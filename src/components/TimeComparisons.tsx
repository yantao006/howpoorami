"use client";

import {
  getRelevantComparisons,
  type ComparisonResult,
} from "@/data/time-comparisons";
import { getYearsToMatchLine } from "@/data/comedic-lines";
import { useLanguage } from "@/components/LanguageProvider";
import { formatNumber } from "@/lib/format";

interface TimeComparisonsProps {
  readonly yearsToMatch: number;
  readonly billionaireName: string;
}

const CATEGORY_ACCENT: Record<string, string> = {
  historical: "text-accent-amber",
  scientific: "text-accent-periwinkle",
  religious: "text-accent-lavender",
  human: "text-accent-sage",
  comedic: "text-accent-rose",
  pop_culture: "text-accent-rose",
};

const CATEGORY_BORDER: Record<string, string> = {
  historical: "border-accent-amber/20",
  scientific: "border-accent-periwinkle/20",
  religious: "border-accent-lavender/20",
  human: "border-accent-sage/20",
  comedic: "border-accent-rose/20",
  pop_culture: "border-accent-rose/20",
};

const TIME_LABELS_ZH: Record<string, string> = {
  "working-career": "平均职业生涯",
  "human-lifetime": "平均人类寿命",
  "grandparents-born": "从你祖父母出生到现在",
  "dog-lifetime": "狗的平均寿命",
  generations: "一代人的时间",
  "retirement-savings": "为退休储蓄的平均时长",
  "great-pyramid": "建造金字塔的时间",
  "us-independence": "美国独立至今",
  "industrial-revolution": "工业革命至今",
  "roman-empire": "罗马帝国持续时间",
  renaissance: "文艺复兴至今",
  "genghis-khan": "成吉思汗帝国至今",
  cleopatra: "克利奥帕特拉至今",
  "moon-landing": "登月至今",
  "internet-invented": "互联网诞生至今",
  "first-iphone": "第一代 iPhone 发布至今",
  "world-cup-cycle": "世界杯周期",
  "olympics-cycle": "奥运会周期",
  "blockbuster-closed": "最后一家百视达关门至今",
  "count-to-billion": "每秒数一个数到 10 亿",
  "walk-around-earth": "步行绕地球一圈",
  "mars-mission": "往返火星一次",
};

function formatMultiplierZh(multiplier: number): string {
  if (multiplier >= 1_000_000) {
    return `${(multiplier / 1_000_000).toFixed(1).replace(/\.0$/, "")} 百万`;
  }
  if (multiplier >= 1_000) {
    return new Intl.NumberFormat("zh-CN", {
      maximumFractionDigits: 0,
    }).format(Math.round(multiplier));
  }
  if (multiplier >= 1) {
    return multiplier.toFixed(multiplier >= 10 ? 0 : 1).replace(/\.0$/, "");
  }
  return `${multiplier.toFixed(multiplier >= 0.1 ? 1 : 2).replace(/\.0+$/, "")}`;
}

function getLocalizedLabel(comparison: ComparisonResult, language: "en" | "zh"): string {
  if (language === "en") return comparison.ref.label;
  return TIME_LABELS_ZH[comparison.ref.id] ?? comparison.ref.label;
}

function getLocalizedFormatted(comparison: ComparisonResult, language: "en" | "zh"): string {
  if (language === "en") return comparison.formatted;

  const n = formatMultiplierZh(comparison.multiplier);
  const label = getLocalizedLabel(comparison, language);

  if (comparison.ref.id === "human-lifetime") {
    return `你得连续活上 ${n} 个人类一生`;
  }

  if (comparison.ref.id === "grandparents-born") {
    return `相当于 ${n} 次祖辈的人生跨度`;
  }

  return `相当于 ${n} 个「${label}」`;
}

function LifetimeHighlight({
  comparison,
  comedicQuote,
}: {
  readonly comparison: ComparisonResult;
  readonly comedicQuote: string;
}) {
  const { language } = useLanguage();
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-8 sm:p-10 text-center">
      <span className="text-4xl sm:text-5xl mb-4 block" aria-hidden="true">
        {comparison.ref.emoji}
      </span>
      <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-accent-sage mb-3">
        {getLocalizedFormatted(comparison, language)}
      </p>
      <p className="text-text-muted text-sm sm:text-base">
        {getLocalizedLabel(comparison, language)}{" "}
        ({comparison.ref.years} {language === "zh" ? "年" : "years"})
      </p>
      {comedicQuote && (
        <p className="text-text-muted text-sm italic mt-5 pt-5 border-t border-border-subtle/50 max-w-lg mx-auto">
          {comedicQuote}
        </p>
      )}
    </div>
  );
}

function ComparisonCard({
  comparison,
}: {
  readonly comparison: ComparisonResult;
}) {
  const { language } = useLanguage();
  const accent = CATEGORY_ACCENT[comparison.ref.category] ?? "text-text-primary";
  const border = CATEGORY_BORDER[comparison.ref.category] ?? "border-border-subtle";

  return (
    <div className={`bg-bg-card border ${border} rounded-2xl p-5 sm:p-6 text-center`}>
      <span className="text-3xl sm:text-4xl mb-3 block" aria-hidden="true">
        {comparison.ref.emoji}
      </span>
      <p className={`text-lg sm:text-xl font-bold ${accent} mb-2`}>
        {getLocalizedFormatted(comparison, language)}
      </p>
      <p className="text-text-muted text-xs sm:text-sm">
        {getLocalizedLabel(comparison, language)}
      </p>
    </div>
  );
}

export default function TimeComparisons({
  yearsToMatch,
  billionaireName,
}: TimeComparisonsProps) {
  const { language } = useLanguage();
  const comparisons = getRelevantComparisons(yearsToMatch, billionaireName);

  const lifetimeComparison = comparisons.find(
    (c) => c.ref.id === "human-lifetime",
  );

  const gridCards = comparisons
    .filter((c) => c.ref.id !== "human-lifetime")
    .slice(0, 6);

  const comedicQuote = language === "zh"
    ? `按这个速度，得花上 ${formatNumber(yearsToMatch)} 年，远远超过一个普通人的一生。`
    : getYearsToMatchLine(
        yearsToMatch,
        billionaireName,
        formatNumber(yearsToMatch),
      );

  if (comparisons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-8">
      {lifetimeComparison && (
        <LifetimeHighlight
          comparison={lifetimeComparison}
          comedicQuote={comedicQuote}
        />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {gridCards.map((comparison) => (
          <ComparisonCard
            key={comparison.ref.id}
            comparison={comparison}
          />
        ))}
      </div>
    </div>
  );
}
