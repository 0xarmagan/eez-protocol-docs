# EEZ Protocol Docs

[Vocs](https://vocs.dev) site for the [`docs/`](https://github.com/eez-association/eez-core-protocol/tree/main/docs) folder of `eez-core-protocol`, currently pinned to commit `143d87e`.

Live: https://0xarmagan.github.io/eez-protocol-docs/

## Develop

```sh
npm install
npm run dev
```

## Resync from upstream

```sh
git clone --depth 1 https://github.com/eez-association/eez-core-protocol /tmp/core
node scripts/sync-docs.mjs /tmp/core "$(git -C /tmp/core rev-parse --short HEAD)" src/pages
```

Then update the commit hash in `src/pages/index.mdx`. The script rewrites links between docs to site routes and points source links at GitHub, pinned to that commit.

Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
