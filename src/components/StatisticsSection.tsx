"use client";

import { useState } from "react";
import AnimatedCounter from "./AnimatedCounter";
import { type CountryData, GLOBAL_STATS, getWealthThresholds } from "@/data/wealth-data";
import { formatCurrency } from "@/lib/format";
import { fromUSD } from "@/lib/currency";
import { getPPPFactor } from "@/lib/ppp";
import { REGIONS, type RegionStats } from "@/data/regions";

interface StatisticsSectionProps {
  readonly country: CountryData;
}

interface StatCardProps {
  readonly label: string;
  readonly children: React.ReactNode;
  readonly sublabel?: string;
  readonly accent?: "rose" | "amber" | "sage" | "periwinkle" | "lavender";
}

const accentColors = {
  rose: "text-accent-rose",
  amber: "text-accent-amber",
  sage: "text-accent-sage",
  periwinkle: "text-accent-periwinkle",
  lavender: "text-accent-lavender",
};

function StatCard({ label, children, sublabel, accent = "periwinkle" }: StatCardProps) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 sm:p-8 text-center">
      <p className="text-text-secondary text-sm sm:text-base mb-3">{label}</p>
      <p className={`text-3xl sm:text-4xl lg:text-5xl font-bold ${accentColors[accent]}`}>
        {children}
      </p>
      {sublabel && (
        <p className="text-text-muted text-xs sm:text-sm mt-3">{sublabel}</p>
      )}
    </div>
  );
}

