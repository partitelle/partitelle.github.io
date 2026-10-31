# CLAUDE.md

Astro landing site for partitelle, published with GitHub Pages at https://partitelle.github.io.

## Read first
- [README.md](README.md) for the stack, scripts and CI/CD.
- [brand/BRAND.md](brand/BRAND.md) for colors, type, components and accessibility (the logo SVGs there are the source of truth).

## Rules
- Small, focused PRs. PR titles follow Conventional Commits (CI checks them).
- Before opening a PR run what CI runs: `pnpm install --frozen-lockfile`, `pnpm biome ci .`, `pnpm astro check`, `pnpm build`, `pnpm exec playwright test` (after a build) and `pnpm lhci autorun`.
- User-facing strings live in `src/i18n/it.ts`. Palette colors only; vanilla TypeScript, no UI framework.
- Keep copy and docs neutral: no reference to a specific sport or messaging platform.

## Gates
- Never push to `main`; open a PR.
- A push to `main` publishes the live site. Merging needs a maintainer's explicit OK.

Company context: if you have access to the private repo `partitelle/hq` (usually cloned at `../partitelle-hq`), read its CLAUDE.md for decisions, priorities and approval rules. This repo must stay self-contained without it.
