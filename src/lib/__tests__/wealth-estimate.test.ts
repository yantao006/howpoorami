import { describe, it, expect } from "vitest";
import {
  estimateWealthRange,
  countFilledFactors,
  computeSpreadFactor,
  DEFAULT_INCOME_FACTORS,
  MAX_FACTORS,
  type IncomeFactors,
} from "@/lib/wealth-estimate";
import { COUNTRIES, type CountryData } from "@/data/wealth-data";

// ── Helpers ────────────────────────────────────────────────────────

/** US country data used as the default test fixture. */
const US: CountryData = COUNTRIES.find((c) => c.code === "US")!;

/** Create factors with selective overrides (immutable). */
function makeFactors(overrides: Partial<IncomeFactors> = {}): IncomeFactors {
  return { ...DEFAULT_INCOME_FACTORS, ...overrides };
}

// ── estimateWealthRange ────────────────────────────────────────────

describe("estimateWealthRange", () => {
  it("produces a reasonable range for a $50k income, age 30", () => {
    const factors = makeFactors({ age: "30" });
    const range = estimateWealthRange(50_000, US, factors);

    expect(range.low).toBeLessThan(range.mid);
    expect(range.mid).toBeLessThan(range.high);
    expect(range.mid).toBeGreaterThan(0);
    // A 30-year-old earning median US income should have wealth in
    // the tens-of-thousands to low hundreds-of-thousands range.
    expect(range.mid).toBeGreaterThan(10_000);
    expect(range.mid).toBeLessThan(1_000_000);
  });

  it("returns a range near zero for zero income with default factors", () => {
    const factors = makeFactors({ age: "30" });
    const range = estimateWealthRange(0, US, factors);

    expect(range.mid).toBe(0);
    expect(range.low).toBe(0);
    expect(range.high).toBe(0);
  });

  it("produces a higher range for $1M income than for $50k", () => {
    const factors = makeFactors({ age: "40" });
    const lowIncome = estimateWealthRange(50_000, US, factors);
    const highIncome = estimateWealthRange(1_000_000, US, factors);

    expect(highIncome.mid).toBeGreaterThan(lowIncome.mid);
    expect(highIncome.high).toBeGreaterThan(lowIncome.high);
  });

  it("applies age bracket multipliers correctly", () => {
    const young = makeFactors({ age: "22" });
    const mid = makeFactors({ age: "45" });
    const senior = makeFactors({ age: "65" });

    const youngRange = estimateWealthRange(50_000, US, young);
    const midRange = estimateWealthRange(50_000, US, mid);
    const seniorRange = estimateWealthRange(50_000, US, senior);

    // Older age brackets should produce higher wealth estimates.
    expect(midRange.mid).toBeGreaterThan(youngRange.mid);
    expect(seniorRange.mid).toBeGreaterThan(midRange.mid);
  });

  it("uses default age multiplier when age is empty", () => {
    const noAge = makeFactors({});
    const range = estimateWealthRange(50_000, US, noAge);

    // Default multiplier is 2.0 (same as 35-39 bracket).
    const withAge35 = makeFactors({ age: "35" });
    const ageRange = estimateWealthRange(50_000, US, withAge35);

    expect(range.mid).toBe(ageRange.mid);
  });

  it("adds property value as addon when property is owned with value", () => {
    const withProperty = makeFactors({
      age: "40",
      hasProperty: true,
      propertyValue: "300000",
    });
    const withoutProperty = makeFactors({ age: "40" });

    const withPropRange = estimateWealthRange(50_000, US, withProperty);
    const noPropRange = estimateWealthRange(50_000, US, withoutProperty);

    expect(withPropRange.mid).toBeGreaterThan(noPropRange.mid);
  });

  it("subtracts mortgage from wealth estimate", () => {
    const propertyOnly = makeFactors({
      age: "40",
      hasProperty: true,
      propertyValue: "400000",
    });
    const withMortgage = makeFactors({
      age: "40",
      hasProperty: true,
      propertyValue: "400000",
      hasMortgage: true,
      mortgageRemaining: "250000",
    });

    const propRange = estimateWealthRange(50_000, US, propertyOnly);
    const mortRange = estimateWealthRange(50_000, US, withMortgage);

    expect(mortRange.mid).toBeLessThan(propRange.mid);
  });

  it("handles debt levels reducing wealth", () => {
    const noDebt = makeFactors({ age: "35" });
    const highDebt = makeFactors({
      age: "35",
      hasDebts: true,
      debtLevel: "high",
    });

    const noDebtRange = estimateWealthRange(50_000, US, noDebt);
    const debtRange = estimateWealthRange(50_000, US, highDebt);

    expect(debtRange.mid).toBeLessThan(noDebtRange.mid);
  });

  it("always has low <= mid <= high", () => {
    const scenarios: Array<{ income: number; factors: IncomeFactors }> = [
      { income: 0, factors: makeFactors({ age: "25" }) },
      { income: 25_000, factors: makeFactors({ age: "22", hasDebts: true, debtLevel: "very_high" }) },
      { income: 500_000, factors: makeFactors({ age: "55", hasProperty: true, propertyValue: "1000000" }) },
      { income: 100_000, factors: makeFactors({}) },
    ];

    for (const { income, factors } of scenarios) {
      const range = estimateWealthRange(income, US, factors);
      expect(range.low).toBeLessThanOrEqual(range.mid);
      expect(range.mid).toBeLessThanOrEqual(range.high);
    }
  });
});

