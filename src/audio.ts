import { getMuted, setMuted as persistMuted } from './storage';

export interface AudioManager {
  playJump: () => void;
  playLand: (impactVy: number) => void;
  playCombo: (level: number) => void;
  playGameOver: () => void;
  playMenuSelect: () => void;
  setMuted: (muted: boolean) => void;
  toggleMuted: () => boolean;
  isMuted: () => boolean;
  ensureContext: () => void;
}

interface AudioCtxRefs {
  ctx: AudioContext;
  master: GainNode;
}

export function createAudioManager(): AudioManager {
  let muted = getMuted();
  let refs: AudioCtxRefs | null = null;

  function ensureContext(): AudioCtxRefs | null {
    if (refs) return refs;
    if (typeof window === 'undefined') return null;
    const Ctor = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
    if (!Ctor) return null;
    try {
      const ctx = new Ctor();
      const master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      refs = { ctx, master };
      return refs;
    } catch {
      return null;
    }
  }

  function blip(
    type: OscillatorType,
    startFreq: number,
    endFreq: number,
    durationMs: number,
    gainTarget = 0.32,
    delayMs = 0,
  ): void {
    if (muted) return;
    const r = ensureContext();
    if (!r) return;
    const { ctx, master } = r;
    const t0 = ctx.currentTime + delayMs / 1000;
    const t1 = t0 + durationMs / 1000;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t1);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainTarget, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    osc.connect(gain).connect(master);
    osc.start(t0);
    osc.stop(t1 + 0.05);
  }

  function noise(durationMs: number, gainTarget = 0.18, lowpass = 1800): void {
    if (muted) return;
    const r = ensureContext();
    if (!r) return;
    const { ctx, master } = r;
    const t0 = ctx.currentTime;
    const t1 = t0 + durationMs / 1000;
    const buf = ctx.createBuffer(1, Math.max(1, Math.floor(ctx.sampleRate * (durationMs / 1000))), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(gainTarget, t0 + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, t1);
    src.connect(filter).connect(gain).connect(master);
    src.start(t0);
    src.stop(t1 + 0.05);
  }

  return {
    ensureContext: () => void ensureContext(),
    playJump() {
      blip('triangle', 540, 900, 130, 0.22);
    },
    playLand(impactVy) {
      const intensity = Math.min(1, Math.abs(impactVy) / 1500);
      blip('sine', 220, 90, 110, 0.18 + intensity * 0.16);
      noise(120 + intensity * 80, 0.06 + intensity * 0.18, 600 + intensity * 1200);
    },
    playCombo(level) {
      const base = 540 + Math.min(level, 6) * 90;
      blip('square', base, base * 1.35, 90, 0.16);
      blip('triangle', base * 1.5, base * 1.9, 130, 0.12, 60);
    },
    playGameOver() {
      blip('sawtooth', 280, 90, 540, 0.22);
      blip('triangle', 220, 70, 720, 0.16, 80);
    },
    playMenuSelect() {
      blip('triangle', 660, 880, 90, 0.16);
    },
    setMuted(next) {
      muted = next;
      persistMuted(next);
      if (refs) refs.master.gain.value = muted ? 0 : 0.5;
    },
    toggleMuted() {
      muted = !muted;
      persistMuted(muted);
      if (refs) refs.master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() {
      return muted;
    },
  };
}
