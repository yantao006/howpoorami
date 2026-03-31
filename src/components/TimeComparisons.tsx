"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  getRelevantComparisons,
  type ComparisonResult,
} from "@/data/time-comparisons";
import { getYearsToMatchLine } from "@/data/comedic-lines";
import { formatNumber } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface TimeComparisonsProps {
  readonly yearsToMatch: number;
  readonly billionaireName: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  historical: "text-accent-amber",
  scientific: "text-accent-periwinkle",
  religious: "text-accent-lavender",
  human: "text-accent-sage",
  comedic: "text-accent-rose",
  pop_culture: "text-accent-rose",
};

const CATEGORY_BORDER: Record<string, string> = {
  historical: "border-accent-amber/20",
  scientific: "border-accent-periwinkle/20",
  religious: "border-accent-lavender/20",
  human: "border-accent-sage/20",
  comedic: "border-accent-rose/20",
  pop_culture: "border-accent-rose/20",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LifetimeHighlight({
  comparison,
  comedicQuote,
}: {
  readonly comparison: ComparisonResult;
  readonly comedicQuote: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="bg-bg-card border border-border-subtle rounded-2xl p-8 sm:p-10 text-center"
    >
      <span className="text-4xl sm:text-5xl mb-4 block" aria-hidden="true">
        {comparison.ref.emoji}
      </span>
      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-sage mb-3">
        {comparison.formatted}
      </p>
      <p className="text-text-muted text-sm sm:text-base">
        {comparison.ref.label} ({comparison.ref.years} years)
      </p>
      {comedicQuote && (
        <p className="text-text-muted text-sm italic mt-5 pt-5 border-t border-border-subtle/50 max-w-lg mx-auto">
          {comedicQuote}
        </p>
      )}
    </motion.div>
  );
}

function ComparisonCard({
  comparison,
  delay,
}: {
  readonly comparison: ComparisonResult;
  readonly delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  const accent = CATEGORY_ACCENT[comparison.ref.category] ?? "text-text-primary";
  const border = CATEGORY_BORDER[comparison.ref.category] ?? "border-border-subtle";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`bg-bg-card border ${border} rounded-2xl p-5 sm:p-6 text-center`}
    >
      <span className="text-3xl sm:text-4xl mb-3 block" aria-hidden="true">
        {comparison.ref.emoji}
      </span>
      <p className={`text-lg sm:text-xl font-bold ${accent} mb-2`}>
        {comparison.formatted}
      </p>
      <p className="text-text-muted text-xs sm:text-sm">
        {comparison.ref.label}
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function TimeComparisons({
  yearsToMatch,
  billionaireName,
}: TimeComparisonsProps) {
  const comparisons = getRelevantComparisons(yearsToMatch, billionaireName);

  // Always show the lifetime highlight separately
  const lifetimeComparison = comparisons.find(
    (c) => c.ref.id === "human-lifetime",
  );

  // The 6 grid cards are everything except the lifetime highlight
  const gridCards = comparisons
    .filter((c) => c.ref.id !== "human-lifetime")
    .slice(0, 6);

  // Get a comedic quote to put inside the lifetime card
  const comedicQuote = getYearsToMatchLine(
    yearsToMatch,
    billionaireName,
    formatNumber(yearsToMatch),
  );

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {lifetimeComparison && (
        <LifetimeHighlight
          comparison={lifetimeComparison}
          comedicQuote={comedicQuote}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {gridCards.map((comparison, index) => (
          <ComparisonCard
            key={comparison.ref.id}
            comparison={comparison}
            delay={index * 0.08}
          />
        ))}
      </div>
    </div>
  );
}
