import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';

describe('game configuration', () => {
  it('uses downward-positive gravity and upward-negative jump velocity', () => {
    expect(CONFIG.gravity).toBeGreaterThan(0);
    expect(CONFIG.jumpVelocity).toBeLessThan(0);
  });
});
