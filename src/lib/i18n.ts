export type Language = "en" | "zh";

export const LANGUAGE_STORAGE_KEY = "language";

export function normalizeLanguage(value: string | null | undefined): Language {
  return value?.toLowerCase().startsWith("zh") ? "zh" : "en";
}

/**
 * Resolves the user's language from storage and navigator (same priority as
 * the inline boot script in layout.tsx). Do not read `document.lang` here:
 * the boot script sets it before hydration, which would make the client's
 * first render disagree with the server and cause a hydration mismatch.
 */
export function detectPreferredLanguage(): Language {
  if (typeof window === "undefined") {
    return "en";
  }

  try {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return normalizeLanguage(stored);
  } catch {
    // Ignore storage failures and fall back to navigator.
  }

  return normalizeLanguage(window.navigator.language);
}

const SEGMENT_LABELS: Record<string, Record<Language, string>> = {
  "Bottom 50%": { en: "Bottom 50%", zh: "底部 50%" },
  "Middle 40%": { en: "Middle 40%", zh: "中间 40%" },
  "Top 10%": { en: "Top 10%", zh: "前 10%" },
  "Top 1%": { en: "Top 1%", zh: "前 1%" },
  "Top 0.1%": { en: "Top 0.1%", zh: "前 0.1%" },
  "Top 10-1%": { en: "Top 10-1%", zh: "前 10%-1%" },
  "Top 10–1%": { en: "Top 10–1%", zh: "前 10%-1%" },
  "Top 1-0.1%": { en: "Top 1-0.1%", zh: "前 1%-0.1%" },
  "Top 1–0.1%": { en: "Top 1–0.1%", zh: "前 1%-0.1%" },
  "Top 0.1-0.01%": { en: "Top 0.1-0.01%", zh: "前 0.1%-0.01%" },
  "Top 0.1–0.01%": { en: "Top 0.1–0.01%", zh: "前 0.1%-0.01%" },
  "Top 0.01%": { en: "Top 0.01%", zh: "前 0.01%" },
  "Next 9%": { en: "Next 9%", zh: "接下来的 9%" },
};

const REGION_LABELS: Record<string, Record<Language, string>> = {
  Global: { en: "Global", zh: "全球" },
  Americas: { en: "Americas", zh: "美洲" },
  Europe: { en: "Europe", zh: "欧洲" },
  "Asia-Pacific": { en: "Asia-Pacific", zh: "亚太" },
  Africa: { en: "Africa", zh: "非洲" },
  Other: { en: "Other", zh: "其他" },
};

const COUNTRY_LABELS: Record<string, Record<Language, string>> = {
  GLOBAL: { en: "Global", zh: "全球" },
  US: { en: "United States", zh: "美国" },
  GB: { en: "United Kingdom", zh: "英国" },
  FR: { en: "France", zh: "法国" },
  DE: { en: "Germany", zh: "德国" },
  NL: { en: "The Netherlands", zh: "荷兰" },
  CA: { en: "Canada", zh: "加拿大" },
  AU: { en: "Australia", zh: "澳大利亚" },
  NZ: { en: "New Zealand", zh: "新西兰" },
  JP: { en: "Japan", zh: "日本" },
  KR: { en: "South Korea", zh: "韩国" },
  CN: { en: "China", zh: "中国" },
  SG: { en: "Singapore", zh: "新加坡" },
  IN: { en: "India", zh: "印度" },
  BR: { en: "Brazil", zh: "巴西" },
  MX: { en: "Mexico", zh: "墨西哥" },
  CL: { en: "Chile", zh: "智利" },
  ZA: { en: "South Africa", zh: "南非" },
  SE: { en: "Sweden", zh: "瑞典" },
  NO: { en: "Norway", zh: "挪威" },
  DK: { en: "Denmark", zh: "丹麦" },
  FI: { en: "Finland", zh: "芬兰" },
  CH: { en: "Switzerland", zh: "瑞士" },
  IT: { en: "Italy", zh: "意大利" },
  ES: { en: "Spain", zh: "西班牙" },
  PT: { en: "Portugal", zh: "葡萄牙" },
  AT: { en: "Austria", zh: "奥地利" },
  BE: { en: "Belgium", zh: "比利时" },
  IE: { en: "Ireland", zh: "爱尔兰" },
  PL: { en: "Poland", zh: "波兰" },
  CZ: { en: "Czech Republic", zh: "捷克" },
};

export function tSegmentLabel(label: string, language: Language): string {
  return SEGMENT_LABELS[label]?.[language] ?? label;
}

export function tRegionLabel(region: string, language: Language): string {
  return REGION_LABELS[region]?.[language] ?? region;
}

export function tCountryName(
  code: string | null | undefined,
  fallback: string,
  language: Language,
): string {
  if (!code) return fallback;
  return COUNTRY_LABELS[code]?.[language] ?? fallback;
}
