# EEZ Protocol Docs

Source for [docs.eez.io](https://docs.eez.io), the specification of the EEZ core protocol contracts, built with [Vocs](https://vocs.dev).

The pages come from the [`docs/`](https://github.com/eez-association/eez-core-protocol/tree/main/docs) folder of [eez-core-protocol](https://github.com/eez-association/eez-core-protocol). To change a page, edit it there. This repo syncs it in and adds the site layout.

## Develop

```sh
npm install
npm run dev
```

## Sync from eez-core-protocol

```sh
git clone --depth 1 https://github.com/eez-association/eez-core-protocol /tmp/core
node scripts/sync-docs.mjs /tmp/core "$(git -C /tmp/core rev-parse --short HEAD)" src/pages
```

The synced commit is saved in `src/sync.json` and shown in the site banner.

## Deploy

Pushing to `main` deploys to GitHub Pages. Pull requests build the site and check its links. The build also renders a preview image for each page, used when a link is shared.
