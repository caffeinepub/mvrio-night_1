import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
  movementThreshold?: number;
}

interface LongPressHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onPointerLeave: () => void;
  onPointerMove: (e: React.PointerEvent) => void;
}

export function useLongPress({
  onLongPress,
  delay = 5000,
  movementThreshold = 10,
}: UseLongPressOptions): LongPressHandlers {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startPositionRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressTriggeredRef = useRef(false);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPositionRef.current = null;
    isLongPressTriggeredRef.current = false;
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Capture the starting position
      startPositionRef.current = { x: e.clientX, y: e.clientY };
      isLongPressTriggeredRef.current = false;

      // Start the long-press timer
      timeoutRef.current = setTimeout(() => {
        if (!isLongPressTriggeredRef.current) {
          isLongPressTriggeredRef.current = true;
          onLongPress();
        }
      }, delay);
    },
    [onLongPress, delay]
  );

  const onPointerUp = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerCancel = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerLeave = useCallback(() => {
    clear();
  }, [clear]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startPositionRef.current) return;

      // Calculate movement distance
      const deltaX = Math.abs(e.clientX - startPositionRef.current.x);
      const deltaY = Math.abs(e.clientY - startPositionRef.current.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Cancel if movement exceeds threshold
      if (distance > movementThreshold) {
        clear();
      }
    },
    [movementThreshold, clear]
  );

  return {
    onPointerDown,
    onPointerUp,
    onPointerCancel,
    onPointerLeave,
    onPointerMove,
  };
}
