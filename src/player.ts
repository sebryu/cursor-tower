import { CONFIG } from './config';
import type { InputIntents } from './input';
import type { Platform } from './platforms';

export type PlayerFacing = 'left' | 'right';

export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  grounded: boolean;
  highestY: number;
  facing: PlayerFacing;
  // Run-cycle phase used by the renderer for animation.
  runPhase: number;
  // Squash factor: 1 = neutral, <1 = vertical compression on landing.
  squash: number;
  // Time since last grounded frame, in ms; enables coyote-time jumps.
  airTimeMs: number;
  // Buffer window after a jump press, used to land-and-jump cleanly.
  jumpBufferMs: number;
  // Hold window after takeoff during which holding jump adds upward thrust.
  jumpHoldRemainingMs: number;
  // Vertical impact velocity from the most recent landing event (for FX).
  lastLandVy: number;
}

export interface PlayerEvents {
  onJump?: (player: Player) => void;
  onLand?: (player: Player, platform: Platform, impactVy: number) => void;
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
    facing: 'right',
    runPhase: 0,
    squash: 1,
    airTimeMs: 9999,
    jumpBufferMs: 0,
    jumpHoldRemainingMs: 0,
    lastLandVy: 0,
  };
}

export function resetPlayer(player: Player): void {
  player.x = CONFIG.playerStartX;
  player.y = CONFIG.playerStartY;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.highestY = CONFIG.playerStartY;
  player.facing = 'right';
  player.runPhase = 0;
  player.squash = 1;
  player.airTimeMs = 9999;
  player.jumpBufferMs = 0;
  player.jumpHoldRemainingMs = 0;
  player.lastLandVy = 0;
}

export function updatePlayer(
  player: Player,
  intents: InputIntents,
  dtMs: number,
  events?: PlayerEvents,
): void {
  const dt = dtMs / 1000;

  if (intents.jumpPressed) {
    player.jumpBufferMs = CONFIG.jumpBufferMs;
  }
  player.jumpBufferMs = Math.max(0, player.jumpBufferMs - dtMs);

  const direction = Number(intents.moveRight) - Number(intents.moveLeft);
  if (direction !== 0) {
    player.facing = direction > 0 ? 'right' : 'left';
  }

  const accelScale = player.grounded ? 1 : CONFIG.airControl;
  player.vx += direction * CONFIG.moveAccel * accelScale * dt;

  if (direction === 0 && player.grounded) {
    player.vx *= Math.pow(CONFIG.friction, dt * 60);
    if (Math.abs(player.vx) < 1) player.vx = 0;
  }
  player.vx = clamp(player.vx, -CONFIG.maxRunSpeed, CONFIG.maxRunSpeed);

  const canJump = player.airTimeMs <= CONFIG.coyoteTimeMs;
  if (player.jumpBufferMs > 0 && canJump) {
    const bonus = computeMomentumJumpBonus(player.vx);
    player.vy = CONFIG.jumpVelocity * (1 + bonus);
    player.grounded = false;
    player.airTimeMs = CONFIG.coyoteTimeMs + 1;
    player.jumpBufferMs = 0;
    player.jumpHoldRemainingMs = CONFIG.holdJumpWindowMs;
    player.squash = 1.18;
    events?.onJump?.(player);
  }

  if (player.jumpHoldRemainingMs > 0 && intents.jumpHeld && player.vy < 0) {
    player.vy -= CONFIG.holdJumpAccel * dt;
    player.jumpHoldRemainingMs -= dtMs;
  } else {
    player.jumpHoldRemainingMs = 0;
  }

  player.vy = Math.min(player.vy + CONFIG.gravity * dt, CONFIG.terminalFallSpeed);
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  player.x = wrapX(player.x, player.width, CONFIG.gameWidth);

  if (player.y < player.highestY) {
    player.highestY = player.y;
  }

  if (player.grounded) {
    player.runPhase = (player.runPhase + Math.abs(player.vx) * dt * 0.025) % (Math.PI * 2);
  } else {
    player.runPhase = 0;
  }

  player.squash += (1 - player.squash) * Math.min(1, dt * 12);

  if (!player.grounded) {
    player.airTimeMs += dtMs;
  }
}

export function resolvePlayerPlatformCollision(
  player: Player,
  platforms: readonly Platform[],
  previousY: number,
  events?: PlayerEvents,
): Platform | undefined {
  if (player.vy < 0) {
    if (player.grounded) {
      player.airTimeMs = 0;
    } else {
      player.grounded = false;
    }
    return undefined;
  }

  const previousBottom = previousY + player.height;
  const currentBottom = player.y + player.height;

  for (const platform of platforms) {
    const crossedTop = previousBottom <= platform.y + 1 && currentBottom >= platform.y;
    const overlapsX =
      player.x + player.width > platform.x && player.x < platform.x + platform.width;

    if (crossedTop && overlapsX) {
      const impactVy = player.vy;
      player.y = platform.y - player.height;
      player.vy = 0;
      player.grounded = true;
      player.airTimeMs = 0;
      player.jumpHoldRemainingMs = 0;
      player.lastLandVy = impactVy;
      const squash = clamp(0.6 + (1 - Math.min(1, impactVy / 1600)) * 0.4, 0.55, 1);
      player.squash = squash;
      events?.onLand?.(player, platform, impactVy);
      return platform;
    }
  }

  player.grounded = false;
  return undefined;
}

export function computeMomentumJumpBonus(vx: number): number {
  const speedRatio = Math.min(1, Math.abs(vx) / CONFIG.maxRunSpeed);
  return speedRatio * CONFIG.momentumJumpBonus;
}

export function wrapX(x: number, width: number, screenWidth: number): number {
  if (x < -width) return screenWidth;
  if (x > screenWidth) return -width;
  return x;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
