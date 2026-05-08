const BEST_KEY = 'sky-climber.best';
const MUTED_KEY = 'sky-climber.muted';

let memoryBest = 0;
let memoryMuted = false;

export function getBest(): number {
  try {
    const stored = window.localStorage.getItem(BEST_KEY);
    return stored === null ? memoryBest : Number.parseInt(stored, 10) || 0;
  } catch {
    return memoryBest;
  }
}

export function setBest(value: number): void {
  const safeValue = Math.max(0, Math.floor(value));
  memoryBest = safeValue;

  try {
    window.localStorage.setItem(BEST_KEY, String(safeValue));
  } catch {
    memoryBest = safeValue;
  }
}

export function getMuted(): boolean {
  try {
    const stored = window.localStorage.getItem(MUTED_KEY);
    return stored === null ? memoryMuted : stored === 'true';
  } catch {
    return memoryMuted;
  }
}

export function setMuted(value: boolean): void {
  memoryMuted = value;

  try {
    window.localStorage.setItem(MUTED_KEY, String(value));
  } catch {
    memoryMuted = value;
  }
}
