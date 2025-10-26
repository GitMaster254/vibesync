// hooks/useLongPress.ts
import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onShortPress?: () => void;
  threshold?: number; // ms
}

export function useLongPress({ onLongPress, onShortPress, threshold = 500 }: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const startPress = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault(); // Prevent scroll/select
    isLongPress.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, threshold);
  }, [onLongPress, threshold]);

  const endPress = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (!isLongPress.current && onShortPress) {
      onShortPress();
    }
  }, [onShortPress]);

  return { onMouseDown: startPress, onMouseUp: endPress, onTouchStart: startPress, onTouchEnd: endPress };
}