/**
 * Purchasing Power Parity (PPP) conversion utilities.
 *
 * PPP factors convert local currency to "international dollars" — a
 * hypothetical currency with the same purchasing power as the US dollar
 * in the United States. This allows meaningful cross-country comparison
 * of what money can actually buy.
 *
 * Data source: World Bank International Comparison Program
 * Indicator: PA.NUS.PPP — PPP conversion factor, GDP (LCU per international $)
 * URL: https://data.worldbank.org/indicator/PA.NUS.PPP
 * Year: 2023
 */

import rawPPP from "../../data/raw/ppp-factors.json";

const factors = (rawPPP as { factors: Record<string, number> }).factors ?? {};

/**
 * Convert a local-currency amount to PPP-adjusted international dollars.
 *
 * Example: €50,000 in Germany → 50000 / 0.701 ≈ $71,300 in purchasing power
 * (i.e. €50K in Germany buys as much as $71K in the US).
 */
export function toPPPDollars(localAmount: number, currencyCode: string): number {
  const factor = factors[currencyCode];
  if (factor === undefined || factor === 0) return localAmount;
  return localAmount / factor;
}

/**
 * Convert PPP international dollars to local currency.
 */
export function fromPPPDollars(pppAmount: number, currencyCode: string): number {
  const factor = factors[currencyCode];
  if (factor === undefined) return pppAmount;
  return pppAmount * factor;
}

/**
 * Get the PPP factor for a currency (LCU per international $).
 * Returns null if not available.
 */
export function getPPPFactor(countryCode: string): number | null {
  return factors[countryCode] ?? null;
}

/**
 * Check if PPP data is available for a given country code.
 */
export function hasPPPData(countryCode: string): boolean {
  return countryCode in factors;
}
