import { useEffect, useRef, useState } from 'react';

/**
 * Animated counter hook — counts from `start` to `end` with ease-out-cubic easing.
 * Only begins counting when `shouldStart` is true (typically from IntersectionObserver).
 *
 * @param {number} end - Target value
 * @param {Object} options
 * @param {number} options.start - Starting value (default 0)
 * @param {number} options.duration - Animation duration in ms (default 2000)
 * @param {boolean} options.shouldStart - Whether to start the animation
 */
export default function useCountUp(end, { start = 0, duration = 2000, shouldStart = false } = {}) {
  const [value, setValue] = useState(start);
  const rafRef = useRef(null);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!shouldStart || hasRun.current) return;
    hasRun.current = true;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setValue(end);
      return;
    }

    const startTime = performance.now();
    const range = end - start;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const current = Math.round(start + range * eased);

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [shouldStart, end, start, duration]);

  return value;
}
