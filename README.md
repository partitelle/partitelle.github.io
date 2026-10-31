# partitelle.github.io

Landing site for **partitelle**, a project that helps friends organize casual team games: it collects who is in, keeps the list updated and builds the teams. Published with GitHub Pages at <https://partitelle.com>; the old <https://partitelle.github.io> address redirects there.

## Stack

- [Astro](https://astro.build) (static output) with strict TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4, CSS-first (`@theme` in `src/styles/global.css`), palette colors only
- Outfit, self-hosted through [Fontsource](https://fontsource.org) (no third-party font requests)
- [Biome](https://biomejs.dev) for lint and format, `astro check` for types
- [Vitest](https://vitest.dev) for unit tests, [Playwright](https://playwright.dev) + axe-core for e2e and accessibility, [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) for budgets
- pnpm (via corepack), Node 24 (`.nvmrc`)
- No UI framework: vanilla TypeScript only, where JS is needed

## Develop

```sh
corepack enable
pnpm i
pnpm dev
```

## Scripts

| Script           | What it does                                                            |
| ---------------- | ----------------------------------------------------------------------- |
| `pnpm dev`       | Astro dev server                                                        |
| `pnpm build`     | Static build into `dist/`                                               |
| `pnpm preview`   | Serve `dist/`                                                           |
| `pnpm check`     | `astro check` (types)                                                   |
| `pnpm lint`      | `biome ci .`                                                            |
| `pnpm format`    | Format with Biome                                                       |
| `pnpm test:unit` | Vitest unit tests (`src/**/*.test.ts`)                                  |
| `pnpm test:e2e`  | Playwright tests against the built site (run `pnpm build` first)        |
| `pnpm lhci`      | Lighthouse CI on `dist/` (needs Chrome; set `CHROME_PATH` if not found) |

## CI/CD

- `.github/workflows/ci.yml` runs on pull requests and pushes to `main`: `lint` (Biome + astro check), `unit-test` (Vitest), `build` (uploads `dist`), `e2e` (needs `build`; uploads report and screenshots), `lighthouse` (needs `build`) and `semantic-pr-title` (pull requests only).
- `.github/workflows/deploy.yml` builds and deploys to GitHub Pages on every push to `main` (and manually), then runs a smoke test on the live URL. The custom domain `partitelle.com` is set in the repository Pages settings, not with a `CNAME` file: with an Actions-based deploy a `CNAME` file is ignored.
- Third-party actions are pinned to commit SHAs; Dependabot updates npm and actions weekly, grouping minor and patch bumps.

## Brand

Brand tokens (colors, type) and motion variables live in `src/styles/global.css`. The logo SVGs the site serves live in `public/brand/` and `public/favicon.svg`; `brand/` keeps the app icons, the yellow logo mark and `og-image.svg`, the source of `public/og-image.png`. All user-facing strings live in `src/i18n/it.ts`.

## License

This repository has no open-source license: see [NOTICE](NOTICE) for the code and the content, and [TRADEMARKS.md](TRADEMARKS.md) for the name and the marks.
