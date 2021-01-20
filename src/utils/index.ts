import { Shell, Vec2 } from '../hooks/GameState';

export function getRandomIntInclusive(min: number, max: number): number {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getShellNextMove(shell: Shell, destination: Vec2): Shell {
  const { position } = shell;

  const speed = 5;

  const dx = destination.x - position.x;
  const dy = destination.y - position.y;

  const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));

  const velocity = {
    x: (speed / distance) * dx,
    y: (speed / distance) * dy,
  };

  if (distance < 1) {
    return shell;
  }

  return {
    ...shell,
    position: {
      x: shell.position.x + velocity.x,
      y: shell.position.y + velocity.y,
    },
  };
}
