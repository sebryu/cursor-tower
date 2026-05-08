import { createAudioManager } from './audio';
import { createCamera } from './camera';
import { CONFIG } from './config';
import { InputManager, type TouchButton } from './input';
import { createGameLoop } from './loop';
import { createPlatformsManager } from './platforms';
import { createPlayer, resetPlayer, resolvePlayerPlatformCollision, updatePlayer } from './player';
import { Renderer } from './render';
import { createScoreTracker } from './scoring';
import { GAME_STATES, getState, registerStateHooks, setState } from './state';
import { hitTestTouchButton } from './ui/touch';

const canvas = document.querySelector<HTMLCanvasElement>('#game');
const app = document.querySelector<HTMLElement>('#app');

if (!canvas) {
  throw new Error('Missing #game canvas.');
}

const gameCanvas = canvas;
const renderer = new Renderer(gameCanvas);
const input = new InputManager();
const player = createPlayer();
const platforms = createPlatformsManager();
const camera = createCamera();
const score = createScoreTracker();
const audio = createAudioManager();
const activeTouchButtons = new Map<number, TouchButton>();

let lastScoredHeight = 0;

registerStateHooks(GAME_STATES.PLAYING, {
  onEnter() {
    lastScoredHeight = 0;
  },
});

function startRun(): void {
  resetPlayer(player);
  platforms.reset();
  camera.reset();
  score.reset();
  audio.playMenuSelect();
  setState(GAME_STATES.PLAYING);
}

function update(dtMs: number): void {
  const state = getState();
  const intents = input.getIntents();

  if (state === GAME_STATES.MENU || state === GAME_STATES.GAMEOVER) {
    if (intents.jumpPressed) {
      startRun();
    }
    input.endFrame();
    return;
  }

  if (state === GAME_STATES.PAUSED) {
    if (intents.pauseToggle) {
      setState(GAME_STATES.PLAYING);
    }
    input.endFrame();
    return;
  }

  if (intents.pauseToggle) {
    setState(GAME_STATES.PAUSED);
    input.endFrame();
    return;
  }

  const wasGrounded = player.grounded;
  const previousY = player.y;
  updatePlayer(player, intents, dtMs);
  const landedPlatform = resolvePlayerPlatformCollision(player, platforms.platforms, previousY);

  if (wasGrounded && !player.grounded && intents.jumpPressed) {
    audio.playJump();
  }

  if (landedPlatform) {
    score.add(10 + Math.max(0, Math.round((CONFIG.playerStartY - landedPlatform.y) / 30)));
    audio.playLand();
  }

  camera.update(player.y);
  platforms.update(camera);
  scoreHeightProgress();
  score.tick(dtMs);

  if (camera.transform(player.y) > CONFIG.gameHeight + CONFIG.fallDeathMargin) {
    audio.playGameOver();
    setState(GAME_STATES.GAMEOVER);
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
  });
}

function scoreHeightProgress(): void {
  const height = Math.max(0, CONFIG.playerStartY - player.highestY);
  const nextBand = Math.floor(height / 50);

  if (nextBand > lastScoredHeight) {
    score.add((nextBand - lastScoredHeight) * 5);
    lastScoredHeight = nextBand;
  }
}

function handlePointerDown(event: PointerEvent): void {
  event.preventDefault();
  gameCanvas.setPointerCapture(event.pointerId);

  const state = getState();
  if (state === GAME_STATES.MENU || state === GAME_STATES.GAMEOVER) {
    startRun();
    return;
  }

  const point = renderer.screenToGame(event.clientX, event.clientY);
  if (!point) {
    return;
  }

  const button = hitTestTouchButton(CONFIG.gameWidth, CONFIG.gameHeight, point.x, point.y);
  if (button) {
    input.setTouchButton(button, true);
    activeTouchButtons.set(event.pointerId, button);
  }
}

function handlePointerEnd(event: PointerEvent): void {
  event.preventDefault();
  const button = activeTouchButtons.get(event.pointerId);

  if (button) {
    input.setTouchButton(button, false);
    activeTouchButtons.delete(event.pointerId);
  }

  if (gameCanvas.hasPointerCapture(event.pointerId)) {
    gameCanvas.releasePointerCapture(event.pointerId);
  }
}

gameCanvas.addEventListener('pointerdown', handlePointerDown, { passive: false });
gameCanvas.addEventListener('pointerup', handlePointerEnd, { passive: false });
gameCanvas.addEventListener('pointercancel', handlePointerEnd, { passive: false });

const loop = createGameLoop({ update, render });
loop.start();
app?.classList.add('ready');
