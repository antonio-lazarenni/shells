import { memo, FC, MouseEventHandler } from 'react';
import { useCanvas } from '../../ctx/CanvasContext';
interface CanvasProps {
  onClick: MouseEventHandler<HTMLCanvasElement>;
}

const Canvas: FC<CanvasProps> = ({ onClick }) => {
  const { canvasRef } = useCanvas();
  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      onClick={onClick}
    />
  );
};

export default memo(Canvas);
