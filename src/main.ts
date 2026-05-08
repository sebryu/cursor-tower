import { createAudioManager } from './audio';
import { createCamera } from './camera';
import { CONFIG } from './config';
import { createParticleSystem } from './effects';
import { InputManager, type TouchButton } from './input';
import { createGameLoop } from './loop';
import { createPlatformsManager } from './platforms';
import {
  createPlayer,
  resetPlayer,
  resolvePlayerPlatformCollision,
  updatePlayer,
} from './player';
import { Renderer } from './render';
import { createScoreTracker, pushPopup } from './scoring';
import {
  GAME_STATES,
  getState,
  registerStateHooks,
  setState,
  resetStateMachine,
} from './state';
import { hitTestTouchButton, type TouchControl } from './ui/touch';
import { pointInMute } from './ui/common';
import { getHintSeen, setHintSeen } from './storage';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const app = document.querySelector<HTMLElement>('#app');

if (!canvas) throw new Error('Missing #game canvas.');

const gameCanvas = canvas;
const renderer = new Renderer(gameCanvas);
const input = new InputManager();
const player = createPlayer();
const platforms = createPlatformsManager();
const camera = createCamera();
const score = createScoreTracker();
const audio = createAudioManager();
const particles = createParticleSystem();

const activeTouchButtons = new Map<number, TouchButton>();
const activeTouchVisual = new Set<TouchControl>();

function detectTouchPreferred(): boolean {
  const coarse = matchMedia?.('(pointer: coarse)').matches ?? false;
  const narrow = window.innerWidth <= 720;
  const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  return coarse || (hasTouch && narrow) || narrow;
}

let isTouchDevice = detectTouchPreferred();
let showTouchControls = isTouchDevice;
window.addEventListener('resize', () => {
  if (detectTouchPreferred()) {
    isTouchDevice = true;
    showTouchControls = true;
  }
});
let lastPlatformIndexLanded = -1;
let newBest = false;
let hintAlpha = 0;
let flash = 0;

const HINT_TEXT = 'Move with arrow keys or A/D - hold jump for height';

resetStateMachine(GAME_STATES.MENU);

function startRun(): void {
  audio.ensureContext();
  resetPlayer(player);
  platforms.reset();
  camera.reset();
  score.reset();
  particles.reset();
  lastPlatformIndexLanded = -1;
  newBest = false;
  hintAlpha = getHintSeen() ? 0 : 1;
  flash = 0;
  audio.playMenuSelect();
  setState(GAME_STATES.PLAYING);
}

function endRun(): void {
  const result = score.finalize();
  newBest = result.newBest;
  audio.playGameOver();
  camera.addShake(0.7);
  flash = 0.4;
  setState(GAME_STATES.GAMEOVER);
}

registerStateHooks(GAME_STATES.PLAYING, {
  onEnter() {
    flash = 0;
  },
});

