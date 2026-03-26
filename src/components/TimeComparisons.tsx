"use client";

import { useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  getRelevantComparisons,
  type ComparisonResult,
} from "@/data/time-comparisons";
import { YEARS_TO_MATCH_LINES } from "@/data/comedic-lines";
import { formatNumber } from "@/lib/format";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface TimeComparisonsProps {
  readonly yearsToMatch: number;
  readonly billionaireName: string;
}

interface ComedyCard {
  readonly text: string;
  readonly emoji: string;
  readonly accent: string;
  readonly border: string;
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

/** Emojis to rotate through for the comedic grid cards */
const CARD_EMOJIS = [
  "\u{1F4B8}", // money with wings
  "\u{1F525}", // fire
  "\u{1F916}", // robot
  "\u{1F3B0}", // slot machine
  "\u{1F4A1}", // light bulb
  "\u{1F30D}", // globe
  "\u{23F3}",  // hourglass
  "\u{1F4CA}", // chart
  "\u{1F947}", // medal
  "\u{1F3AF}", // dart
  "\u{1F6A7}", // construction
  "\u{2620}\uFE0F", // skull and crossbones
] as const;

const CARD_ACCENTS = [
  { accent: "text-accent-rose", border: "border-accent-rose/20" },
  { accent: "text-accent-amber", border: "border-accent-amber/20" },
  { accent: "text-accent-periwinkle", border: "border-accent-periwinkle/20" },
  { accent: "text-accent-sage", border: "border-accent-sage/20" },
  { accent: "text-accent-lavender", border: "border-accent-lavender/20" },
  { accent: "text-accent-rose", border: "border-accent-rose/20" },
  { accent: "text-accent-amber", border: "border-accent-amber/20" },
  { accent: "text-accent-periwinkle", border: "border-accent-periwinkle/20" },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Deterministic for a given seed so the same years always shows the same cards.
 */
function seededRandom(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick n unique random items from an array using a seeded RNG */
function pickRandom<T>(arr: readonly T[], n: number, rng: () => number): T[] {
  const copy = [...arr];
  const result: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(rng() * copy.length);
    result.push(copy[idx]);
    copy.splice(idx, 1);
  }
  return result;
}

function getComedyCards(
  years: number,
  billionaireName: string,
  count: number,
): readonly ComedyCard[] {
  const formattedYears = formatNumber(years);
  const rng = seededRandom(Math.floor(years));

  // Find matching tier
  const tier = YEARS_TO_MATCH_LINES.find(
    (t) => years >= t.min && years < t.max,
  ) ?? YEARS_TO_MATCH_LINES[YEARS_TO_MATCH_LINES.length - 1];

  // Pick unique lines
  const lines = pickRandom(tier.lines, count, rng);

  return lines.map((line, i) => ({
    text: line
      .replace(/\{name\}/g, billionaireName)
      .replace(/\{years\}/g, formattedYears),
    emoji: CARD_EMOJIS[i % CARD_EMOJIS.length],
    accent: CARD_ACCENTS[i % CARD_ACCENTS.length].accent,
    border: CARD_ACCENTS[i % CARD_ACCENTS.length].border,
  }));
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function LifetimeHighlight({
  comparison,
}: {
  readonly comparison: ComparisonResult;
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
      <span className="text-4xl sm:text-5xl mb-4 block">
        {comparison.ref.emoji}
      </span>
      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-sage mb-3">
        {comparison.formatted}
      </p>
      <p className="text-text-muted text-sm sm:text-base">
        {comparison.ref.label}
      </p>
    </motion.div>
  );
}

function ComedyGridCard({
  card,
  delay,
}: {
  readonly card: ComedyCard;
  readonly delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-30px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={`bg-bg-card border ${card.border} rounded-2xl p-5 sm:p-6 flex items-start gap-4`}
    >
      <span className="text-2xl sm:text-3xl shrink-0 mt-0.5">
        {card.emoji}
      </span>
      <div className="min-w-0">
        <p className={`text-sm sm:text-base leading-relaxed ${card.accent}`}>
          {card.text}
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const GRID_CARD_COUNT = 8;

export default function TimeComparisons({
  yearsToMatch,
  billionaireName,
}: TimeComparisonsProps) {
  const comparisons = getRelevantComparisons(yearsToMatch, billionaireName);

  // Always show the lifetime highlight
  const lifetimeComparison = comparisons.find(
    (c) => c.ref.id === "human-lifetime",
  );

  // Generate 8 comedic grid cards from YEARS_TO_MATCH_LINES
  const comedyCards = useMemo(
    () => getComedyCards(yearsToMatch, billionaireName, GRID_CARD_COUNT),
    [yearsToMatch, billionaireName],
  );

  if (comparisons.length === 0 && comedyCards.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {lifetimeComparison && (
        <LifetimeHighlight comparison={lifetimeComparison} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        {comedyCards.map((card, index) => (
          <ComedyGridCard
            key={`comedy-${index}`}
            card={card}
            delay={index * 0.08}
          />
        ))}
      </div>
    </div>
  );
}
