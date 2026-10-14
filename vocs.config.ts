import { defineConfig } from 'vocs/config'

export default defineConfig({
  title: 'EEZ Docs',
  basePath: '/eez-protocol-docs',
  baseUrl: 'https://0xarmagan.github.io/eez-protocol-docs',
  renderStrategy: 'full-static',
  colorScheme: 'dark',
  accentColor: '#3BE57E',
  logoUrl: '/eez-protocol-docs/logo.svg',
  iconUrl: '/eez-protocol-docs/favicon.svg',
  description: 'Specifications for the EEZ core protocol contracts.',
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
