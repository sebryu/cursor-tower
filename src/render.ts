import { CONFIG } from './config';
import type { AudioManager } from './audio';
import type { Camera } from './camera';
import { GAME_STATES, type GameState } from './state';
import type { Player } from './player';
import { renderPlayer } from './player';
import type { PlatformsManager } from './platforms';
import type { ScoreTracker } from './scoring';
import { renderGameOver } from './ui/gameover';
import { renderHud } from './ui/hud';
import { renderMenu } from './ui/menu';
import { renderPause } from './ui/pause';
import { renderTouchControls } from './ui/touch';

export interface RenderScene {
  state: GameState;
  player: Player;
  platforms: PlatformsManager;
  camera: Camera;
  score: ScoreTracker;
  audio: AudioManager;
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

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Canvas 2D is required to run Sky Climber.');
    }

    this.ctx = ctx;
    this.resize();
    window.addEventListener('resize', this.resize);
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

  render(scene: RenderScene): void {
    this.clear();
    this.withGameTransform(() => {
      this.renderBackground();

      if (scene.state !== GAME_STATES.MENU) {
        this.renderWorld(scene);
      }

      if (scene.state === GAME_STATES.MENU) {
        renderMenu(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, {
          best: scene.score.best,
          muted: scene.audio.isMuted(),
        });
      } else if (scene.state === GAME_STATES.PLAYING) {
        renderHud(this.ctx, CONFIG.gameWidth, {
          score: scene.score,
          muted: scene.audio.isMuted(),
        });
        renderTouchControls(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight);
      } else if (scene.state === GAME_STATES.PAUSED) {
        renderHud(this.ctx, CONFIG.gameWidth, {
          score: scene.score,
          muted: scene.audio.isMuted(),
        });
        renderPause(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight);
      } else if (scene.state === GAME_STATES.GAMEOVER) {
        renderGameOver(this.ctx, CONFIG.gameWidth, CONFIG.gameHeight, scene.score);
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

  private withGameTransform(draw: () => void): void {
    this.ctx.setTransform(
      this.dpr * this.scale,
      0,
      0,
      this.dpr * this.scale,
      this.dpr * this.offsetX,
      this.dpr * this.offsetY,
    );
    draw();
  }

  private renderBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, CONFIG.gameHeight);
    gradient.addColorStop(0, CONFIG.backgroundTop);
    gradient.addColorStop(1, CONFIG.backgroundBottom);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CONFIG.gameWidth, CONFIG.gameHeight);

    this.ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
    for (let index = 0; index < 36; index += 1) {
      const x = (index * 73) % CONFIG.gameWidth;
      const y = (index * 137) % CONFIG.gameHeight;
      const radius = 1 + (index % 3);
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private renderWorld(scene: RenderScene): void {
    scene.platforms.render(this.ctx, scene.camera);
    renderPlayer(this.ctx, scene.player, scene.camera.transform(scene.player.y));
  }
}
