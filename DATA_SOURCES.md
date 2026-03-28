# Data Sources

Every data point in **How Poor Am I?** comes from a documented, publicly accessible source. All raw data is committed to the repository in `data/raw/` for full transparency.

## Source Overview

| Source | Data | License | Update Frequency | Raw File |
|--------|------|---------|-----------------|----------|
| [WID.world](https://wid.world) | Wealth & income shares, historical time series, sub-percentile breakdown | CC-BY 4.0 | Annual | `wid-historical.json`, `wid-sub-percentile.json`, `wid-detailed-shares.json` |
| [Forbes RTB API](https://github.com/komed3/rtb-api) | Richest person per country, net worth | MIT | Daily (source), periodic (our fetch) | `billionaires.json` |
| [OECD SDMX API](https://data-explorer.oecd.org) | Average annual wages (PPP-adjusted) | OECD Terms | Annual | `purchasing-power.json` |
| [World Bank API](https://data.worldbank.org) | Consumer Price Index (CPI) | CC-BY 4.0 | Annual | `purchasing-power.json` |
| [FRED API](https://fred.stlouisfed.org) | BIS Residential Property Prices | Public domain | Quarterly | `purchasing-power.json` |

## Detailed Provenance

### WID.world — World Inequality Database

- **What**: Wealth shares (top 1%, top 10%, bottom 50%), income shares, Gini coefficients, historical time series (1900-2024)
- **API endpoint**: `rfap9nitz6.execute-api.eu-west-1.amazonaws.com/prod`
- **Variables used**:
  - `shweal_p99p100_992_j` — Top 1% wealth share
  - `shweal_p90p100_992_j` — Top 10% wealth share
  - `shweal_p0p50_992_j` — Bottom 50% wealth share
  - `shweal_p99.9p100_992_j` — Top 0.1% wealth share
  - `shweal_p99.99p100_992_j` — Top 0.01% wealth share
- **Countries**: 30 countries + Global aggregate
- **Citation**: Chancel, L., Piketty, T., Saez, E., Zucman, G. et al. World Inequality Database, https://wid.world
- **Known limitations**: Survey data may underestimate top wealth; tax haven wealth partially excluded

### Forbes Real-Time Billionaires

- **What**: Richest person per country with estimated net worth
- **Source API**: `komed3/rtb-api` (MIT license, mirrors Forbes data)
- **Transformations**: Net worth converted from millions to absolute USD
- **Known limitations**: Net worth figures are estimates based on stock prices, exchange rates, and reported assets. Values fluctuate daily.

### OECD Average Annual Wages

- **What**: Average annual wages in constant USD PPP
- **API**: OECD SDMX REST API
- **Indicator**: `AV_AN_WAGE`
- **Transformation**: Rebased to year 2000 = 100
- **Countries**: US, UK, France, Germany, Netherlands

### World Bank Consumer Price Index

- **What**: Consumer Price Index (2010 = 100 in source, rebased to 2000 = 100)
- **API**: World Bank v2 API
- **Indicator**: `FP.CPI.TOTL`
- **Transformation**: Rebased to year 2000 = 100

### FRED / BIS House Prices

- **What**: BIS Residential Property Price indices (real, CPI-deflated)
- **API**: FRED API (requires API key)
- **Series**: `QUSR628BIS` (US), `QGBR628BIS` (UK), etc.
- **Transformation**: Q1 value per year, rebased to year 2000 = 100

## Country Metadata & Tax Rates

The following data in `data/raw/` was compiled from multiple authoritative sources:

- **`country-metadata.json`**: Population (World Bank), median income (OECD/WID), median/mean wealth per adult (Credit Suisse Global Wealth Report / UBS), Gini coefficients (WID.world/SWIID)
- **`tax-rates.json`**: Effective tax rates by wealth class, compiled from OECD Tax Database, national tax authority publications, and academic studies (Saez & Zucman 2019, "The Triumph of Injustice")
- **`wealth-income-shares.json`**: WID.world distributional national accounts

## Reproducibility

To re-fetch all data from source APIs:

```bash
# Set optional API keys
export FRED_API_KEY=your_key_here

# Fetch everything
pnpm data:fetch

# Or skip specific sources
pnpm data:fetch -- --skip-billionaires --skip-economic
```

The fetch script (`scripts/fetch-all-data.mjs`) downloads all data into `data/raw/`. These JSON files are committed to the repository so the data pipeline is fully auditable.

## Last Updated

Check the `fetchedAt` timestamp in each `data/raw/*.json` file's `_meta` block for the exact fetch date.
