import { getMuted, setMuted as persistMuted } from './storage';

export interface AudioManager {
  playJump: () => void;
  playLand: () => void;
  playCombo: () => void;
  playGameOver: () => void;
  playMenuSelect: () => void;
  setMuted: (muted: boolean) => void;
  isMuted: () => boolean;
}

export function createAudioManager(): AudioManager {
  let muted = getMuted();

  const playIfAudible = () => {
    if (muted) {
      return;
    }
  };

  return {
    playJump: playIfAudible,
    playLand: playIfAudible,
    playCombo: playIfAudible,
    playGameOver: playIfAudible,
    playMenuSelect: playIfAudible,
    setMuted(nextMuted) {
      muted = nextMuted;
      persistMuted(nextMuted);
    },
    isMuted() {
      return muted;
    },
  };
}
