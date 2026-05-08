import { describe, expect, it } from 'vitest';
import { CONFIG } from '../config';
import { createCamera } from '../camera';

describe('camera', () => {
  it('never scrolls down once raised', () => {
    const cam = createCamera();
    cam.update(CONFIG.playerStartY - 600, 16);
    const high = cam.y;
    cam.update(CONFIG.playerStartY + 200, 16);
    expect(cam.y).toBeLessThanOrEqual(high + 0.0001);
  });

  it('worldToScreen is monotonic in worldY', () => {
    const cam = createCamera();
    cam.update(CONFIG.playerStartY - 200, 16);
    const a = cam.transform(0);
    const b = cam.transform(100);
    expect(a).toBeLessThan(b);
  });

  it('shake decays toward zero', () => {
    const cam = createCamera();
    cam.addShake(0.8);
    for (let i = 0; i < 200; i++) cam.tick(16);
    expect(Math.abs(cam.shakeX)).toBeLessThan(0.5);
    expect(Math.abs(cam.shakeY)).toBeLessThan(0.5);
  });
});
