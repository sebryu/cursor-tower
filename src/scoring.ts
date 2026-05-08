import { CONFIG } from './config';
import { getBest, setBest } from './storage';

export interface ScoreTracker {
  score: number;
  best: number;
  combo: number;
  comboTimerMs: number;
  comboMax: number;
  multiplier: number;
  height: number;
  // Score popups created on big events; consumed by the renderer per frame.
  popups: ScorePopup[];
  reset: () => void;
  registerHeight: (heightWorldUnits: number) => number;
  registerLanding: (skipsAcrossLast: number, isHardLand: boolean) => LandingResult;
  tick: (dtMs: number) => void;
  finalize: () => { newBest: boolean };
}

export interface ScorePopup {
  id: number;
  text: string;
  worldX: number;
  worldY: number;
  ageMs: number;
  ttlMs: number;
}

export interface LandingResult {
  delta: number;
  combo: number;
  comboBumped: boolean;
}

let popupId = 0;

export function createScoreTracker(): ScoreTracker {
  const tracker: ScoreTracker = {
    score: 0,
    best: getBest(),
    combo: 0,
    comboTimerMs: 0,
    comboMax: 0,
    multiplier: 1,
    height: 0,
    popups: [],
    reset() {
      tracker.score = 0;
      tracker.combo = 0;
      tracker.comboTimerMs = 0;
      tracker.comboMax = 0;
      tracker.multiplier = 1;
      tracker.height = 0;
      tracker.popups.length = 0;
    },
    registerHeight(heightWorldUnits) {
      const next = Math.max(0, heightWorldUnits);
      const delta = next - tracker.height;
      if (delta <= 0) return 0;
      tracker.height = next;
      const points = Math.round(delta * CONFIG.heightToScore * tracker.multiplier);
      if (points > 0) {
        tracker.score += points;
      }
      return points;
    },
    registerLanding(skipsAcrossLast, isHardLand) {
      if (isHardLand) {
        tracker.combo = 0;
        tracker.comboTimerMs = 0;
        tracker.multiplier = 1;
        return { delta: 0, combo: 0, comboBumped: false };
      }
      const earnedCombo = skipsAcrossLast > 0 || tracker.comboTimerMs > 0;
      if (earnedCombo) {
        tracker.combo = Math.min(CONFIG.comboMaxMultiplier * 4, tracker.combo + 1);
        tracker.comboTimerMs = CONFIG.comboWindowMs;
      }
      tracker.comboMax = Math.max(tracker.comboMax, tracker.combo);
      tracker.multiplier = Math.min(
        CONFIG.comboMaxMultiplier,
        1 + tracker.combo * CONFIG.comboMultiplierStep,
      );
      const skipPoints = skipsAcrossLast * CONFIG.skipBonusBase * tracker.multiplier;
      const delta = Math.round(skipPoints);
      if (delta > 0) tracker.score += delta;
      return { delta, combo: tracker.combo, comboBumped: earnedCombo };
    },
    tick(dtMs) {
      if (tracker.comboTimerMs > 0) {
        tracker.comboTimerMs = Math.max(0, tracker.comboTimerMs - dtMs);
        if (tracker.comboTimerMs === 0) {
          tracker.combo = 0;
          tracker.multiplier = 1;
        }
      }
      let i = 0;
      while (i < tracker.popups.length) {
        const popup = tracker.popups[i];
        popup.ageMs += dtMs;
        if (popup.ageMs >= popup.ttlMs) {
          tracker.popups.splice(i, 1);
        } else {
          i++;
        }
      }
    },
    finalize() {
      if (tracker.score > tracker.best) {
        tracker.best = tracker.score;
        setBest(tracker.best);
        return { newBest: true };
      }
      return { newBest: false };
    },
  };
  return tracker;
}

export function pushPopup(
  tracker: ScoreTracker,
  text: string,
  worldX: number,
  worldY: number,
  ttlMs = 1100,
): void {
  tracker.popups.push({
    id: popupId++,
    text,
    worldX,
    worldY,
    ageMs: 0,
    ttlMs,
  });
}
