import { CONFIG } from './config';
import { getBest, setBest } from './storage';

export interface ScoreTracker {
  score: number;
  best: number;
  combo: number;
  reset: () => void;
  add: (points: number) => void;
  tick: (dtMs: number) => void;
}

export function createScoreTracker(): ScoreTracker {
  let comboTimerMs = 0;

  const tracker: ScoreTracker = {
    score: 0,
    best: getBest(),
    combo: 0,
    reset() {
      tracker.score = 0;
      tracker.combo = 0;
      comboTimerMs = 0;
    },
    add(points) {
      tracker.combo += 1;
      comboTimerMs = CONFIG.comboWindowMs;
      const multiplier = 1 + Math.max(0, tracker.combo - 1) * CONFIG.comboMultiplierStep;
      tracker.score += Math.round(points * multiplier);

      if (tracker.score > tracker.best) {
        tracker.best = tracker.score;
        setBest(tracker.best);
      }
    },
    tick(dtMs) {
      if (comboTimerMs <= 0) {
        tracker.combo = 0;
        return;
      }

      comboTimerMs = Math.max(0, comboTimerMs - dtMs);
      if (comboTimerMs === 0) {
        tracker.combo = 0;
      }
    },
  };

  return tracker;
}
