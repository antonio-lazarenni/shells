import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Box } from 'theme-ui';
import { useCanvas } from './ctx/CanvasContext';
import Canvas from './components/Canvas';
import { getRandomIntInclusive } from './utils';
interface Vec2 {
  x: number,
  y: number,
}

interface Place {
  id: string,
  position: Vec2,
}
interface Shell {
  id: number,
  status: 'open' | 'close',
  position: Vec2,
  place: Place['id'],
  color: string,
}

interface Ball {
  position: Shell['id'],
}

interface ShuffleState {
  status: 'swapping' | 'finish',
  shuffles: [string, string][]
}

interface GameState {
  status: 'idle' | 'shuffling' | 'guessing' | 'showing_result',
  shuffle: ShuffleState,
  shells: Record<string, Shell>,
  places: Record<string, Place>,
  ball: Ball,
}

interface GameAction {
  type:
  'reset' |
  'change_status' |
  'start' |
  'shuffle' |
  'open' |
  'start_swapping' |
  'stop_swapping' |
  'move' |
  'render_move',
  payload?: any,
}

const initialState: GameState = {
  status: 'idle',
  shuffle: {
    status: 'finish', // swap status to be honest
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
    }
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
      color: "#76cfd5",
      place: 'c',
    }
  },
  ball: {
    position: 2
  }
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'reset':
      return initialState;
    case 'change_status':
      return {
        ...state,
        status: action.payload.status,
      };
    case 'shuffle':
      const newShells = Object.keys(state.shells).reduce<Record<string, Shell>>((acc, key: string) => {
        const shell = state.shells[key]
        return {
          ...acc,
          [shell.id]: {
            ...shell,
            status: 'close'
          }
        }
      }, {});

      return {
        ...state,
        shells: {
          ...newShells
        },
        shuffle: {
          status: 'finish',
          shuffles: action.payload
        },
      };
    case 'open':
      return {
        ...state,
        shells: {
          ...state.shells,
          [action.payload.id]: {
            ...state.shells[action.payload.id],
            status: 'open',
          }
        }
      };
    case 'start_swapping':
      if (!action.payload) {
        return {
          ...state,
          status: 'guessing',
        }
      }

      const firsrShell = Object.values(state.shells).find((shell) => shell.place === action.payload[0])
      const secondShell = Object.values(state.shells).find((shell) => shell.place === action.payload[1])

      if (firsrShell === undefined || secondShell === undefined) {
        throw new Error(`Error: unexpected swap error`);
      }

      return {
        ...state,
        shuffle: {
          status: 'swapping',
          shuffles: state.shuffle.shuffles.slice(1),
        },
        shells: {
          ...state.shells,
          [firsrShell.id]: {
            ...firsrShell,
            place: action.payload[1],
          },
          [secondShell.id]: {
            ...secondShell,
            place: action.payload[0],
          },
        }
      };
    case 'stop_swapping':
      return {
        ...state,
        shuffle: {
          ...state.shuffle,
          status: 'finish',
        }
      }
    case 'render_move':
      return {
        ...state,
        shells: {
          ...state.shells,
          ...action.payload.shells,
        },
      };
    default:
      throw new Error(`Action: ${action.type}`);
  }
}

const useGameState = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const createAction = (type: GameAction['type'], p?: any) => (payload = p) => dispatch({ type, payload });
  return {
    state,
    dispatch,
    createAction
  }
}

interface UseTick {
  tick: number,
}

const useTick = (): UseTick => {
  const [tick, setTime] = useState<number>(0);

  useEffect(() => {
    window.requestAnimationFrame(() => setTime(tick + 1));
  });

  return { tick };
}

