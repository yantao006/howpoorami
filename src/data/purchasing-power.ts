/**
 * Purchasing power / wages vs. cost of living data.
 *
 * Data source:  data/raw/purchasing-power.json (fetched by scripts/fetch-all-data.mjs)
 * Sources:      OECD (wages), World Bank (CPI), BIS/FRED (house prices)
 */

import rawPurchasingPower from "../../data/raw/purchasing-power.json";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EconomicDataPoint {
  readonly year: number;
  readonly wageIndex: number;
  readonly cpiIndex: number;
  readonly housePriceIndex: number | null;
}

export interface CountryEconomicData {
  readonly countryCode: string;
  readonly series: readonly EconomicDataPoint[];
}

// ─── Raw JSON type ───────────────────────────────────────────────────────────

type RawEconEntry = {
  countryCode?: string;
  series: Array<{
    year: number;
    wageIndex?: number;
    cpiIndex?: number;
    housePriceIndex?: number;
  }>;
};

// ─── Transform and export ────────────────────────────────────────────────────

function buildPurchasingPower(): Readonly<Record<string, CountryEconomicData>> {
  const entries = Object.entries(rawPurchasingPower as unknown as Record<string, RawEconEntry>)
    .filter(([key]) => key !== "_meta")
    .map(([cc, data]) => [
      cc,
      {
        countryCode: cc,
        series: data.series.map(p => ({
          year: p.year,
          wageIndex: p.wageIndex ?? 100,
          cpiIndex: p.cpiIndex ?? 100,
          housePriceIndex: p.housePriceIndex ?? null,
        })),
      },
    ]);
  return Object.fromEntries(entries);
}

export const PURCHASING_POWER: Readonly<Record<string, CountryEconomicData>> = buildPurchasingPower();

export const ECONOMIC_SOURCES = {
  wages: { name: "OECD Average Annual Wages", indicator: "AV_AN_WAGE", url: "https://data-explorer.oecd.org" },
  cpi: { name: "World Bank CPI", indicator: "FP.CPI.TOTL", url: "https://data.worldbank.org/indicator/FP.CPI.TOTL" },
  housePrices: { name: "BIS Residential Property Prices via FRED", url: "https://data.bis.org/topics/RPP" },
} as const;
