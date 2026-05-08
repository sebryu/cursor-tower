export const STORAGE_KEYS = {
  best: 'sky-climber.best',
  muted: 'sky-climber.muted',
  hintSeen: 'sky-climber.hintSeen',
} as const;

let memoryBest = 0;
let memoryMuted = false;
let memoryHint = false;

function readStorage(key: string): string | null {
  try {
    return globalThis?.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    globalThis?.localStorage?.setItem(key, value);
  } catch {
    // localStorage is unavailable (private mode, file://, sandbox); fall through.
  }
}

export function getBest(): number {
  const stored = readStorage(STORAGE_KEYS.best);
  if (stored === null) return memoryBest;
  const parsed = Number.parseInt(stored, 10);
  return Number.isFinite(parsed) ? parsed : memoryBest;
}

export function setBest(value: number): void {
  const safeValue = Math.max(0, Math.floor(value));
  memoryBest = safeValue;
  writeStorage(STORAGE_KEYS.best, String(safeValue));
}

export function getMuted(): boolean {
  const stored = readStorage(STORAGE_KEYS.muted);
  if (stored === null) return memoryMuted;
  return stored === 'true';
}

export function setMuted(value: boolean): void {
  memoryMuted = value;
  writeStorage(STORAGE_KEYS.muted, String(value));
}

export function getHintSeen(): boolean {
  const stored = readStorage(STORAGE_KEYS.hintSeen);
  if (stored === null) return memoryHint;
  return stored === 'true';
}

export function setHintSeen(): void {
  memoryHint = true;
  writeStorage(STORAGE_KEYS.hintSeen, 'true');
}
