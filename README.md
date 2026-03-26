# How Poor Am I?

An interactive wealth and income inequality visualization. Enter your income or net wealth and see where you really stand in the global wealth distribution.

**Live site:** [howpoorami.org](https://howpoorami.org)

## Features

- **Wealth Percentile Calculator** -- Enter your income or net wealth and instantly see your percentile ranking within your country's wealth distribution.
- **30+ Countries** -- Covers major economies with data from authoritative sources. Auto-detects your country via geolocation.
- **Billionaire Comparison** (/compare) -- See how long it would take to earn what a billionaire has, with perspective comparisons and time context.
- **Purchasing Power Over Time** -- See how many hours of work at minimum wage it takes to afford everyday items, and how that's changed over decades.
- **Wealth Concentration** -- Visualize how wealth is distributed across population segments, from the bottom 50% to the top 0.01%.
- **Interactive Charts** -- Historical evolution (1980-2023), income share bars, tax rate comparisons, and more.
- **Dark / Light Mode** -- Toggle between themes with smooth transitions. Persists your preference and respects system settings.
- **Privacy First** -- All calculations run client-side. No data is stored or sent anywhere.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, static export)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) with CSS custom properties for theming
- **Charts:** [visx](https://airbnb.io/visx/) (low-level composable visualization primitives)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Fonts:** [Bitter](https://fonts.google.com/specimen/Bitter) (headings) + [Raleway](https://fonts.google.com/specimen/Raleway) (body) via `next/font`

## Data Sources

All data files live in `src/data/` with inline source citations:

| File | Description | Primary Sources |
|------|-------------|-----------------|
| `wealth-data.ts` | Wealth/income distribution, Gini coefficients, population for 30+ countries | [WID.world](https://wid.world), [OECD](https://www.oecd.org), [SWIID](https://fsolt.org/swiid/) |
| `billionaires.ts` | Top billionaire per country with net worth (March 2026) | [Bloomberg Billionaires Index](https://www.bloomberg.com/billionaires/), [Forbes](https://www.forbes.com/real-time-billionaires/) |
| `tax-rates.ts` | Income tax, wealth tax, capital gains, and notable policies per country | OECD Tax Database, national tax authority publications |
| `purchasing-power.ts` | Historical prices and minimum wages for US, UK, FR, DE, NL | BLS, ONS, Eurostat, national statistics offices |
| `time-comparisons.ts` | Historical time periods and cultural milestones for wealth context | Various historical references |
| `countries-extended.ts` | Country metadata: codes, names, flags, currencies, regions | ISO 3166, World Bank |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view.

## Deployment

The site is deployed on **Cloudflare Pages** (free tier):

1. Connect your GitHub repo in the [Cloudflare Dashboard](https://dash.cloudflare.com/) under **Workers & Pages > Create > Pages > Connect to Git**
2. Set build configuration:
   - **Build command:** `pnpm build`
   - **Build output directory:** `out`
   - **Node.js version:** 20+
3. Add your custom domain (`howpoorami.org`) under **Custom domains**
4. Every push to `main` triggers an automatic deploy

## Contributing

Contributions welcome! If you find inaccurate data, please open an issue with a link to the authoritative source.

## License

MIT
