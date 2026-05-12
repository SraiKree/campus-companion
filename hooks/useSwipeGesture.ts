import { useRef, useCallback, type PointerEvent as ReactPointerEvent } from 'react';

interface SwipeGestureOptions {
  /** Minimum horizontal distance (px) to trigger a swipe. Default 80 */
  threshold?: number;
  /** Max ratio of vertical/horizontal movement to allow. Default 0.6 */
  maxVerticalRatio?: number;
  /** Called on every move with the horizontal delta (px) */
  onDrag?: (dx: number) => void;
  /** Called when a left-to-right swipe completes (past threshold) */
  onSwipeRight?: () => void;
  /** Called when a right-to-left swipe completes (past threshold) */
  onSwipeLeft?: () => void;
  /** Called when the gesture ends without reaching threshold */
  onCancel?: () => void;
}

export function useSwipeGesture(options: SwipeGestureOptions = {}) {
  const {
    threshold = 80,
    maxVerticalRatio = 0.6,
    onDrag,
    onSwipeRight,
    onSwipeLeft,
    onCancel,
  } = options;

  const startX = useRef(0);
  const startY = useRef(0);
  const tracking = useRef(false);
  const locked = useRef<'horizontal' | 'vertical' | null>(null);

  const onPointerDown = useCallback((e: ReactPointerEvent) => {
    // Only primary button (or touch)
    if (e.button !== 0) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    tracking.current = true;
    locked.current = null;
    // NOTE: We intentionally do NOT call setPointerCapture here.
    // Capturing the pointer would steal all events from child elements
    // (links, buttons), making them unclickable. We capture later, only
    // once a horizontal swipe is locked in (see onPointerMove).
  }, []);

  const onPointerMove = useCallback((e: ReactPointerEvent) => {
    if (!tracking.current) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Lock direction after 10px of movement
    if (!locked.current && (absDx > 10 || absDy > 10)) {
      locked.current = absDx >= absDy ? 'horizontal' : 'vertical';

      // Once locked horizontal, capture the pointer so subsequent
      // move/up events keep firing on this element even if the cursor
      // (or finger) drifts off the sidebar — e.g. on a left swipe that
      // pushes past the viewport edge. Auto-released on pointerup.
      if (locked.current === 'horizontal') {
        try {
          (e.currentTarget as Element).setPointerCapture(e.pointerId);
        } catch {
          // ignore — some environments throw if the element isn't ready
        }
      }
    }

    // If locked to vertical, bail
    if (locked.current === 'vertical') {
      return;
    }

    // Ignore if too much vertical movement relative to horizontal
    if (absDx > 0 && absDy / absDx > maxVerticalRatio) {
      return;
    }

    // Clamp the visual drag to a reasonable range
    const clampedDx = Math.max(-120, Math.min(120, dx));
    onDrag?.(clampedDx);
  }, [maxVerticalRatio, onDrag]);

  const onPointerUp = useCallback((e: ReactPointerEvent) => {
    if (!tracking.current) return;
    tracking.current = false;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Reset drag
    onDrag?.(0);

    // Only fire if primarily horizontal
    if (locked.current === 'vertical' || (absDx > 0 && absDy / absDx > maxVerticalRatio)) {
      onCancel?.();
      return;
    }

    if (absDx >= threshold) {
      if (dx > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else {
      onCancel?.();
    }
  }, [threshold, maxVerticalRatio, onDrag, onSwipeRight, onSwipeLeft, onCancel]);

  const onPointerCancel = useCallback(() => {
    tracking.current = false;
    onDrag?.(0);
    onCancel?.();
  }, [onDrag, onCancel]);

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
  };
}
