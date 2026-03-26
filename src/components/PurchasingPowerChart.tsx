"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PURCHASING_POWER } from "@/data/purchasing-power";

interface PurchasingPowerChartProps {
  readonly countryCode: string;
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.05, duration: 0.3, ease: "easeOut" as const },
  }),
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
};

function formatPrice(value: number, symbol: string): string {
  if (value >= 1_000_000) return `${symbol}${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${symbol}${value.toLocaleString("en", { maximumFractionDigits: 0 })}`;
  return `${symbol}${value.toFixed(2)}`;
}

function formatHours(hours: number): string {
  if (hours >= 8760) return `${(hours / 8760).toFixed(1)} years`;
  if (hours >= 2000) return `${(hours / 2000).toFixed(1)} work-years`;
  if (hours >= 168) return `${Math.round(hours / 8)} work-days`;
  if (hours >= 1) return `${hours.toFixed(1)} hrs`;
  return `${Math.round(hours * 60)} min`;
}

export default function PurchasingPowerChart({
  countryCode,
}: PurchasingPowerChartProps) {
  const data = PURCHASING_POWER[countryCode];

  const years = useMemo(() => {
    if (!data) return [];
    return data.timeline.map((t) => t.year);
  }, [data]);

  const earliestYear = years[0] ?? 1970;
  const latestYear = years[years.length - 1] ?? 2023;

  const [selectedYear, setSelectedYear] = useState(latestYear);

  const closestSnapshot = useMemo(() => {
    if (!data) return undefined;
    let closest = data.timeline[0];
    for (const t of data.timeline) {
      if (Math.abs(t.year - selectedYear) < Math.abs(closest.year - selectedYear)) {
        closest = t;
      }
    }
    return closest;
  }, [data, selectedYear]);

  /** Compute hours of work at minimum wage to buy each item, across all years */
  const hoursOverTime = useMemo(() => {
    if (!data) return [];

    // Exclude min_wage from the items list (it's the denominator)
    const itemBaskets = data.baskets.filter((b) => b.id !== "min_wage");

    return itemBaskets.map((basket) => {
      const points = data.timeline
        .filter((t) => t.items.min_wage > 0 && t.items[basket.id] !== undefined)
        .map((t) => ({
          year: t.year,
          price: t.items[basket.id],
          wage: t.items.min_wage,
          hours: t.items[basket.id] / t.items.min_wage,
        }));

      const earliest = points[0];
      const latest = points[points.length - 1];
      const change =
        earliest && latest && earliest.hours > 0
          ? ((latest.hours - earliest.hours) / earliest.hours) * 100
          : 0;

      return {
        id: basket.id,
        emoji: basket.emoji,
        label: basket.label,
        unit: basket.unit,
        points,
        change,
      };
    });
  }, [data]);

  /** Current year's item data */
  const currentItems = useMemo(() => {
    if (!data || !closestSnapshot) return [];
    const wage = closestSnapshot.items.min_wage;
    if (wage <= 0) return [];

    return data.baskets
      .filter((b) => b.id !== "min_wage")
      .map((basket) => {
        const price = closestSnapshot.items[basket.id];
        if (price === undefined || price <= 0) return null;
        return {
          id: basket.id,
          emoji: basket.emoji,
          label: basket.label,
          unit: basket.unit,
          price,
          wage,
          hours: price / wage,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, [data, closestSnapshot]);

  if (!data) {
    return (
      <div className="rounded-xl border border-border-subtle bg-bg-card p-8 text-center">
        <p className="text-text-secondary text-lg">
          No purchasing power data available for this country.
        </p>
        <p className="text-text-muted mt-2 text-sm">
          Data is currently available for US, GB, FR, DE, and NL.
        </p>
      </div>
    );
  }

  const hasMinWageData = data.timeline.some((t) => t.items.min_wage > 0);

  return (
    <div className="space-y-12">
      {/* Part 1: Hours of Work Over Time */}
      {hasMinWageData && (
        <section>
          <h3 className="text-text-primary mb-1 text-xl font-semibold">
            How Many Hours of Work?
          </h3>
          <p className="text-text-muted mb-6 text-sm">
            Hours at minimum wage to afford each item — then vs now (
            {data.currencySymbol})
          </p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hoursOverTime
              .filter((item) => item.points.length >= 2)
              .map((item, i) => {
                const earliest = item.points[0];
                const latest = item.points[item.points.length - 1];
                const worsened = item.change > 0;

                return (
                  <motion.div
                    key={item.id}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    className="rounded-xl border border-border-subtle bg-bg-card p-4"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-2xl" role="img" aria-label={item.label}>
                        {item.emoji}
                      </span>
                      <span className="text-text-primary text-sm font-medium">
                        {item.label}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between mb-2">
                      <div className="text-text-muted text-xs">
                        <span className="block">{earliest.year}</span>
                        <span className="text-text-secondary font-semibold text-base tabular-nums">
                          {formatHours(earliest.hours)}
                        </span>
                        <span className="block text-[10px]">
                          at {formatPrice(earliest.wage, data.currencySymbol)}/hr
                        </span>
                      </div>
                      <div className="text-text-muted text-lg px-2">→</div>
                      <div className="text-text-muted text-xs text-right">
                        <span className="block">{latest.year}</span>
                        <span
                          className={`font-semibold text-base tabular-nums ${
                            worsened ? "text-accent-rose" : "text-accent-sage"
                          }`}
                        >
                          {formatHours(latest.hours)}
                        </span>
                        <span className="block text-[10px]">
                          at {formatPrice(latest.wage, data.currencySymbol)}/hr
                        </span>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-bold ${
                        worsened ? "text-accent-rose" : "text-accent-sage"
                      }`}
                    >
                      {worsened ? "↑" : "↓"}{" "}
                      {Math.abs(item.change).toFixed(0)}%{" "}
                      {worsened ? "more work needed" : "less work needed"}
                    </div>

                    <div className="text-text-muted mt-1 text-[10px]">
                      {item.unit}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </section>
      )}

      {/* Part 2: Interactive Year Slider */}
      {hasMinWageData && (
        <section>
          <h3 className="text-text-primary mb-1 text-xl font-semibold">
            Work Hours by Year
          </h3>
          <p className="text-text-muted mb-6 text-sm">
            Slide to see how long you&apos;d need to work at minimum wage to
            buy everyday items.
          </p>

          {/* Slider */}
          <div className="mb-8">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-text-muted text-sm">{earliestYear}</span>
              <motion.span
                key={closestSnapshot?.year}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-bold text-accent-periwinkle"
              >
                {closestSnapshot?.year}
              </motion.span>
              <span className="text-text-muted text-sm">{latestYear}</span>
            </div>

            <input
              type="range"
              min={earliestYear}
              max={latestYear}
              step={1}
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-bg-card-hover accent-accent-periwinkle outline-none"
              aria-label="Select year"
            />

            {/* Year markers */}
            <div className="mt-1 flex justify-between">
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  className={`text-[10px] transition-colors ${
                    closestSnapshot?.year === year
                      ? "font-bold text-accent-periwinkle"
                      : "text-text-muted hover:text-text-secondary"
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Items grid */}
          <AnimatePresence mode="popLayout">
            {currentItems.length === 0 ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-text-muted py-8 text-center text-sm"
              >
                No minimum wage data available for {closestSnapshot?.year}.
              </motion.p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {currentItems.map((item, i) => {
                  const maxHours = Math.max(
                    ...currentItems.map((it) => it.hours)
                  );
                  const barPct = Math.min(
                    (item.hours / maxHours) * 100,
                    100
                  );

                  return (
                    <motion.div
                      key={item.id}
                      custom={i}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="rounded-xl border border-border-subtle bg-bg-card p-4"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className="text-2xl"
                          role="img"
                          aria-label={item.label}
                        >
                          {item.emoji}
                        </span>
                        <span className="text-text-primary text-sm font-medium">
                          {item.label}
                        </span>
                      </div>

                      <motion.div
                        key={`${item.id}-${closestSnapshot?.year}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        className="mb-1 text-2xl font-bold text-accent-periwinkle"
                      >
                        {formatHours(item.hours)}
                      </motion.div>

                      <div className="text-text-muted mb-2 text-xs">
                        {formatPrice(item.price, data.currencySymbol)} at{" "}
                        {formatPrice(item.wage, data.currencySymbol)}/hr
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card-hover">
                        <motion.div
                          className="h-full rounded-full bg-accent-periwinkle/60"
                          initial={{ width: 0 }}
                          animate={{ width: `${barPct}%` }}
                          transition={{
                            duration: 0.4,
                            delay: i * 0.03,
                            ease: "easeOut",
                          }}
                        />
                      </div>
                      <div className="text-text-muted mt-1 text-[10px]">
                        {item.unit}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Fallback if no min wage data */}
      {!hasMinWageData && (
        <div className="rounded-xl border border-border-subtle bg-bg-card p-8 text-center">
          <p className="text-text-secondary text-lg">
            Minimum wage data not available for this country.
          </p>
          <p className="text-text-muted mt-2 text-sm">
            Hours-of-work comparison requires historical minimum wage data.
          </p>
        </div>
      )}
    </div>
  );
}
