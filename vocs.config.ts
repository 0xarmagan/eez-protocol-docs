import { readFileSync } from 'node:fs'
import { defineConfig } from 'vocs/config'

// Written by scripts/sync-docs.mjs.
const { commit } = JSON.parse(readFileSync('src/sync.json', 'utf8'))
const core = 'https://github.com/eez-association/eez-core-protocol'

export default defineConfig({
  title: 'EEZ Protocol Documents',
  baseUrl: 'https://docs.eez.io',
  renderStrategy: 'full-static',
  head: { base: false },
  colorScheme: 'dark',
  accentColor: '#3BE57E',
  logoUrl: '/logo.svg',
  iconUrl: '/favicon.svg',
  description: 'Specifications for the EEZ core protocol contracts.',
  banner: {
    content: `Synced from eez-core-protocol at commit ${commit}`,
    href: `${core}/tree/${commit}/docs`,
    variant: 'info',
    dismissable: false,
  },
  topNav: [
    { text: 'Docs', link: '/' },
    { text: 'EEZ Demos', link: 'https://eez-demos.vercel.app', external: true },
    { text: 'eez.dev', link: 'https://eez.dev', external: true },
  ],
  // Serialized with toString, so it must stay self-contained. Synced pages map back
  // to upstream `docs/` names (blobs/blob-format-spec.md → blobs/BLOB_FORMAT_SPEC.md).
  editLink: {
    text: 'Suggest changes to this page',
    link: (filePath) =>
      filePath.endsWith('.mdx')
        ? `https://github.com/eez-association/eez-protocol-docs/edit/main/src/pages/${filePath}`
        : `https://github.com/eez-association/eez-core-protocol/edit/main/docs/${filePath.replace(
            /[^/]+(?=\.md$)/,
            (name) => name.toUpperCase().replace(/-/g, '_'),
          )}`,
  },
  // Images come from scripts/og/build.mjs (GitHub Pages can't serve Vocs' dynamic /api/og).
  ogImageUrl: (path, { baseUrl }) =>
    `${baseUrl}/og/${path.replace(/^\/$/, '/index').slice(1)}.png`,
  socials: [
    { icon: 'github', link: 'https://github.com/eez-association/eez-core-protocol' },
  ],
  sidebar: [
    { text: 'Introduction', link: '/' },
    { text: 'Walkthrough', link: '/eez-walkthrough' },
    {
      text: 'Specification',
      items: [
        { text: 'Core protocol', link: '/core-protocol-spec' },
        { text: 'Execution entries', link: '/execution-entry-spec' },
        { text: 'Static entries', link: '/static-entry' },
        { text: 'Multi-prover', link: '/multi-prover-spec' },
        { text: 'Events and reconstruction', link: '/events' },
      ],
    },
    {
      text: 'Limits and boundaries',
      items: [
        { text: 'Call-pattern limits', link: '/call-pattern-limits' },
        { text: 'Caveats', link: '/caveats' },
        { text: 'Integration boundaries', link: '/integration-boundaries' },
      ],
    },
    {
      text: 'Blobs',
      items: [
        { text: 'Message format', link: '/blobs/blob-format-spec' },
        { text: 'U256 compressed codec', link: '/blobs/u256-compressed-codec' },
        { text: 'Future optimizations', link: '/blobs/future-optimizations' },
      ],
    },
  ],
})
