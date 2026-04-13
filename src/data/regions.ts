/**
 * Continental/regional aggregate statistics.
 *
 * Computes population-weighted averages from individual country data.
 * Regions follow the groupings used in the CountrySearchDropdown.
 *
 * These are approximate aggregates — proper regional data from WID.world
 * would be more accurate, but these give useful context when comparing
 * countries within the same region.
 */

import { ALL_COUNTRIES } from "./countries-extended";
import type { CountryData } from "./wealth-data";

// ─── Region definitions ─────────────────────────────────────────────────────

export type RegionCode = "americas" | "europe" | "asia-pacific" | "africa";

export interface RegionStats {
  readonly code: RegionCode;
  readonly name: string;
  readonly countries: readonly string[];
  readonly totalPopulation: number;
  readonly weightedMeanWealth: number;
  readonly weightedMedianWealth: number;
  readonly weightedGiniWealth: number;
  readonly weightedTop1Share: number;
  readonly weightedBottom50Share: number;
}

const REGION_MEMBERS: Readonly<Record<RegionCode, readonly string[]>> = {
  americas: ["US", "CA", "BR", "MX", "CL"],
  europe: ["GB", "FR", "DE", "NL", "SE", "NO", "DK", "FI", "CH", "IT", "ES", "PT", "AT", "BE", "IE", "PL", "CZ"],
  "asia-pacific": ["JP", "KR", "CN", "IN", "SG", "AU", "NZ"],
  africa: ["ZA"],
};

const REGION_NAMES: Readonly<Record<RegionCode, string>> = {
  americas: "Americas",
  europe: "Europe",
  "asia-pacific": "Asia-Pacific",
  africa: "Africa",
};

// ─── Computation ────────────────────────────────────────────────────────────

function computeRegionStats(code: RegionCode): RegionStats {
  const memberCodes = REGION_MEMBERS[code];
  const countryMap = new Map(ALL_COUNTRIES.map((c) => [c.code, c]));
  const members: CountryData[] = [];

  for (const cc of memberCodes) {
    const c = countryMap.get(cc);
    if (c) members.push(c);
  }

  if (members.length === 0) {
    return {
      code,
      name: REGION_NAMES[code],
      countries: [],
      totalPopulation: 0,
      weightedMeanWealth: 0,
      weightedMedianWealth: 0,
      weightedGiniWealth: 0,
      weightedTop1Share: 0,
      weightedBottom50Share: 0,
    };
  }

  const totalPop = members.reduce((sum, c) => sum + c.population, 0);

  // Population-weighted averages
  const weightedMean = members.reduce(
    (sum, c) => sum + c.meanWealthPerAdult * c.population,
    0,
  ) / totalPop;

  const weightedMedian = members.reduce(
    (sum, c) => sum + c.medianWealthPerAdult * c.population,
    0,
  ) / totalPop;

  const weightedGini = members.reduce(
    (sum, c) => sum + c.giniWealth * c.population,
    0,
  ) / totalPop;

  const weightedTop1 = members.reduce(
    (sum, c) => sum + c.wealthShares.top1 * c.population,
    0,
  ) / totalPop;

  const weightedBottom50 = members.reduce(
    (sum, c) => sum + c.wealthShares.bottom50 * c.population,
    0,
  ) / totalPop;

  return {
    code,
    name: REGION_NAMES[code],
    countries: memberCodes,
    totalPopulation: totalPop,
    weightedMeanWealth: Math.round(weightedMean),
    weightedMedianWealth: Math.round(weightedMedian),
    weightedGiniWealth: Math.round(weightedGini * 100) / 100,
    weightedTop1Share: Math.round(weightedTop1 * 10) / 10,
    weightedBottom50Share: Math.round(weightedBottom50 * 10) / 10,
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

export const REGION_CODES: readonly RegionCode[] = [
  "americas", "europe", "asia-pacific", "africa",
];

export const REGIONS: readonly RegionStats[] = REGION_CODES.map(computeRegionStats);

export const REGION_MAP: Readonly<Record<RegionCode, RegionStats>> = Object.fromEntries(
  REGIONS.map((r) => [r.code, r]),
) as Record<RegionCode, RegionStats>;