export default function StatisticsSection({ country }: StatisticsSectionProps) {
  const [showPPP, setShowPPP] = useState(false);
  const pppFactor = getPPPFactor(country.code);
  const hasPPP = pppFactor !== null && country.code !== "US" && country.code !== "GLOBAL";

  const meanToMedianRatio = country.meanWealthPerAdult / country.medianWealthPerAdult;

  // Average wealth of a top 1% member = (their share of total wealth) / (1% of adults)
  // = (top1% / 100) * meanWealthPerAdult / 0.01
  const avgTop1Wealth = (country.wealthShares.top1 / 100) * country.meanWealthPerAdult / 0.01;
  const yearsToEarnTop1 = Math.round(avgTop1Wealth / country.medianIncome);

  // Wealth thresholds for key percentile boundaries
  const thresholds = getWealthThresholds(country);

  // Convert USD values to local currency for display
  const cc = country.currency;
  const meanLocal = fromUSD(country.meanWealthPerAdult, cc);
  const medianLocal = fromUSD(country.medianWealthPerAdult, cc);
  const medianIncomeLocal = fromUSD(country.medianIncome, cc);
  const avgTop1Local = fromUSD(avgTop1Wealth, cc);

  // PPP-adjusted values (USD purchasing power equivalent)
  const pppMeanUSD = pppFactor ? meanLocal / pppFactor : null;
  const pppMedianUSD = pppFactor ? medianLocal / pppFactor : null;

  // Find which region this country belongs to
  const countryRegion = REGIONS.find((r) => r.countries.includes(country.code)) ?? null;

  return (
    <div className="space-y-16">
      <div>
        <div className="flex flex-col items-center gap-3 mb-10">
          <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center text-text-primary">
            The Numbers That Define Inequality
          </h3>
          {hasPPP && (
            <button
              type="button"
              onClick={() => setShowPPP((v) => !v)}
              className={`text-xs px-3 py-1 rounded-full font-medium transition-all cursor-pointer ${
                showPPP
                  ? "bg-accent-amber/20 text-accent-amber border border-accent-amber/30"
                  : "bg-bg-card text-text-secondary border border-border-subtle hover:text-text-primary"
              }`}
            >
              {showPPP ? "Showing purchasing power" : "Show purchasing power (PPP)"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatCard label={`The top 1% in ${country.name} owns`} accent="rose" sublabel="of total national wealth">
            <AnimatedCounter end={country.wealthShares.top1} suffix="%" decimals={1} />
          </StatCard>
          <StatCard label="The bottom 50% shares just" accent="sage" sublabel="of total national wealth">
            <AnimatedCounter end={country.wealthShares.bottom50} suffix="%" decimals={1} />
          </StatCard>
          <StatCard label="Wealth Gini coefficient" accent="lavender" sublabel="0 = perfect equality, 1 = one person owns everything">
            <AnimatedCounter end={country.giniWealth} decimals={2} />
          </StatCard>
          <StatCard
            label="Mean wealth per adult"
            accent="amber"
            sublabel={showPPP && pppMeanUSD ? `PPP: ~$${Math.round(pppMeanUSD / 1000)}K purchasing power` : "Skewed upward by the ultra-wealthy"}
          >
            {formatCurrency(meanLocal, cc, true)}
          </StatCard>
          <StatCard
            label="Median wealth per adult"
            accent="periwinkle"
            sublabel={showPPP && pppMedianUSD ? `PPP: ~$${Math.round(pppMedianUSD / 1000)}K purchasing power` : "What the typical person actually has"}
          >
            {formatCurrency(medianLocal, cc, true)}
          </StatCard>
          <StatCard label="Mean / Median ratio" accent="rose" sublabel="Higher = more skewed distribution">
            <AnimatedCounter end={meanToMedianRatio} suffix="x" decimals={1} />
          </StatCard>
        </div>
      </div>

      {/* Entry thresholds */}
      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center mb-4 text-text-primary">
          What Does It Take to Join Each Group?
        </h3>
        <p className="text-text-muted text-sm text-center mb-8 max-w-lg mx-auto">
          Estimated minimum net wealth to enter each wealth bracket in {country.name}.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <ThresholdCard label="Top 50%" amount={fromUSD(thresholds.p50, cc)} currency={cc} />
          <ThresholdCard label="Top 10%" amount={fromUSD(thresholds.p90, cc)} currency={cc} />
          <ThresholdCard label="Top 1%" amount={fromUSD(thresholds.p99, cc)} currency={cc} />
          <ThresholdCard label="Top 0.1%" amount={fromUSD(thresholds.p999, cc)} currency={cc} />
        </div>
        <p className="text-text-muted text-xs text-center mt-4">
          Thresholds are estimates based on Pareto-interpolated WID.world data.
        </p>
      </div>

      {/* Big impact statement */}
      <div className="bg-gradient-to-br from-accent-periwinkle/8 to-accent-lavender/8 border border-accent-periwinkle/15 rounded-3xl p-8 sm:p-12 text-center">
        <p className="text-text-secondary text-lg sm:text-xl mb-4">
          A median income earner in {country.name} would need to work for
        </p>
        <p className="text-5xl sm:text-6xl lg:text-7xl font-bold text-accent-amber font-[family-name:var(--font-heading)]">
          <AnimatedCounter end={yearsToEarnTop1} duration={2.5} /> years
        </p>
        <p className="text-text-secondary text-lg sm:text-xl mt-4">
          to accumulate the average wealth of the top 1%
        </p>
        <p className="text-text-muted text-sm mt-6">
          Based on median pre-tax national income of {formatCurrency(medianIncomeLocal, cc)}/year vs. average
          top 1% wealth of {formatCurrency(avgTop1Local, cc, true)}
        </p>
      </div>

      {/* Income vs Wealth comparison */}
      <div>
        <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center mb-10 text-text-primary">
          Income vs. Wealth: The Double Gap
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 sm:p-8">
            <h4 className="text-accent-periwinkle font-semibold text-lg mb-6">Income Distribution</h4>
            <div className="space-y-4">
              <BarRow label="Top 1%" value={country.incomeShares.top1} color="#CC6677" />
              <BarRow label="Top 10%" value={country.incomeShares.top10} color="#DDCC77" />
              <BarRow label="Middle 40%" value={country.incomeShares.middle40} color="#88CCEE" />
              <BarRow label="Bottom 50%" value={country.incomeShares.bottom50} color="#44AA99" />
            </div>
            <p className="text-text-muted text-xs mt-4">Gini (income): {country.giniIncome.toFixed(2)}</p>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 sm:p-8">
            <h4 className="text-accent-amber font-semibold text-lg mb-6">Wealth Distribution</h4>
            <div className="space-y-4">
              <BarRow label="Top 1%" value={country.wealthShares.top1} color="#CC6677" />
              <BarRow label="Top 10%" value={country.wealthShares.top10} color="#DDCC77" />
              <BarRow label="Middle 40%" value={country.wealthShares.middle40} color="#88CCEE" />
              <BarRow label="Bottom 50%" value={country.wealthShares.bottom50} color="#44AA99" />
            </div>
            <p className="text-text-muted text-xs mt-4">Gini (wealth): {country.giniWealth.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Global context */}
      <div className="text-center">
        <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl mb-8 text-text-primary">
          The Global Picture
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Global top 1% owns" accent="rose" sublabel="of all global wealth">
            <AnimatedCounter end={GLOBAL_STATS.globalTop1WealthShare} suffix="%" decimals={1} />
          </StatCard>
          <StatCard label="Global bottom 50% owns" accent="sage" sublabel="of all global wealth">
            <AnimatedCounter end={GLOBAL_STATS.globalBottom50WealthShare} suffix="%" decimals={1} />
          </StatCard>
          <StatCard label="Global wealth Gini" accent="lavender" sublabel="Among the highest of any metric measured">
            <AnimatedCounter end={GLOBAL_STATS.globalGiniWealth} decimals={2} />
          </StatCard>
        </div>
        <p className="text-text-muted text-sm mt-6">Source: {GLOBAL_STATS.source}</p>
      </div>

      {/* Regional context */}
      {countryRegion && (
        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-2xl sm:text-3xl text-center mb-8 text-text-primary">
            {country.name} in Regional Context
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REGIONS.filter((r) => r.countries.length > 1).map((r) => {
              const isCurrent = r.code === countryRegion.code;
              return (
                <div
                  key={r.code}
                  className={`bg-bg-card border rounded-xl p-4 text-center ${
                    isCurrent
                      ? "border-accent-periwinkle/40 ring-1 ring-accent-periwinkle/20"
                      : "border-border-subtle"
                  }`}
                >
                  <p className="text-text-secondary text-xs mb-1">{r.name}</p>
                  <p className="text-text-primary font-bold text-lg tabular-nums">
                    {formatCurrency(r.weightedMedianWealth, "USD", true)}
                  </p>
                  <p className="text-text-muted text-[10px] mt-1">median wealth (USD)</p>
                  <div className="flex justify-center gap-3 mt-2 text-[10px]">
                    <span className="text-accent-rose">Top 1%: {r.weightedTop1Share}%</span>
                    <span className="text-accent-sage">Bot 50%: {r.weightedBottom50Share}%</span>
                  </div>
                  {isCurrent && (
                    <p className="text-accent-periwinkle text-[10px] font-medium mt-1">
                      {country.name}&apos;s region
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-text-muted text-xs text-center mt-4">
            Regional aggregates are population-weighted averages of covered countries.
          </p>
        </div>
      )}
    </div>
  );
}

function ThresholdCard({ label, amount, currency }: { readonly label: string; readonly amount: number; readonly currency: string }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl p-4 text-center">
      <p className="text-text-muted text-xs mb-1">{label}</p>
      <p className="text-text-primary font-bold text-lg sm:text-xl tabular-nums">
        {formatCurrency(amount, currency, true)}
      </p>
    </div>
  );
}

function BarRow({ label, value, color }: { readonly label: string; readonly value: number; readonly color: string }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-text-secondary">{label}</span>
        <span className="text-text-primary font-medium tabular-nums">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2.5 bg-bg-primary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ backgroundColor: color, width: `${Math.max(0, value)}%` }}
        />
      </div>
    </div>
  );
}
