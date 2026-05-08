import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import {
  difficultyAt,
  isReachable,
  maxHorizontalReachWorld,
  maxJumpHeightWorld,
  mulberry32,
  nextPlatform,
  type PlatformSpec,
} from '../procgen';

const screenWidth = CONFIG.gameWidth;

function makeStartingPlatform(): PlatformSpec {
  return {
    x: screenWidth / 2 - 100,
    y: 800,
    width: 200,
    kind: 'normal',
    moveOriginX: 0,
    moveRange: 0,
    moveSpeed: 0,
    movePhase: 0,
  };
}

describe('procgen', () => {
  it('produces upward platforms (y decreases)', () => {
    const rng = mulberry32(1);
    let prev = makeStartingPlatform();
    for (let i = 0; i < 50; i++) {
      const next = nextPlatform({ prev, rng, height: i * 100, screenWidth });
      expect(next.y).toBeLessThan(prev.y);
      prev = next;
    }
  });

  it('keeps every consecutive pair reachable across many seeds', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = mulberry32(seed);
      let prev = makeStartingPlatform();
      for (let i = 0; i < 80; i++) {
        const next = nextPlatform({ prev, rng, height: i * 80, screenWidth });
        expect(isReachable(prev, next)).toBe(true);
        prev = next;
      }
    }
  });

  it('difficulty curve shrinks platform widths and grows gaps with height', () => {
    const easy = difficultyAt(0);
    const hard = difficultyAt(CONFIG.difficultyRampHeight);
    expect(hard.widthScale).toBeLessThan(easy.widthScale);
    expect(hard.gapScale).toBeGreaterThan(easy.gapScale);
  });

  it('moving platforms only appear above the height threshold', () => {
    const earlyChance = difficultyAt(CONFIG.movingPlatformStartHeight - 200).movingChance;
    const lateChance = difficultyAt(CONFIG.movingPlatformStartHeight + 800).movingChance;
    expect(earlyChance).toBe(0);
    expect(lateChance).toBeGreaterThan(0);
  });

  it('max jump and reach values are positive and finite', () => {
    expect(maxJumpHeightWorld()).toBeGreaterThan(60);
    expect(maxHorizontalReachWorld()).toBeGreaterThan(120);
  });
});
