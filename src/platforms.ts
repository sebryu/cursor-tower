import { CONFIG } from './config';
import type { Camera } from './camera';
import {
  difficultyAt,
  isReachable,
  mulberry32,
  nextPlatform,
  type PlatformKind,
  type PlatformSpec,
  type Rng,
} from './procgen';

export interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  kind: PlatformKind;
  // Internal fields kept only for moving platforms so update() can oscillate.
  moveOriginX: number;
  moveRange: number;
  moveSpeed: number;
  movePhase: number;
  // Used by the renderer to fade newly-spawned platforms in.
  spawnAgeMs: number;
}

export interface PlatformsManager {
  platforms: Platform[];
  reset: (seed?: number) => void;
  update: (camera: Camera, dtMs: number) => void;
  highestPlatform: () => Platform | undefined;
  height: () => number;
}

const CULL_BELOW_PX = CONFIG.gameHeight * 1.2;

export function createPlatformsManager(): PlatformsManager {
  let nextId = 0;
  let rng: Rng = mulberry32(0);
  let highestY: number = CONFIG.playerStartY;
  const platforms: Platform[] = [];

  function specToPlatform(spec: PlatformSpec): Platform {
    return {
      id: nextId++,
      x: spec.kind === 'moving' ? spec.moveOriginX + spec.moveRange / 2 : spec.x,
      y: spec.y,
      width: spec.width,
      height: CONFIG.platformHeight,
      kind: spec.kind,
      moveOriginX: spec.moveOriginX,
      moveRange: spec.moveRange,
      moveSpeed: spec.moveSpeed,
      movePhase: spec.movePhase,
      spawnAgeMs: 0,
    };
  }

  function topSpec(): PlatformSpec {
    const top = platforms[platforms.length - 1];
    if (!top) {
      return {
        x: 0,
        y: CONFIG.playerStartY + CONFIG.playerHeight,
        width: CONFIG.gameWidth,
        kind: 'normal',
        moveOriginX: 0,
        moveRange: 0,
        moveSpeed: 0,
        movePhase: 0,
      };
    }
    return {
      x: top.x,
      y: top.y,
      width: top.width,
      kind: top.kind,
      moveOriginX: top.moveOriginX,
      moveRange: top.moveRange,
      moveSpeed: top.moveSpeed,
      movePhase: top.movePhase,
    };
  }

  function spawnUntil(yLimit: number): void {
    while (true) {
      const top = platforms[platforms.length - 1];
      if (top && top.y < yLimit) break;
      const playerStart: number = CONFIG.playerStartY;
      const height = Math.max(0, playerStart - (top?.y ?? playerStart));
      let candidate = nextPlatform({
        prev: topSpec(),
        rng,
        height,
        screenWidth: CONFIG.gameWidth,
      });
      // Reachability fallback: try a few times to keep the next jump fair.
      let attempts = 0;
      while (!isReachable(topSpec(), candidate) && attempts < 6) {
        candidate = nextPlatform({
          prev: topSpec(),
          rng,
          height,
          screenWidth: CONFIG.gameWidth,
        });
        attempts++;
      }
      const platform = specToPlatform(candidate);
      platforms.push(platform);
      highestY = Math.min(highestY, platform.y);
    }
  }

  function reset(seed?: number): void {
    rng = mulberry32(seed ?? Math.floor(Math.random() * 0xffffffff));
    platforms.length = 0;
    nextId = 0;
    highestY = CONFIG.playerStartY as number;
    // Place a guaranteed wide starting platform under the player.
    platforms.push({
      id: nextId++,
      x: CONFIG.gameWidth / 2 - 110,
      y: CONFIG.playerStartY + CONFIG.playerHeight + 8,
      width: 220,
      height: CONFIG.platformHeight,
      kind: 'normal',
      moveOriginX: 0,
      moveRange: 0,
      moveSpeed: 0,
      movePhase: 0,
      spawnAgeMs: 999,
    });
    // Build the first stack of platforms upward so the run starts populated.
    spawnUntil(CONFIG.playerStartY - CONFIG.gameHeight);
  }

  function update(camera: Camera, dtMs: number): void {
    const dt = dtMs / 1000;
    for (const platform of platforms) {
      platform.spawnAgeMs += dtMs;
      if (platform.kind === 'moving' && platform.moveSpeed > 0) {
        platform.movePhase += dt * (platform.moveSpeed / Math.max(1, platform.moveRange / 2));
        const offset = Math.sin(platform.movePhase) * (platform.moveRange / 2);
        platform.x = platform.moveOriginX + platform.moveRange / 2 + offset - platform.width / 2;
      }
    }
    // Recycle platforms that fall well below the camera's bottom.
    const cullBelow = camera.viewportBottomY() + CULL_BELOW_PX;
    let i = 0;
    while (i < platforms.length) {
      if (platforms[i].y > cullBelow) {
        platforms.splice(i, 1);
      } else {
        i++;
      }
    }
    // Always keep platforms generated ~1.5 viewports above the camera top.
    spawnUntil(camera.viewportTopY() - CONFIG.gameHeight * 1.5);
    void difficultyAt;
  }

  return {
    platforms,
    reset,
    update,
    highestPlatform() {
      return platforms.reduce<Platform | undefined>((best, platform) => {
        return !best || platform.y < best.y ? platform : best;
      }, undefined);
    },
    height() {
      return Math.max(0, CONFIG.playerStartY - highestY);
    },
  };
}
