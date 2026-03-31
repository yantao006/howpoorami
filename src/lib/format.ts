/** Currency symbols for codes used across the dataset */
const CURRENCY_SYMBOLS: Readonly<Record<string, string>> = {
  USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$",
  GBP: "£", EUR: "€", CHF: "CHF ",
  JPY: "¥", CNY: "¥", KRW: "₩", SGD: "S$", INR: "₹",
  BRL: "R$", MXN: "MX$", CLP: "CL$", ZAR: "R",
  SEK: "kr ", NOK: "kr ", DKK: "kr ", CZK: "Kč ",
  PLN: "zł ", HUF: "Ft ",
};

export function getCurrencySymbol(currencyCode: string): string {
  return CURRENCY_SYMBOLS[currencyCode] ?? "$";
}

export function formatCurrency(
  value: number,
  currencyCode = "USD",
  compact = false
): string {
  const sym = getCurrencySymbol(currencyCode);
  if (compact) {
    if (value >= 1_000_000_000) return `${sym}${(value / 1_000_000_000).toFixed(1)}B`;
    if (value >= 1_000_000) return `${sym}${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${sym}${(value / 1_000).toFixed(0)}K`;
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${sym}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format a number of days as a human-readable duration (days or years). */
export function formatDaysAsYears(days: number): string {
  const years = Math.floor(days / 365);
  if (years >= 1000) {
    return `${formatNumber(years)} years`;
  }
  if (years >= 1) {
    return `${formatNumber(years)} year${years !== 1 ? "s" : ""}`;
  }
  return `${formatNumber(days)} day${days !== 1 ? "s" : ""}`;
}
