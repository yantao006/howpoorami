import { ALL_COUNTRY_MAP, type AllCountryCode, isAllCountryCode } from "@/data/countries-extended";

/** All country codes that get their own page (excludes GLOBAL) */
export const SEO_COUNTRY_CODES: readonly AllCountryCode[] = Object.keys(ALL_COUNTRY_MAP).filter(
  (c): c is AllCountryCode => c !== "GLOBAL" && isAllCountryCode(c)
);

export const SITE_URL = "https://howpoorami.org";

export interface CountrySeoData {
  readonly code: AllCountryCode;
  readonly name: string;
  readonly slug: string; // lowercase ISO code for URL
}

export function getCountrySeo(code: AllCountryCode): CountrySeoData {
  const country = ALL_COUNTRY_MAP[code];
  return {
    code,
    name: country.name,
    slug: code.toLowerCase(),
  };
}

export function getAllCountrySeo(): readonly CountrySeoData[] {
  return SEO_COUNTRY_CODES.map(getCountrySeo);
}

export function resolveCountryCode(slug: string): AllCountryCode | null {
  const upper = slug.toUpperCase();
  if (upper !== "GLOBAL" && isAllCountryCode(upper)) {
    return upper;
  }
  return null;
}
