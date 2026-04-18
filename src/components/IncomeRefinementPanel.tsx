"use client";

import { type ReactNode, useCallback } from "react";
import {
  type IncomeFactors,
  type FactorImpact,
  countFilledFactors,
  MAX_FACTORS,
  computeSpreadFactor,
  computeFactorImpacts,
} from "@/lib/wealth-estimate";
import type { Language } from "@/lib/i18n";

interface IncomeRefinementPanelProps {
  readonly factors: IncomeFactors;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  readonly onChange: <K extends keyof IncomeFactors>(
    key: K,
    value: IncomeFactors[K],
  ) => void;
  readonly currencyCode?: string;
  readonly language: Language;
}

// ── Small UI primitives ────────────────────────────────────────────

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-300 ${open ? "rotate-180" : ""}`}
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ConfidenceBar({
  filled,
  language,
}: {
  readonly filled: number;
  readonly language: Language;
}) {
  const pct = Math.round((filled / MAX_FACTORS) * 100);
  const label =
    pct === 0
      ? language === "zh"
        ? "非常粗略"
        : "Very rough"
      : pct <= 20
        ? language === "zh"
          ? "粗略"
          : "Rough"
        : pct <= 40
          ? language === "zh"
            ? "一般"
            : "Moderate"
          : pct <= 60
            ? language === "zh"
              ? "不错"
              : "Good"
            : pct <= 80
              ? language === "zh"
                ? "精确"
                : "Precise"
              : language === "zh"
                ? "非常精确"
                : "Very precise";
  const color =
    pct <= 20
      ? "bg-accent-rose/60"
      : pct <= 40
        ? "bg-accent-amber/60"
        : "bg-accent-sage/60";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.max(5, pct)}%` }}
        />
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap tabular-nums">
        {label} ({filled}/{MAX_FACTORS})
      </span>
    </div>
  );
}

function ToggleChip({
  active,
  label,
  onClick,
  variant = "neutral",
}: {
  readonly active: boolean;
  readonly label: ReactNode;
  readonly onClick: () => void;
  readonly variant?: "positive" | "negative" | "neutral";
}) {
  const activeStyles = {
    positive: "bg-accent-sage/20 text-accent-sage border-accent-sage/30",
    negative: "bg-accent-rose/20 text-accent-rose border-accent-rose/30",
    neutral:
      "bg-accent-periwinkle/20 text-accent-periwinkle border-accent-periwinkle/30",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
        active
          ? activeStyles[variant]
          : "bg-bg-primary text-text-muted border-border-subtle hover:text-text-secondary hover:border-text-muted/30"
      }`}
    >
      {label}
    </button>
  );
}

function SegmentedButtons({
  options,
  value,
  onSelect,
  variant = "neutral",
}: {
  readonly options: readonly (readonly [string, string])[];
  readonly value: string;
  readonly onSelect: (v: string) => void;
  readonly variant?: "neutral" | "negative";
}) {
  const activeClass =
    variant === "negative"
      ? "bg-accent-rose/15 text-accent-rose border-accent-rose/30"
      : "bg-accent-periwinkle/15 text-accent-periwinkle border-accent-periwinkle/30";

  return (
    <div className="flex flex-wrap gap-1">
      {options.map(([val, label]) => (
        <button
          key={val}
          type="button"
          onClick={() => onSelect(val)}
          className={`px-2 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
            value === val
              ? activeClass
              : "bg-bg-primary text-text-muted border-border-subtle hover:text-text-secondary"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function SmallInput({
  id,
  label,
  value,
  placeholder,
  onChange,
  maxLen = 3,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (val: string) => void;
  readonly maxLen?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs text-text-muted mb-0.5">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          const cleaned = e.target.value.replace(/[^0-9]/g, "").slice(0, maxLen);
          onChange(cleaned);
        }}
        placeholder={placeholder}
        className="w-full px-2.5 py-1.5 rounded-lg text-sm bg-bg-primary border border-border-subtle text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-periwinkle/40 transition-colors tabular-nums"
      />
    </div>
  );
}

function SectionLegend({ children }: { readonly children: string }) {
  return (
    <legend className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
      {children}
    </legend>
  );
}

