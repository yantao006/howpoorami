/**
 * Billionaire data and detailed sub-percentile wealth shares.
 *
 * Data source:  data/raw/*.json (fetched by scripts/fetch-all-data.mjs)
 * Raw files:
 *   - data/raw/billionaires.json        — Forbes Real-Time Billionaires (komed3/rtb-api)
 *   - data/raw/wid-detailed-shares.json — WID.world sub-percentile wealth shares
 */

import rawBillionaires from "../../data/raw/billionaires.json";
import rawDetailedShares from "../../data/raw/wid-detailed-shares.json";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface BillionaireData {
  readonly name: string;
  readonly netWorth: number;
  readonly source: string;
  readonly country: string;
  readonly photoDescription: string;
}

export interface DetailedWealthShares {
  readonly bottom50: number;
  readonly middle40: number;
  readonly next9: number;
  readonly next09: number;
  readonly next009: number;
  readonly top001: number;
}

// ─── Raw JSON types ──────────────────────────────────────────────────────────

type RawBillionaire = {
  name: string;
  netWorth: number;
  source?: string;
  photoDescription?: string;
};

type RawDetailedShare = {
  bottom50: number;
  middle40: number;
  next9: number;
  next09: number;
  next009: number;
  top001: number;
};

// ─── Transform and export ────────────────────────────────────────────────────

function buildBillionaireMap(): Readonly<Record<string, BillionaireData>> {
  const entries = Object.entries(rawBillionaires as unknown as Record<string, RawBillionaire>)
    .filter(([key]) => key !== "_meta")
    .map(([cc, data]) => [
      cc,
      {
        name: data.name,
        netWorth: data.netWorth,
        source: data.source ?? "",
        country: cc,
        photoDescription: data.photoDescription ?? "",
      },
    ]);
  return Object.fromEntries(entries);
}

function buildDetailedSharesMap(): Readonly<Record<string, DetailedWealthShares>> {
  const entries = Object.entries(rawDetailedShares as unknown as Record<string, RawDetailedShare>)
    .filter(([key]) => key !== "_meta")
    .map(([cc, data]) => [
      cc,
      {
        bottom50: data.bottom50,
        middle40: data.middle40,
        next9: data.next9,
        next09: data.next09,
        next009: data.next009,
        top001: data.top001,
      },
    ]);
  return Object.fromEntries(entries);
}

export const RICHEST_BY_COUNTRY: Readonly<Record<string, BillionaireData>> = buildBillionaireMap();

export const DETAILED_SHARES: Readonly<Record<string, DetailedWealthShares>> = buildDetailedSharesMap();
