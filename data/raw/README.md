# Raw Data Files

This directory contains all external data used by **How Poor Am I?**, downloaded from public APIs by `scripts/fetch-all-data.mjs`.

These files are committed to the repository for transparency and reproducibility. To refresh, run:

```bash
pnpm data:fetch
```

## Files

| File | Source | Description |
|------|--------|-------------|
| `country-metadata.json` | WID.world, World Bank, Credit Suisse | Country names, flags, populations, median/mean wealth, Gini coefficients |
| `wealth-income-shares.json` | WID.world | Wealth and income distribution shares (top 1%, top 10%, middle 40%, bottom 50%) |
| `wid-historical.json` | WID.world API | Historical wealth share time series (1900-2024) |
| `wid-sub-percentile.json` | WID.world API | Raw sub-percentile data (top 0.1%, top 0.01%) |
| `wid-detailed-shares.json` | Derived from wid-sub-percentile | Six-segment breakdown for distribution charts |
| `billionaires.json` | Forbes via komed3/rtb-api (MIT) | Richest person per country with net worth |
| `tax-rates.json` | OECD Tax Database, academic studies | Effective tax rates by wealth class |
| `purchasing-power.json` | OECD, World Bank, FRED | Wages, CPI, and house prices indexed to 2000 |

## Metadata

Each file contains a `_meta` block with:
- `description` — What the data represents
- `source` — Where it came from
- `fetchedAt` — When it was downloaded
- `variables` — API variable names used (for WID files)

## See Also

- [DATA_SOURCES.md](../../DATA_SOURCES.md) — Full provenance documentation
- [METHODOLOGY.md](../../METHODOLOGY.md) — How the data is processed and displayed