function FactorImpactSummary({
  impacts,
  language,
}: {
  readonly impacts: readonly FactorImpact[];
  readonly language: Language;
}) {
  if (impacts.length === 0) return null;

  const upFactors = impacts.filter((i) => i.direction === "up");
  const downFactors = impacts.filter((i) => i.direction === "down");

  return (
    <div className="pt-3 border-t border-border-subtle space-y-2">
      <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
        {language === "zh" ? "影响估算结果的因素" : "What's influencing your estimate"}
      </p>
      {upFactors.length > 0 && (
        <div className="space-y-1">
          {upFactors.map((f) => (
            <div key={f.key} className="flex items-start gap-2 text-xs">
              <span className="text-accent-sage mt-0.5 flex-shrink-0" aria-hidden="true">↑</span>
              <div>
                <span className="font-medium text-accent-sage">{f.label}</span>
                <span className="text-text-muted ml-1">— {f.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
      {downFactors.length > 0 && (
        <div className="space-y-1">
          {downFactors.map((f) => (
            <div key={f.key} className="flex items-start gap-2 text-xs">
              <span className="text-accent-rose mt-0.5 flex-shrink-0" aria-hidden="true">↓</span>
              <div>
                <span className="font-medium text-accent-rose">{f.label}</span>
                <span className="text-text-muted ml-1">— {f.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────

export default function IncomeRefinementPanel({
  factors,
  isOpen,
  onToggle,
  onChange,
  currencyCode = "USD",
  language,
}: IncomeRefinementPanelProps) {
  const filled = countFilledFactors(factors);
  const spread = computeSpreadFactor(factors);
  const spreadPct = Math.round(spread * 100);
  const impacts = computeFactorImpacts(factors);

  const numChange = useCallback(
    (key: keyof IncomeFactors, raw: string, maxLen = 3) => {
      const cleaned = raw.replace(/[^0-9]/g, "").slice(0, maxLen);
      onChange(key, cleaned as IncomeFactors[typeof key]);
    },
    [onChange],
  );

  return (
    <div className="mt-3 rounded-xl border border-border-subtle overflow-hidden transition-all duration-300">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between px-4 py-3 bg-bg-card hover:bg-bg-secondary/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-secondary">
            {language === "zh" ? "细化估算" : "Refine estimate"}
          </span>
          {filled > 0 && (
            <span className="text-xs tabular-nums text-accent-periwinkle bg-accent-periwinkle/10 px-1.5 py-0.5 rounded-full">
              ±{spreadPct}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-text-muted">
          {filled > 0 && !isOpen && (
            <span className="text-xs tabular-nums">
              {language === "zh"
                ? `${filled} 项因素`
                : `${filled} factor${filled !== 1 ? "s" : ""}`}
            </span>
          )}
          <ChevronIcon open={isOpen} />
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-2 space-y-4 bg-bg-card border-t border-border-subtle">
            <ConfidenceBar filled={filled} language={language} />

            {/* ── Demographics ── */}
            <fieldset>
              <SectionLegend>{language === "zh" ? "人口特征" : "Demographics"}</SectionLegend>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                <SmallInput
                  id="ref-age"
                  label={language === "zh" ? "年龄" : "Age"}
                  value={factors.age}
                  placeholder="35"
                  onChange={(v) => numChange("age", v, 3)}
                />
                <SmallInput
                  id="ref-household"
                  label={language === "zh" ? "家庭人数" : "Household"}
                  value={factors.householdSize}
                  placeholder="2"
                  onChange={(v) => numChange("householdSize", v, 2)}
                />
                <SmallInput
                  id="ref-years-worked"
                  label={language === "zh" ? "工作年限" : "Yrs worked"}
                  value={factors.yearsWorked}
                  placeholder="10"
                  onChange={(v) => numChange("yearsWorked", v, 2)}
                />
              </div>

              {/* Education */}
              <div className="mb-2">
                <span className="block text-xs text-text-muted mb-1">
                  {language === "zh" ? "教育程度" : "Education"}
                </span>
                <SegmentedButtons
                  options={[
                    ["no_degree", language === "zh" ? "无学位" : "No degree"],
                    ["high_school", language === "zh" ? "高中" : "High school"],
                    ["bachelor", language === "zh" ? "本科" : "Bachelor"],
                    ["master", language === "zh" ? "硕士" : "Master"],
                    ["doctorate", language === "zh" ? "博士" : "PhD"],
                  ]}
                  value={factors.educationLevel}
                  onSelect={(v) => onChange("educationLevel", v)}
                />
              </div>

              {/* Employment type */}
              <div className="mb-2">
                <span className="block text-xs text-text-muted mb-1">
                  {language === "zh" ? "就业状态" : "Employment"}
                </span>
                <SegmentedButtons
                  options={[
                    ["unemployed", language === "zh" ? "失业" : "Unemployed"],
                    ["part_time", language === "zh" ? "兼职" : "Part-time"],
                    ["full_time", language === "zh" ? "全职" : "Full-time"],
                    ["self_employed", language === "zh" ? "自由职业" : "Self-empl."],
                    ["business_owner", language === "zh" ? "企业主" : "Business"],
                    ["retired", language === "zh" ? "退休" : "Retired"],
                  ]}
                  value={factors.employmentType}
                  onSelect={(v) => onChange("employmentType", v)}
                />
              </div>

              {/* Marital status */}
              <div>
                <span className="block text-xs text-text-muted mb-1">
                  {language === "zh" ? "婚姻状态" : "Marital status"}
                </span>
                <SegmentedButtons
                  options={[
                    ["single", language === "zh" ? "单身" : "Single"],
                    ["partnered", language === "zh" ? "伴侣同住" : "Partner"],
                    ["married", language === "zh" ? "已婚" : "Married"],
                    ["divorced", language === "zh" ? "离异" : "Divorced"],
                    ["widowed", language === "zh" ? "丧偶" : "Widowed"],
                  ]}
                  value={factors.maritalStatus}
                  onSelect={(v) => onChange("maritalStatus", v)}
                />
              </div>
            </fieldset>

            {/* ── Financial Profile ── */}
            <fieldset>
              <SectionLegend>{language === "zh" ? "财务画像" : "Financial profile"}</SectionLegend>

              <div className="mb-2">
                <span className="block text-xs text-text-muted mb-1">
                  {language === "zh" ? "储蓄习惯" : "Savings habit"}
                </span>
                <SegmentedButtons
                  options={[
                    ["very_low", language === "zh" ? "很少" : "Minimal"],
                    ["low", language === "zh" ? "低于平均" : "Below avg"],
                    ["moderate", language === "zh" ? "平均" : "Average"],
                    ["high", language === "zh" ? "高于平均" : "Above avg"],
                    ["very_high", language === "zh" ? "非常积极" : "Aggressive"],
                  ]}
                  value={factors.savingsRate}
                  onSelect={(v) => onChange("savingsRate", v)}
                />
              </div>

              {/* Asset chips + optional values */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <ToggleChip
                  active={factors.hasInvestments}
                  label={<><span aria-hidden="true">📈 </span>{language === "zh" ? "投资" : "Investments"}</>}
                  onClick={() =>
                    onChange("hasInvestments", !factors.hasInvestments)
                  }
                  variant="positive"
                />
                <ToggleChip
                  active={factors.hasRetirement}
                  label={<><span aria-hidden="true">🏛️ </span>{language === "zh" ? "退休账户" : "Retirement fund"}</>}
                  onClick={() =>
                    onChange("hasRetirement", !factors.hasRetirement)
                  }
                  variant="positive"
                />
                <ToggleChip
                  active={factors.hasInheritance}
                  label={<><span aria-hidden="true">🏦 </span>{language === "zh" ? "继承/赠与" : "Inheritance"}</>}
                  onClick={() =>
                    onChange("hasInheritance", !factors.hasInheritance)
                  }
                  variant="positive"
                />
              </div>

              {/* Conditional value inputs for investments & retirement */}
              {(factors.hasInvestments || factors.hasRetirement) && (
                <div className="grid grid-cols-2 gap-2 mt-2 ml-1">
                  {factors.hasInvestments && (
                    <SmallInput
                      id="ref-inv-val"
                      label={language === "zh" ? `投资金额（${currencyCode}）` : `Investment value (${currencyCode})`}
                      value={factors.investmentValue}
                      placeholder={language === "zh" ? "例如 50000" : "e.g. 50000"}
                      onChange={(v) => numChange("investmentValue", v, 10)}
                      maxLen={10}
                    />
                  )}
                  {factors.hasRetirement && (
                    <SmallInput
                      id="ref-ret-val"
                      label={language === "zh" ? `养老金 / 401k（${currencyCode}）` : `Pension pot / 401k (${currencyCode})`}
                      value={factors.retirementValue}
                      placeholder={language === "zh" ? "例如 80000" : "e.g. 80000"}
                      onChange={(v) => numChange("retirementValue", v, 10)}
                      maxLen={10}
                    />
                  )}
                </div>
              )}
            </fieldset>

            {/* ── Property ── */}
            <fieldset>
              <SectionLegend>{language === "zh" ? "房产" : "Property"}</SectionLegend>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  <ToggleChip
                    active={factors.hasProperty}
                    label={<><span aria-hidden="true">🏠 </span>{language === "zh" ? "我有房产" : "I own property"}</>}
                    onClick={() =>
                      onChange("hasProperty", !factors.hasProperty)
                    }
                    variant="positive"
                  />
                  <ToggleChip
                    active={factors.hasMortgage}
                    label={<><span aria-hidden="true">🏗️ </span>{language === "zh" ? "房贷" : "Mortgage"}</>}
                    onClick={() =>
                      onChange("hasMortgage", !factors.hasMortgage)
                    }
                    variant="negative"
                  />
                </div>
                {(factors.hasProperty || factors.hasMortgage) && (
                  <div className="grid grid-cols-2 gap-2 ml-1">
                    {factors.hasProperty && (
                      <SmallInput
                        id="ref-prop-val"
                        label={language === "zh" ? `房产市值（${currencyCode}）` : `Property value (${currencyCode})`}
                        value={factors.propertyValue}
                        placeholder={language === "zh" ? "例如 350000" : "e.g. 350000"}
                        onChange={(v) => numChange("propertyValue", v, 10)}
                        maxLen={10}
                      />
                    )}
                    {factors.hasMortgage && (
                      <SmallInput
                        id="ref-mort-val"
                        label={language === "zh" ? `剩余房贷（${currencyCode}）` : `Mortgage remaining (${currencyCode})`}
                        value={factors.mortgageRemaining}
                        placeholder={language === "zh" ? "例如 200000" : "e.g. 200000"}
                        onChange={(v) => numChange("mortgageRemaining", v, 10)}
                        maxLen={10}
                      />
                    )}
                  </div>
                )}
              </div>
            </fieldset>

            {/* ── Debts ── */}
            <fieldset>
              <SectionLegend>{language === "zh" ? "非房贷负债" : "Non-mortgage debts"}</SectionLegend>
              <div className="space-y-2">
                <ToggleChip
                  active={factors.hasDebts}
                  label={<><span aria-hidden="true">💳 </span>{language === "zh" ? "我有较大负债" : "I have significant debts"}</>}
                  onClick={() => onChange("hasDebts", !factors.hasDebts)}
                  variant="negative"
                />
                {factors.hasDebts && (
                  <div className="ml-1">
                    <span className="block text-xs text-text-muted mb-1">
                      {language === "zh" ? "负债水平（不含房贷）" : "Debt level (excl. mortgage)"}
                    </span>
                    <SegmentedButtons
                      options={[
                        ["low", language === "zh" ? "< 1 年收入" : "< 1yr income"],
                        ["moderate", language === "zh" ? "1–3 年" : "1–3yr"],
                        ["high", language === "zh" ? "3–5 年" : "3–5yr"],
                        ["very_high", language === "zh" ? "> 5 年" : "> 5yr"],
                      ]}
                      value={factors.debtLevel}
                      onSelect={(v) => onChange("debtLevel", v)}
                      variant="negative"
                    />
                  </div>
                )}
              </div>
            </fieldset>

            {/* Factor impact summary */}
            <FactorImpactSummary impacts={impacts} language={language} />

            {/* Methodology note */}
            <p className="text-xs text-text-muted/70 leading-relaxed pt-2 border-t border-border-subtle">
              {language === "zh"
                ? `基于美联储 SCF、OECD、ECB HFCS 与 Credit Suisse 数据。模型为：收入 × 年龄 × 教育 × 就业 × 婚姻 × 储蓄 × 资产 − 负债。目前不确定区间约为 ±${spreadPct}%。`
                : `Based on Federal Reserve SCF, OECD, ECB HFCS, and Credit Suisse data. Model: income × age × education × employment × marital × savings × assets − debts. Currently ±${spreadPct}% uncertainty.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
