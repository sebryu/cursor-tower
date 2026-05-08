import { describe, expect, it, beforeEach } from 'vitest';
import { CONFIG } from '../config';
import { createScoreTracker } from '../scoring';
import { STORAGE_KEYS } from '../storage';

beforeEach(() => {
  globalThis.localStorage?.clear?.();
  globalThis.localStorage?.removeItem?.(STORAGE_KEYS.best);
});

describe('scoring', () => {
  it('starts at zero', () => {
    const s = createScoreTracker();
    s.reset();
    expect(s.score).toBe(0);
    expect(s.combo).toBe(0);
    expect(s.multiplier).toBe(1);
  });

  it('height score grows monotonically and ignores backtrack', () => {
    const s = createScoreTracker();
    s.reset();
    s.registerHeight(100);
    const a = s.score;
    s.registerHeight(50); // ignored, height already higher
    expect(s.score).toBe(a);
    s.registerHeight(220);
    expect(s.score).toBeGreaterThan(a);
  });

  it('combo accumulates with skips and decays after window', () => {
    const s = createScoreTracker();
    s.reset();
    s.registerLanding(1, false);
    expect(s.combo).toBeGreaterThanOrEqual(1);
    s.registerLanding(2, false);
    expect(s.multiplier).toBeGreaterThan(1);
    s.tick(CONFIG.comboWindowMs + 50);
    expect(s.combo).toBe(0);
    expect(s.multiplier).toBe(1);
  });

  it('hard landing resets combo', () => {
    const s = createScoreTracker();
    s.reset();
    s.registerLanding(2, false);
    s.registerLanding(0, true);
    expect(s.combo).toBe(0);
    expect(s.multiplier).toBe(1);
  });

  it('skip bonus awards points scaled by multiplier', () => {
    const s = createScoreTracker();
    s.reset();
    const r1 = s.registerLanding(2, false);
    expect(r1.delta).toBeGreaterThan(0);
    const r2 = s.registerLanding(3, false);
    expect(r2.delta).toBeGreaterThan(r1.delta);
  });

  it('multiplier is capped', () => {
    const s = createScoreTracker();
    s.reset();
    for (let i = 0; i < 200; i++) {
      s.registerLanding(1, false);
    }
    expect(s.multiplier).toBeLessThanOrEqual(CONFIG.comboMaxMultiplier);
  });
});