function update(dtMs: number): void {
  renderer.tick(dtMs);
  flash = Math.max(0, flash - dtMs / 220);
  hintAlpha = Math.max(0, hintAlpha - dtMs / 4500);
  const state = getState();
  const intents = input.getIntents();

  if (state === GAME_STATES.MENU) {
    if (intents.jumpPressed) {
      startRun();
    }
    if (intents.muteToggle) audio.toggleMuted();
    input.endFrame();
    return;
  }

  if (state === GAME_STATES.PAUSED) {
    if (intents.pauseToggle) setState(GAME_STATES.PLAYING);
    if (intents.muteToggle) audio.toggleMuted();
    if (intents.restartPressed) startRun();
    input.endFrame();
    return;
  }

  if (state === GAME_STATES.GAMEOVER) {
    if (intents.jumpPressed || intents.restartPressed) startRun();
    if (intents.muteToggle) audio.toggleMuted();
    input.endFrame();
    return;
  }

  if (intents.pauseToggle) {
    setState(GAME_STATES.PAUSED);
    input.endFrame();
    return;
  }

  if (intents.muteToggle) audio.toggleMuted();
  if (intents.restartPressed) {
    startRun();
    input.endFrame();
    return;
  }

  const previousY = player.y;
  updatePlayer(player, intents, dtMs, {
    onJump(p) {
      audio.playJump();
      particles.spawnPuff(p.x + p.width / 2, p.y + p.height + 4);
      if (!getHintSeen()) {
        setHintSeen();
        hintAlpha = Math.max(hintAlpha - 0.05, 0);
      }
    },
    onLand(p, platform, impactVy) {
      const landedIndex = platforms.platforms.indexOf(platform);
      const skips = lastPlatformIndexLanded < 0
        ? 0
        : Math.max(0, lastPlatformIndexLanded - landedIndex - 1);
      const isHard = impactVy > CONFIG.combatHardLandSpeed;

      if (isHard) {
        camera.addShake(0.4);
      }

      const result = score.registerLanding(skips, false);
      audio.playLand(impactVy);
      particles.spawnLandDust(p.x + p.width / 2, p.y + p.height, Math.min(1, impactVy / 1500));

      if (result.delta > 0) {
        pushPopup(score, `+${result.delta}`, p.x + p.width / 2, p.y - 10);
      }
      if (result.comboBumped && result.combo >= 2) {
        audio.playCombo(result.combo);
        particles.spawnComboSparks(p.x + p.width / 2, p.y);
        camera.addShake(Math.min(0.6, 0.18 + result.combo * 0.05));
        if (result.combo >= 3) {
          pushPopup(score, `COMBO x${score.multiplier.toFixed(1)}`, p.x + p.width / 2, p.y - 36, 1300);
        }
      }
      if (landedIndex !== -1) lastPlatformIndexLanded = landedIndex;
    },
  });

  resolvePlayerPlatformCollision(player, platforms.platforms, previousY, {
    onLand: undefined,
  });

  camera.update(player.y, dtMs);
  camera.tick(dtMs);
  platforms.update(camera, dtMs);
  score.registerHeight(Math.max(0, CONFIG.playerStartY - player.highestY));
  score.tick(dtMs);

  if (player.y > camera.viewportBottomY() + CONFIG.fallDeathMargin) {
    endRun();
  }

  input.endFrame();
}

function render(): void {
  renderer.render({
    state: getState(),
    player,
    platforms,
    camera,
    score,
    audio,
    particles,
    hudHint: hintAlpha > 0.01 ? HINT_TEXT : undefined,
    hudHintAlpha: hintAlpha,
    newBest,
    showTouch: showTouchControls,
    activeTouch: activeTouchVisual,
    isTouch: isTouchDevice,
    flash,
  });
}

function activatePointerControls(point: { x: number; y: number }, pointerId: number): void {
  if (pointInMute(CONFIG.gameWidth, point.x, point.y)) {
    audio.toggleMuted();
    return;
  }
  const button = hitTestTouchButton(CONFIG.gameWidth, CONFIG.gameHeight, point.x, point.y);
  if (button) {
    isTouchDevice = true;
    showTouchControls = true;
    input.setTouchButton(button, true);
    activeTouchButtons.set(pointerId, button);
    activeTouchVisual.add(button);
  } else if (getState() === GAME_STATES.MENU || getState() === GAME_STATES.GAMEOVER) {
    startRun();
  } else if (getState() === GAME_STATES.PAUSED) {
    setState(GAME_STATES.PLAYING);
  }
}

function handlePointerDown(event: PointerEvent): void {
  event.preventDefault();
  audio.ensureContext();
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    isTouchDevice = true;
    showTouchControls = true;
  }
  gameCanvas.setPointerCapture(event.pointerId);
  const point = renderer.screenToGame(event.clientX, event.clientY);
  if (!point) return;
  activatePointerControls(point, event.pointerId);
}

function handlePointerEnd(event: PointerEvent): void {
  event.preventDefault();
  const button = activeTouchButtons.get(event.pointerId);
  if (button) {
    input.setTouchButton(button, false);
    activeTouchButtons.delete(event.pointerId);
    activeTouchVisual.delete(button);
  }
  if (gameCanvas.hasPointerCapture(event.pointerId)) {
    gameCanvas.releasePointerCapture(event.pointerId);
  }
}

gameCanvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
gameCanvas.addEventListener('pointerup', handlePointerEnd, { passive: false });
gameCanvas.addEventListener('pointercancel', handlePointerEnd, { passive: false });
gameCanvas.addEventListener('contextmenu', (event) => event.preventDefault());

const loop = createGameLoop({ update, render });
loop.start();
app?.classList.add('ready');

window.addEventListener('blur', () => {
  if (getState() === GAME_STATES.PLAYING) setState(GAME_STATES.PAUSED);
});

