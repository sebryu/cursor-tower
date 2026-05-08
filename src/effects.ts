import { THEME } from './theme';

export type ParticleKind = 'puff' | 'dust' | 'spark';

export interface Particle {
  worldX: number;
  worldY: number;
  vx: number;
  vy: number;
  ageMs: number;
  ttlMs: number;
  size: number;
  color: string;
  kind: ParticleKind;
}

export interface ParticleSystem {
  particles: Particle[];
  reset: () => void;
  spawnPuff: (worldX: number, worldY: number) => void;
  spawnLandDust: (worldX: number, worldY: number, intensity: number) => void;
  spawnComboSparks: (worldX: number, worldY: number) => void;
  tick: (dtMs: number) => void;
}

export function createParticleSystem(): ParticleSystem {
  const particles: Particle[] = [];

  function pushParticle(p: Particle): void {
    if (particles.length > 220) particles.shift();
    particles.push(p);
  }

  return {
    particles,
    reset() {
      particles.length = 0;
    },
    spawnPuff(worldX, worldY) {
      for (let i = 0; i < 6; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        const speed = 60 + Math.random() * 90;
        pushParticle({
          worldX,
          worldY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ageMs: 0,
          ttlMs: 380 + Math.random() * 120,
          size: 4 + Math.random() * 3,
          color: THEME.cloudA,
          kind: 'puff',
        });
      }
    },
    spawnLandDust(worldX, worldY, intensity) {
      const count = 6 + Math.round(intensity * 10);
      for (let i = 0; i < count; i++) {
        const dir = Math.random() < 0.5 ? -1 : 1;
        const angle = dir * (Math.PI / 2 + (Math.random() - 0.5) * 0.8);
        const speed = 70 + Math.random() * (140 + intensity * 200);
        pushParticle({
          worldX,
          worldY,
          vx: Math.cos(angle) * speed,
          vy: -Math.abs(Math.sin(angle) * speed) * 0.4,
          ageMs: 0,
          ttlMs: 320 + Math.random() * 220,
          size: 3 + Math.random() * 3,
          color: THEME.cloudB,
          kind: 'dust',
        });
      }
    },
    spawnComboSparks(worldX, worldY) {
      for (let i = 0; i < 14; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 90 + Math.random() * 200;
        pushParticle({
          worldX,
          worldY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          ageMs: 0,
          ttlMs: 480 + Math.random() * 280,
          size: 2 + Math.random() * 3,
          color: i % 3 === 0 ? THEME.particleA : i % 3 === 1 ? THEME.particleB : THEME.particleC,
          kind: 'spark',
        });
      }
    },
    tick(dtMs) {
      const dt = dtMs / 1000;
      let i = 0;
      while (i < particles.length) {
        const p = particles[i];
        p.ageMs += dtMs;
        if (p.ageMs >= p.ttlMs) {
          particles.splice(i, 1);
          continue;
        }
        p.worldX += p.vx * dt;
        p.worldY += p.vy * dt;
        p.vy += 380 * dt;
        p.vx *= Math.pow(0.86, dt * 60);
        i++;
      }
    },
  };
}
