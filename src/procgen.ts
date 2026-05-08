import { CONFIG } from './config';

export type PlatformKind = 'normal' | 'small' | 'moving';

export interface PlatformSpec {
  x: number;
  y: number;
  width: number;
  kind: PlatformKind;
  // Moving platforms oscillate between [moveOriginX, moveOriginX + moveRange]
  // at moveSpeed (px/s); normal platforms keep moveSpeed = 0.
  moveOriginX: number;
  moveRange: number;
  moveSpeed: number;
  movePhase: number;
}

export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface DifficultyParams {
  widthScale: number;
  gapScale: number;
  movingChance: number;
  smallChance: number;
}

export function difficultyAt(height: number): DifficultyParams {
  const t = clamp(height / CONFIG.difficultyRampHeight, 0, 1);
  const widthScale = lerp(1, 0.62, t);
  const gapScale = lerp(0.65, 1, t);
  const movingChance = height > CONFIG.movingPlatformStartHeight
    ? lerp(CONFIG.movingPlatformChance, CONFIG.movingPlatformChanceMax, t)
    : 0;
  const smallChance = lerp(CONFIG.smallPlatformChance, CONFIG.smallPlatformChanceMax, t);
  return { widthScale, gapScale, movingChance, smallChance };
}

export function maxJumpHeightWorld(): number {
  // Approximate: peak Y reached on a maxed momentum jump with full hold.
  // h = v0^2 / (2g) plus the integrated hold-thrust contribution. We sample
  // numerically here (cheap enough) but cache via a pre-computed constant.
  const v0 = CONFIG.jumpVelocity * (1 + CONFIG.momentumJumpBonus);
  let v = v0;
  let y = 0;
  const dt = 1 / 240;
  for (let t = 0; t < 1.6; t += dt) {
    const holdActive = t * 1000 < CONFIG.holdJumpWindowMs && v < 0;
    const a = CONFIG.gravity - (holdActive ? CONFIG.holdJumpAccel : 0);
    v += a * dt;
    y += v * dt;
    if (v >= 0) break;
  }
  return Math.abs(y);
}

export function maxHorizontalReachWorld(): number {
  const v0 = CONFIG.jumpVelocity * (1 + CONFIG.momentumJumpBonus);
  let v = v0;
  let t = 0;
  const dt = 1 / 240;
  // Time to reach peak then back to platform (assume same y).
  while (t < 2.5) {
    const holdActive = t * 1000 < CONFIG.holdJumpWindowMs && v < 0;
    const a = CONFIG.gravity - (holdActive ? CONFIG.holdJumpAccel : 0);
    v += a * dt;
    t += dt;
    if (v > 0 && -v0 - v < 0.0001) break;
    if (t > CONFIG.holdJumpWindowMs / 1000 && v > 0) break;
  }
  // Round-trip air-time: vertical going up and coming down to same height.
  const tFlight = (-v0 / CONFIG.gravity) * 2 + CONFIG.holdJumpWindowMs / 1000 * 0.5;
  return CONFIG.maxRunSpeed * tFlight;
}

export interface NextPlatformContext {
  prev: PlatformSpec;
  rng: Rng;
  height: number;
  screenWidth: number;
}

export function nextPlatform({ prev, rng, height, screenWidth }: NextPlatformContext): PlatformSpec {
  const params = difficultyAt(height);
  const minWidth = Math.round(CONFIG.platformMinWidth * params.widthScale);
  const maxWidth = Math.round(CONFIG.platformMaxWidth * params.widthScale);

  const wantSmall = rng() < params.smallChance;
  const width = wantSmall
    ? Math.round(minWidth * 0.7 + rng() * (minWidth * 0.3))
    : Math.round(minWidth + rng() * Math.max(1, maxWidth - minWidth));

  const gapMin = CONFIG.platformVerticalSpacingMin * params.gapScale;
  const gapMax = CONFIG.platformVerticalSpacingMax * params.gapScale;
  const verticalGap = gapMin + rng() * (gapMax - gapMin);
  const y = prev.y - verticalGap;

  const horizontalReach = Math.max(120, maxHorizontalReachWorld() - 80);
  const prevCenter = prev.x + prev.width / 2;
  const xMin = clamp(prevCenter - horizontalReach, 16, screenWidth - width - 16);
  const xMax = clamp(prevCenter + horizontalReach, 16, screenWidth - width - 16);
  const xRange = Math.max(0, xMax - xMin);
  const x = xMin + rng() * xRange;

  const isMoving = !wantSmall && rng() < params.movingChance;
  const moveSpeed = isMoving
    ? CONFIG.movingPlatformSpeedMin + rng() * (CONFIG.movingPlatformSpeedMax - CONFIG.movingPlatformSpeedMin)
    : 0;
  const moveRange = isMoving ? Math.min(180, screenWidth - width - 32) * (0.4 + rng() * 0.6) : 0;
  const moveOriginX = isMoving ? clamp(x - moveRange / 2, 16, screenWidth - width - moveRange - 16) : x;

  const kind: PlatformKind = isMoving ? 'moving' : wantSmall ? 'small' : 'normal';
  return {
    x: isMoving ? moveOriginX : x,
    y,
    width,
    kind,
    moveOriginX,
    moveRange,
    moveSpeed,
    movePhase: rng() * Math.PI * 2,
  };
}

export function isReachable(prev: PlatformSpec, next: PlatformSpec): boolean {
  const verticalGap = prev.y - next.y;
  if (verticalGap <= 0) return false;
  if (verticalGap > maxJumpHeightWorld() + 8) return false;
  const prevCenter = prev.x + prev.width / 2;
  const nextCenter = next.x + next.width / 2;
  const horizontalGap = Math.abs(prevCenter - nextCenter);
  const reach = maxHorizontalReachWorld() + (prev.width + next.width) / 2;
  return horizontalGap <= reach;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
