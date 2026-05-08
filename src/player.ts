import { CONFIG } from './config';
import type { InputIntents } from './input';
import type { Platform } from './platforms';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  highestY: number;
}

export function createPlayer(): Player {
  return {
    x: CONFIG.playerStartX,
    y: CONFIG.playerStartY,
    width: CONFIG.playerWidth,
    height: CONFIG.playerHeight,
    vx: 0,
    vy: 0,
    grounded: false,
    highestY: CONFIG.playerStartY,
  };
}

export function resetPlayer(player: Player): void {
  player.x = CONFIG.playerStartX;
  player.y = CONFIG.playerStartY;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.highestY = CONFIG.playerStartY;
}

export function updatePlayer(player: Player, intents: InputIntents, dtMs: number): void {
  const dt = dtMs / 1000;
  const direction = Number(intents.moveRight) - Number(intents.moveLeft);

  player.vx += direction * CONFIG.moveAccel * dt;

  if (direction === 0) {
    player.vx *= Math.pow(CONFIG.friction, dt * 60);
  }

  player.vx = clamp(player.vx, -CONFIG.maxRunSpeed, CONFIG.maxRunSpeed);

  if (intents.jumpPressed && player.grounded) {
    player.vy = CONFIG.jumpVelocity;
    player.grounded = false;
  }

  player.vy = Math.min(player.vy + CONFIG.gravity * dt, CONFIG.terminalFallSpeed);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  if (player.x < -player.width) {
    player.x = CONFIG.gameWidth;
  } else if (player.x > CONFIG.gameWidth) {
    player.x = -player.width;
  }

  player.highestY = Math.min(player.highestY, player.y);
}

export function resolvePlayerPlatformCollision(
  player: Player,
  platforms: readonly Platform[],
  previousY: number,
): Platform | undefined {
  if (player.vy < 0) {
    player.grounded = false;
    return undefined;
  }

  const previousBottom = previousY + player.height;
  const currentBottom = player.y + player.height;

  for (const platform of platforms) {
    const crossedTop = previousBottom <= platform.y && currentBottom >= platform.y;
    const overlapsX = player.x + player.width > platform.x && player.x < platform.x + platform.width;

    if (crossedTop && overlapsX) {
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
      return platform;
    }
  }

  player.grounded = false;
  return undefined;
}

export function renderPlayer(ctx: CanvasRenderingContext2D, player: Player, screenY: number): void {
  const x = player.x;
  const y = screenY;
  const radius = 10;

  ctx.save();
  ctx.fillStyle = '#f97316';
  ctx.strokeStyle = '#fed7aa';
  ctx.lineWidth = 3;
  roundedRect(ctx, x, y, player.width, player.height, radius);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(x + player.width * 0.65, y + player.height * 0.32, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
