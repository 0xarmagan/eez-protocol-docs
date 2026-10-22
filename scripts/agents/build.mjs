// Agent-facing files, written into the built site after `vocs build`:
// - /<page>.md for every page (Vocs only emits /assets/md/<page>.md; its .md router
//   needs a server, and GitHub Pages is static)
// - /SKILL.md and /.well-known/skills/ (for `npx skills add https://docs.eez.io`)
// The page table comes from the sidebar and each page's description, so it can't drift.
import fs from 'node:fs'
import path from 'node:path'
import config from '../../vocs.config.ts'

const site = 'https://docs.eez.io'
const repo = 'https://github.com/eez-association/eez-core-protocol'
const out = 'dist/public'
const { commit } = JSON.parse(fs.readFileSync('src/sync.json', 'utf8'))

// Hand-written routing for common jobs. Every link must be a sidebar page.
const TASKS = [
  ['Get oriented on how one cross-rollup call works', ['/eez-walkthrough']],
  ['Build execution entries for L1 `postAndVerifyBatch` or L2 `loadExecutionTable` / `executeIncomingCrossChainCall`', ['/execution-entry-spec', '/core-protocol-spec']],
  ['Compute or check call hashes and rolling hashes', ['/core-protocol-spec']],
  ['Handle a read-only cross-chain call (STATICCALL) or a reverting reentrant call', ['/static-entry']],
  ['Check whether a call pattern is supported today', ['/call-pattern-limits', '/caveats']],
  ['Configure proof systems, verification keys or the threshold for a rollup', ['/multi-prover-spec']],
  ['Index events or reconstruct execution from receipts', ['/events']],
  ['Find what a builder, prover or operator must provide outside the contracts', ['/integration-boundaries']],
  ['Encode or decode the blob message stream', ['/blobs/blob-format-spec', '/blobs/u256-compressed-codec']],
]

const description = (file) => {
  const fm = fs.readFileSync(file, 'utf8').match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
  const v = fm.match(/^description:\s*(.+)$/m)?.[1]
  return v?.startsWith('"') ? JSON.parse(v) : v
}
const source = (link) =>
  ['.md', '.mdx', '/index.mdx'].map((ext) => `src/pages${link === '/' ? '/index' : link}${ext}`).find((f) => fs.existsSync(f))

// Synced spec pages from the sidebar. Local .mdx pages (home, Build with AI) are site
// chrome: Vocs emits no Markdown for them, and they hold no protocol content.
const pages = []
for (const item of config.sidebar) {
  for (const p of item.items ?? [item]) {
    const file = source(p.link)
    if (!file) throw new Error(`agents: no source for ${p.link}`)
    if (file.endsWith('.mdx')) continue
    pages.push({ section: item.items ? item.text : '', text: p.text, link: p.link, description: description(file) })
  }
}
const byLink = new Map(pages.map((p) => [p.link, p]))
const md = (link) => `${site}${link}.md`

// 1. Markdown copies at /<page>.md.
let copied = 0
for (const p of pages) {
  const from = path.join(out, 'assets/md', `${p.link}.md`)
  if (!fs.existsSync(from)) throw new Error(`agents: Vocs emitted no Markdown for ${p.link}`)
  fs.mkdirSync(path.dirname(path.join(out, `${p.link}.md`)), { recursive: true })
  fs.copyFileSync(from, path.join(out, `${p.link}.md`))
  copied++
}

// 2. SKILL.md.
const pageTable = [
  '| Page | What it covers |',
  '| --- | --- |',
  ...pages.map((p) => `| [${p.section ? `${p.section}: ` : ''}${p.text}](${md(p.link)}) | ${p.description ?? ''} |`),
].join('\n')
const taskTable = [
  '| Task | Read |',
  '| --- | --- |',
  ...TASKS.map(([task, links]) => {
    const refs = links.map((l) => {
      const p = byLink.get(l)
      if (!p) throw new Error(`agents: task links ${l}, which is not a sidebar page`)
      return `[${p.text}](${md(l)})`
    })
    return `| ${task} | ${refs.join(', ')} |`
  }),
].join('\n')
const skill = fs
  .readFileSync('scripts/agents/SKILL.template.md', 'utf8')
  .replace('{{PAGES}}', pageTable)
  .replace('{{TASKS}}', taskTable)
  .replaceAll('{{REPO}}', repo)
  .replaceAll('{{COMMIT}}', commit)
if (/\{\{\w+\}\}/.test(skill)) throw new Error('agents: unfilled placeholder in SKILL.md')
const name = skill.match(/^name:\s*(\S+)$/m)[1]
const skillDescription = skill.match(/^description:\s*(.+)$/m)[1]

fs.writeFileSync(path.join(out, 'SKILL.md'), skill)
// Discovery index read by the `skills` CLI (well-known v1 layout: <dir>/<name>/SKILL.md).
const wellKnown = path.join(out, '.well-known/skills')
fs.mkdirSync(path.join(wellKnown, name), { recursive: true })
fs.writeFileSync(path.join(wellKnown, name, 'SKILL.md'), skill)
fs.writeFileSync(
  path.join(wellKnown, 'index.json'),
  JSON.stringify({ skills: [{ name, description: skillDescription, files: ['SKILL.md'] }] }, null, 2) + '\n',
)

console.log(`agents: ${copied} .md copies, SKILL.md (${pages.length} pages, ${TASKS.length} tasks, ${commit})`)
