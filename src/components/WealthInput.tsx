"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { type CountryData, findPercentile } from "@/data/wealth-data";
import { formatCurrency, getCurrencySymbol } from "@/lib/format";
import { toUSD, fromUSD } from "@/lib/currency";
import { getPercentileLine } from "@/data/comedic-lines";
import { RICHEST_BY_COUNTRY } from "@/data/billionaires";
import {
  type IncomeFactors,
  type PercentileRange,
  DEFAULT_INCOME_FACTORS,
  estimateWealthRange,
  computePercentileRange,
} from "@/lib/wealth-estimate";
import {
  adjustPercentileForAge,
  hasAgeData,
  AGE_GROUP_LABELS,
  type AgeAdjustedResult,
} from "@/data/age-adjustment";
import IncomeRefinementPanel from "./IncomeRefinementPanel";
import { useLanguage } from "@/components/LanguageProvider";
import { tCountryName, type Language } from "@/lib/i18n";

interface WealthInputProps {
  readonly country: CountryData;
  readonly onPercentileChange: (percentile: number | null) => void;
}

type InputMode = "wealth" | "income";

export default function WealthInput({
  country,
  onPercentileChange,
}: WealthInputProps) {
  const { language } = useLanguage();
  const countryName = tCountryName(country.code, country.name, language);
  const [inputValue, setInputValue] = useState("");
  const [percentile, setPercentile] = useState<number | null>(null);
  const [percentileRange, setPercentileRange] =
    useState<PercentileRange | null>(null);
  const [mode, setMode] = useState<InputMode>("wealth");
  const [incomeFactors, setIncomeFactors] = useState<IncomeFactors>(
    DEFAULT_INCOME_FACTORS,
  );
  const [refinePanelOpen, setRefinePanelOpen] = useState(false);
  const [ageInput, setAgeInput] = useState("");
  const refinePanelRef = useRef<HTMLDivElement>(null);

  // Auto-scroll refinement panel into view on mobile when opened
  useEffect(() => {
    if (refinePanelOpen && refinePanelRef.current) {
      // Small delay to allow the panel animation to start
      const timer = setTimeout(() => {
        refinePanelRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [refinePanelOpen]);

  // Convert input and recompute when country changes (instead of resetting)
  const prevCurrencyRef = useRef(country.currency);
  const prevCountryCodeRef = useRef(country.code);
  const [zeroIncomeMessage, setZeroIncomeMessage] = useState<string | null>(
    null,
  );
  useEffect(() => {
    if (prevCountryCodeRef.current === country.code) return;
    const prevCurrency = prevCurrencyRef.current;
    prevCurrencyRef.current = country.currency;
    prevCountryCodeRef.current = country.code;

    const id = requestAnimationFrame(() => {
      if (inputValue.length === 0 || inputValue === "-") {
        setPercentile(null);
        setPercentileRange(null);
        setZeroIncomeMessage(null);
        onPercentileChange(null);
        return;
      }

      const parsed = parseInt(inputValue, 10);
      if (!Number.isFinite(parsed)) return;
      const usd = toUSD(parsed, prevCurrency);
      const converted = Math.round(fromUSD(usd, country.currency));
      const newRaw = String(converted);
      setInputValue(newRaw);

      if (mode !== "income") {
        const p = findPercentile(usd, country);
        setPercentile(p);
        setPercentileRange(null);
        onPercentileChange(p);
      }
    });

    return () => cancelAnimationFrame(id);
  }, [country, inputValue, mode, onPercentileChange]);

  const computeFromIncome = useCallback(
    (raw: string, factors: IncomeFactors) => {
      if (raw.length === 0 || raw === "-") {
        setPercentile(null);
        setPercentileRange(null);
        setZeroIncomeMessage(null);
        onPercentileChange(null);
        return;
      }
      const value = parseInt(raw, 10);
      if (!Number.isFinite(value)) return;

      if (value === 0) {
        setPercentile(null);
        setPercentileRange(null);
        setZeroIncomeMessage(
          language === "zh"
            ? "请输入你的年度收入来查看位置。如果当前没有收入，建议改用“净资产”模式。"
            : "Enter your annual income to see where you stand. For zero or no income, try Net Wealth mode instead.",
        );
        onPercentileChange(null);
        return;
      }

      setZeroIncomeMessage(null);
      const valueUSD = toUSD(value, country.currency);
      const wRange = estimateWealthRange(valueUSD, country, factors, country.currency);
      const pRange = computePercentileRange(wRange, country);

      setPercentile(pRange.mid);
      setPercentileRange(pRange);
      onPercentileChange(pRange.mid);
    },
    [country, language, onPercentileChange],
  );

  // Recompute when income factors change
  useEffect(() => {
    if (mode !== "income") return;
    const id = requestAnimationFrame(() => {
      computeFromIncome(inputValue, incomeFactors);
    });
    return () => cancelAnimationFrame(id);
  }, [incomeFactors, mode, inputValue, computeFromIncome]);

  const ageResult = useMemo((): AgeAdjustedResult | null => {
    const age = parseInt(ageInput, 10);
    if (!Number.isFinite(age) || age < 18 || age > 120 || percentile === null) {
      return null;
    }
    if (!hasAgeData(country.code)) {
      return null;
    }
    if (inputValue.length === 0 || inputValue === "-") {
      return null;
    }
    const parsed = parseInt(inputValue, 10);
    if (!Number.isFinite(parsed)) return null;
    const usd = mode === "income"
      ? estimateWealthRange(toUSD(parsed, country.currency), country, incomeFactors, country.currency).mid
      : toUSD(parsed, country.currency);
    return adjustPercentileForAge(usd, age, country);
  }, [ageInput, percentile, inputValue, country, mode, incomeFactors]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip everything except digits and leading minus (wealth can be negative)
      const cleaned = mode === "wealth"
        ? e.target.value.replace(/(?!^-)[^0-9]/g, "").replace(/^(-?)0+(?=\d)/, "$1")
        : e.target.value.replace(/[^0-9]/g, "");
      const raw = cleaned;
      setInputValue(raw);

      if (mode === "income") {
        computeFromIncome(raw, incomeFactors);
      } else if (raw.length > 0 && raw !== "-") {
        const localAmount = parseInt(raw, 10);
        const usdAmount = toUSD(localAmount, country.currency);
        const p = findPercentile(usdAmount, country);
        setPercentile(p);
        setPercentileRange(null);
        onPercentileChange(p);
      } else {
        setPercentile(null);
        setPercentileRange(null);
        onPercentileChange(null);
      }
    },
    [country, onPercentileChange, mode, incomeFactors, computeFromIncome],
  );

  const handleModeSwitch = useCallback(
    (newMode: InputMode) => {
      setMode(newMode);
      setInputValue("");
      setPercentile(null);
      setPercentileRange(null);
      setZeroIncomeMessage(null);
      setIncomeFactors(DEFAULT_INCOME_FACTORS);
      setRefinePanelOpen(false);
      onPercentileChange(null);
    },
    [onPercentileChange],
  );

  const updateFactor = useCallback(
    <K extends keyof IncomeFactors>(key: K, value: IncomeFactors[K]) => {
      setIncomeFactors((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const displayValue = useMemo(() => {
    if (inputValue.length === 0 || inputValue === "-") return inputValue;
    const parsed = parseInt(inputValue, 10);
    if (!Number.isFinite(parsed)) return inputValue;
    return formatCurrency(parsed, country.currency);
  }, [inputValue, country.currency]);

  const comedic = useMemo(() => {
    if (percentile === null) return null;
    return getPercentileLine(percentile, country.name);
  }, [percentile, country.name]);

  const wealthRange = useMemo(() => {
    if (mode !== "income" || inputValue.length === 0) return null;
    const value = parseInt(inputValue, 10);
    if (!Number.isFinite(value)) return null;
    const valueUSD = toUSD(value, country.currency);
    const rangeUSD = estimateWealthRange(valueUSD, country, incomeFactors, country.currency);
    // Convert back to local currency for display
    const rate = value / valueUSD; // local per USD
    return {
      low: Math.round(rangeUSD.low * rate),
      mid: Math.round(rangeUSD.mid * rate),
      high: Math.round(rangeUSD.high * rate),
    };
  }, [mode, inputValue, country, incomeFactors]);

  const isRange = mode === "income" && percentileRange !== null;

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mode toggle — Net Wealth first */}
      <div className="flex justify-center gap-1 mb-4">
        <ModeButton
          label={language === "zh" ? "净资产" : "Net Wealth"}
          active={mode === "wealth"}
          onClick={() => handleModeSwitch("wealth")}
        />
        <ModeButton
          label={language === "zh" ? "年收入" : "Annual Income"}
          active={mode === "income"}
          onClick={() => handleModeSwitch("income")}
        />
      </div>

      <label
        htmlFor="wealth-input"
        className="block text-sm text-text-secondary mb-2 text-center"
      >
        {mode === "income"
          ? language === "zh"
            ? `输入你的税前年收入（${country.currency}）`
            : `Enter your gross (pre-tax) annual income in ${country.currency}`
          : language === "zh"
            ? `输入你的净资产（${country.currency}）`
            : `Enter your net wealth in ${country.currency}`}
      </label>
      <p className="text-text-muted text-[11px] text-center mb-2">
        {mode === "income"
          ? language === "zh"
            ? "税前收入包括工资、资本收入以及养老金等税前金额。"
            : "Pre-tax includes wages, capital income, and pensions before tax."
          : language === "zh"
            ? "请输入你个人名下的份额；如果与伴侣共同持有资产，请填写属于你的那一半。"
            : "Enter YOUR personal share — if you share finances with a partner, enter half."}
      </p>

      <div className="relative">
        <input
          id="wealth-input"
          type="text"
          inputMode={mode === "wealth" ? "text" : "numeric"}
          value={displayValue}
          onChange={handleChange}
          placeholder={`${getCurrencySymbol(country.currency)}0`}
          className="
            w-full px-6 py-4 rounded-2xl text-center text-2xl font-medium tabular-nums
            bg-bg-card border border-border-subtle
            text-text-primary placeholder:text-text-muted
            focus:outline-none focus:border-accent-periwinkle/50 focus:ring-2 focus:ring-accent-periwinkle/20
            transition-all duration-300
          "
        />
      </div>

      {/* Optional age input */}
      {percentile !== null && hasAgeData(country.code) && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <label htmlFor="age-input" className="text-text-muted text-xs">
            {language === "zh" ? "你的年龄（可选）：" : "Your age (optional):"}
          </label>
          <input
            id="age-input"
            type="text"
            inputMode="numeric"
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
            placeholder={language === "zh" ? "例如 30" : "e.g. 30"}
            className="w-16 px-2 py-1 rounded-lg text-center text-sm tabular-nums bg-bg-card border border-border-subtle text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-periwinkle/50 transition-colors"
          />
        </div>
      )}

      {/* Income refinement panel */}
      {mode === "income" && (
        <div ref={refinePanelRef}>
          {!refinePanelOpen && inputValue.length > 0 && inputValue !== "0" && (
            <button
              type="button"
              onClick={() => setRefinePanelOpen(true)}
              className="w-full text-center text-xs text-accent-periwinkle hover:text-accent-periwinkle/80 mt-2 mb-1 cursor-pointer transition-colors"
            >
              {language === "zh"
                ? "如果你知道自己的资产情况，可补充房产、投资等信息，让估算更精确"
                : "Know your assets? Add property, investments & more for a tighter estimate"}
            </button>
          )}
          <IncomeRefinementPanel
            factors={incomeFactors}
            isOpen={refinePanelOpen}
            onToggle={() => setRefinePanelOpen((o) => !o)}
            onChange={updateFactor}
            currencyCode={country.currency}
            language={language}
          />
        </div>
      )}

      {/* Estimated wealth range */}
      {wealthRange !== null && (
        <p className="text-text-muted text-[11px] text-center mt-2 tabular-nums">
          {language === "zh" ? "估算净资产：" : "Est. net wealth: "}{" "}
          <span className="text-text-secondary font-medium">
            {formatCurrency(wealthRange.low, country.currency)}
          </span>
          <span className="mx-1">–</span>
          <span className="text-text-secondary font-medium">
            {formatCurrency(wealthRange.high, country.currency)}
          </span>
        </p>
      )}

      {/* Zero income message */}
      {zeroIncomeMessage && (
        <p className="text-text-muted text-sm text-center mt-4 animate-fade-in">
          {zeroIncomeMessage}
        </p>
      )}

      {/* Result */}
      {percentile !== null && (
        <div className="mt-4 text-center animate-fade-in">
          <p className="text-text-secondary text-sm">
            {mode === "income"
              ? language === "zh"
                ? `在 ${countryName}，按你的收入推算出的财富水平计算，你超过了`
                : `In ${countryName}, based on estimated wealth from your income, you rank higher than`
              : language === "zh"
                ? `在 ${countryName}，你的财富超过了`
                : `In ${countryName}, you are wealthier than`}
          </p>

          {isRange && percentileRange ? (
            <PercentileRangeDisplay
              range={percentileRange}
              refinePanelOpen={refinePanelOpen}
              language={language}
            />
          ) : (
            <PercentilePreciseDisplay percentile={percentile} language={language} />
          )}

          {/* Age-adjusted result */}
          {ageResult && (
            <div className="mt-3 bg-accent-periwinkle/5 border border-accent-periwinkle/15 rounded-xl px-4 py-3 max-w-sm mx-auto">
              <p className="text-text-secondary text-xs mb-1">
                {language === "zh"
                  ? `按你的年龄组（${AGE_GROUP_LABELS[ageResult.ageGroup]}）：`
                  : `For your age group (${AGE_GROUP_LABELS[ageResult.ageGroup]}):`}
              </p>
              <p className="text-2xl font-bold tabular-nums">
                <span className={percentileColor(ageResult.ageAdjustedPercentile)}>
                  {ageResult.ageAdjustedPercentile.toFixed(1)}%
                </span>
              </p>
              <p className="text-text-muted text-[10px] mt-1">
                {ageResult.ageAdjustedPercentile > ageResult.overallPercentile
                  ? language === "zh"
                    ? `和同龄人相比，你的表现比整体排名更好（整体为 ${ageResult.overallPercentile.toFixed(1)}%）`
                    : `You're doing better among your age peers than overall (${ageResult.overallPercentile.toFixed(1)}%)`
                  : ageResult.ageAdjustedPercentile < ageResult.overallPercentile
                    ? language === "zh"
                      ? `你的年龄组通常积累了更多财富，因此你的整体排名（${ageResult.overallPercentile.toFixed(1)}%）反而更高`
                      : `Your age group typically has more wealth — your overall rank (${ageResult.overallPercentile.toFixed(1)}%) is higher`
                    : language === "zh"
                      ? "你在同龄人中的位置与整体排名大致相近"
                      : "Your ranking is similar among your age peers"}
              </p>
            </div>
          )}

          {language === "en" && comedic && (
            <p className="text-text-muted text-sm mt-3 italic max-w-sm mx-auto">
              {comedic}
            </p>
          )}

          {/* Negative wealth context */}
          {mode === "wealth" && inputValue.startsWith("-") && (
            <p className="text-text-muted text-xs mt-2 max-w-sm mx-auto">
              {language === "zh"
                ? "净资产为负（负债大于资产）并不少见。很多国家都有 10%-20% 的成年人处于负净资产状态，WID.world 的数据也将这些人纳入底部百分位。"
                : "Negative net wealth (debt exceeding assets) is common. In many countries, 10-20% of adults have negative net wealth. WID.world data includes these individuals in the bottom percentiles."}
            </p>
          )}

          {percentile < 50 && !(mode === "wealth" && inputValue.startsWith("-")) && (
            <p className="text-text-muted text-xs mt-2">
              {language === "zh" ? "低于该国财富中位数：" : "Below the median wealth of"}{" "}
              {formatCurrency(
                fromUSD(country.medianWealthPerAdult, country.currency),
                country.currency,
              )}
            </p>
          )}
          {percentile >= 99 && (
            <p className="text-accent-amber/80 text-xs mt-2">
              {language === "zh" ? "你已进入前 1%" : "You are in the top 1%"}
            </p>
          )}

          <ShareButtons
            percentile={percentile}
            percentileRange={isRange ? percentileRange : null}
            countryName={countryName}
            countryCode={country.code}
            language={language}
          />

          {/* Cross-link to How Long page */}
          {(() => {
            const richest = RICHEST_BY_COUNTRY[country.code];
            if (!richest || country.code === "GLOBAL") return null;

            // Estimate annual income in local currency for the link
            const incomeForLink = mode === "income" && inputValue
              ? inputValue
              : null;

            const compareUrl = incomeForLink
              ? `/compare/${country.code.toLowerCase()}?income=${incomeForLink}`
              : `/compare/${country.code.toLowerCase()}`;

            // Calculate gap to top 1%
            const totalWealth = country.meanWealthPerAdult * country.population * 1_000_000;
            const adults = country.population * 1_000_000;
            const avgTop1Wealth = (totalWealth * country.wealthShares.top1 / 100) / (adults * 0.01);
            const avgTop1Local = fromUSD(avgTop1Wealth, country.currency);

            return (
              <div className="mt-5 pt-4 border-t border-border-subtle/50 max-w-sm mx-auto">
                <p className="text-text-muted text-xs mb-1">
                  {language === "zh" ? "前 1% 平均财富：" : "Average top 1% wealth: "}{" "}
                  <span className="text-text-secondary font-medium">
                    {formatCurrency(avgTop1Local, country.currency)}
                  </span>
                </p>
                <p className="text-text-muted text-xs mb-3">
                  {language === "zh" ? `${countryName} 最富有的人：` : `Richest in ${countryName}: `}{" "}
                  <span className="text-text-secondary font-medium">
                    {richest.name}
                  </span>{" "}
                  ({formatCurrency(fromUSD(richest.netWorth, country.currency), country.currency)})
                </p>
                <Link
                  href={compareUrl}
                  className="inline-block text-accent-periwinkle text-xs font-medium hover:underline"
                >
                  {language === "zh" ? "看看需要多久才能追平他们 →" : "See how long it would take to match them →"}
                </Link>
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-text-muted text-xs text-center mt-3">
        {language === "zh"
          ? "你的数据始终保留在浏览器中，不会被存储或发送到任何地方。"
          : "Your data stays in your browser. Nothing is stored or sent anywhere."}
        {mode === "income" && (
          <span className="block mt-1">
            {language === "zh"
              ? "收入会被换算为一个估算净资产区间。若想获得更精确的结果，请使用“净资产”模式。"
              : 'Income is converted to an estimated wealth range. For exact results, use "Net Wealth" mode.'}
          </span>
        )}
      </p>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function ModeButton({
  label,
  active,
  onClick,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
        active
          ? "bg-accent-periwinkle/20 text-accent-periwinkle border border-accent-periwinkle/30"
          : "bg-bg-card text-text-secondary border border-border-subtle hover:text-text-primary"
      }`}
    >
      {label}
    </button>
  );
}

function percentileColor(p: number): string {
  if (p >= 90) return "text-accent-amber";
  if (p >= 50) return "text-accent-sage";
  return "text-accent-rose";
}

function PercentileRangeDisplay({
  range,
  refinePanelOpen,
  language,
}: {
  readonly range: PercentileRange;
  readonly refinePanelOpen: boolean;
  readonly language: Language;
}) {
  return (
    <>
      <p className="text-text-secondary text-sm mt-1">
        {language === "zh" ? "大约" : "approximately"}
      </p>
      <p className="text-4xl sm:text-5xl font-bold mt-1 tabular-nums">
        <span className={percentileColor(range.low)}>
          {range.low.toFixed(1)}%
        </span>
        <span className="text-text-muted text-lg sm:text-xl mx-1 font-normal">
          –
        </span>
        <span className={percentileColor(range.high)}>
          {range.high.toFixed(1)}%
        </span>
      </p>
      <p className="text-text-secondary text-sm mt-1">
        {language === "zh" ? "的人口" : "of the population"}
      </p>
      {!refinePanelOpen && (
        <p className="text-text-muted text-[11px] mt-1">
          {language === "zh"
            ? '展开上方“细化估算”可缩小这个区间'
            : 'Open "Refine estimate" above to narrow this range'}
        </p>
      )}
    </>
  );
}

function PercentilePreciseDisplay({
  percentile,
  language,
}: {
  readonly percentile: number;
  readonly language: Language;
}) {
  return (
    <>
      <p className="text-5xl font-bold mt-1 tabular-nums">
        <span className={percentileColor(percentile)}>
          {percentile.toFixed(1)}%
        </span>
      </p>
      <p className="text-text-secondary text-sm mt-1">
        {language === "zh" ? "的人口" : "of the population"}
      </p>
    </>
  );
}

function ShareButtons({
  percentile,
  percentileRange,
  countryName,
  countryCode,
  language,
}: {
  readonly percentile: number;
  readonly percentileRange: PercentileRange | null;
  readonly countryName: string;
  readonly countryCode: string;
  readonly language: Language;
}) {
  const [copyStatus, setCopyStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");

  const pText = percentileRange
    ? `${percentileRange.low.toFixed(1)}–${percentileRange.high.toFixed(1)}%`
    : `${percentile.toFixed(1)}%`;
  const shareText =
    language === "zh"
      ? `我在 ${countryName} 的财富超过了 ${pText} 的人口。你又处在哪个位置？`
      : `I'm wealthier than ${pText} of the population in ${countryName}. Where do you stand?`;
  const url = countryCode === "GLOBAL"
    ? "https://howpoorami.org"
    : `https://howpoorami.org/${countryCode.toLowerCase()}`;

  const handleCopy = useCallback(() => {
    const onSuccess = () => {
      setCopyStatus("copied");
      setTimeout(() => setCopyStatus("idle"), 2000);
    };
    const onFailure = () => {
      setCopyStatus("failed");
      setTimeout(() => setCopyStatus("idle"), 2000);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(onSuccess).catch(onFailure);
    } else {
      onFailure();
    }
  }, [url]);

  const copyLabel =
    copyStatus === "copied"
      ? language === "zh"
        ? "已复制"
        : "Copied!"
      : copyStatus === "failed"
        ? language === "zh"
          ? "复制失败"
          : "Copy failed"
        : language === "zh"
          ? "复制链接"
          : "Copy link";

  const btnClass =
    "px-2.5 py-1 rounded-lg text-[11px] font-medium min-h-[44px] min-w-[44px] bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-periwinkle/30 transition-all cursor-pointer";

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <span className="text-text-muted text-xs">{language === "zh" ? "分享：" : "Share:"}</span>
      <button
        type="button"
        onClick={() =>
          window.open(
            `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`,
            "_blank",
            "noopener,noreferrer",
          )
        }
        className={btnClass}
        aria-label={language === "zh" ? "分享到 X" : "Share on X"}
      >
        X / Twitter
      </button>
      <button
        type="button"
        onClick={() =>
          window.open(
            `https://wa.me/?text=${encodeURIComponent(`${shareText} ${url}`)}`,
            "_blank",
            "noopener,noreferrer",
          )
        }
        className={btnClass}
        aria-label={language === "zh" ? "分享到 WhatsApp" : "Share on WhatsApp"}
      >
        WhatsApp
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className={`${btnClass} ${
          copyStatus === "copied"
            ? "!text-accent-sage !border-accent-sage/30"
            : copyStatus === "failed"
              ? "!text-accent-rose !border-accent-rose/30"
              : ""
        }`}
        aria-label={language === "zh" ? "复制链接" : "Copy link"}
      >
        {copyLabel}
      </button>
    </div>
  );
}
