import { describe, expect, it, beforeEach } from 'vitest';
import {
  STORAGE_KEYS,
  getBest,
  getHintSeen,
  getMuted,
  setBest,
  setHintSeen,
  setMuted,
} from '../storage';

beforeEach(() => {
  globalThis.localStorage?.clear?.();
});

describe('storage', () => {
  it('persists best score', () => {
    setBest(420);
    expect(getBest()).toBe(420);
    if (globalThis.localStorage) {
      expect(globalThis.localStorage.getItem(STORAGE_KEYS.best)).toBe('420');
    }
  });

  it('coerces best to a non-negative integer', () => {
    setBest(-12.7);
    expect(getBest()).toBe(0);
    setBest(99.9);
    expect(getBest()).toBe(99);
  });

  it('persists muted flag', () => {
    setMuted(true);
    expect(getMuted()).toBe(true);
    setMuted(false);
    expect(getMuted()).toBe(false);
  });

  it('falls back to in-memory when localStorage throws', () => {
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked');
      },
    });
    setBest(7);
    expect(getBest()).toBe(7);
    setMuted(true);
    expect(getMuted()).toBe(true);
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: original,
    });
  });

  it('persists hint seen', () => {
    expect(getHintSeen()).toBe(false);
    setHintSeen();
    expect(getHintSeen()).toBe(true);
  });
});
