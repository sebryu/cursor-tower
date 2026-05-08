import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import {
  computeMomentumJumpBonus,
  createPlayer,
  resolvePlayerPlatformCollision,
  updatePlayer,
  wrapX,
} from '../player';
import type { InputIntents } from '../input';

const NULL_INTENTS: InputIntents = {
  moveLeft: false,
  moveRight: false,
  jumpPressed: false,
  jumpHeld: false,
  pauseToggle: false,
  restartPressed: false,
  muteToggle: false,
};

describe('player', () => {
  it('wrapX wraps off-screen positions', () => {
    expect(wrapX(-50, 30, 540)).toBe(540);
    expect(wrapX(550, 30, 540)).toBe(-30);
    expect(wrapX(120, 30, 540)).toBe(120);
  });

  it('momentum jump bonus is bounded by configured maximum', () => {
    expect(computeMomentumJumpBonus(0)).toBe(0);
    expect(computeMomentumJumpBonus(CONFIG.maxRunSpeed)).toBeCloseTo(CONFIG.momentumJumpBonus);
    expect(computeMomentumJumpBonus(CONFIG.maxRunSpeed * 2)).toBeCloseTo(
      CONFIG.momentumJumpBonus,
    );
  });

  it('held jump produces taller climb than tap jump', () => {
    const tap = createPlayer();
    const hold = createPlayer();
    tap.grounded = true;
    tap.airTimeMs = 0;
    hold.grounded = true;
    hold.airTimeMs = 0;
    const tapStartY = tap.y;
    const holdStartY = hold.y;

    updatePlayer(tap, { ...NULL_INTENTS, jumpPressed: true }, 16);
    updatePlayer(hold, { ...NULL_INTENTS, jumpPressed: true, jumpHeld: true }, 16);

    for (let i = 0; i < 30; i++) {
      updatePlayer(tap, { ...NULL_INTENTS, jumpHeld: false }, 16);
      updatePlayer(hold, { ...NULL_INTENTS, jumpHeld: true }, 16);
    }

    const tapClimb = tapStartY - tap.highestY;
    const holdClimb = holdStartY - hold.highestY;
    expect(holdClimb).toBeGreaterThan(tapClimb + 20);
  });

  it('only lands when descending onto a platform top', () => {
    const player = createPlayer();
    player.x = 250;
    player.y = 700;
    player.vy = 600;
    const platform = {
      id: 1,
      x: 240,
      y: 760,
      width: 100,
      height: 16,
      kind: 'normal' as const,
      moveOriginX: 0,
      moveRange: 0,
      moveSpeed: 0,
      movePhase: 0,
      spawnAgeMs: 999,
    };
    const previousY = 700;
    player.y = 720; // simulate descending into platform top
    const result = resolvePlayerPlatformCollision(player, [platform], previousY);
    expect(result).toBe(platform);
    expect(player.grounded).toBe(true);
    expect(player.vy).toBe(0);
  });

  it('does not land if rising', () => {
    const player = createPlayer();
    player.vy = -100;
    const platform = {
      id: 1,
      x: 240,
      y: 600,
      width: 100,
      height: 16,
      kind: 'normal' as const,
      moveOriginX: 0,
      moveRange: 0,
      moveSpeed: 0,
      movePhase: 0,
      spawnAgeMs: 999,
    };
    const result = resolvePlayerPlatformCollision(player, [platform], 700);
    expect(result).toBeUndefined();
  });
});
