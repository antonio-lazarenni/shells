import { useEffect, useState } from 'react';

interface UseTick {
  tick: number;
}

export const useTick = (): UseTick => {
  const [tick, setTime] = useState<number>(0);

  useEffect(() => {
    window.requestAnimationFrame(() => setTime(tick + 1));
  });

  return { tick };
};
