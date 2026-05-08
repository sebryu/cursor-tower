import { CONFIG } from './config';
import type { Camera } from './camera';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlatformsManager {
  platforms: Platform[];
  reset: () => void;
  update: (camera: Camera) => void;
  render: (ctx: CanvasRenderingContext2D, camera: Camera) => void;
}

export function createPlatformsManager(): PlatformsManager {
  const manager: PlatformsManager = {
    platforms: [],
    reset() {
      manager.platforms = createStartingPlatforms();
    },
    update(camera) {
      const lowestVisibleY = camera.y + CONFIG.gameHeight + 80;
      manager.platforms = manager.platforms.filter((platform) => platform.y < lowestVisibleY);
    },
    render(ctx, camera) {
      ctx.save();

      for (const platform of manager.platforms) {
        const screenY = camera.transform(platform.y);
        ctx.fillStyle = '#67e8f9';
        ctx.strokeStyle = '#cffafe';
        ctx.lineWidth = 2;
        roundRect(ctx, platform.x, screenY, platform.width, platform.height, 8);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();
    },
  };

  manager.reset();
  return manager;
}

function createStartingPlatforms(): Platform[] {
  const platforms: Platform[] = [];
  let y = CONFIG.playerStartY + CONFIG.playerHeight + 14;

  for (let index = 0; index < CONFIG.startingPlatformCount; index += 1) {
    const widthRange = CONFIG.platformMaxWidth - CONFIG.platformMinWidth;
    const width = CONFIG.platformMinWidth + ((index * 37) % widthRange);
    const x = 32 + ((index * 101) % Math.max(1, CONFIG.gameWidth - width - 64));

    platforms.push({
      id: index,
      x,
      y,
      width,
      height: CONFIG.platformHeight,
    });

    y -= CONFIG.platformVerticalSpacingMin + ((index * 23) % 38);
  }

  return platforms;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
