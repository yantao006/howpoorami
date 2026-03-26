#!/usr/bin/env node
/**
 * Fetches economic indicators (CPI, wages, house prices) from public APIs
 * and updates purchasing-power.ts.
 *
 * Sources:
 *   - World Bank API: Consumer Price Index (FP.CPI.TOTL, 2010=100)
 *   - OECD SDMX API: Average Annual Wages (DSD_EARNINGS@AV_AN_WAGE, USD PPP constant)
 *   - BIS via FRED: Real Residential Property Prices (2010=100)
 *
 * Usage: node scripts/update-economic-data.mjs
 *
 * Note: FRED requires an API key. Set FRED_API_KEY env var, or the script
 * will skip house prices and keep existing values.
 */

import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = resolve(__dirname, "../src/data/purchasing-power.ts");

const COUNTRIES = ["US", "GB", "FR", "DE", "NL"];
const YEARS = [1995, 2000, 2005, 2010, 2015, 2020, 2023];
const BASE_YEAR = 2000;

// World Bank API country codes
const WB_CODES = { US: "US", GB: "GB", FR: "FR", DE: "DE", NL: "NL" };

// OECD country codes (ISO 3166-1 alpha-3)
const OECD_CODES = { US: "USA", GB: "GBR", FR: "FRA", DE: "DEU", NL: "NLD" };

// FRED series for BIS real residential property prices
const FRED_SERIES = {
  US: "QUSR628BIS",
  GB: "QGBR628BIS",
  FR: "QFRR628BIS",
  DE: "QDER628BIS",
  NL: "QNLR628BIS",
};

const FRED_API_KEY = process.env.FRED_API_KEY || "";

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ─── World Bank CPI ──────────────────────────────────────────────────────────

async function fetchWorldBankCPI() {
  console.log("Fetching CPI data from World Bank...");
  const codes = Object.values(WB_CODES).join(";");
  const url = `https://api.worldbank.org/v2/country/${codes}/indicator/FP.CPI.TOTL?date=1990:2024&format=json&per_page=500`;
  const data = await fetchJSON(url);

  // World Bank returns [metadata, records]
  const records = data[1] || [];
  const result = {};

  // World Bank returns country.id as 2-letter code (e.g., "DE", "US")
  for (const r of records) {
    if (r.value === null) continue;
    const countryId = r.country?.id;
    // WB uses 2-letter codes that match ours directly
    if (!countryId || !COUNTRIES.includes(countryId)) continue;
    if (!result[countryId]) result[countryId] = {};
    result[countryId][parseInt(r.date)] = r.value;
  }

  return result;
}

// ─── OECD Average Wages ──────────────────────────────────────────────────────

async function fetchOECDWages() {
  console.log("Fetching wage data from OECD...");
  const countries = Object.values(OECD_CODES).join("+");
  // 7 dots = all values for all 7 dimensions; we filter in parsing
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,1.0/${countries}.......?startPeriod=1990&endPeriod=2024`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+csv" },
  });

  if (!res.ok) {
    console.warn(`  OECD API returned ${res.status}, trying JSON format...`);
    return fetchOECDWagesJSON();
  }

  const csv = await res.text();
  return parseOECDCSV(csv);
}

function parseOECDCSV(csv) {
  const lines = csv.split("\n");
  const header = lines[0].split(",");
  const refAreaIdx = header.indexOf("REF_AREA");
  const periodIdx = header.indexOf("TIME_PERIOD");
  const valueIdx = header.indexOf("OBS_VALUE");
  const unitIdx = header.indexOf("UNIT_MEASURE");
  const priceBaseIdx = header.indexOf("PRICE_BASE");

  const result = {};
  const codeMap = Object.fromEntries(
    Object.entries(OECD_CODES).map(([k, v]) => [v, k])
  );

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < Math.max(refAreaIdx, periodIdx, valueIdx) + 1) continue;

    // Filter for USD PPP at constant prices only
    const unit = cols[unitIdx];
    const priceBase = cols[priceBaseIdx];
    if (unit !== "USD_PPP" || priceBase !== "Q") continue;

    const area = cols[refAreaIdx];
    const year = parseInt(cols[periodIdx]);
    const value = parseFloat(cols[valueIdx]);

    const countryCode = codeMap[area];
    if (!countryCode || isNaN(year) || isNaN(value)) continue;

    if (!result[countryCode]) result[countryCode] = {};
    result[countryCode][year] = value;
  }

  return result;
}

async function fetchOECDWagesJSON() {
  // Fallback: try JSON format
  const countries = Object.values(OECD_CODES).join("+");
  const url = `https://sdmx.oecd.org/public/rest/data/OECD.ELS.SAE,DSD_EARNINGS@AV_AN_WAGE,1.0/${countries}.......?startPeriod=1990&endPeriod=2024`;

  const res = await fetch(url, {
    headers: { Accept: "application/vnd.sdmx.data+json" },
  });

  if (!res.ok) {
    console.warn(`  OECD JSON also failed (${res.status}). Wages will use existing values.`);
    return null;
  }

  // Parse SDMX-JSON is complex; return null for now and use existing
  console.warn("  OECD JSON parsing not implemented. Wages will use existing values.");
  return null;
}

