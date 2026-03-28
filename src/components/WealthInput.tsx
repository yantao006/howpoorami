"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { type CountryData, findPercentile } from "@/data/wealth-data";
import { formatCurrency, getCurrencySymbol } from "@/lib/format";
import { getPercentileLine } from "@/data/comedic-lines";

interface WealthInputProps {
  readonly country: CountryData;
  readonly onPercentileChange: (percentile: number | null) => void;
}

type InputMode = "wealth" | "income";

function getComedicResponse(percentile: number, countryName: string): string {
  return getPercentileLine(percentile, countryName);
}

/**
 * Rough income-to-wealth estimate using wealth-to-income multipliers.
 * Based on patterns from the Federal Reserve Survey of Consumer Finances (SCF):
 * lower-income households have lower savings rates and fewer assets, while
 * higher-income households accumulate disproportionately more wealth through
 * investments, property, and compounding returns. These are broad approximations
 * — actual wealth varies enormously by age, debt, housing market, and behavior.
 */
function estimateWealthFromIncome(annualIncome: number, country: CountryData): number {
  const medianIncome = country.medianIncome;
  const incomeRatio = annualIncome / (medianIncome > 0 ? medianIncome : 1);

  if (incomeRatio <= 0.5) return annualIncome * 0.5;
  if (incomeRatio <= 1) return annualIncome * 2;
  if (incomeRatio <= 2) return annualIncome * 4;
  if (incomeRatio <= 5) return annualIncome * 8;
  return annualIncome * 15;
}

export default function WealthInput({ country, onPercentileChange }: WealthInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [percentile, setPercentile] = useState<number | null>(null);
  const [mode, setMode] = useState<InputMode>("income");

  // Reset state when country changes
  useEffect(() => {
    setInputValue("");
    setPercentile(null);
    onPercentileChange(null);
  }, [country.code, onPercentileChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9]/g, "");
      setInputValue(raw);

      if (raw.length > 0) {
        const value = parseInt(raw, 10);
        const wealthValue = mode === "income"
          ? estimateWealthFromIncome(value, country)
          : value;
        const p = findPercentile(wealthValue, country);
        setPercentile(p);
        onPercentileChange(p);
      } else {
        setPercentile(null);
        onPercentileChange(null);
      }
    },
    [country, onPercentileChange, mode]
  );

  const handleModeSwitch = useCallback((newMode: InputMode) => {
    setMode(newMode);
    setInputValue("");
    setPercentile(null);
    onPercentileChange(null);
  }, [onPercentileChange]);

  const displayValue = useMemo(() => {
    if (inputValue.length === 0) return "";
    return formatCurrency(parseInt(inputValue, 10), country.currency);
  }, [inputValue, country.currency]);

  const comedic = useMemo(() => {
    if (percentile === null) return null;
    return getComedicResponse(percentile, country.name);
  }, [percentile, country.name]);

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Mode toggle */}
      <div className="flex justify-center gap-1 mb-4">
        <button
          type="button"
          onClick={() => handleModeSwitch("income")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            mode === "income"
              ? "bg-accent-periwinkle/20 text-accent-periwinkle border border-accent-periwinkle/30"
              : "bg-bg-card text-text-secondary border border-border-subtle hover:text-text-primary"
          }`}
        >
          Annual Income
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch("wealth")}
          className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
            mode === "wealth"
              ? "bg-accent-periwinkle/20 text-accent-periwinkle border border-accent-periwinkle/30"
              : "bg-bg-card text-text-secondary border border-border-subtle hover:text-text-primary"
          }`}
        >
          Net Wealth
        </button>
      </div>

      <label
        htmlFor="wealth-input"
        className="block text-sm text-text-secondary mb-2 text-center"
      >
        {mode === "income"
          ? `Enter your annual income (${country.currency}) to see where you stand`
          : `Enter your net wealth (${country.currency}) to see where you stand`}
      </label>
      <div className="relative">
        <input
          id="wealth-input"
          type="text"
          inputMode="numeric"
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

      {percentile !== null && (
        <div className="mt-4 text-center animate-fade-in">
          <p className="text-text-secondary text-sm">
            In {country.name}, you are wealthier than
          </p>
          <p className="text-5xl font-bold mt-1 tabular-nums">
            <span
              className={
                percentile >= 90
                  ? "text-accent-amber"
                  : percentile >= 50
                  ? "text-accent-sage"
                  : "text-accent-rose"
              }
            >
              {percentile.toFixed(1)}%
            </span>
          </p>
          <p className="text-text-secondary text-sm mt-1">of the population</p>

          {/* Comedic response */}
          {comedic && (
            <p className="text-text-muted text-sm mt-3 italic max-w-sm mx-auto">
              {comedic}
            </p>
          )}

          {percentile < 50 && (
            <p className="text-text-muted text-xs mt-2">
              Below the median wealth of {formatCurrency(country.medianWealthPerAdult, country.currency)}
            </p>
          )}
          {percentile >= 99 && (
            <p className="text-accent-amber/80 text-xs mt-2">
              You are in the top 1%
            </p>
          )}

          {/* Share buttons */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="text-text-muted text-xs">Share:</span>
            <button
              type="button"
              onClick={() => {
                const text = `I'm wealthier than ${percentile.toFixed(1)}% of the population in ${country.name}. Where do you stand?`;
                const url = `https://howpoorami.org/${country.code.toLowerCase()}`;
                window.open(
                  `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-periwinkle/30 transition-all cursor-pointer"
              aria-label="Share on X"
            >
              X / Twitter
            </button>
            <button
              type="button"
              onClick={() => {
                const text = `I'm wealthier than ${percentile.toFixed(1)}% of the population in ${country.name}. Where do you stand? https://howpoorami.org/${country.code.toLowerCase()}`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(text)}`,
                  "_blank",
                  "noopener,noreferrer",
                );
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-periwinkle/30 transition-all cursor-pointer"
              aria-label="Share on WhatsApp"
            >
              WhatsApp
            </button>
            <button
              type="button"
              onClick={() => {
                const url = `https://howpoorami.org/${country.code.toLowerCase()}`;
                navigator.clipboard.writeText(url);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary hover:border-accent-periwinkle/30 transition-all cursor-pointer"
              aria-label="Copy link"
            >
              Copy link
            </button>
          </div>
        </div>
      )}

      <p className="text-text-muted text-xs text-center mt-3">
        Your data stays in your browser. Nothing is stored or sent anywhere.
        {mode === "income" && (
          <span className="block mt-1">
            Income is converted to estimated wealth using approximate multipliers
            based on Federal Reserve SCF data. For accuracy, use &quot;Net Wealth&quot; mode.
          </span>
        )}
      </p>
    </div>
  );
}
