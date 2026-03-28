# Methodology

This document explains how **How Poor Am I?** calculates percentiles, processes data, and what assumptions are made.

## Percentile Calculation

When you enter your net wealth, the tool estimates your position in the national wealth distribution using **piecewise linear interpolation** across six segments:

| Segment | Population share |
|---------|-----------------|
| Bottom 50% | 50% |
| Middle 40% | 40% |
| Next 9% (top 10-1%) | 9% |
| Top 1-0.1% | 0.9% |
| Top 0.1-0.01% | 0.09% |
| Top 0.01% | 0.01% |

For each segment, the **average wealth per adult** is computed from:
- Total national wealth = mean wealth per adult x adult population
- Segment wealth = total wealth x segment's wealth share
- Segment average = segment wealth / segment population

Your wealth is compared against these thresholds to estimate your percentile.

### Limitations

- This is a **continuous approximation** of a discrete distribution. Within each segment, wealth is assumed to be uniformly distributed (which it is not).
- Wealth data reflects **net worth** (assets minus debts). Negative net worth is possible and real.
- The sub-percentile breakdown (within the top 1%) uses WID.world data where available, and estimated ratios (55/28/17 split) where not.

## Income-to-Wealth Estimation

When users enter income instead of wealth, an approximate conversion is applied using wealth-to-income multipliers derived from the [Federal Reserve Survey of Consumer Finances](https://www.federalreserve.gov/econres/scfindex.htm):

| Income range | Multiplier |
|-------------|-----------|
| < $20K | 0.5x |
| $20K-$50K | 2x |
| $50K-$100K | 4x |
| $100K-$250K | 7x |
| > $250K | 15x |

These are broad approximations. Actual wealth varies enormously by age, debt, housing market, savings behavior, and inheritance.

## Currency Conversion

All wealth shares are expressed as percentages of national wealth. When comparing across countries, no PPP adjustment is needed since shares are relative. For the "Global" view, all figures use nominal USD.

## Historical Data

Historical wealth share time series come from WID.world's distributional national accounts. Data points are selected at target years (1900, 1910, ... 2023) with a ±2 year tolerance for nearby matches. All three series (top 1%, top 10%, bottom 50%) are aligned to common years before display.

## Data Freshness

- **WID.world data**: Updated annually. Our data reflects the most recent available year per country (typically 2022-2024).
- **Forbes billionaires**: Snapshot at time of last `pnpm data:fetch` run. Billionaire wealth fluctuates daily.
- **OECD wages**: Annual data with ~1-2 year lag.
- **World Bank CPI**: Annual data with ~1 year lag.
- **FRED house prices**: Quarterly data, using Q1 values per year.

## What "Net Worth" Includes

Following WID.world's definition:
- **Assets**: Real estate, financial assets (stocks, bonds, savings), business equity, pensions, and other assets
- **Minus debts**: Mortgages, student loans, credit card debt, other liabilities
- **Excludes**: Human capital, future earnings potential, government transfers

This means the bottom 50% can have negative net worth (more debt than assets), which is real and reflected in the data.
