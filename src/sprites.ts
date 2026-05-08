import { CONFIG } from './config';
import type { Player } from './player';
import type { Platform } from './platforms';
import { THEME } from './theme';

// Renders a chunky pixel-art-styled climber. The shape is drawn with
// rounded shapes so we don't depend on external image assets while keeping
// a coherent original look.
export function drawPlayerSprite(
  ctx: CanvasRenderingContext2D,
  player: Player,
  screenY: number,
  fallingFast: boolean,
): void {
  const w = player.width;
  const h = player.height;
  const cx = player.x + w / 2;
  const baseY = screenY + h;
  const squashY = player.squash;
  const squashX = 1 + (1 - squashY) * 0.5;

  ctx.save();
  // Soft shadow under the player so it reads against bright platforms.
  ctx.fillStyle = THEME.shadow;
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4, w / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(cx, baseY);
  if (player.facing === 'left') ctx.scale(-1, 1);
  ctx.scale(squashX, squashY);
  ctx.translate(-w / 2, -h);

  ctx.fillStyle = THEME.playerOutline;
  roundRect(ctx, 0, 0, w, h, 10);
  ctx.fill();

  ctx.fillStyle = THEME.player;
  roundRect(ctx, 3, 3, w - 6, h - 6, 8);
  ctx.fill();

  ctx.fillStyle = THEME.playerShade;
  roundRect(ctx, 3, h * 0.55, w - 6, h * 0.45 - 3, 6);
  ctx.fill();

  // Cape / scarf flap so motion is readable.
  ctx.fillStyle = THEME.accent2;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.32);
  ctx.lineTo(-6, h * 0.55 + Math.sin(player.runPhase) * 4);
  ctx.lineTo(w * 0.18, h * 0.62);
  ctx.closePath();
  ctx.fill();

  // Eye + smile to communicate facing.
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(w * 0.66, h * 0.32, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (fallingFast) {
    ctx.moveTo(w * 0.5, h * 0.5);
    ctx.lineTo(w * 0.78, h * 0.52);
  } else {
    ctx.moveTo(w * 0.5, h * 0.46);
    ctx.quadraticCurveTo(w * 0.66, h * 0.55, w * 0.82, h * 0.46);
  }
  ctx.stroke();

  // Legs animate via runPhase when grounded; tucked when airborne.
  ctx.fillStyle = THEME.playerOutline;
  const legSpread = player.grounded ? Math.sin(player.runPhase) * 6 : -2;
  roundRect(ctx, w * 0.22 - 4, h - 6, 8, 8, 3);
  ctx.fill();
  roundRect(ctx, w * 0.6 - 4 + legSpread, h - 6, 8, 8, 3);
  ctx.fill();

  ctx.restore();
}

export function drawPlatformSprite(
  ctx: CanvasRenderingContext2D,
  platform: Platform,
  screenY: number,
): void {
  const fade = Math.min(1, platform.spawnAgeMs / 320);
  ctx.save();
  ctx.globalAlpha = fade;

  const fillNormal = THEME.platformNormal;
  const fillSmall = THEME.platformSmall;
  const fillMoving = THEME.platformMoving;
  const shadeNormal = THEME.platformNormalShade;
  const shadeSmall = THEME.platformSmallShade;
  const shadeMoving = THEME.platformMovingShade;

  const fill = platform.kind === 'small' ? fillSmall : platform.kind === 'moving' ? fillMoving : fillNormal;
  const shade = platform.kind === 'small' ? shadeSmall : platform.kind === 'moving' ? shadeMoving : shadeNormal;

  // Outline / depth shadow.
  ctx.fillStyle = THEME.platformOutline;
  roundRect(ctx, platform.x - 1, screenY - 1, platform.width + 2, platform.height + 4, 8);
  ctx.fill();

  // Lower shaded band gives a faux-pixel volume.
  ctx.fillStyle = shade;
  roundRect(ctx, platform.x, screenY + platform.height * 0.55, platform.width, platform.height * 0.55, 6);
  ctx.fill();

  // Top fill.
  ctx.fillStyle = fill;
  roundRect(ctx, platform.x, screenY, platform.width, platform.height * 0.65, 6);
  ctx.fill();

  // Highlight pixels.
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(platform.x + 6, screenY + 3, Math.max(8, platform.width * 0.18), 2);

  if (platform.kind === 'moving') {
    ctx.strokeStyle = 'rgba(248,250,252,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(platform.x + 4, screenY + platform.height + 6);
    for (let i = 8; i < platform.width - 4; i += 8) {
      ctx.lineTo(platform.x + i, screenY + platform.height + 6 + (i % 16 === 0 ? 0 : 2));
    }
    ctx.stroke();
  }
  if (platform.kind === 'small') {
    ctx.fillStyle = 'rgba(248,250,252,0.5)';
    ctx.fillRect(platform.x + platform.width * 0.4, screenY - 4, 4, 4);
  }

  ctx.restore();
}

