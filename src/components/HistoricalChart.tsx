"use client";

import { useMemo, useCallback, useState } from "react";
import { Group } from "@visx/group";
import { LinePath, AreaClosed, Bar, Line } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { LinearGradient } from "@visx/gradient";
import { curveMonotoneX } from "@visx/curve";
import { localPoint } from "@visx/event";
import ChartTooltip from "@/components/ChartTooltip";
import { type CountryData } from "@/data/wealth-data";

interface HistoricalChartProps {
  readonly country: CountryData;
  readonly width: number;
  readonly height: number;
}

interface DataPoint {
  readonly year: number;
  readonly share: number;
}

const MARGIN = { top: 20, right: 30, bottom: 60, left: 65 };

// Paul Tol qualitative palette — colorblind-safe
const COLORS = {
  top1: { line: "#CC6677", fill: "#CC6677", label: "Top 1%" },
  top10: { line: "#DDCC77", fill: "#DDCC77", label: "Top 10%" },
  bottom50: { line: "#44AA99", fill: "#44AA99", label: "Bottom 50%" },
} as const;

export default function HistoricalChart({
  country,
  width,
  height,
}: HistoricalChartProps) {
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const allYears = useMemo(
    () => country.historicalWealthTop1.map((d) => d.year),
    [country]
  );

  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [Math.min(...allYears), Math.max(...allYears)],
        range: [0, innerWidth],
      }),
    [allYears, innerWidth]
  );

  const yScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, 100],
        range: [innerHeight, 0],
      }),
    [innerHeight]
  );

  const [tooltip, setTooltip] = useState<{
    data: { year: number; top1: number; top10: number; bottom50: number };
    left: number;
    top: number;
  } | null>(null);

  const handleTooltip = useCallback(
    (event: React.TouchEvent<SVGRectElement> | React.MouseEvent<SVGRectElement>) => {
      const coords = localPoint(event);
      if (!coords) return;

      const x0 = xScale.invert(coords.x - MARGIN.left);
      const closestIdx = country.historicalWealthTop1.reduce(
        (bestIdx, curr, idx) =>
          Math.abs(curr.year - x0) <
          Math.abs(country.historicalWealthTop1[bestIdx].year - x0)
            ? idx
            : bestIdx,
        0
      );

      setTooltip({
        data: {
          year: country.historicalWealthTop1[closestIdx].year,
          top1: country.historicalWealthTop1[closestIdx].share,
          top10: country.historicalWealthTop10[closestIdx]?.share ?? 0,
          bottom50: country.historicalWealthBottom50[closestIdx]?.share ?? 0,
        },
        left: xScale(country.historicalWealthTop1[closestIdx].year) + MARGIN.left,
        top: Math.min(Math.max(MARGIN.top, coords.y), MARGIN.top + innerHeight),
      });
    },
    [country, xScale, innerHeight]
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  if (width < 10) return null;

  return (
    <div className="relative">
      <svg width={width} height={height}>
        <LinearGradient id="hist-top1" from="#CC6677" fromOpacity={0.2} to="#CC6677" toOpacity={0.02} />
        <LinearGradient id="hist-top10" from="#DDCC77" fromOpacity={0.15} to="#DDCC77" toOpacity={0.02} />
        <LinearGradient id="hist-bottom50" from="#44AA99" fromOpacity={0.2} to="#44AA99" toOpacity={0.02} />

        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Grid */}
          {[1920, 1940, 1960, 1980, 2000, 2020].map((tick) => (
            <Line
              key={`grid-x-${tick}`}
              from={{ x: xScale(tick), y: 0 }}
              to={{ x: xScale(tick), y: innerHeight }}
              stroke="var(--border-subtle)"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.4}
            />
          ))}
          {[20, 40, 60, 80].map((tick) => (
            <Line
              key={`grid-y-${tick}`}
              from={{ x: 0, y: yScale(tick) }}
              to={{ x: innerWidth, y: yScale(tick) }}
              stroke="var(--border-subtle)"
              strokeWidth={1}
              strokeDasharray="4,4"
              opacity={0.4}
            />
          ))}

          {/* Areas */}
          <AreaClosed<DataPoint>
            data={[...country.historicalWealthTop10]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#hist-top10)"
          />
          <AreaClosed<DataPoint>
            data={[...country.historicalWealthTop1]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#hist-top1)"
          />
          <AreaClosed<DataPoint>
            data={[...country.historicalWealthBottom50]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill="url(#hist-bottom50)"
          />

          {/* Lines */}
          <LinePath<DataPoint>
            data={[...country.historicalWealthTop10]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            stroke={COLORS.top10.line}
            strokeWidth={2}
            curve={curveMonotoneX}
          />
          <LinePath<DataPoint>
            data={[...country.historicalWealthTop1]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            stroke={COLORS.top1.line}
            strokeWidth={2.5}
            curve={curveMonotoneX}
          />
          <LinePath<DataPoint>
            data={[...country.historicalWealthBottom50]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.share)}
            stroke={COLORS.bottom50.line}
            strokeWidth={2.5}
            curve={curveMonotoneX}
          />

          {/* Tooltip hover area */}
          <Bar
            x={0}
            y={0}
            width={innerWidth}
            height={innerHeight}
            fill="transparent"
            onTouchStart={handleTooltip}
            onTouchMove={handleTooltip}
            onMouseMove={handleTooltip}
            onMouseLeave={hideTooltip}
          />

          {tooltip && (
            <Line
              from={{ x: xScale(tooltip.data.year), y: 0 }}
              to={{ x: xScale(tooltip.data.year), y: innerHeight }}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.5}
            />
          )}

          {/* Axes */}
          <AxisBottom
            top={innerHeight}
            scale={xScale}
            numTicks={6}
            tickFormat={(v) => String(v)}
            stroke="var(--border-subtle)"
            tickStroke="var(--border-subtle)"
            tickLabelProps={{
              fill: "var(--text-secondary)",
              fontSize: 12,
              textAnchor: "middle",
              fontFamily: "var(--font-body)",
            }}
          />
          <AxisLeft
            scale={yScale}
            tickValues={[0, 20, 40, 60, 80, 100]}
            tickFormat={(v) => `${v}%`}
            stroke="var(--border-subtle)"
            tickStroke="var(--border-subtle)"
            tickLabelProps={{
              fill: "var(--text-secondary)",
              fontSize: 12,
              textAnchor: "end",
              fontFamily: "var(--font-body)",
            }}
            label="Share of total wealth"
            labelOffset={45}
            labelProps={{
              fill: "var(--text-secondary)",
              fontSize: 13,
              textAnchor: "middle",
              fontFamily: "var(--font-body)",
            }}
          />
        </Group>
      </svg>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-4">
        {Object.entries(COLORS).map(([key, val]) => (
          <div key={key} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: val.line }}
            />
            <span className="text-text-secondary text-sm">{val.label}</span>
          </div>
        ))}
      </div>

      {tooltip && (
        <ChartTooltip
          left={tooltip.left}
          top={tooltip.top}
          containerWidth={width}
          containerHeight={height}
        >
          <p className="text-text-primary font-semibold tabular-nums text-sm">
            {tooltip.data.year}
          </p>
          <div className="mt-1.5 space-y-1">
            <p className="text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#DDCC77] mr-1.5" />
              <span className="text-text-secondary">Top 10%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.top10.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#CC6677] mr-1.5" />
              <span className="text-text-secondary">Top 1%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.top1.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs">
              <span className="inline-block w-2 h-2 rounded-full bg-[#44AA99] mr-1.5" />
              <span className="text-text-secondary">Bottom 50%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.bottom50.toFixed(1)}%
              </span>
            </p>
          </div>
        </ChartTooltip>
      )}
    </div>
  );
}
