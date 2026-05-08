export interface InputIntents {
  moveLeft: boolean;
  moveRight: boolean;
  jumpPressed: boolean;
  jumpHeld: boolean;
  pauseToggle: boolean;
  restartPressed: boolean;
  muteToggle: boolean;
}

export type TouchButton = 'left' | 'right' | 'jump' | 'pause';

const GAME_KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
  'Space',
  'KeyP',
  'Escape',
  'KeyR',
  'KeyM',
]);
const LEFT_KEYS = new Set(['ArrowLeft', 'KeyA']);
const RIGHT_KEYS = new Set(['ArrowRight', 'KeyD']);
const JUMP_KEYS = new Set(['ArrowUp', 'KeyW', 'Space']);
const PAUSE_KEYS = new Set(['KeyP', 'Escape']);
const RESTART_KEYS = new Set(['KeyR']);
const MUTE_KEYS = new Set(['KeyM']);

export class InputManager {
  private readonly heldKeys = new Set<string>();
  private readonly touchButtons = new Set<TouchButton>();
  private jumpPressedThisFrame = false;
  private pauseToggleThisFrame = false;
  private restartPressedThisFrame = false;
  private muteToggleThisFrame = false;
  private disposed = false;

  constructor(private readonly target: Window = window) {
    this.target.addEventListener('keydown', this.handleKeyDown, { passive: false });
    this.target.addEventListener('keyup', this.handleKeyUp, { passive: false });
    this.target.addEventListener('blur', this.handleBlur);
  }

  getIntents(): InputIntents {
    return {
      moveLeft: this.hasLeft(),
      moveRight: this.hasRight(),
      jumpPressed: this.jumpPressedThisFrame,
      jumpHeld: this.hasJump(),
      pauseToggle: this.pauseToggleThisFrame,
      restartPressed: this.restartPressedThisFrame,
      muteToggle: this.muteToggleThisFrame,
    };
  }

  endFrame(): void {
    this.jumpPressedThisFrame = false;
    this.pauseToggleThisFrame = false;
    this.restartPressedThisFrame = false;
    this.muteToggleThisFrame = false;
  }

  setTouchButton(button: TouchButton, active: boolean): void {
    const wasJumpHeld = this.hasJump();
    if (active) {
      this.touchButtons.add(button);
    } else {
      this.touchButtons.delete(button);
    }
    if (button === 'jump' && active && !wasJumpHeld) {
      this.jumpPressedThisFrame = true;
    }
    if (button === 'pause' && active) {
      this.pauseToggleThisFrame = true;
      this.touchButtons.delete('pause');
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
    this.target.removeEventListener('blur', this.handleBlur);
    this.disposed = true;
  }

  private hasLeft(): boolean {
    return this.touchButtons.has('left') || [...LEFT_KEYS].some((c) => this.heldKeys.has(c));
  }
  private hasRight(): boolean {
    return this.touchButtons.has('right') || [...RIGHT_KEYS].some((c) => this.heldKeys.has(c));
  }
  private hasJump(): boolean {
    return this.touchButtons.has('jump') || [...JUMP_KEYS].some((c) => this.heldKeys.has(c));
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (!GAME_KEYS.has(event.code)) return;
    event.preventDefault();
    if (JUMP_KEYS.has(event.code) && !this.heldKeys.has(event.code)) {
      this.jumpPressedThisFrame = true;
    }
    if (PAUSE_KEYS.has(event.code) && !this.heldKeys.has(event.code)) {
      this.pauseToggleThisFrame = true;
    }
    if (RESTART_KEYS.has(event.code) && !this.heldKeys.has(event.code)) {
      this.restartPressedThisFrame = true;
    }
    if (MUTE_KEYS.has(event.code) && !this.heldKeys.has(event.code)) {
      this.muteToggleThisFrame = true;
    }
    this.heldKeys.add(event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    if (!GAME_KEYS.has(event.code)) return;
    event.preventDefault();
    this.heldKeys.delete(event.code);
  };

  private readonly handleBlur = (): void => {
    this.heldKeys.clear();
    this.touchButtons.clear();
    this.jumpPressedThisFrame = false;
    this.pauseToggleThisFrame = false;
    this.restartPressedThisFrame = false;
    this.muteToggleThisFrame = false;
  };
}
