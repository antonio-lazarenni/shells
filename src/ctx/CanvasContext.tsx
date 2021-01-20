import React, {
  useRef,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface ICanvasContext {
  ctx: CanvasRenderingContext2D | null;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

const CanvasContext = createContext<ICanvasContext | undefined>(undefined);

export const CanvasProvider: React.FC = (props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ctx, setContext] = useState<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx == null) {
        throw new Error('Could not get context');
      }
      setContext(ctx);
    }
  }, []);

  return <CanvasContext.Provider {...props} value={{ ctx, canvasRef }} />;
};

export const useCanvas = (): ICanvasContext => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new TypeError('useCanvas must be used within a CanvasProvider');
  }
  return context;
};

export default CanvasContext;
