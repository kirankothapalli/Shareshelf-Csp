import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for scroll-triggered reveal animations via Intersection Observer.
 * Returns a ref to attach to the element and a boolean for visibility.
 *
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.15
 * @param {string} options.rootMargin - Root margin, default '0px 0px -60px 0px'
 * @param {boolean} options.once - Whether to unobserve after first intersection, default true
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px', once = true } = {}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, isVisible };
}

/**
 * Convenience component wrapper for scroll-reveal.
 * Applies the 'scroll-reveal' CSS class and toggles 'visible'.
 */
export function ScrollReveal({
  children,
  className = '',
  variant = 'up',
  delay = 0,
  once = true,
  as: Tag = 'div',
  ...props
}) {
  const { ref, isVisible } = useScrollReveal({ once });

  const variantClass = {
    up: 'scroll-reveal',
    left: 'scroll-reveal-left',
    right: 'scroll-reveal-right',
    scale: 'scroll-reveal-scale',
  }[variant] || 'scroll-reveal';

  const delayClass = delay ? `delay-${delay}` : '';

  return (
    <Tag
      ref={ref}
      className={`${variantClass} ${delayClass} ${isVisible ? 'visible' : ''} ${className}`}
      {...props}
    >
      {children}
    </Tag>
  );
}
