"use client";

import { useState, useMemo, useCallback } from "react";
import { LazyMotion, domAnimation, m, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ALL_COUNTRIES,
  ALL_COUNTRY_MAP,
  type AllCountryCode,
  isAllCountryCode,
} from "@/data/countries-extended";
import { findPercentile, getWealthThresholds } from "@/data/wealth-data";
import type { CountryData } from "@/data/wealth-data";
import { toUSD, fromUSD } from "@/lib/currency";
import { formatCurrency, getCurrencySymbol } from "@/lib/format";
import { getPPPFactor } from "@/lib/ppp";
import { useLanguage } from "@/components/LanguageProvider";
import { tCountryName, tSegmentLabel } from "@/lib/i18n";

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_COUNTRIES = 5;
const MIN_COUNTRIES = 2;

const DEFAULT_SELECTIONS: readonly AllCountryCode[] = ["US", "GB", "DE", "NL", "FR"];

const REGION_MAP: Readonly<Record<string, string>> = {
  US: "Americas", CA: "Americas", BR: "Americas", MX: "Americas", CL: "Americas",
  GB: "Europe", FR: "Europe", DE: "Europe", NL: "Europe", SE: "Europe",
  NO: "Europe", DK: "Europe", FI: "Europe", CH: "Europe", IT: "Europe",
  ES: "Europe", PT: "Europe", AT: "Europe", BE: "Europe", IE: "Europe",
  PL: "Europe", CZ: "Europe",
  JP: "Asia-Pacific", KR: "Asia-Pacific", CN: "Asia-Pacific", IN: "Asia-Pacific",
  SG: "Asia-Pacific", AU: "Asia-Pacific", NZ: "Asia-Pacific",
  ZA: "Africa",
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface CountryResult {
  readonly country: CountryData;
  readonly percentile: number;
  readonly localAmount: number;
  readonly segment: string;
  readonly thresholdToNext: number | null;
  readonly thresholdToNextLabel: string | null;
  readonly pppEquivalent: number | null;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getSegmentLabel(percentile: number): string {
  if (percentile >= 99.9) return "Top 0.1%";
  if (percentile >= 99) return "Top 1%";
  if (percentile >= 90) return "Top 10%";
  if (percentile >= 50) return "Top 50%";
  return "Bottom 50%";
}

function getSegmentColor(percentile: number): string {
  if (percentile >= 99) return "text-accent-rose";
  if (percentile >= 90) return "text-accent-amber";
  if (percentile >= 50) return "text-accent-periwinkle";
  return "text-accent-sage";
}

function getNextThreshold(
  percentile: number,
  thresholds: ReturnType<typeof getWealthThresholds>,
): { amount: number; label: string } | null {
  if (percentile >= 99.9) return null;
  if (percentile >= 99) return { amount: thresholds.p999, label: "top 0.1%" };
  if (percentile >= 90) return { amount: thresholds.p99, label: "top 1%" };
  if (percentile >= 50) return { amount: thresholds.p90, label: "top 10%" };
  return { amount: thresholds.p50, label: "top 50%" };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function CrossCountryCompare() {
  const { language } = useLanguage();
  const [inputValue, setInputValue] = useState("");
  const [inputCurrency, setInputCurrency] = useState<string>("USD");
  const [selectedCodes, setSelectedCodes] = useState<readonly AllCountryCode[]>(DEFAULT_SELECTIONS);
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const localizeCountry = useCallback(
    (country: CountryData) => tCountryName(country.code, country.name, language),
    [language],
  );

  // Parse input amount to USD
  const amountUSD = useMemo(() => {
    const cleaned = inputValue.replace(/[^0-9.-]/g, "");
    const parsed = parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return null;
    return toUSD(parsed, inputCurrency);
  }, [inputValue, inputCurrency]);

  // Compute results for each selected country
  const results: readonly CountryResult[] = useMemo(() => {
    if (amountUSD === null) return [];
    return selectedCodes.map((code) => {
      const country = ALL_COUNTRY_MAP[code];
      const percentile = findPercentile(amountUSD, country);
      const localAmount = fromUSD(amountUSD, country.currency);
      const thresholds = getWealthThresholds(country);
      const next = getNextThreshold(percentile, thresholds);
      // PPP: what does this local amount buy in US-dollar terms?
      const pppFactor = getPPPFactor(country.code);
      const pppEquivalent = pppFactor && pppFactor > 0 ? localAmount / pppFactor : null;

      return {
        country,
        percentile,
        localAmount,
        segment: getSegmentLabel(percentile),
        thresholdToNext: next ? fromUSD(next.amount, country.currency) : null,
        thresholdToNextLabel: next?.label ?? null,
        pppEquivalent,
      };
    }).sort((a, b) => b.percentile - a.percentile);
  }, [amountUSD, selectedCodes]);

  // Available currencies from selected countries + USD
  const availableCurrencies = useMemo(() => {
    const set = new Set(["USD"]);
    for (const code of selectedCodes) {
      set.add(ALL_COUNTRY_MAP[code].currency);
    }
    return Array.from(set).sort();
  }, [selectedCodes]);

  // Country picker filtered list
  const filteredCountries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const selSet = new Set<string>(selectedCodes);
    return ALL_COUNTRIES
      .filter((c) => !selSet.has(c.code))
      .filter((c) => {
        const localizedName = localizeCountry(c).toLowerCase();
        return !q
          || c.name.toLowerCase().includes(q)
          || localizedName.includes(q)
          || c.code.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const rA = REGION_MAP[a.code] ?? "Other";
        const rB = REGION_MAP[b.code] ?? "Other";
        if (rA !== rB) return rA.localeCompare(rB);
        return localizeCountry(a).localeCompare(localizeCountry(b));
      });
  }, [localizeCountry, searchQuery, selectedCodes]);

  const handleToggleCountry = useCallback((code: string) => {
    if (!isAllCountryCode(code)) return;
    setSelectedCodes((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= MIN_COUNTRIES) return prev;
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= MAX_COUNTRIES) return prev;
      return [...prev, code];
    });
  }, []);

  const handleRemoveCountry = useCallback((code: AllCountryCode) => {
    setSelectedCodes((prev) => {
      if (prev.length <= MIN_COUNTRIES) return prev;
      return prev.filter((c) => c !== code);
    });
  }, []);

  const sym = getCurrencySymbol(inputCurrency);

  return (
    <LazyMotion features={domAnimation}>
      <main className="min-h-screen pt-14 px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <h1 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight">
              {language === "zh" ? "跨国比较" : "Compare Countries"}
            </h1>
            <p className="text-text-secondary text-base sm:text-lg mt-3 max-w-xl mx-auto">
              {language === "zh"
                ? "同样的财富，换个国家，排名可能完全不同。"
                : "Same wealth, different country. See how your ranking changes across borders."}
            </p>
          </m.div>

          {/* Input Section */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="bg-bg-card border border-border-subtle rounded-2xl p-6 sm:p-8 mb-8"
          >
            <label className="block text-text-secondary text-sm mb-2">
              {language === "zh"
                ? "输入你的净资产（资产减去负债）"
                : "Enter your net wealth (assets minus debts)"}
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-lg pointer-events-none">
                  {sym}
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={language === "zh" ? "例如 250000" : "e.g. 250000"}
                  className="w-full bg-bg-primary border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-text-primary text-lg tabular-nums placeholder:text-text-muted/40 focus:outline-none focus:border-accent-periwinkle/50 focus:ring-1 focus:ring-accent-periwinkle/30 transition-colors"
                />
              </div>
              <select
                value={inputCurrency}
                onChange={(e) => setInputCurrency(e.target.value)}
                className="bg-bg-primary border border-border-subtle rounded-xl px-3 py-3 text-text-primary text-sm focus:outline-none focus:border-accent-periwinkle/50 cursor-pointer"
              >
                {availableCurrencies.map((cc) => (
                  <option key={cc} value={cc}>{cc}</option>
                ))}
              </select>
            </div>
            <p className="text-text-muted text-xs mt-2">
              {language === "zh"
                ? "所有数据都按成年人个体口径计算（WID.world equal-split）。如果你与伴侣共同持有财务，请填写你个人那一半。"
                : "All data is per-adult (WID.world equal-split). If you share finances with a partner, enter your personal half."}
            </p>
          </m.div>

          {/* Country Selection */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-text-primary font-semibold text-sm">
                {language === "zh"
                  ? `国家 (${selectedCodes.length}/${MAX_COUNTRIES})`
                  : `Countries (${selectedCodes.length}/${MAX_COUNTRIES})`}
              </h2>
              <button
                onClick={() => { setShowPicker(!showPicker); setSearchQuery(""); }}
                className="text-accent-periwinkle text-xs font-medium hover:underline cursor-pointer"
              >
                {showPicker
                  ? language === "zh"
                    ? "完成"
                    : "Done"
                  : language === "zh"
                    ? "+ 添加 / 移除"
                    : "+ Add / Remove"}
              </button>
            </div>

            {/* Selected country chips */}
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCodes.map((code) => {
                const c = ALL_COUNTRY_MAP[code];
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1.5 bg-bg-card border border-border-subtle rounded-full px-3 py-1 text-sm text-text-primary"
                  >
                    <span>{c.flag}</span>
                    <span>{localizeCountry(c)}</span>
                    {selectedCodes.length > MIN_COUNTRIES && (
                      <button
                        onClick={() => handleRemoveCountry(code)}
                        className="text-text-muted hover:text-accent-rose ml-0.5 cursor-pointer"
                        aria-label={language === "zh" ? `移除 ${localizeCountry(c)}` : `Remove ${localizeCountry(c)}`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Country picker dropdown */}
            <AnimatePresence>
              {showPicker && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="bg-bg-card border border-border-subtle rounded-xl p-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === "zh" ? "搜索国家..." : "Search countries..."}
                      className="w-full bg-bg-primary border border-border-subtle rounded-lg px-3 py-2 text-text-primary text-sm placeholder:text-text-muted/40 focus:outline-none focus:border-accent-periwinkle/50 mb-3"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => handleToggleCountry(c.code)}
                          disabled={selectedCodes.length >= MAX_COUNTRIES}
                          className="w-full text-left px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:bg-bg-primary hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {c.flag} {localizeCountry(c)}
                          <span className="text-text-muted text-xs ml-2">({c.currency})</span>
                        </button>
                      ))}
                      {filteredCountries.length === 0 && (
                        <p className="text-text-muted text-xs text-center py-2">
                          {language === "zh" ? "没有找到匹配国家" : "No countries found"}
                        </p>
                      )}
                    </div>
                  </div>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>

          {/* Results */}
          <AnimatePresence mode="popLayout">
            {results.length > 0 ? (
              <m.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-3"
              >
                <h2 className="text-text-primary font-semibold text-sm mb-4">
                  {language === "zh" ? "你在不同国家的排名" : "Your ranking across countries"}
                </h2>
                {results.map((r, i) => (
                  <m.div
                    key={r.country.code}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="bg-bg-card border border-border-subtle rounded-xl p-4 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{r.country.flag}</span>
                          <span className="text-text-primary font-semibold text-sm sm:text-base truncate">
                            {localizeCountry(r.country)}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-bg-primary ${getSegmentColor(r.percentile)}`}>
                            {tSegmentLabel(r.segment, language)}
                          </span>
                        </div>

                        {/* Percentile bar */}
                        <div className="mb-3">
                          <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                            <m.div
                              className="h-full rounded-full bg-accent-periwinkle"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.max(r.percentile, 1)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                          <span className="text-text-muted">
                            {language === "zh" ? "本地币值：" : "Local value: "}{" "}
                            <span className="text-text-secondary font-medium tabular-nums">
                              {formatCurrency(r.localAmount, r.country.currency, true)}
                            </span>
                          </span>
                          {r.pppEquivalent !== null && r.country.code !== "US" && (
                            <span className="text-text-muted">
                              {language === "zh" ? "购买力等值：" : "Buying power: "}{" "}
                              <span className="text-text-secondary font-medium tabular-nums">
                                {formatCurrency(r.pppEquivalent, "USD", true)}
                              </span>
                            </span>
                          )}
                          {r.thresholdToNext !== null && r.thresholdToNextLabel !== null && (
                            <span className="text-text-muted">
                              {language === "zh" ? "还差 " : "Need "}{" "}
                              <span className="text-text-secondary font-medium tabular-nums">
                                {formatCurrency(r.thresholdToNext, r.country.currency, true)}
                              </span>
                              {language === "zh"
                                ? ` 才能进入 ${tSegmentLabel(r.thresholdToNextLabel.replace("top", "Top").replace("bottom", "Bottom"), language)}`
                                : ` for ${r.thresholdToNextLabel}`}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Percentile number */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-2xl sm:text-3xl font-bold text-accent-periwinkle tabular-nums">
                          {r.percentile.toFixed(1)}
                          <span className="text-sm font-normal text-text-muted">%ile</span>
                        </p>
                        <p className="text-text-muted text-[10px] mt-0.5">
                          {language === "zh"
                            ? `超过了 ${r.percentile.toFixed(1)}% 的成年人`
                            : `Richer than ${r.percentile.toFixed(1)}% of adults`}
                        </p>
                      </div>
                    </div>
                  </m.div>
                ))}

                {/* Insight box */}
                {results.length >= 2 && (
                  <m.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-accent-periwinkle/8 to-accent-lavender/8 border border-accent-periwinkle/15 rounded-xl p-5 text-center mt-6"
                  >
                    <p className="text-text-secondary text-sm">
                      {language === "zh" ? "同样一笔财富，在 " : "The same amount of wealth puts you in the "}{" "}
                      <span className="text-accent-periwinkle font-semibold">
                        {language === "zh"
                          ? tSegmentLabel(results[0].segment, language)
                          : results[0].segment.toLowerCase()}
                      </span>
                      {language === "zh"
                        ? `，会让你处在 ${localizeCountry(results[0].country)} 的这个区间；但在 `
                        : ` in ${localizeCountry(results[0].country)} but the `}{" "}
                      <span className="text-accent-amber font-semibold">
                        {language === "zh"
                          ? tSegmentLabel(results[results.length - 1].segment, language)
                          : results[results.length - 1].segment.toLowerCase()}
                      </span>
                      {language === "zh"
                        ? ` 在 ${localizeCountry(results[results.length - 1].country)} 只能排到这里。`
                        : ` in ${localizeCountry(results[results.length - 1].country)}.`}
                    </p>
                  </m.div>
                )}
              </m.div>
            ) : amountUSD === null && inputValue.length > 0 ? (
              <m.p
                key="invalid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-text-muted text-sm"
              >
                {language === "zh" ? "请输入有效数字查看结果。" : "Enter a valid number to see results."}
              </m.p>
            ) : inputValue.length === 0 ? (
              <m.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center py-12"
              >
                <p className="text-text-muted text-sm mb-2">
                  {language === "zh"
                    ? "在上方输入你的净资产，开始做跨国比较。"
                    : "Enter your net wealth above to compare across countries."}
                </p>
                <p className="text-text-muted text-xs">
                  {language === "zh" ? "提示：如果你想根据收入估算财富，请使用主站的 " : "Tip: Use the main "}{" "}
                  <Link href="/" className="text-accent-periwinkle hover:underline">
                    {language === "zh" ? "计算器" : "calculator"}
                  </Link>
                  {language === "zh" ? "" : " if you want to estimate wealth from income."}
                </p>
              </m.div>
            ) : null}
          </AnimatePresence>

          {/* Methodology note */}
          <div className="mt-12 text-center">
            <p className="text-text-muted text-xs">
              {language === "zh"
                ? "百分位基于 WID.world 的 Pareto 插值分布数据计算。货币换算使用 ECB 汇率，不做购买力平价调整。"
                : "Percentiles use Pareto-interpolated WID.world distribution data. Currency conversion via ECB exchange rates (not purchasing-power adjusted)."}
            </p>
            <p className="text-text-muted text-xs mt-1">
              <Link href="/methodology" className="text-accent-periwinkle hover:underline">
                {language === "zh" ? "查看完整方法说明" : "Read the full methodology"}
              </Link>
            </p>
          </div>
        </div>
      </main>
    </LazyMotion>
  );
}
