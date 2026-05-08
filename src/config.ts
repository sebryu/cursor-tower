export const CONFIG = {
  gameWidth: 540,
  gameHeight: 960,

  bgTop: '#0b1126',
  bgBottom: '#1a0f33',
  bgHorizon: '#3b1d6b',

  gravity: 2300,
  // Negative jump velocity launches upward because world Y increases downward.
  jumpVelocity: -880,
  // Held-jump adds upward thrust within a short window after takeoff;
  // the design choice is to give a noticeable hop-vs-leap difference.
  holdJumpAccel: 1700,
  holdJumpWindowMs: 220,
  // Faster horizontal speed boosts jump velocity (capped by maxMomentumBonus).
  momentumJumpBonus: 0.55,
  coyoteTimeMs: 110,
  jumpBufferMs: 130,

  moveAccel: 3600,
  friction: 0.82,
  maxRunSpeed: 460,
  airControl: 0.85,
  terminalFallSpeed: 1500,

  playerWidth: 38,
  playerHeight: 54,
  playerStartX: 270,
  playerStartY: 760,

  platformMinWidth: 84,
  platformMaxWidth: 178,
  platformHeight: 16,
  platformVerticalSpacingMin: 86,
  platformVerticalSpacingMax: 138,
  startingPlatformCount: 8,

  movingPlatformStartHeight: 1500,
  movingPlatformChance: 0.18,
  movingPlatformChanceMax: 0.42,
  movingPlatformSpeedMin: 32,
  movingPlatformSpeedMax: 96,
  smallPlatformChance: 0.06,
  smallPlatformChanceMax: 0.55,

  difficultyRampHeight: 5200,

  comboWindowMs: 1300,
  comboMultiplierStep: 0.25,
  comboMaxMultiplier: 5,
  skipBonusBase: 60,
  combatHardLandSpeed: 1200,

  cameraTopMargin: 360,
  cameraSmoothing: 0.18,
  fallDeathMargin: 220,

  heightToScore: 0.18,

  touchButtonSize: 96,
  touchButtonPadding: 22,

  fixedStepMs: 1000 / 60,
  maxFrameDeltaMs: 100,
} as const;

export type GameConfig = typeof CONFIG;
