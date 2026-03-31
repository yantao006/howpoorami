/**
 * Effective tax rate data by wealth class.
 *
 * Data source:  data/raw/tax-rates.json (fetched by scripts/fetch-all-data.mjs)
 * Sources:      See _meta.sources in the raw JSON file.
 */

import rawTaxRates from "../../data/raw/tax-rates.json";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TaxRateByClass {
  readonly bottom50: number;
  readonly middle40: number;
  readonly top10to1: number;
  readonly top1to01: number;
  readonly top01to001: number;
  readonly top001: number;
  readonly nominalTopRate: number;
  readonly source: string;
  readonly year: number;
}

export type TaxRateCountryCode = string;

// ─── Raw JSON type ───────────────────────────────────────────────────────────

type RawTaxEntry = {
  bottom50: number; middle40: number; top10to1: number;
  top1to01: number; top01to001: number; top001: number;
  nominalTopRate: number; source: string; year: number;
};

// ─── Runtime validation ─────────────────────────────────────────────────────

function validateTaxRateData(data: unknown): data is Record<string, RawTaxEntry> {
  if (typeof data !== "object" || data === null) return false;
  const values = Object.entries(data).filter(([k]) => k !== "_meta");
  if (values.length === 0) return false;
  const [, first] = values[0];
  return (
    typeof first === "object" && first !== null &&
    typeof (first as RawTaxEntry).bottom50 === "number" &&
    typeof (first as RawTaxEntry).year === "number"
  );
}

// ─── Transform and export ────────────────────────────────────────────────────

function buildTaxRates(): Readonly<Record<TaxRateCountryCode, TaxRateByClass>> {
  if (!validateTaxRateData(rawTaxRates)) {
    throw new Error("tax-rates.json has an invalid shape: expected Record<string, { bottom50: number, ..., year: number }>");
  }
  const entries = Object.entries(rawTaxRates as unknown as Record<string, RawTaxEntry>)
    .filter(([key]) => key !== "_meta")
    .map(([cc, data]) => [cc, { ...data }]);
  return Object.fromEntries(entries);
}

export const TAX_RATES: Readonly<Record<TaxRateCountryCode, TaxRateByClass>> = buildTaxRates();

// ─── Analysis utilities ──────────────────────────────────────────────────────

export const getRegressivityGap = (rates: TaxRateByClass): number => {
  const peakRate = Math.max(
    rates.bottom50, rates.middle40, rates.top10to1,
    rates.top1to01, rates.top01to001, rates.top001,
  );
  return peakRate - rates.top001;
};

export const getStatutoryGap = (rates: TaxRateByClass): number =>
  rates.nominalTopRate - rates.top001;

export const getCountriesByRegressivity = (): ReadonlyArray<{
  readonly countryCode: string;
  readonly regressivityGap: number;
  readonly statutoryGap: number;
}> => {
  const entries = Object.entries(TAX_RATES).map(([code, rates]) => ({
    countryCode: code,
    regressivityGap: getRegressivityGap(rates),
    statutoryGap: getStatutoryGap(rates),
  }));
  return [...entries].sort((a, b) => b.regressivityGap - a.regressivityGap);
};
