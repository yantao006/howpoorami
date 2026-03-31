import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDaysAsYears,
  getCurrencySymbol,
} from "@/lib/format";

// ── getCurrencySymbol ──────────────────────────────────────────────

describe("getCurrencySymbol", () => {
  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("returns the euro sign for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("\u20AC");
  });

  it("returns the pound sign for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("\u00A3");
  });

  it("falls back to $ for unknown currency codes", () => {
    expect(getCurrencySymbol("XYZ")).toBe("$");
  });
});

// ── formatCurrency ─────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formats USD with dollar sign and no decimals", () => {
    const result = formatCurrency(50000, "USD");
    expect(result).toContain("50,000");
    expect(result).toContain("$");
  });

  it("formats large numbers correctly", () => {
    const result = formatCurrency(1_234_567, "USD");
    expect(result).toContain("1,234,567");
  });

  it("formats negative numbers", () => {
    const result = formatCurrency(-5000, "USD");
    // Intl may use a minus sign or parentheses depending on locale.
    expect(result).toMatch(/-|−|\(/);
    expect(result).toContain("5,000");
  });

  it("formats zero", () => {
    const result = formatCurrency(0, "USD");
    expect(result).toContain("0");
  });

  it("uses compact notation for billions", () => {
    expect(formatCurrency(2_500_000_000, "USD", true)).toBe("$2.5B");
  });

  it("uses compact notation for millions", () => {
    expect(formatCurrency(3_700_000, "USD", true)).toBe("$3.7M");
  });

  it("uses compact notation for thousands", () => {
    expect(formatCurrency(42_000, "USD", true)).toBe("$42K");
  });

  it("formats GBP currency", () => {
    const result = formatCurrency(10000, "GBP");
    expect(result).toContain("10,000");
  });

  it("formats EUR currency", () => {
    const result = formatCurrency(10000, "EUR");
    expect(result).toContain("10,000");
  });

  it("handles unknown currency gracefully via fallback", () => {
    // Should not throw, falls back to symbol + formatted number.
    const result = formatCurrency(1000, "XYZ");
    expect(result).toContain("1,000");
  });
});

// ── formatNumber ───────────────────────────────────────────────────

describe("formatNumber", () => {
  it("adds thousands separators", () => {
    expect(formatNumber(1234567)).toBe("1,234,567");
  });

  it("does not add separators for small numbers", () => {
    expect(formatNumber(999)).toBe("999");
  });

  it("handles zero", () => {
    expect(formatNumber(0)).toBe("0");
  });

  it("handles negative numbers", () => {
    expect(formatNumber(-42000)).toBe("-42,000");
  });
});

// ── formatPercent ──────────────────────────────────────────────────

describe("formatPercent", () => {
  it("formats with default 1 decimal place", () => {
    expect(formatPercent(42.567)).toBe("42.6%");
  });

  it("formats with 0 decimal places", () => {
    expect(formatPercent(42.567, 0)).toBe("43%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.0%");
  });
});

// ── formatDaysAsYears ──────────────────────────────────────────────

describe("formatDaysAsYears", () => {
  it("formats days less than a year as days", () => {
    expect(formatDaysAsYears(30)).toBe("30 days");
  });

  it("uses singular 'day' for 1 day", () => {
    expect(formatDaysAsYears(1)).toBe("1 day");
  });

  it("formats exactly 1 year", () => {
    expect(formatDaysAsYears(365)).toBe("1 year");
  });

  it("formats multiple years", () => {
    expect(formatDaysAsYears(730)).toBe("2 years");
  });

  it("formats large year values with thousands separators", () => {
    const result = formatDaysAsYears(1000 * 365);
    expect(result).toBe("1,000 years");
  });

  it("truncates partial years (floor)", () => {
    // 400 days = 1 year + 35 days -> should show "1 year"
    expect(formatDaysAsYears(400)).toBe("1 year");
  });
});
