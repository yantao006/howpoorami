"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { ALL_COUNTRY_MAP, type AllCountryCode, isAllCountryCode } from "@/data/countries-extended";
import { RICHEST_BY_COUNTRY } from "@/data/billionaires";
import { TAX_RATES } from "@/data/tax-rates";
import { PURCHASING_POWER } from "@/data/purchasing-power";
import CountrySelector from "@/components/CountrySelector";
import CurrencySelector from "@/components/CurrencySelector";
import DataProvenanceBanner from "@/components/DataProvenanceBanner";
import WealthInput from "@/components/WealthInput";
import SourcesSection from "@/components/SourcesSection";
import ResponsiveChart from "@/components/ResponsiveChart";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useGeoCountry } from "@/hooks/useGeoCountry";

import WealthDistributionChart from "@/components/WealthDistributionChart";
import WealthShareBars from "@/components/WealthShareBars";
import WealthHoardingChart from "@/components/WealthHoardingChart";
import TaxRateChart from "@/components/TaxRateChart";
import PurchasingPowerChart from "@/components/PurchasingPowerChart";
import HistoricalEvolutionChart from "@/components/HistoricalEvolutionChart";
import StatisticsSection from "@/components/StatisticsSection";
import { useLanguage } from "@/components/LanguageProvider";
import { tCountryName } from "@/lib/i18n";

interface HomeClientProps {
  readonly initialCountry?: AllCountryCode;
}

