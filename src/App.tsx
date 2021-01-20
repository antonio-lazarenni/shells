import React, { FC, useCallback, useEffect } from 'react';
import { Box } from 'theme-ui';
import { getRandomIntInclusive, getShellNextMove } from './utils';

import { useCanvas } from './ctx/CanvasContext';
import { useTick } from './hooks/Tick';
import { useGameState, Shell, Ball, ShuffleState } from './hooks/GameState';

import Canvas from './components/Canvas';

const App: FC = () => {
  const {
    state,
    dispatch,
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
  } = useGameState();

  const { tick } = useTick();
  const { ctx } = useCanvas();

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const x = e.clientX,
        y = e.clientY;

      if (state.stage === 'idle') {
        startGame();
      }

      if (state.stage === 'showing_result') {
        resetGame();
      }

      if (state.stage === 'guessing') {
        const shell = Object.values(state.shells).find(({ position }) => {
          return (
            position.x < x &&
            position.x + 50 > x &&
            position.y < y &&
            position.y + 50 > y
          );
        });

        if (shell) {
          saveGuess({ shell });
          openShell({ shell });
          showResults();
        }
      }
    },
    [dispatch, state.shells, state.stage]
  );

  const drawShell = useCallback(
    (ctx: CanvasRenderingContext2D, shell: Shell) => {
      const rectangle = new Path2D();
      ctx.save();
      rectangle.rect(shell.position.x, shell.position.y, 50, 50);
      ctx.fillStyle = `rgba(54, 70, 236, ${shell.status === 'open' ? 0 : 1})`;
      ctx.fill(rectangle);
      ctx.strokeStyle = `rgba(54, 70, 236, 1)`;
      ctx.stroke(rectangle);
      ctx.restore();
    },
    []
  );

  const drawBall = useCallback(
    (ctx: CanvasRenderingContext2D, ball: Ball) => {
      const { position } = state.shells[ball.position];
      const circle = new Path2D();
      ctx.save();
      circle.arc(position.x + 25, position.y + 25, 15, 0, 2 * Math.PI);
      ctx.fillStyle = 'salmon';
      ctx.fill(circle);
      ctx.restore();
    },
    [state.shells]
  );

  const drawGameState = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.save();
      ctx.fillStyle = 'salmon';
      ctx.font = '30px Arial';
      switch (state.stage) {
        case 'idle':
          ctx.fillText('Click to start shuffling! 😎', 200, 50);
          break;
        case 'shuffling':
          ctx.fillText('🎲 Shuffling...! 🎲', 200, 50);
          break;
        case 'guessing':
          ctx.fillText('Click on the shell! 👀👀👀', 200, 50);
          break;
        case 'showing_result':
          {
            const result =
              state.guess === 2 ? 'Awesome! 🎉🎉🎉' : 'Maybe next time 😓😓😓';
            ctx.fillText(result, 200, 50);
            ctx.fillText('Click to start again!', 200, 75);
          }
          break;

        default:
          break;
      }
      ctx.restore();
    },
    [state.stage]
  );

  // Animate
  useEffect(() => {
    if (state.shuffle.status === 'swapping') {
      const shells = Object.keys(state.shells).reduce<Record<string, Shell>>(
        (acc, key: string) => {
          const shell = state.shells[key];
          const attractionPoint = state.places[shell.place].position;
          if (
            shell.position.x === attractionPoint.x &&
            shell.position.y === attractionPoint.y
          ) {
            //Animation for this shell is finished
            return acc;
          }
          return {
            ...acc,
            [shell.id]: getShellNextMove(shell, attractionPoint),
          };
        },
        {}
      );

      if (Object.keys(shells).length === 0) {
        stopSwapping();
      }

      renderMove({ shells });
    }
  }, [tick]);

  // Game Main Dispatcher
  useEffect(() => {
    switch (state.stage) {
      case 'shuffling':
        {
          const shells = Object.keys(state.shells).reduce<
            Record<string, Shell>
          >((acc, key: string) => {
            const shell = state.shells[key];
            return {
              ...acc,
              [shell.id]: {
                ...shell,
                status: 'close',
              },
            };
          }, {});

          const swapOptions: ShuffleState['shuffles'] = [
            ['a', 'b'],
            ['b', 'c'],
            ['a', 'c'],
          ];

          const range = (n: number) =>
            Array.from(
              { length: n },
              () => swapOptions[getRandomIntInclusive(0, 2)]
            );
          const swapTimes = getRandomIntInclusive(3, 6);
          const shuffles = range(swapTimes);
          // Close all shells
          // Put Shuffles
          // Update state
          startShuffle({
            shells,
            shuffles,
          });
        }
        break;
      case 'guessing':
        break;
      case 'showing_result':
        openShell({ shell: state.shells[2] });
        break;

      default:
        break;
    }
  }, [dispatch, state.stage]);

  // Shuffles Dispatcher
  useEffect(() => {
    if (state.shuffle.status === 'ready' && state.shuffle.shuffles.length) {
      const swap = state.shuffle.shuffles[0];

      const aShell = Object.values(state.shells).find(
        (shell) => shell.place === swap[0]
      );

      const bShell = Object.values(state.shells).find(
        (shell) => shell.place === swap[1]
      );

      if (aShell === undefined || bShell === undefined) {
        throw new Error(`Error: unexpected swap error`);
      }

      const shells = {
        ...state.shells,
        [aShell.id]: {
          ...aShell,
          place: swap[1],
        },
        [bShell.id]: {
          ...bShell,
          place: swap[0],
        },
      };

      startSwapping({ shells, shuffles: state.shuffle.shuffles.slice(1) });
    }

    if (state.shuffle.status === 'finished' && state.shuffle.shuffles.length) {
      startNextSwap();
    }

    if (state.shuffle.shuffles.length === 0 && state.stage === 'shuffling') {
      startGuessing();
    }
  }, [dispatch, state.shuffle.shuffles, state.shuffle.status]);

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
    });
  }, [
    ctx,
    drawBall,
    drawGameState,
    drawShell,
    state.ball,
    state.shells,
    state.stage,
  ]);

  return (
    <Box>
      <Canvas onClick={handleCanvasClick} />
    </Box>
  );
};

export default App;
