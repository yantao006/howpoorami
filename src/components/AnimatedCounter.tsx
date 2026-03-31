"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { motion, useInView } from "framer-motion";

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
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const prevEnd = useRef(end);
  const rafId = useRef<number | null>(null);
  const countRef = useRef(0);

  const cancelAnimation = useCallback(() => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isInView) return;

    cancelAnimation();

    const from = prevEnd.current !== end ? countRef.current : 0;
    prevEnd.current = end;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const newCount = from + eased * (end - from);
      countRef.current = newCount;
      setCount(newCount);

      if (progress < 1) {
        rafId.current = requestAnimationFrame(animate);
      } else {
        rafId.current = null;
      }
    }

    rafId.current = requestAnimationFrame(animate);

    return cancelAnimation;
  }, [isInView, end, duration, cancelAnimation]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="tabular-nums"
    >
      {prefix}
      {count.toFixed(decimals)}
      {suffix}
    </motion.span>
  );
}
