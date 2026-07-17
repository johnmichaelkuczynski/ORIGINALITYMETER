import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Makes a floating panel draggable by its header.
 * Returns `pos` (left/top pixel position) and `onHeaderMouseDown` to attach
 * to the header element. The panel should be `position: fixed`.
 */
export function useDraggablePanel(defaultX?: number, defaultY = 80) {
  const [pos, setPos] = useState<{ x: number; y: number }>(() => ({
    x: defaultX ?? Math.max(40, window.innerWidth - 720),
    y: defaultY,
  }));

  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const posRef = useRef(pos);
  posRef.current = pos;

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't start drag on button clicks inside the header
    if ((e.target as HTMLElement).closest('button')) return;
    dragging.current = true;
    offset.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({
        x: Math.max(0, e.clientX - offset.current.x),
        y: Math.max(0, e.clientY - offset.current.y),
      });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  return { pos, onHeaderMouseDown };
}
