"use client";

import { useMemo, useCallback, useState } from "react";
import { Group } from "@visx/group";
import { AreaClosed, LinePath, Bar, Line } from "@visx/shape";
import { scaleLinear } from "@visx/scale";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { curveMonotoneX } from "@visx/curve";
import { localPoint } from "@visx/event";
import ChartTooltip from "@/components/ChartTooltip";
import { motion } from "framer-motion";
import { type CountryData } from "@/data/wealth-data";

interface HistoricalEvolutionChartProps {
  readonly country: CountryData;
  readonly width: number;
  readonly height: number;
}

interface StackedPoint {
  readonly year: number;
  readonly bottom50: number;
  readonly middle40: number;
  readonly top10: number;
  readonly top1: number;
  readonly cumBottom50: number;
  readonly cumMiddle40: number;
  readonly cumTop10: number;
}

interface EventMarker {
  readonly year: number;
  readonly label: string;
}

interface TooltipPayload {
  readonly year: number;
  readonly bottom50: number;
  readonly middle40: number;
  readonly top10: number;
  readonly top1: number;
}

const MARGIN = { top: 80, right: 30, bottom: 60, left: 65 };

// Paul Tol qualitative palette — colorblind-safe
const COLORS = {
  bottom50: { fill: "#44AA99", opacity: 0.4, label: "Bottom 50%" },
  middle40: { fill: "#88CCEE", opacity: 0.3, label: "Middle 40%" },
  top10: { fill: "#CC6677", opacity: 0.3, label: "Top 10%" },
  top1Line: { stroke: "#882255", label: "Top 1%" },
} as const;

const COUNTRY_EVENTS: Readonly<Record<string, readonly EventMarker[]>> = {
  US: [
    { year: 1933, label: "New Deal" },
    { year: 1944, label: "Top tax rate 94%" },
    { year: 1964, label: "Great Society" },
    { year: 1981, label: "Reaganomics" },
    { year: 2001, label: "Bush tax cuts" },
    { year: 2008, label: "Financial crisis" },
    { year: 2017, label: "Tax Cuts & Jobs Act" },
  ],
  GB: [
    { year: 1945, label: "Post-war welfare state" },
    { year: 1979, label: "Thatcherism begins" },
    { year: 2008, label: "Financial crisis" },
  ],
  FR: [
    { year: 1945, label: "Post-war reconstruction" },
    { year: 1982, label: "Wealth tax introduced" },
    { year: 2008, label: "Financial crisis" },
  ],
  DE: [
    { year: 1948, label: "Currency reform" },
    { year: 1990, label: "Reunification" },
    { year: 2008, label: "Financial crisis" },
  ],
  NL: [
    { year: 1945, label: "Welfare state expansion" },
    { year: 1990, label: "Housing boom starts" },
    { year: 2008, label: "Financial crisis" },
  ],
} as const;

const DEFAULT_EVENTS: readonly EventMarker[] = [
  { year: 2008, label: "Financial crisis" },
] as const;

function getEventsForCountry(code: string): readonly EventMarker[] {
  return COUNTRY_EVENTS[code] ?? DEFAULT_EVENTS;
}

function buildStackedData(country: CountryData): readonly StackedPoint[] {
  // Build lookup maps keyed by year to avoid index-based alignment bugs
  const top1ByYear = new Map(country.historicalWealthTop1.map(p => [p.year, p.share]));
  const bottom50ByYear = new Map(country.historicalWealthBottom50.map(p => [p.year, p.share]));

  return country.historicalWealthTop10
    .filter(entry => top1ByYear.has(entry.year) && bottom50ByYear.has(entry.year))
    .map(entry => {
      const year = entry.year;
      const top10 = entry.share;
      const top1 = top1ByYear.get(year) ?? 0;
      const bottom50 = bottom50ByYear.get(year) ?? 0;
      const middle40 = Math.max(0, 100 - top10 - bottom50);

      return {
        year,
        bottom50,
        middle40,
        top10,
        top1,
        cumBottom50: bottom50,
        cumMiddle40: bottom50 + middle40,
        cumTop10: bottom50 + middle40 + top10,
      };
    });
}

function findClosestIndex(
  data: readonly StackedPoint[],
  targetYear: number
): number {
  return data.reduce(
    (bestIdx, curr, idx) =>
      Math.abs(curr.year - targetYear) < Math.abs(data[bestIdx].year - targetYear)
        ? idx
        : bestIdx,
    0
  );
}