// ─── FRED House Prices ───────────────────────────────────────────────────────

async function fetchFREDHousePrices() {
  if (!FRED_API_KEY) {
    console.log("Skipping FRED house prices (no FRED_API_KEY set).");
    console.log("  Get a free key at: https://fred.stlouisfed.org/docs/api/api_key.html");
    return null;
  }

  console.log("Fetching house price data from FRED...");
  const result = {};

  for (const [country, series] of Object.entries(FRED_SERIES)) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_API_KEY}&file_type=json&observation_start=1990-01-01&observation_end=2024-12-31&frequency=a`;
    try {
      const data = await fetchJSON(url);
      result[country] = {};
      for (const obs of data.observations || []) {
        if (obs.value === ".") continue;
        const year = parseInt(obs.date);
        result[country][year] = parseFloat(obs.value);
      }
      console.log(`  ${country}: ${Object.keys(result[country]).length} years`);
    } catch (err) {
      console.warn(`  Failed to fetch ${country} house prices: ${err.message}`);
    }
  }

  return result;
}

// ─── Index Computation ───────────────────────────────────────────────────────

function reindex(rawByYear, baseYear) {
  const baseValue = rawByYear[baseYear];
  if (!baseValue) return null;
  const indexed = {};
  for (const [year, value] of Object.entries(rawByYear)) {
    indexed[parseInt(year)] = Math.round((value / baseValue) * 1000) / 10;
  }
  return indexed;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Updating economic data...\n");

  const [cpiRaw, wagesRaw, housePricesRaw] = await Promise.all([
    fetchWorldBankCPI(),
    fetchOECDWages(),
    fetchFREDHousePrices(),
  ]);

  // Read existing file to extract house price values as fallback when FRED key not available
  const existing = readFileSync(OUTPUT_PATH, "utf-8");
  const existingHousePrices = {};
  if (!housePricesRaw) {
    // Parse house price values from existing file
    for (const country of COUNTRIES) {
      const regex = new RegExp(
        `const ${country}_SERIES.*?\\[([\\s\\S]*?)\\] as const`,
        "m"
      );
      const match = existing.match(regex);
      if (match) {
        existingHousePrices[country] = {};
        const yearRegex = /year:\s*(\d+).*?housePriceIndex:\s*([\d.]+)/g;
        let m;
        while ((m = yearRegex.exec(match[1])) !== null) {
          existingHousePrices[country][parseInt(m[1])] = parseFloat(m[2]);
        }
      }
    }
    console.log("Using existing house price data as fallback.");
  }

  const countryData = {};

  for (const country of COUNTRIES) {
    const series = [];

    // Index each metric to BASE_YEAR = 100
    const cpiIndexed = cpiRaw[country] ? reindex(cpiRaw[country], BASE_YEAR) : null;
    const wageIndexed = wagesRaw?.[country] ? reindex(wagesRaw[country], BASE_YEAR) : null;
    const hpIndexed = housePricesRaw?.[country]
      ? reindex(housePricesRaw[country], BASE_YEAR)
      : existingHousePrices[country] || null;

    for (const year of YEARS) {
      const point = {
        year,
        wageIndex: wageIndexed?.[year] ?? null,
        cpiIndex: cpiIndexed?.[year] ?? null,
        housePriceIndex: hpIndexed?.[year] ?? null,
      };

      // Only include years where we have at least 2 of 3 metrics
      const available = [point.wageIndex, point.cpiIndex, point.housePriceIndex].filter(
        (v) => v !== null
      ).length;
      if (available >= 2) {
        series.push(point);
      }
    }

    countryData[country] = series;

    console.log(`\n${country}:`);
    for (const p of series) {
      console.log(
        `  ${p.year}: wage=${p.wageIndex ?? "N/A"} cpi=${p.cpiIndex ?? "N/A"} house=${p.housePriceIndex ?? "N/A"}`
      );
    }
  }

  // Check if we got enough data to write
  const totalPoints = Object.values(countryData).reduce((s, a) => s + a.length, 0);
  if (totalPoints < 10) {
    console.error("\nNot enough data fetched. Keeping existing file.");
    console.error("Check your network and API access.");
    process.exit(1);
  }

  const today = new Date().toISOString().split("T")[0];

  // Generate raw source values comment
  const rawComment = Object.entries({ CPI: cpiRaw, Wages: wagesRaw || {} })
    .map(([label, data]) => {
      if (!data || Object.keys(data).length === 0) return `// ${label}: no data fetched`;
      return Object.entries(data)
        .map(([c, years]) => {
          const vals = YEARS.map((y) => `${y}=${years[y]?.toFixed?.(2) ?? "N/A"}`).join("  ");
          return `//   ${c}:  ${vals}`;
        })
        .join("\n");
    })
    .join("\n//\n");

  const tsContent = `/**
 * Economic indicators over time — wages, consumer prices, and house prices.
 *
 * AUTO-GENERATED by scripts/update-economic-data.mjs on ${today}
 *
 * All series are indexed to a common base year (${BASE_YEAR} = 100) so they can be
 * compared on the same chart. The gap between lines reveals how wages, prices,
 * and housing costs have diverged.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SOURCES (all publicly downloadable):
 *
 * Wages — OECD Average Annual Wages (AV_AN_WAGE)
 *   Measure: USD, constant prices, constant PPP
 *   Dataset: OECD.ELS.SAE, DSD_EARNINGS@AV_AN_WAGE
 *   URL: https://data-explorer.oecd.org → Average Annual Wages
 *
 * Consumer Prices — World Bank, Consumer Price Index (FP.CPI.TOTL)
 *   Measure: Index (2010 = 100), rebased to ${BASE_YEAR} = 100
 *   URL: https://data.worldbank.org/indicator/FP.CPI.TOTL
 *
 * House Prices — BIS Residential Property Prices via FRED
 *   Measure: Real (CPI-deflated), index (2010 = 100), rebased to ${BASE_YEAR} = 100
 *   Series: QUSR628BIS (US), QGBR628BIS (UK), QFRR628BIS (FR),
 *           QDER628BIS (DE), QNLR628BIS (NL)
 *   URL: https://data.bis.org/topics/RPP
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * HOW THE INDEX IS COMPUTED:
 *   index = (value / value_${BASE_YEAR}) × 100
 *
 * Raw source values used to compute each index:
${rawComment}
 */

export interface EconomicDataPoint {
  readonly year: number;
  /** Real average wages, indexed ${BASE_YEAR} = 100 (OECD, constant USD PPP) */
  readonly wageIndex: number;
  /** Consumer Price Index, indexed ${BASE_YEAR} = 100 (World Bank) */
  readonly cpiIndex: number;
  /** Real house prices, indexed ${BASE_YEAR} = 100 (BIS via FRED) */
  readonly housePriceIndex: number;
}

export interface CountryEconomicData {
  readonly countryCode: string;
  readonly series: readonly EconomicDataPoint[];
}

${COUNTRIES.map((c) => {
  const series = countryData[c];
  return `const ${c}_SERIES: readonly EconomicDataPoint[] = [
${series
  .map(
    (p) =>
      `  { year: ${p.year}, wageIndex: ${p.wageIndex ?? 100}, cpiIndex: ${p.cpiIndex ?? 100}, housePriceIndex: ${p.housePriceIndex ?? 100} },`
  )
  .join("\n")}
] as const;`;
}).join("\n\n")}

export const PURCHASING_POWER: Readonly<Record<string, CountryEconomicData>> = {
${COUNTRIES.map((c) => `  ${c}: { countryCode: "${c}", series: ${c}_SERIES },`).join("\n")}
} as const;

export const ECONOMIC_SOURCES = {
  wages: {
    name: "OECD Average Annual Wages",
    dataset: "DSD_EARNINGS@AV_AN_WAGE",
    measure: "USD, constant prices, constant PPP",
    url: "https://data-explorer.oecd.org",
  },
  cpi: {
    name: "World Bank Consumer Price Index",
    dataset: "FP.CPI.TOTL",
    measure: "Index (2010 = 100), rebased to ${BASE_YEAR} = 100",
    url: "https://data.worldbank.org/indicator/FP.CPI.TOTL",
  },
  housePrices: {
    name: "BIS Residential Property Prices",
    dataset: "Selected Residential Property Prices (real, CPI-deflated)",
    measure: "Index (2010 = 100), rebased to ${BASE_YEAR} = 100",
    url: "https://data.bis.org/topics/RPP",
  },
} as const;
`;

  writeFileSync(OUTPUT_PATH, tsContent);
  console.log(`\n✓ Updated ${OUTPUT_PATH}`);
  console.log(`  ${totalPoints} data points across ${COUNTRIES.length} countries`);
}

main().catch((err) => {
  console.error("Failed to update economic data:", err);
  process.exit(1);
});
