# How Poor Am I?

> An interactive wealth inequality visualizer. Enter your income or net wealth and discover where you really stand — globally and in 30+ countries.

**[Live Demo: howpoorami.org](https://howpoorami.org)**

## What It Does

- **Wealth Percentile Calculator** — Enter your income or net wealth and see your percentile ranking (top X%) with sub-percentile precision up to 99.99%
- **30+ Countries** — US, UK, France, Germany, Netherlands, Japan, China, India, Brazil, and 21 more. Auto-detects your country via geolocation
- **Wealth Concentration** — See how the top 0.01% compares to the bottom 50% with area-proportional rectangles
- **Historical Evolution** — Stacked area charts showing how wealth concentration changed from 1900 to 2024, with policy event markers
- **Tax Regressivity** — Effective tax rates by wealth class reveal who really pays (and who doesn't)
- **Purchasing Power** — Wages vs. CPI vs. house prices indexed to 2000 — see where the gap opened
- **Billionaire Comparison** — How long would it take you to earn what the richest person in your country has?
- **Privacy First** — All calculations run client-side. No data is stored or sent anywhere.

## Data Pipeline

All data comes from public, authoritative APIs. No hardcoded values — TypeScript files import raw JSON and transform it at build time.

```
pnpm data:fetch                  # Download from APIs → data/raw/*.json
pnpm build                       # TS imports JSON → transforms → static HTML
```

| Source | Data | Raw File |
|--------|------|----------|
| [WID.world](https://wid.world) | Wealth shares, income shares, historical series, Gini | `data/raw/wid-*.json` |
| [Forbes RTB](https://github.com/komed3/rtb-api) | Billionaires per country | `data/raw/billionaires.json` |
| [OECD](https://data-explorer.oecd.org) | Average wages (PPP) | `data/raw/purchasing-power.json` |
| [World Bank](https://data.worldbank.org) | Consumer Price Index | `data/raw/purchasing-power.json` |
| [FRED](https://fred.stlouisfed.org) | House price indices | `data/raw/purchasing-power.json` |

See [DATA_SOURCES.md](DATA_SOURCES.md) for full provenance and [METHODOLOGY.md](METHODOLOGY.md) for calculation details.

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

To refresh external data:

```bash
pnpm data:fetch               # Fetch all sources
pnpm data:fetch --skip-wid    # Skip WID.world (slow)
pnpm build                    # Rebuild with new data
```

## Tech Stack

- **[Next.js 16](https://nextjs.org/)** — App Router, static export (`output: "export"`)
- **TypeScript** — Strict mode
- **[Tailwind CSS v4](https://tailwindcss.com/)** — CSS custom properties for dark/light theming
- **[visx](https://airbnb.io/visx/)** — Low-level composable SVG chart primitives
- **[Framer Motion](https://www.framer.com/motion/)** — Scroll-triggered animations

## Deployment

Deployed on **Cloudflare Pages** (free tier):

1. Connect GitHub repo in Cloudflare Dashboard
2. Build command: `pnpm build` / Output directory: `out`
3. Every push to `main` auto-deploys

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Data corrections, new countries, and bug fixes are all welcome.

## Citation

If you use this tool or its data pipeline in your work:

```
How Poor Am I? — Wealth Inequality Visualizer
https://howpoorami.org
Data: WID.world, OECD, World Bank, Forbes, FRED
```

See [CITATION.cff](CITATION.cff) for machine-readable citation.

## License

MIT
