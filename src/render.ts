import { CONFIG } from './config';
import type { AudioManager } from './audio';
import type { Camera } from './camera';
import type { ParticleSystem } from './effects';
import { GAME_STATES, type GameState } from './state';
import type { Player } from './player';
import { drawPlayerSprite, drawPlatformSprite, createBackground } from './sprites';
import type { PlatformsManager } from './platforms';
import type { ScoreTracker } from './scoring';
import { THEME } from './theme';
import { renderGameOver } from './ui/gameover';
import { renderHud } from './ui/hud';
import { renderMenu } from './ui/menu';
import { renderPause } from './ui/pause';
import { renderTouchControls, type TouchControl } from './ui/touch';

export interface RenderScene {
  state: GameState;
  player: Player;
  platforms: PlatformsManager;
  camera: Camera;
  score: ScoreTracker;
  audio: AudioManager;
  particles: ParticleSystem;
  hudHint?: string;
  hudHintAlpha?: number;
  newBest: boolean;
  showTouch: boolean;
  activeTouch: Set<TouchControl>;
  isTouch: boolean;
  flash: number;
}

export interface GamePoint {
  x: number;
  y: number;
}

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private dpr: number = 1;
  private cssWidth: number = CONFIG.gameWidth;
  private cssHeight: number = CONFIG.gameHeight;
  private scale: number = 1;
  private offsetX: number = 0;
  private offsetY: number = 0;
  private elapsedMs: number = 0;
  private readonly background = createBackground();

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D is required.');
    }
    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
  }

  resize = (): void => {
    this.dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 3));
    this.cssWidth = Math.max(1, window.innerWidth);
    this.cssHeight = Math.max(1, window.innerHeight);
    this.scale = Math.min(this.cssWidth / CONFIG.gameWidth, this.cssHeight / CONFIG.gameHeight);
    this.offsetX = (this.cssWidth - CONFIG.gameWidth * this.scale) / 2;
    this.offsetY = (this.cssHeight - CONFIG.gameHeight * this.scale) / 2;
    this.canvas.width = Math.floor(this.cssWidth * this.dpr);
    this.canvas.height = Math.floor(this.cssHeight * this.dpr);
  };

  tick(dtMs: number): void {
    this.elapsedMs += dtMs;
  }

  render(scene: RenderScene): void {
    this.clear();
    this.withGameTransform(scene.camera, () => {
      this.background.draw(this.ctx, scene.camera.viewportTopY(), CONFIG.gameWidth, CONFIG.gameHeight);

      if (scene.state !== GAME_STATES.MENU) {
        this.renderWorld(scene);
      } else {
        this.renderMenuPreview();
      }

      if (scene.state === GAME_STATES.MENU) {
        renderMenu(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, {
          best: scene.score.best,
          muted: scene.audio.isMuted(),
          timeMs: this.elapsedMs,
          isTouch: scene.isTouch,
        });
      } else if (scene.state === GAME_STATES.PLAYING) {
        renderHud(this.ctx, CONFIG.gameWidth, {
          score: scene.score,
          muted: scene.audio.isMuted(),
          hint: scene.hudHint,
          hintAlpha: scene.hudHintAlpha,
        });
        renderTouchControls(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, scene.activeTouch, scene.showTouch);
      } else if (scene.state === GAME_STATES.PAUSED) {
        renderHud(this.ctx, CONFIG.gameWidth, {
          score: scene.score,
          muted: scene.audio.isMuted(),
        });
        renderTouchControls(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, scene.activeTouch, scene.showTouch);
        renderPause(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, { muted: scene.audio.isMuted() });
      } else if (scene.state === GAME_STATES.GAMEOVER) {
        renderGameOver(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, {
          score: scene.score,
          newBest: scene.newBest,
          isTouch: scene.isTouch,
        });
      }

      if (scene.flash > 0) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.5, scene.flash)})`;
        this.ctx.fillRect(0, 0, CONFIG.gameWidth, CONFIG.gameHeight);
      }
    });
  }

  screenToGame(clientX: number, clientY: number): GamePoint | undefined {
    const x = (clientX - this.offsetX) / this.scale;
    const y = (clientY - this.offsetY) / this.scale;
    if (x < 0 || x > CONFIG.gameWidth || y < 0 || y > CONFIG.gameHeight) {
      return undefined;
    }
    return { x, y };
  }

  private clear(): void {
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#020617';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private withGameTransform(camera: Camera, draw: () => void): void {
    const tx = this.dpr * (this.offsetX + camera.shakeX);
    const ty = this.dpr * (this.offsetY + camera.shakeY);
    this.ctx.setTransform(this.dpr * this.scale, 0, 0, this.dpr * this.scale, tx, ty);
    draw();
  }

  private renderWorld(scene: RenderScene): void {
    for (const platform of scene.platforms.platforms) {
      const screenY = scene.camera.transform(platform.y);
      if (screenY > CONFIG.gameHeight + 30 || screenY < -60) continue;
      drawPlatformSprite(this.ctx, platform, screenY);
    }
    drawPlayerSprite(
      this.ctx,
      scene.player,
      scene.camera.transform(scene.player.y),
      scene.player.vy > CONFIG.terminalFallSpeed * 0.6,
    );

    // Score popups float upward.
    for (const popup of scene.score.popups) {
      const t = popup.ageMs / popup.ttlMs;
      const screenY = scene.camera.transform(popup.worldY) - t * 28;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, 1 - t);
      this.ctx.fillStyle = THEME.accent;
      this.ctx.font = '900 22px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(popup.text, popup.worldX, screenY);
      this.ctx.restore();
    }

    // Particles.
    for (const particle of scene.particles.particles) {
      const screenY = scene.camera.transform(particle.worldY);
      const t = particle.ageMs / particle.ttlMs;
      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, 1 - t);
      this.ctx.fillStyle = particle.color;
      this.ctx.beginPath();
      this.ctx.arc(particle.worldX, screenY, Math.max(0.5, particle.size * (1 - t)), 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  private renderMenuPreview(): void {
    // Floating clouds across the menu so it doesn't feel static.
    for (let i = 0; i < 4; i++) {
      const t = (this.elapsedMs / 4000 + i * 0.27) % 1;
      const x = -100 + t * (CONFIG.gameWidth + 200);
      const y = 140 + i * 90;
      this.ctx.fillStyle = i % 2 === 0 ? THEME.cloudA : THEME.cloudB;
      this.ctx.beginPath();
      this.ctx.ellipse(x, y, 80, 18, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}
