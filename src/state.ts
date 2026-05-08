export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
} as const;

export type GameState = (typeof GAME_STATES)[keyof typeof GAME_STATES];

export interface StateHooks {
  onEnter?: (from: GameState) => void;
  onExit?: (to: GameState) => void;
}

const hooks = new Map<GameState, StateHooks>();
let currentState: GameState = GAME_STATES.MENU;

export function getState(): GameState {
  return currentState;
}

export function setState(nextState: GameState): void {
  if (nextState === currentState) {
    return;
  }

  const previousState = currentState;
  hooks.get(previousState)?.onExit?.(nextState);
  currentState = nextState;
  hooks.get(nextState)?.onEnter?.(previousState);
}

export function registerStateHooks(state: GameState, stateHooks: StateHooks): () => void {
  hooks.set(state, stateHooks);

  return () => {
    if (hooks.get(state) === stateHooks) {
      hooks.delete(state);
    }
  };
}

export function resetStateMachine(initialState: GameState = GAME_STATES.MENU): void {
  currentState = initialState;
}
