"use client";

import { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  readonly end: number;
  readonly duration?: number;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly decimals?: number;
}

export default function AnimatedCounter({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  decimals = 0,
}: AnimatedCounterProps) {
  // Initialize with `end` so SSR HTML shows the real value
  const [count, setCount] = useState(end);
  const ref = useRef<HTMLSpanElement>(null);
  const rafId = useRef<number | null>(null);
  const hasAnimated = useRef(false);

  // Sync if `end` changes (e.g. country switch) without animation
  useEffect(() => {
    if (hasAnimated.current) {
      setCount(end);
    }
  }, [end]);

  // Animate from 0 → end when element scrolls into view
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || hasAnimated.current) return;
        hasAnimated.current = true;
        observer.disconnect();

        const startTime = performance.now();
        const durationMs = duration * 1000;

        function tick(now: number) {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / durationMs, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(eased * end);

          if (progress < 1) {
            rafId.current = requestAnimationFrame(tick);
          } else {
            rafId.current = null;
          }
        }

        // Brief reset to 0 then animate up
        setCount(0);
        rafId.current = requestAnimationFrame(tick);
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };
  }, [end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}
