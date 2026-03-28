# Contributing

Thanks for your interest in contributing to **How Poor Am I?** This project aims to make wealth inequality data accessible, transparent, and reproducible.

## Ways to Contribute

### Report a Data Error

If you find inaccurate data, please [open an issue](https://github.com/yrunhaar/howpoorami/issues/new) with:
- Which country/data point is wrong
- What the correct value should be
- A link to the authoritative source

### Add a New Country

1. Add the country's metadata to `data/raw/country-metadata.json`
2. Add wealth/income shares to `data/raw/wealth-income-shares.json`
3. Add the country code to the `ALL_COUNTRIES` array in `scripts/fetch-all-data.mjs`
4. Run `pnpm data:fetch` to pull WID.world and billionaire data
5. Verify the build passes: `pnpm build`

### Add a New Data Source

1. Document the source in `DATA_SOURCES.md`
2. Add the fetch logic to `scripts/fetch-all-data.mjs`
3. Save raw output to `data/raw/`
4. Create or update the TypeScript wrapper in `src/data/`

### Fix a Bug or Add a Feature

1. Fork the repo and create a branch
2. Make your changes
3. Verify: `pnpm lint && pnpm build`
4. Open a pull request with a clear description

## Development Setup

```bash
git clone https://github.com/yrunhaar/howpoorami.git
cd howpoorami
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Data Pipeline

```
pnpm data:fetch          # Download from APIs → data/raw/*.json
pnpm build               # TypeScript files import JSON → static HTML
```

The TypeScript files in `src/data/` contain **only logic** (imports + transforms). All actual data lives in `data/raw/*.json`. See [DATA_SOURCES.md](DATA_SOURCES.md) for full provenance.

## Code Style

- TypeScript strict mode
- Immutable patterns (readonly props, no mutation)
- Tailwind CSS v4 for styling
- Files under 400 lines preferred

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