// ── countFilledFactors ─────────────────────────────────────────────

describe("countFilledFactors", () => {
  it("returns 0 for default (empty) factors", () => {
    expect(countFilledFactors(DEFAULT_INCOME_FACTORS)).toBe(0);
  });

  it("counts age when provided", () => {
    const factors = makeFactors({ age: "30" });
    expect(countFilledFactors(factors)).toBe(1);
  });

  it("does not count value keys when their boolean toggle is false", () => {
    // propertyValue alone without hasProperty=true should not count.
    const factors = makeFactors({ propertyValue: "200000" });
    expect(countFilledFactors(factors)).toBe(0);
  });

  it("counts value key when boolean toggle is true and value is provided", () => {
    const factors = makeFactors({
      hasProperty: true,
      propertyValue: "200000",
    });
    // Only propertyValue is tracked (hasProperty is not a separate factor).
    expect(countFilledFactors(factors)).toBe(1);
  });

  it("counts hasInheritance as filled when true (no associated value needed)", () => {
    const factors = makeFactors({ hasInheritance: true });
    expect(countFilledFactors(factors)).toBe(1);
  });

  it("never exceeds MAX_FACTORS", () => {
    const allFilled = makeFactors({
      age: "40",
      householdSize: "3",
      hasProperty: true,
      propertyValue: "500000",
      hasMortgage: true,
      mortgageRemaining: "200000",
      hasDebts: true,
      debtLevel: "low",
      savingsRate: "high",
      hasInvestments: true,
      investmentValue: "100000",
      hasRetirement: true,
      retirementValue: "300000",
      hasInheritance: true,
      yearsWorked: "15",
      educationLevel: "bachelor",
      employmentType: "full_time",
      maritalStatus: "married",
    });
    expect(countFilledFactors(allFilled)).toBeLessThanOrEqual(MAX_FACTORS);
  });
});

// ── computeSpreadFactor ────────────────────────────────────────────

describe("computeSpreadFactor", () => {
  it("returns max spread (0.70) when no factors are filled", () => {
    expect(computeSpreadFactor(DEFAULT_INCOME_FACTORS)).toBe(0.7);
  });

  it("returns min spread (0.10) when all factors are filled", () => {
    const allFilled = makeFactors({
      age: "40",
      householdSize: "3",
      hasProperty: true,
      propertyValue: "500000",
      hasMortgage: true,
      mortgageRemaining: "200000",
      hasDebts: true,
      debtLevel: "low",
      savingsRate: "high",
      hasInvestments: true,
      investmentValue: "100000",
      hasRetirement: true,
      retirementValue: "300000",
      hasInheritance: true,
      yearsWorked: "15",
      educationLevel: "bachelor",
      employmentType: "full_time",
      maritalStatus: "married",
    });
    expect(computeSpreadFactor(allFilled)).toBeCloseTo(0.1, 1);
  });

  it("decreases as more factors are provided", () => {
    const none = computeSpreadFactor(DEFAULT_INCOME_FACTORS);
    const some = computeSpreadFactor(makeFactors({ age: "30", hasInheritance: true }));
    const more = computeSpreadFactor(
      makeFactors({
        age: "30",
        hasInheritance: true,
        educationLevel: "bachelor",
        employmentType: "full_time",
        maritalStatus: "married",
      }),
    );

    expect(none).toBeGreaterThan(some);
    expect(some).toBeGreaterThan(more);
  });

  it("always returns a value between 0.10 and 0.70", () => {
    const spread = computeSpreadFactor(makeFactors({ age: "25" }));
    expect(spread).toBeGreaterThanOrEqual(0.1);
    expect(spread).toBeLessThanOrEqual(0.7);
  });
});
