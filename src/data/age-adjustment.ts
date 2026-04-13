/**
 * Age-adjusted wealth percentile estimation.
 *
 * Wealth accumulation follows a strong lifecycle pattern: young adults
 * have little, wealth peaks around 65-74, then declines slightly.
 * Comparing a 25-year-old to all adults is misleading — this module
 * adjusts the comparison to peers of the same age.
 *
 * Data sources:
 *   - US: Federal Reserve SCF 2022 (Table 1, median net worth by age)
 *   - EU: ECB HFCS Wave 4 (2021, median net wealth by age)
 *   - Other: Scaled from closest survey using lifecycle ratios
 *
 * See data/raw/age-wealth-medians.json for full source documentation.
 */

import rawAgeData from "../../data/raw/age-wealth-medians.json";
import type { CountryData } from "./wealth-data";
import { findPercentile } from "./wealth-data";

// ─── Types ──────────────────────────────────────────────────────────────────

export type AgeGroup = "<35" | "35-44" | "45-54" | "55-64" | "65-74" | "75+";

export const AGE_GROUPS: readonly AgeGroup[] = [
  "<35", "35-44", "45-54", "55-64", "65-74", "75+",
];

export const AGE_GROUP_LABELS: Readonly<Record<AgeGroup, string>> = {
  "<35": "Under 35",
  "35-44": "35–44",
  "45-54": "45–54",
  "55-64": "55–64",
  "65-74": "65–74",
  "75+": "75 and over",
};

export interface AgeAdjustedResult {
  /** Overall percentile (all adults) */
  readonly overallPercentile: number;
  /** Age-adjusted percentile (among age peers) */
  readonly ageAdjustedPercentile: number;
  /** The user's age group */
  readonly ageGroup: AgeGroup;
  /** Median wealth for this age group in USD */
  readonly ageGroupMedianUSD: number;
  /** Overall median wealth in USD */
  readonly overallMedianUSD: number;
  /** Ratio: age group median / overall median */
  readonly ageRatio: number;
}

// ─── Data ───────────────────────────────────────────────────────────────────

type RatioMap = Readonly<Record<string, Readonly<Record<AgeGroup, number>>>>;
const ratios = (rawAgeData as unknown as { ratios: Record<string, Record<string, number>> }).ratios as unknown as RatioMap;

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Determine which age group an age falls into.
 */
export function getAgeGroup(age: number): AgeGroup {
  if (age < 35) return "<35";
  if (age < 45) return "35-44";
  if (age < 55) return "45-54";
  if (age < 65) return "55-64";
  if (age < 75) return "65-74";
  return "75+";
}

/**
 * Check if age-wealth ratio data is available for a country.
 */
export function hasAgeData(countryCode: string): boolean {
  return countryCode in ratios;
}

/**
 * Get the age-group median ratio for a country and age group.
 * Returns the ratio of age-group median to overall median.
 * Returns 1.0 if data is unavailable (no adjustment).
 */
function getAgeRatio(countryCode: string, ageGroup: AgeGroup): number {
  const countryRatios = ratios[countryCode];
  if (!countryRatios) return 1.0;
  return countryRatios[ageGroup] ?? 1.0;
}

// ─── Main function ──────────────────────────────────────────────────────────

/**
 * Compute an age-adjusted wealth percentile.
 *
 * The adjustment works by scaling the user's wealth relative to what's
 * typical for their age group, then finding where that scaled amount
 * falls in the overall distribution. This is equivalent to asking:
 * "If the median person in my age group is at percentile X, and I have
 * Y times their wealth, where do I fall among my age peers?"
 *
 * Method:
 *   1. Get ratio R = ageGroupMedian / overallMedian
 *   2. Compute adjusted wealth = userWealth / R
 *   3. Find percentile of adjusted wealth in overall distribution
 *
 * This effectively normalizes for the lifecycle effect: a 28-year-old
 * with $40K would rank low overall but may be doing well for their age.
 *
 * @param wealthUSD - User's net wealth in USD
 * @param age - User's age in years
 * @param country - Country data
 */
export function adjustPercentileForAge(
  wealthUSD: number,
  age: number,
  country: CountryData,
): AgeAdjustedResult {
  const ageGroup = getAgeGroup(age);
  const ratio = getAgeRatio(country.code, ageGroup);
  const overallMedianUSD = country.medianWealthPerAdult;
  const ageGroupMedianUSD = overallMedianUSD * ratio;

  // The overall percentile (unchanged)
  const overallPercentile = findPercentile(wealthUSD, country);

  // Age-adjusted: divide wealth by the age ratio to normalize
  // If ratio < 1 (young people have less), this inflates the wealth
  // for percentile lookup, giving them a higher age-adjusted rank.
  const adjustedWealth = ratio > 0 ? wealthUSD / ratio : wealthUSD;
  const ageAdjustedPercentile = findPercentile(adjustedWealth, country);

  return {
    overallPercentile,
    ageAdjustedPercentile,
    ageGroup,
    ageGroupMedianUSD,
    overallMedianUSD,
    ageRatio: ratio,
  };
}