function App() {
  const { state, dispatch, createAction } = useGameState();
  const { tick } = useTick();
  const { ctx } = useCanvas();

  const startGame = createAction('change_status', { status: 'shuffling' });
  const startGuessing = createAction('change_status', { status: 'guessing' });
  const showResults = createAction('change_status', { status: 'showing_result' });
  const resetGame = createAction('reset');

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    const x = e.clientX,
      y = e.clientY;

    if (state.status === 'idle' || state.status === 'showing_result') {
      startGame()
    }

    if (state.status === 'showing_result') {
      resetGame();
    }

    if (state.status === 'guessing') {
      const shellClicked = Object.values(state.shells).find((shell) => {
        return shell.position.x < x && x < shell.position.x + 50 && shell.position.y < y && y < shell.position.y + 50
      });

      if (shellClicked) {
        showResults();
        return dispatch({ type: 'open', payload: { id: shellClicked.id } });
      }
    }

  }, [dispatch, state.shells, state.status]);

  const drawShell = useCallback((ctx: CanvasRenderingContext2D, shell: Shell) => {
    const rectangle = new Path2D();
    ctx.save();
    rectangle.rect(shell.position.x, shell.position.y, 50, 50);
    ctx.fillStyle = `rgba(54, 70, 236, ${(shell.status === 'open') ? 0 : 1})`;
    ctx.fill(rectangle);
    ctx.strokeStyle = `rgba(54, 70, 236, 1)`;
    ctx.stroke(rectangle);
    ctx.restore();
  }, [])

  const drawBall = useCallback((ctx: CanvasRenderingContext2D, ball: Ball) => {
    const { position } = state.shells[ball.position];
    const circle = new Path2D();
    ctx.save();
    circle.arc(position.x + 25, position.y + 25, 15, 0, 2 * Math.PI);
    ctx.fillStyle = "salmon";
    ctx.fill(circle);
    ctx.restore();;
  }, [state.shells])

  const drawGameState = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.fillStyle = "salmon";
    ctx.font = "30px Arial";
    ctx.fillText(state.status, 10, 50);
    ctx.restore();;
  }, [state.status])

  function getShellNextMove(shell: Shell, destination: Vec2) {
    const { position } = shell;

    const speed = 10;

    const dx = destination.x - position.x;
    const dy = destination.y - position.y;

    const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

    const velocity = {
      x: speed / distance * dx,
      y: speed / distance * dy,
    }

    if (distance < 1) {
      console.log('swap finished');
      console.log('==============================');

      // Stop current swap
      return shell;
    }

    return {
      ...shell,
      position: {
        x: shell.position.x + velocity.x,
        y: shell.position.y + velocity.y,
      }
    }
  }

  // Animate
  useEffect(() => {
    if (state.shuffle.status === 'swapping') {
      const newShells = Object.keys(state.shells).reduce<Record<string, Shell>>((acc, key: string) => {
        const shell = state.shells[key]
        const attractionPoint = state.places[shell.place].position;
        return {
          ...acc,
          [shell.id]: getShellNextMove(shell, attractionPoint)
        }
      }, {});

      dispatch({ type: 'render_move', payload: { shells: newShells } })
    }

  }, [tick])

  // Game Main Dispatcher
  useEffect(() => {
    switch (state.status) {
      case 'shuffling':
        const range = (n: number) => Array.from({ length: n }, () => swapOptions[getRandomIntInclusive(0, 2)])
        const swapOptions = [['a', 'b'], ['b', 'c'], ['a', 'c']];
        const swapTimes = getRandomIntInclusive(1, 10);
        const shuffles = range(swapTimes);
        dispatch({ type: 'shuffle', payload: shuffles });
        break;
      case 'guessing':

        break;
      case 'showing_result':
        dispatch({ type: 'open', payload: { id: 2 } });
        break;

      default:
        break;
    }
  }, [dispatch, state.status])

  // Shuffles Dispatcher
  useEffect(() => {
    if (state.shuffle.status === 'finish' && state.shuffle.shuffles.length) {
      dispatch({ type: 'start_swapping', payload: state.shuffle.shuffles[0] })
    }

    if (state.shuffle.status === 'finish' && state.shuffle.shuffles.length) {
      dispatch({ type: 'stop_swapping' })
    }

    if (state.shuffle.shuffles.length === 0 && state.status === 'shuffling') {
      startGuessing();
    }

  }, [dispatch, state.shuffle.shuffles, state.shuffle.status, state.status])

  // Draw state
  useEffect(() => {

    if (ctx == null) {
      return;
    }

    ctx.clearRect(0, 0, window.innerHeight, window.innerWidth);
    drawGameState(ctx);

    drawBall(ctx, state.ball);

    Object.values(state.shells).forEach((shell) => {
      drawShell(ctx, shell);
    })


  }, [ctx, drawBall, drawGameState, drawShell, state.ball, state.shells, state.status])

  return (
    <Box>
      <Canvas onClick={handleCanvasClick} />
    </Box>
  );
}

export default App;
