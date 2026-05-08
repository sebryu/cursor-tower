import { CONFIG } from './config';

export interface Camera {
  y: number;
  shakeX: number;
  shakeY: number;
  highestY: number;
  reset: () => void;
  update: (playerY: number, dtMs: number) => void;
  transform: (worldY: number) => number;
  viewportTopY: () => number;
  viewportBottomY: () => number;
  addShake: (trauma: number) => void;
  tick: (dtMs: number) => void;
}

export function createCamera(): Camera {
  let trauma = 0;

  const camera: Camera = {
    y: 0,
    shakeX: 0,
    shakeY: 0,
    highestY: CONFIG.playerStartY,
    reset() {
      camera.y = 0;
      camera.shakeX = 0;
      camera.shakeY = 0;
      camera.highestY = CONFIG.playerStartY;
      trauma = 0;
    },
    update(playerY, dtMs) {
      camera.highestY = Math.min(camera.highestY, playerY);
      const targetY = playerY - CONFIG.cameraTopMargin;
      // Lerp toward target but never scroll back down once raised.
      if (targetY < camera.y) {
        const k = 1 - Math.exp(-CONFIG.cameraSmoothing * (dtMs / 16.67));
        camera.y = camera.y + (targetY - camera.y) * k;
      }
    },
    transform(worldY) {
      return worldY - camera.y;
    },
    viewportTopY() {
      return camera.y;
    },
    viewportBottomY() {
      return camera.y + CONFIG.gameHeight;
    },
    addShake(amount) {
      trauma = Math.min(1, trauma + amount);
    },
    tick(dtMs) {
      if (trauma <= 0) {
        camera.shakeX = 0;
        camera.shakeY = 0;
        return;
      }
      const t = trauma * trauma;
      const angle = Math.random() * Math.PI * 2;
      camera.shakeX = Math.cos(angle) * t * 18;
      camera.shakeY = Math.sin(angle) * t * 18;
      trauma = Math.max(0, trauma - dtMs / 1000 * 1.5);
    },
  };
  return camera;
}