export interface BackgroundLayer {
  draw: (ctx: CanvasRenderingContext2D, cameraY: number, cssWidth: number, cssHeight: number) => void;
}

export function createBackground(): BackgroundLayer {
  const stars: { x: number; y: number; r: number; twinkle: number }[] = [];
  for (let i = 0; i < 110; i++) {
    stars.push({
      x: Math.random() * CONFIG.gameWidth,
      y: Math.random() * (CONFIG.gameHeight * 4),
      r: Math.random() * 1.6 + 0.4,
      twinkle: Math.random() * Math.PI * 2,
    });
  }
  const farMountains: { x: number; w: number; h: number }[] = [];
  for (let i = 0; i < 8; i++) {
    farMountains.push({
      x: i * 90 - 30,
      w: 110 + Math.random() * 60,
      h: 120 + Math.random() * 90,
    });
  }
  const nearTowers: { x: number; w: number; h: number }[] = [];
  for (let i = 0; i < 6; i++) {
    nearTowers.push({ x: i * 110 - 40, w: 80 + Math.random() * 60, h: 200 + Math.random() * 120 });
  }

  return {
    draw(ctx, cameraY) {
      // Altitude-tint gradient. Higher cameraY (lower world Y => more negative)
      // shifts the sky toward indigo/black.
      const altitude = Math.max(0, -cameraY) / 4000;
      const top = mixColor(THEME.bgTop, '#000010', Math.min(0.7, altitude));
      const horizon = mixColor(THEME.bgHorizon, '#1e0d3e', Math.min(0.6, altitude));
      const grad = ctx.createLinearGradient(0, 0, 0, CONFIG.gameHeight);
      grad.addColorStop(0, top);
      grad.addColorStop(0.6, horizon);
      grad.addColorStop(1, THEME.bgGroundBand);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, CONFIG.gameWidth, CONFIG.gameHeight);

      // Stars layer (slow parallax).
      const starOffset = (cameraY * 0.12) % CONFIG.gameHeight;
      for (const s of stars) {
        const screenY = ((s.y + starOffset) % (CONFIG.gameHeight * 4) + CONFIG.gameHeight * 4) % (CONFIG.gameHeight * 4) - CONFIG.gameHeight;
        if (screenY < -10 || screenY > CONFIG.gameHeight + 10) continue;
        const tw = 0.6 + 0.4 * Math.sin(s.twinkle + cameraY * 0.001);
        ctx.fillStyle = altitude > 0.4 ? THEME.star : THEME.starDim;
        ctx.globalAlpha = tw;
        ctx.beginPath();
        ctx.arc(s.x, screenY, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Distant mountain silhouette (parallax 0.3) with neon trim.
      const farY = CONFIG.gameHeight - 220 + cameraY * 0.3;
      ctx.fillStyle = '#1d1140';
      ctx.beginPath();
      ctx.moveTo(0, CONFIG.gameHeight);
      for (const m of farMountains) {
        ctx.lineTo(m.x, farY + 220 - m.h);
        ctx.lineTo(m.x + m.w * 0.5, farY + 220 - m.h - 30);
        ctx.lineTo(m.x + m.w, farY + 220 - m.h);
      }
      ctx.lineTo(CONFIG.gameWidth, CONFIG.gameHeight);
      ctx.closePath();
      ctx.fill();

      // Mid-ground neon towers (parallax 0.55).
      const midY = CONFIG.gameHeight - 70 + cameraY * 0.55;
      for (const t of nearTowers) {
        ctx.fillStyle = '#2a1860';
        ctx.fillRect(t.x, midY - t.h, t.w, t.h);
        ctx.fillStyle = THEME.accent2;
        ctx.fillRect(t.x + 4, midY - t.h + 16, 4, t.h - 32);
        ctx.fillStyle = THEME.accent3;
        ctx.fillRect(t.x + t.w - 8, midY - t.h + 24, 4, t.h - 48);
      }

      // Fog band at the bottom for depth.
      const fog = ctx.createLinearGradient(0, CONFIG.gameHeight - 140, 0, CONFIG.gameHeight);
      fog.addColorStop(0, 'rgba(10, 8, 28, 0)');
      fog.addColorStop(1, 'rgba(10, 8, 28, 0.6)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, CONFIG.gameHeight - 140, CONFIG.gameWidth, 140);
    },
  };
}

function mixColor(a: string, b: string, t: number): string {
  const ar = parseInt(a.slice(1, 3), 16);
  const ag = parseInt(a.slice(3, 5), 16);
  const ab = parseInt(a.slice(5, 7), 16);
  const br = parseInt(b.slice(1, 3), 16);
  const bg = parseInt(b.slice(3, 5), 16);
  const bb = parseInt(b.slice(5, 7), 16);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bch = Math.round(ab + (bb - ab) * t);
  return `rgb(${r}, ${g}, ${bch})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
