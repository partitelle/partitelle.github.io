# CLAUDE.md

Astro landing site for partitelle, published with GitHub Pages at https://partitelle.github.io.

## Read first

- [README.md](README.md) for the stack, scripts and CI/CD.
- Brand tokens (colors, type) live in the CSS custom properties in `src/styles/global.css`; the motion rules (durations, easing, reduced motion) are CSS variables in the same file. The logo SVGs the site serves are in `public/brand/`.

## Rules

- Small, focused PRs. PR titles follow Conventional Commits (CI checks them).
- Before opening a PR run what CI runs: `pnpm install --frozen-lockfile`, `pnpm biome ci .`, `pnpm astro check`, `pnpm build`, `pnpm exec playwright test` (after a build) and `pnpm lhci autorun`.
- User-facing strings live in `src/i18n/it.ts`. Palette colors only; vanilla TypeScript, no UI framework.
- Keep copy and docs neutral: no reference to a specific sport or messaging platform.

## Gates

- Never push to `main`; open a PR.
- A push to `main` publishes the live site. Merging needs a maintainer's explicit OK.

Company context: if you have access to the private repo `partitelle/hq` (usually cloned at `../partitelle-hq`), read its CLAUDE.md for decisions, priorities and approval rules. The full brand guide is there at `departments/design-brand/brand/BRAND.md` (optional: this repo must stay self-contained without it).