export default function HistoricalEvolutionChart({
  country,
  width,
  height,
}: HistoricalEvolutionChartProps) {
  const innerWidth = width - MARGIN.left - MARGIN.right;
  const innerHeight = height - MARGIN.top - MARGIN.bottom;

  const stackedData = useMemo(() => buildStackedData(country), [country]);

  const events = useMemo(
    () => getEventsForCountry(country.code),
    [country.code]
  );

  const xScale = useMemo(
    () =>
      scaleLinear<number>({
        domain: [
          Math.min(...stackedData.map((d) => d.year)),
          Math.max(...stackedData.map((d) => d.year)),
        ],
        range: [0, innerWidth],
      }),
    [stackedData, innerWidth]
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
    data: TooltipPayload;
    left: number;
    top: number;
  } | null>(null);

  const handleTooltip = useCallback(
    (
      event:
        | React.TouchEvent<SVGRectElement>
        | React.MouseEvent<SVGRectElement>
    ) => {
      const coords = localPoint(event);
      if (!coords) return;

      const x0 = xScale.invert(coords.x - MARGIN.left);
      const idx = findClosestIndex(stackedData, x0);
      const point = stackedData[idx];

      setTooltip({
        data: {
          year: point.year,
          bottom50: point.bottom50,
          middle40: point.middle40,
          top10: point.top10,
          top1: point.top1,
        },
        left: xScale(point.year) + MARGIN.left,
        top: Math.min(Math.max(MARGIN.top, coords.y), MARGIN.top + innerHeight),
      });
    },
    [stackedData, xScale, innerHeight]
  );

  const hideTooltip = useCallback(() => setTooltip(null), []);

  const visibleEvents = useMemo(() => {
    const [minYear, maxYear] = xScale.domain();
    return events.filter((e) => e.year >= minYear && e.year <= maxYear);
  }, [events, xScale]);

  if (width < 10) return null;

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <svg width={width} height={height} role="img" aria-label={`Historical wealth distribution evolution for ${country.name}`} style={{ overflow: "visible" }}>
        <Group left={MARGIN.left} top={MARGIN.top}>
          {/* Grid lines */}
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

          {/* Stacked areas: bottom50 (base), then middle40, then top10 */}
          <AreaClosed<StackedPoint>
            data={[...stackedData]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.cumTop10)}
            y0={() => yScale(0)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={COLORS.top10.fill}
            opacity={COLORS.top10.opacity}
          />
          <AreaClosed<StackedPoint>
            data={[...stackedData]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.cumMiddle40)}
            y0={() => yScale(0)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={COLORS.middle40.fill}
            opacity={COLORS.middle40.opacity}
          />
          <AreaClosed<StackedPoint>
            data={[...stackedData]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.cumBottom50)}
            y0={() => yScale(0)}
            yScale={yScale}
            curve={curveMonotoneX}
            fill={COLORS.bottom50.fill}
            opacity={COLORS.bottom50.opacity}
          />

          {/* Top 1% line within the top 10% area */}
          <LinePath<StackedPoint>
            data={[...stackedData]}
            x={(d) => xScale(d.year)}
            y={(d) => yScale(d.cumMiddle40 + d.top1)}
            stroke={COLORS.top1Line.stroke}
            strokeWidth={2}
            curve={curveMonotoneX}
          />

          {/* Event markers */}
          {visibleEvents.map((evt) => {
            const xPos = xScale(evt.year);
            return (
              <g key={`event-${evt.year}-${evt.label}`}>
                {/* Subtle background highlight */}
                <rect
                  x={xPos - 3}
                  y={0}
                  width={6}
                  height={innerHeight}
                  fill="var(--text-muted)"
                  opacity={0.05}
                />
                {/* Dashed vertical line */}
                <Line
                  from={{ x: xPos, y: 0 }}
                  to={{ x: xPos, y: innerHeight }}
                  stroke="var(--text-muted)"
                  strokeWidth={1}
                  strokeDasharray="3,4"
                  opacity={0.5}
                />
                {/* Label rotated -45 degrees */}
                <text
                  x={xPos}
                  y={-10}
                  transform={`rotate(-45, ${xPos}, -10)`}
                  fill="var(--text-secondary)"
                  fontSize={10}
                  fontFamily="var(--font-body)"
                  textAnchor="start"
                >
                  {evt.label}
                </text>
              </g>
            );
          })}

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

          {/* Tooltip crosshair */}
          {tooltip && (
            <Line
              from={{ x: xScale(tooltip.data.year), y: 0 }}
              to={{ x: xScale(tooltip.data.year), y: innerHeight }}
              stroke="var(--text-muted)"
              strokeWidth={1}
              strokeDasharray="3,3"
              opacity={0.6}
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
      <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 mt-6 px-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: COLORS.bottom50.fill }}
          />
          <span className="text-text-secondary text-sm">
            {COLORS.bottom50.label}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: COLORS.middle40.fill }}
          />
          <span className="text-text-secondary text-sm">
            {COLORS.middle40.label}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-3.5 h-3.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: COLORS.top10.fill }}
          />
          <span className="text-text-secondary text-sm">
            {COLORS.top10.label}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <div
            className="w-5 h-0.5 rounded flex-shrink-0"
            style={{ backgroundColor: COLORS.top1Line.stroke }}
          />
          <span className="text-text-secondary text-sm">
            {COLORS.top1Line.label}
          </span>
        </div>
      </div>

      {/* Tooltip */}
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
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS.top10.fill }}
              />
              <span className="text-text-secondary">Top 10%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.top10.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS.top1Line.stroke }}
              />
              <span className="text-text-secondary">Top 1%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.top1.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS.middle40.fill }}
              />
              <span className="text-text-secondary">Middle 40%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.middle40.toFixed(1)}%
              </span>
            </p>
            <p className="text-xs">
              <span
                className="inline-block w-2 h-2 rounded-full mr-1.5"
                style={{ backgroundColor: COLORS.bottom50.fill }}
              />
              <span className="text-text-secondary">Bottom 50%: </span>
              <span className="text-text-primary font-medium tabular-nums">
                {tooltip.data.bottom50.toFixed(1)}%
              </span>
            </p>
          </div>
        </ChartTooltip>
      )}
    </motion.div>
  );
}
