import { useCallback, useReducer } from 'react';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Place {
  id: string;
  position: Vec2;
}
export interface Shell {
  id: number;
  status: 'open' | 'close';
  position: Vec2;
  place: Place['id'];
  color: string;
}

export interface Ball {
  position: Shell['id'];
}

export interface ShuffleState {
  status: 'ready' | 'swapping' | 'finished';
  shuffles: [string, string][];
}

export interface GameState {
  stage: 'idle' | 'shuffling' | 'guessing' | 'showing_result';
  shuffle: ShuffleState;
  shells: Record<string, Shell>;
  places: Record<string, Place>;
  ball: Ball;
  guess: number | undefined;
}

export interface GameAction {
  type:
    | 'reset'
    | 'change_stage'
    | 'start'
    | 'open_shell'
    | 'start_shuffle'
    | 'stop_shuffle'
    | 'start_swapping'
    | 'stop_swapping'
    | 'start_next_swap'
    | 'render_move'
    | 'save_guess';
  payload?: any;
}

const initialState: GameState = {
  stage: 'idle',
  guess: undefined,
  shuffle: {
    status: 'finished', // swap status to be honest
    shuffles: [],
  },
  places: {
    a: {
      id: 'a',
      position: { x: 200, y: 100 },
    },
    b: {
      id: 'b',
      position: { x: 300, y: 100 },
    },
    c: {
      id: 'c',
      position: { x: 400, y: 100 },
    },
  },
  shells: {
    1: {
      id: 1,
      status: 'close',
      position: { x: 200, y: 100 },
      color: '#72d586',
      place: 'a',
    },
    2: {
      id: 2,
      status: 'open',
      position: { x: 300, y: 100 },
      color: '#6674c8',
      place: 'b',
    },
    3: {
      id: 3,
      status: 'close',
      position: { x: 400, y: 100 },
      color: '#76cfd5',
      place: 'c',
    },
  },
  ball: {
    position: 2,
  },
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'change_stage':
      return {
        ...state,
        stage: action.payload.status,
      };
    case 'start_shuffle':
      return {
        ...state,
        shells: {
          ...action.payload.shells,
        },
        shuffle: {
          status: 'ready',
          shuffles: action.payload.shuffles,
        },
      };
    case 'open_shell':
      return {
        ...state,
        shells: {
          ...state.shells,
          [action.payload.shell.id]: {
            ...state.shells[action.payload.shell.id],
            status: 'open',
          },
        },
      };
    case 'start_swapping':
      return {
        ...state,
        shuffle: {
          status: 'swapping',
          shuffles: action.payload.shuffles,
        },
        shells: {
          ...state.shells,
          ...action.payload.shells,
        },
      };
    case 'stop_swapping':
      return {
        ...state,
        shuffle: {
          ...state.shuffle,
          status: 'finished',
        },
      };
    case 'start_next_swap':
      return {
        ...state,
        shuffle: {
          ...state.shuffle,
          status: 'ready',
        },
      };
    case 'render_move':
      return {
        ...state,
        shells: {
          ...state.shells,
          ...action.payload.shells,
        },
      };
    case 'save_guess':
      return {
        ...state,
        guess: action.payload.shell.id,
        shells: {
          ...state.shells,
          ...action.payload.shells,
        },
      };
    default:
      throw new Error(`Action: ${action.type}`);
  }
}

export const useGameState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const createAction = (type: GameAction['type'], p?: any) =>
    useCallback((payload = p) => dispatch({ type, payload }), []);

  const startGame = createAction('change_stage', {
    status: 'shuffling',
  });

  const startGuessing = createAction('change_stage', {
    status: 'guessing',
  });

  const showResults = createAction('change_stage', {
    status: 'showing_result',
  });

  const resetGame = createAction('reset');
  const renderMove = createAction('render_move');

  const saveGuess = createAction('save_guess');
  const openShell = createAction('open_shell');
  const startShuffle = createAction('start_shuffle');

  const startSwapping = createAction('start_swapping');
  const stopSwapping = createAction('stop_swapping');
  const startNextSwap = createAction('start_next_swap');

  return {
    state,
    dispatch,
    createAction,
    startGame,
    startGuessing,
    showResults,
    resetGame,
    saveGuess,
    stopSwapping,
    renderMove,
    openShell,
    startShuffle,
    startSwapping,
    startNextSwap,
  };
};
