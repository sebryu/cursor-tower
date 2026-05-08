import { CONFIG } from './config';

export interface Camera {
  y: number;
  reset: () => void;
  update: (playerY: number) => void;
  transform: (worldY: number) => number;
}

export function createCamera(): Camera {
  const camera: Camera = {
    y: 0,
    reset() {
      camera.y = 0;
    },
    update(playerY) {
      const targetY = playerY - CONFIG.cameraTopMargin;
      camera.y = Math.min(camera.y, targetY);
    },
    transform(worldY) {
      return worldY - camera.y;
    },
  };

  return camera;
}