export default function HomeClient({ initialCountry }: HomeClientProps) {
  const { language } = useLanguage();
  const [selectedCountryOverride, setSelectedCountryOverride] = useState<AllCountryCode | null>(initialCountry ?? null);
  const [userPercentile, setUserPercentile] = useState<number | null>(null);
  const [globalCurrency, setGlobalCurrency] = useState("USD");
  const geoCountry = useGeoCountry();
  const selectedCountry = selectedCountryOverride ?? geoCountry ?? initialCountry ?? "US";

  const isGlobal = selectedCountry === "GLOBAL";
  const rawCountry = ALL_COUNTRY_MAP[selectedCountry];
  // When Global is selected, override the currency with the user's choice
  const country = isGlobal
    ? { ...rawCountry, currency: globalCurrency }
    : rawCountry;
  const countryName = tCountryName(country.code, country.name, language);

  const handlePercentileChange = useCallback((p: number | null) => {
    setUserPercentile(p);
  }, []);

  const handleCountrySelect = useCallback((code: string) => {
    if (isAllCountryCode(code)) {
      setSelectedCountryOverride(code);
      // Don't reset percentile — WealthInput will recompute via currency conversion
    }
  }, []);

  const hasTaxData = selectedCountry in TAX_RATES;
  const hasPurchasingPowerData = selectedCountry in PURCHASING_POWER;
  const hasRichestData = selectedCountry in RICHEST_BY_COUNTRY;

  return (
    <LazyMotion features={domAnimation}>
    <main className="min-h-screen pt-14">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-6xl mx-auto w-full">
          {/* Title */}
          <m.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-8"
          >
            <h1 className="font-[family-name:var(--font-heading)] text-4xl sm:text-5xl lg:text-7xl font-bold text-text-primary leading-tight">
              {language === "zh" ? "我到底有多穷？" : "How Poor Am I?"}
            </h1>
            <p className="text-text-secondary text-lg sm:text-xl mt-4 max-w-2xl mx-auto">
              {language === "zh"
                ? "输入你的收入或净资产，看看自己在财富分布里究竟处在什么位置。"
                : "Enter your income or wealth and discover where you really stand."}
            </p>
          </m.div>

          {/* Data provenance disclaimer */}
          <DataProvenanceBanner />

          {/* Country Selector */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative mb-8"
          >
            <div className="flex flex-col items-center gap-3">
              <CountrySelector
                selected={selectedCountry}
                onSelect={handleCountrySelect}
              />
              {isGlobal && (
                <m.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <span className="text-text-muted text-xs">
                    {language === "zh" ? "货币：" : "Currency:"}
                  </span>
                  <CurrencySelector
                    selected={globalCurrency}
                    onSelect={setGlobalCurrency}
                  />
                </m.div>
              )}
            </div>
          </m.div>

          {/* Wealth Input */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mb-10"
          >
            <WealthInput
              country={country}
              onPercentileChange={handlePercentileChange}
            />
          </m.div>

          {/* Main Chart — Wealth Distribution */}
          <m.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-text-primary font-semibold text-lg">
                  {country.flag} {countryName} {language === "zh" ? "财富分布" : "— Wealth Distribution"}
                </h2>
                <p className="text-text-muted text-sm">
                  {language === "zh"
                    ? "各人口分组所占财富份额（2023）"
                    : "Wealth share by population group (2023)"}
                </p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-text-muted text-xs">
                  <span className="hidden md:inline">
                    {language === "zh" ? "悬停查看" : "Hover over"}
                  </span>
                  <span className="md:hidden">
                    {language === "zh" ? "轻触查看" : "Tap"}
                  </span>{" "}
                  {language === "zh" ? "各分组详情" : "each group for details"}
                </p>
                <p className="text-text-muted text-xs">
                  {language === "zh" ? "放大可查看最顶层人群" : "Zoom in to see the top"}
                </p>
              </div>
            </div>

            <WealthDistributionChart
              country={country}
              userPercentile={userPercentile}
            />
          </m.div>

          {/* Wealth Share Bars */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="mt-8 bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6"
          >
            <h3 className="text-text-primary font-semibold text-lg mb-4">
              {language === "zh"
                ? `${countryName} 人口占比 vs. 财富占比`
                : `Population vs. Wealth — ${countryName}`}
            </h3>
            <WealthShareBars country={country} />
          </m.div>

          {/* Scroll indicator */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="text-center mt-12"
          >
            <p className="text-text-muted text-sm mb-2">
              {language === "zh" ? "继续向下探索更多" : "Scroll to explore more"}
            </p>
            <m.div
              animate={{ y: [0, 8, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              className="text-text-muted text-2xl"
            >
              ↓
            </m.div>
          </m.div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* The Scale of Concentration */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold text-text-primary">
              {language === "zh" ? "财富集中度的尺度" : "The Scale of Concentration"}
            </h2>
            <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
              {language === "zh"
                ? "下面每个矩形都代表财富，面积表示各群体真正拥有多少。谁拿走了多少，一眼就能看见。"
                : "Each rectangle below represents wealth. The area shows how much each group actually owns. Look at who has what."}
            </p>
          </div>

          <div className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6">
            <ErrorBoundary>
              <ResponsiveChart aspectRatio={16 / 6} minHeight={300} maxHeight={450}>
                {({ width, height }) => (
                  <WealthHoardingChart
                    country={country}
                    width={width}
                    height={height}
                  />
                )}
              </ResponsiveChart>
            </ErrorBoundary>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* Statistics Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <StatisticsSection country={country} />
        </div>
      </section>

      {/* Who Actually Pays? — Tax Rates */}
      {hasTaxData && (
        <section className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold text-text-primary">
                {language === "zh" ? "到底是谁在交税？" : "Who Actually Pays?"}
              </h2>
              <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
                {language === "zh"
                  ? "有效税率讲述的故事，与法定税率并不相同。把实际缴纳的所有税都算进去，包括投资收入、资本利得和公司结构的税务处理后，税制往往会在最顶层重新变得偏向富人。"
                  : "Effective tax rates tell a different story than statutory rates. When you account for all taxes actually paid — including how investment income, capital gains, and corporate structures are treated — the system often becomes regressive at the very top."}
              </p>
            </div>

            <div className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6">
              <ErrorBoundary>
                <ResponsiveChart aspectRatio={16 / 9} minHeight={350} maxHeight={500}>
                  {({ width, height }) => (
                    <TaxRateChart
                      countryCode={selectedCountry}
                      width={width}
                      height={height}
                    />
                  )}
                </ResponsiveChart>
              </ErrorBoundary>
            </div>
          </div>
        </section>
      )}

      <hr className="section-divider" />

      {/* Historical Trends */}
      <section className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold text-text-primary">
              {language === "zh" ? "一个世纪的变化" : "A Century of Change"}
            </h2>
            <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
              {language === "zh"
                ? `${countryName} 的财富集中是如何演变的，以及每一次转折背后的政策选择。`
                : `How wealth concentration in ${countryName} has evolved — and what policy choices drove each shift.`}
            </p>
          </div>

          <div className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6 overflow-visible">
            <ErrorBoundary>
              <ResponsiveChart aspectRatio={16 / 9} minHeight={350} maxHeight={500}>
                {({ width, height }) => (
                  <HistoricalEvolutionChart
                    country={country}
                    width={width}
                    height={height}
                  />
                )}
              </ResponsiveChart>
            </ErrorBoundary>
          </div>
        </div>
      </section>

      {/* Wages vs. Cost of Living */}
      {hasPurchasingPowerData && (
        <section className="px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl sm:text-4xl font-bold text-text-primary">
                {language === "zh" ? "工资追上生活成本了吗？" : "Are Wages Keeping Up?"}
              </h2>
              <p className="text-text-secondary text-lg mt-4 max-w-2xl mx-auto">
                {language === "zh"
                  ? "工资、消费价格和房价，全部以 2000 年为基准指数化。三条线一旦分叉，就说明有人正在掉队。"
                  : "Wages, consumer prices, and house prices — all indexed to 2000. When the lines diverge, someone is falling behind."}
              </p>
            </div>

            <div className="bg-bg-secondary/50 border border-border-subtle rounded-2xl p-4 sm:p-6">
              <ErrorBoundary>
                <ResponsiveChart aspectRatio={16 / 9} minHeight={350} maxHeight={500}>
                  {({ width, height }) => (
                    <PurchasingPowerChart
                      countryCode={selectedCountry}
                      width={width}
                      height={height}
                    />
                  )}
                </ResponsiveChart>
              </ErrorBoundary>
            </div>
          </div>
        </section>
      )}

      {/* Cross-link to Compare page */}
      {hasRichestData && !isGlobal && (
        <section className="px-4 sm:px-6 lg:px-8 py-10">
          <div className="max-w-6xl mx-auto">
            <Link
              href={`/compare/${selectedCountry.toLowerCase()}`}
              className="block bg-accent-periwinkle/8 border border-accent-periwinkle/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-accent-periwinkle/12 hover:border-accent-periwinkle/30 transition-all duration-300"
            >
              <p className="text-text-secondary text-base sm:text-lg">
                {language === "zh"
                  ? "看看你要多久，才能赚到与 "
                  : "See how long it would take you to earn as much as the richest person in "}{" "}
                <span className="text-accent-periwinkle font-medium">{countryName}</span>
                {language === "zh" ? " 最富有人士相当的财富" : ""}
              </p>
              <span className="inline-block mt-3 text-accent-periwinkle text-sm font-medium">
                {language === "zh" ? "试试亿万富豪对比 →" : "Try the billionaire comparison →"}
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Cross-link to Compare Countries page */}
      {!isGlobal && (
        <section className="px-4 sm:px-6 lg:px-8 py-5">
          <div className="max-w-6xl mx-auto">
            <Link
              href="/compare-countries"
              className="block bg-accent-amber/8 border border-accent-amber/20 rounded-2xl p-6 sm:p-8 text-center hover:bg-accent-amber/12 hover:border-accent-amber/30 transition-all duration-300"
            >
              <p className="text-text-secondary text-base sm:text-lg">
                {language === "zh"
                  ? "如果换一个国家，你的财富会排到哪里？"
                  : "How would your wealth rank in a different country?"}
              </p>
              <span className="inline-block mt-3 text-accent-amber text-sm font-medium">
                {language === "zh" ? "做跨国比较 →" : "Compare across countries →"}
              </span>
            </Link>
          </div>
        </section>
      )}

      {/* Sources */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl mx-auto">
          <SourcesSection />
        </div>
      </section>

      {/* Data source attribution */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-text-muted text-sm">
            {language === "zh" ? "数据来源包括 " : "Data sourced from "}
            <a
              href="https://wid.world"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-periwinkle hover:underline"
            >
              WID.world
            </a>
            ,{" "}
            <a
              href="https://www.oecd.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-periwinkle hover:underline"
            >
              OECD
            </a>
            , and{" "}
            <a
              href="https://fsolt.org/swiid/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-periwinkle hover:underline"
            >
              SWIID
            </a>
            {language === "zh" ? "。本项目开源，仅用于教育与公共认知目的。" : ". Open-source project for educational purposes."}
          </p>
        </div>
      </section>
    </main>
    </LazyMotion>
  );
}
