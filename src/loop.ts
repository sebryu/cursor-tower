import { CONFIG } from './config';

export type UpdateCallback = (dtMs: number) => void;
export type RenderCallback = (alpha: number) => void;

export interface GameLoop {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

export interface GameLoopOptions {
  update: UpdateCallback;
  render: RenderCallback;
  stepMs?: number;
  maxDeltaMs?: number;
}

export function createGameLoop({
  update,
  render,
  stepMs = CONFIG.fixedStepMs,
  maxDeltaMs = CONFIG.maxFrameDeltaMs,
}: GameLoopOptions): GameLoop {
  let animationId = 0;
  let running = false;
  let lastTime = 0;
  let accumulator = 0;

  const frame = (time: number) => {
    if (!running) {
      return;
    }

    if (lastTime === 0) {
      lastTime = time;
    }

    const delta = Math.min(time - lastTime, maxDeltaMs);
    lastTime = time;
    accumulator += delta;

    while (accumulator >= stepMs) {
      update(stepMs);
      accumulator -= stepMs;
    }

    render(accumulator / stepMs);
    animationId = window.requestAnimationFrame(frame);
  };

  return {
    start() {
      if (running) {
        return;
      }

      running = true;
      lastTime = 0;
      accumulator = 0;
      animationId = window.requestAnimationFrame(frame);
    },
    stop() {
      if (!running) {
        return;
      }

      running = false;
      window.cancelAnimationFrame(animationId);
      animationId = 0;
    },
    isRunning() {
      return running;
    },
  };
}
