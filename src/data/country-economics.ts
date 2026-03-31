/** Per-country economic reference values for comparison cards.
 *  Sources: OECD Housing Prices, WHO Global Health Expenditure Database.
 *  Values are approximate and used for illustrative comparison only.
 *
 *  All values are in USD equivalent since billionaire net worth is stored in USD.
 *  Home prices and healthcare figures have been converted to USD for consistent comparison. */

export interface CountryEconomics {
  readonly avgHomePrice: number;
  readonly healthcarePerCapita: number;
  readonly currency: string;
}

export const COUNTRY_ECONOMICS: Readonly<Record<string, CountryEconomics>> = {
  US: { avgHomePrice: 350_000, healthcarePerCapita: 12_530, currency: "USD" },
  GB: { avgHomePrice: 290_000, healthcarePerCapita: 5_140, currency: "GBP" },
  FR: { avgHomePrice: 250_000, healthcarePerCapita: 5_470, currency: "EUR" },
  DE: { avgHomePrice: 300_000, healthcarePerCapita: 7_380, currency: "EUR" },
  NL: { avgHomePrice: 400_000, healthcarePerCapita: 6_190, currency: "EUR" },
  CA: { avgHomePrice: 500_000, healthcarePerCapita: 5_740, currency: "CAD" },
  AU: { avgHomePrice: 650_000, healthcarePerCapita: 5_290, currency: "AUD" },
  JP: { avgHomePrice: 300_000, healthcarePerCapita: 4_690, currency: "JPY" }, // ~45M yen -> $300K equiv
  KR: { avgHomePrice: 350_000, healthcarePerCapita: 3_510, currency: "KRW" },
  CN: { avgHomePrice: 150_000, healthcarePerCapita: 930, currency: "CNY" },
  IN: { avgHomePrice: 60_000, healthcarePerCapita: 230, currency: "INR" },
  BR: { avgHomePrice: 80_000, healthcarePerCapita: 1_280, currency: "BRL" },
  MX: { avgHomePrice: 100_000, healthcarePerCapita: 1_090, currency: "MXN" },
  ZA: { avgHomePrice: 75_000, healthcarePerCapita: 1_110, currency: "ZAR" },
  SE: { avgHomePrice: 320_000, healthcarePerCapita: 6_260, currency: "SEK" },
  NO: { avgHomePrice: 400_000, healthcarePerCapita: 8_100, currency: "NOK" },
  DK: { avgHomePrice: 350_000, healthcarePerCapita: 6_380, currency: "DKK" },
  CH: { avgHomePrice: 800_000, healthcarePerCapita: 9_670, currency: "CHF" },
  IT: { avgHomePrice: 200_000, healthcarePerCapita: 3_720, currency: "EUR" },
  ES: { avgHomePrice: 180_000, healthcarePerCapita: 3_600, currency: "EUR" },
  SG: { avgHomePrice: 900_000, healthcarePerCapita: 4_460, currency: "SGD" },
  IE: { avgHomePrice: 350_000, healthcarePerCapita: 6_010, currency: "EUR" },
  BE: { avgHomePrice: 280_000, healthcarePerCapita: 5_620, currency: "EUR" },
  AT: { avgHomePrice: 300_000, healthcarePerCapita: 6_100, currency: "EUR" },
  PL: { avgHomePrice: 120_000, healthcarePerCapita: 2_300, currency: "PLN" },
  CZ: { avgHomePrice: 150_000, healthcarePerCapita: 3_050, currency: "CZK" },
  NZ: { avgHomePrice: 550_000, healthcarePerCapita: 4_600, currency: "NZD" },
  PT: { avgHomePrice: 180_000, healthcarePerCapita: 3_340, currency: "EUR" },
  CL: { avgHomePrice: 120_000, healthcarePerCapita: 2_180, currency: "CLP" },
  FI: { avgHomePrice: 250_000, healthcarePerCapita: 4_900, currency: "EUR" },
} as const;

const DEFAULT_ECONOMICS: CountryEconomics = COUNTRY_ECONOMICS.US;

/** Look up country economics, falling back to US values for unknown countries or GLOBAL. */
export function getCountryEconomics(countryCode: string): CountryEconomics {
  return COUNTRY_ECONOMICS[countryCode] ?? DEFAULT_ECONOMICS;
}
