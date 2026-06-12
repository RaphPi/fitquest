import { useEffect, useRef, type DependencyList } from 'react';

interface Props {
  render: (canvas: HTMLCanvasElement) => void;
  deps: DependencyList;
  className?: string;
}

/** Canvas pixel art : appelle `render` au montage et quand `deps` change. */
export default function PixelCanvas({ render, deps, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) render(ref.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return <canvas ref={ref} className={className} style={{ imageRendering: 'pixelated' }} />;
}
