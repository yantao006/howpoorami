"use client";

import { type ReactNode } from "react";

interface ChartTooltipProps {
  readonly left: number;
  readonly top: number;
  readonly containerWidth: number;
  readonly containerHeight: number;
  readonly children: ReactNode;
}

/**
 * Simple chart tooltip that positions itself relative to the chart container.
 * Automatically flips horizontally/vertically to stay within bounds.
 */
export default function ChartTooltip({
  left,
  top,
  containerWidth,
  containerHeight,
  children,
}: ChartTooltipProps) {
  const tooltipWidth = 180;
  const tooltipHeight = 120;
  const offset = 14;

  // Flip horizontally if tooltip would go off right edge
  const flipX = left + offset + tooltipWidth > containerWidth;
  const x = flipX ? left - offset - tooltipWidth : left + offset;

  // Flip vertically if tooltip would go off bottom edge
  const flipY = top + tooltipHeight > containerHeight;
  const y = flipY ? Math.max(4, top - tooltipHeight) : top;

  return (
    <div
      className="absolute z-10 bg-bg-card border border-border-subtle rounded-lg shadow-lg px-3 py-2"
      style={{
        left: Math.max(4, x),
        top: Math.max(4, y),
        pointerEvents: "none",
        minWidth: 140,
        maxWidth: tooltipWidth,
      }}
    >
      {children}
    </div>
  );
}
