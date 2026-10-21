# EEZ Protocol Docs

[Vocs](https://vocs.dev) site for the [`docs/`](https://github.com/eez-association/eez-core-protocol/tree/main/docs) folder of `eez-core-protocol`. The pinned commit lives in `src/sync.json` and shows in the site banner.

Live: https://docs.eez.io/

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

The script rewrites links between docs to site routes, points source links at GitHub pinned to that commit, and writes the commit to `src/sync.json`. It also converts upstream Markdown to Vocs components (callouts, steps, code titles) and drops hand-written tables of contents; upstream stays plain Markdown. Sequential flows to render as steps are listed in `STEPS`; a `STEPS MISSING` line in the output means upstream text moved.

## Link previews

`npm run build` first renders one 1200×630 preview image per page into `public/og/` (`scripts/og/build.mjs`, styled per the EEZ DESIGN.md, fonts vendored in `scripts/og/fonts/` under the OFL). Each image uses the page title, the page `description` (set in `DESCRIPTIONS` in the sync script) and its sidebar section. Run `npm run og` to regenerate them alone.

Pull requests build the site and check its generated asset, navigation, canonical and preview-image URLs. Pushing to `main` deploys to GitHub Pages via `.github/workflows/deploy.yml`.
