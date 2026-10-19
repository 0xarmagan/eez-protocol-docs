// Usage: node scripts/sync-docs.mjs <core-repo-dir> <commit> <eez-docs/src/pages>
import fs from 'node:fs'
import path from 'node:path'

const [repo, commit, out] = process.argv.slice(2)
const GH = `https://github.com/eez-association/eez-core-protocol`
const docsDir = path.join(repo, 'docs')

const slug = (rel) =>
  '/' + rel.replace(/\.md$/, '').split('/').map((s) => s.toLowerCase().replace(/_/g, '-')).join('/')

const files = []
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.md')) files.push(path.relative(docsDir, p))
  }
}
walk(docsDir)

// Vocs-native rewrites. Upstream stays plain Markdown, so GitHub renders it unchanged.
const FENCE = /^(\s*)(`{3,}|~{3,})(.*)$/
const report = []

// Sequential flows rendered as ::::steps. `after` introduces an ordered list;
// `from` starts a run of `count` bold-led paragraphs.
const STEPS = {
  'EEZ_WALKTHROUGH.md': [
    { from: '**Preparation.**', count: 4 },
    { after: '`postAndVerifyBatch` then follows this sequence:' },
  ],
  'CORE_PROTOCOL_SPEC.md': [{ after: '**State transitions** (in order' }],
}

// Per-page descriptions for search and link previews (meta description, og:description,
// preview image). Hand-written from each page's intro, because first paragraphs often
// open with a date or a cross-reference.
const DESCRIPTIONS = {
  'EEZ_WALKTHROUGH.md':
    'Follow one call through preparation, proof verification and local execution, then tables, hashes, rollback, ETH accounting and system authority.',
  'CORE_PROTOCOL_SPEC.md':
    'How the EEZ contracts post, verify and execute cross-chain entries: data model, core functions, call and rolling hashes, entry lifecycle, invariants.',
  'EXECUTION_ENTRY_SPEC.md':
    'How to build execution entries for L1 (postAndVerifyBatch) and L2 (loadExecutionTable / executeIncomingCrossChainCall).',
  'STATIC_ENTRY.md':
    'Read-only cross-chain calls (STATICCALLs) and the resolution of reverting mutable reentrant calls: routing, position keys, resolution and root pins.',
  'MULTI_PROVER_SPEC.md':
    "EEZ verifies batches with multiple proof systems. Each rollup's manager defines its accepted verifiers, verification keys and threshold.",
  'EVENTS.md':
    'Event signatures, ordering, rollback behavior and reconstruction from committed receipts and execution inputs, for the current contracts.',
  'CALL_PATTERN_LIMITS.md':
    'Which call patterns the current tables support, and where CALL, STATICCALL and revert traces lack a faithful table encoding or exceed retry budgets.',
  'CAVEATS.md':
    'Caveats of the current contracts: calling through cross-chain proxies, delivery and execution semantics, deployment and trust assumptions, edge cases.',
  'INTEGRATION_BOUNDARIES.md':
    'Support limits and external obligations outside the contracts: builder and prover, L2 funding, deployment and proof domains, event consumers.',
  'blobs/BLOB_FORMAT_SPEC.md':
    'A binary format for publishing rollup activity as one stream of messages: operations, cross-rollup calls, results, reverts and transaction boundaries.',
  'blobs/U256_COMPRESSED_CODEC.md':
    'A self-describing, byte-oriented variable-length codec for any 256-bit EVM word, with a literal form and a scientific (mantissa × base^exp) form.',
  'blobs/FUTURE_OPTIMIZATIONS.md':
    'Deferred size optimizations for the blob message format: compressed rollup ids, compressed u256 values and dense blob packing.',
}

// Sets `description` in the page frontmatter, replacing any upstream value.
function withDescription(src, rel) {
  const text = DESCRIPTIONS[rel]
  if (!text) { report.push(`DESCRIPTION MISSING ${rel}`); return src }
  const line = `description: ${JSON.stringify(text)}`
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/)
  if (!fm) return `---\n${line}\n---\n\n${src}`
  const body = fm[1].split('\n').filter((l) => !l.startsWith('description:'))
  return `---\n${[...body, line].join('\n')}\n---\n${src.slice(fm[0].length)}`
}

const isAnchorItem = (l) => /^\s*[-*] \[[^\]]+\]\(#[^)\s]+\)\s*$/.test(l)

// Vocs renders its own outline, so drop hand-written tables of contents.
function dropToc(lines, rel) {
  const out = []
  let inSection = false
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const tocHeading = /^##\s+Table of Contents\s*$/i.test(l)
    let run = 0
    while (!tocHeading && !inSection && isAnchorItem(lines[i + run] ?? '')) run++
    if (tocHeading || run >= 3) {
      i += tocHeading ? 1 : run
      while (i < lines.length && (isAnchorItem(lines[i]) || lines[i].trim() === '')) i++
      i--
      report.push(`TOC ${rel}`)
      continue
    }
    if (/^## /.test(l)) inSection = true
    // Removing a TOC can leave two thematic breaks back to back.
    const prev = out.findLast((o) => o.trim() !== '')
    if (l.trim() === '---' && prev?.trim() === '---') continue
    out.push(l)
  }
  return out
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

// `(a (b) c): rest` → `a (b) c: rest`, so a bold lead's parenthetical reads as body text.
function unwrapParen(body) {
  if (!body.startsWith('(')) return body
  let depth = 0
  for (let i = 0; i < body.length; i++) {
    depth += body[i] === '(' ? 1 : body[i] === ')' ? -1 : 0
    if (depth === 0) return body.slice(1, i) + body.slice(i + 1)
  }
  return body
}

const ALERT = { NOTE: 'note', TIP: 'tip', IMPORTANT: 'info', WARNING: 'warning', CAUTION: 'danger' }
const calloutKind = (lead) =>
  /^note\b/i.test(lead) ? 'note' : /\b(reserved|invalid|must|never)\b/i.test(lead) ? 'warning' : 'info'

// `> **Lead.** …` blockquotes, GitHub `> [!NOTE]` alerts and `Note: …` paragraphs become callouts.
function callouts(lines, rel) {
  const out = []
  let inFence = false
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (FENCE.test(l)) inFence = !inFence
    if (inFence) { out.push(l); continue }
    if (/^>/.test(l)) {
      const body = []
      while (i < lines.length && /^>/.test(lines[i])) body.push(lines[i++].replace(/^> ?/, ''))
      i--
      const alert = body[0].match(/^\[!(\w+)\]\s*$/)
      const kind = alert ? ALERT[alert[1].toUpperCase()] : /^\*\*/.test(body[0]) && calloutKind(body[0].replace(/\*\*/g, ''))
      if (!kind) { out.push(...body.map((b) => `> ${b}`.trimEnd())); continue }
      out.push(`:::${kind}`, ...(alert ? body.slice(1) : body), ':::')
      report.push(`CALLOUT ${kind} ${rel}`)
      continue
    }
    if (/^Note:\s/.test(l) && (lines[i - 1] ?? '').trim() === '') {
      const para = [capitalize(l.replace(/^Note:\s+/, ''))]
      while ((lines[i + 1] ?? '').trim() !== '') para.push(lines[++i])
      out.push(':::note', ...para, ':::')
      report.push(`CALLOUT note ${rel}`)
      continue
    }
    out.push(l)
  }
  return out
}

// A step item's title is its bold lead, else its text up to an early colon, else its first sentence.
function splitStep(text) {
  const bold = text.match(/^\*\*(.+?)\*\*\s*[:.—–-]?\s*(.*)$/s)
  if (bold) return [bold[1].replace(/[.:]$/, ''), capitalize(unwrapParen(bold[2]))]
  const colon = text.indexOf(': ')
  if (colon > 0 && colon < 80) return [text.slice(0, colon), capitalize(text.slice(colon + 2))]
  const sentence = text.match(/^(.+?\.)\s+(.*)$/s)
  if (sentence) return [sentence[1].replace(/\.$/, ''), sentence[2]]
  return [text.replace(/\.$/, ''), '']
}

const emitSteps = (steps, depth) => [
  '::::steps',
  '',
  ...steps.flatMap(([title, body]) => [`${'#'.repeat(depth)} ${title}`, '', ...(body ? [body, ''] : [])]),
  '::::',
]

// One level below the enclosing heading, and never above h4 so steps stay out of the outline.
function stepDepth(lines, start) {
  let parent = 1
  let inFence = false
  for (const l of lines.slice(0, start)) {
    if (FENCE.test(l)) inFence = !inFence
    const h = !inFence && l.match(/^(#{1,6}) /)
    if (h) parent = h[1].length
  }
  return Math.min(6, Math.max(4, parent + 1))
}

function stepsBlocks(lines, rel) {
  for (const spec of STEPS[rel] ?? []) {
    const start = lines.findIndex((l) => l.startsWith(spec.after ?? spec.from))
    if (start < 0) { report.push(`STEPS MISSING ${rel}: ${spec.after ?? spec.from}`); continue }
    const steps = []
    const depth = stepDepth(lines, start)
    let i = start
    if (spec.after) {
      i++
      while (lines[i]?.trim() === '') i++
      const begin = i
      while (/^\d+\.\s/.test(lines[i] ?? '')) {
        const item = [lines[i++].replace(/^\d+\.\s+/, '')]
        while (lines[i]?.trim() && !/^\d+\.\s/.test(lines[i])) item.push(lines[i++].trim())
        steps.push(splitStep(item.join(' ')))
      }
      lines.splice(begin, i - begin, ...emitSteps(steps, depth))
    } else {
      while (steps.length < spec.count && lines[i]?.startsWith('**')) {
        const para = []
        while (lines[i]?.trim()) para.push(lines[i++])
        steps.push(splitStep(para.join(' ')))
        while (lines[i]?.trim() === '') i++
      }
      if (steps.length < spec.count) { report.push(`STEPS SHORT ${rel}: ${spec.from}`); continue }
      lines.splice(start, i - start, ...emitSteps(steps, depth), '')
    }
    report.push(`STEPS ${steps.length} ${rel}`)
  }
  return lines
}

const looksSolidity = (body) =>
  !/[→←↔┌│└‖Σ×≥]|^\s*(#|\[\w\]|TX\d|Seed:|for each)/m.test(body) && /keccak256|require\(|revert |bytes32|==|\w\(.*\)/.test(body)

// Tag untagged code blocks, and title Solidity blocks that open with `// L1 (IEEZ.sol)`.
function codeBlocks(lines, rel) {
  const out = []
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(FENCE)
    if (!m) { out.push(lines[i]); continue }
    const [, indent, fence, info] = m
    let end = i + 1
    while (end < lines.length && !lines[end].trimStart().startsWith(fence)) end++
    let body = lines.slice(i + 1, end)
    let lang = info.trim()
    if (!lang) {
      lang = looksSolidity(body.join('\n')) ? 'solidity' : 'text'
      report.push(`CODE ${lang} ${rel}:${i + 1}`)
    }
    const title = lang === 'solidity' && body[0]?.trim().match(/^\/\/ (L1|L2) \((\w+\.sol)\)\s*(.*)$/)
    if (title && !title[3].includes('.sol)')) {
      lang = `solidity [${title[1]} · ${title[2]}]`
      const rest = title[3].replace(/^[—–-]\s*/, '')
      body = rest ? [body[0].replace(/\/\/.*/, `// ${rest}`), ...body.slice(1)] : body.slice(1)
    }
    out.push(`${indent}${fence}${lang}`, ...body, lines[end] ?? `${indent}${fence}`)
    i = end
  }
  return out
}

const vocsify = (src, rel) =>
  withDescription(codeBlocks(stepsBlocks(callouts(dropToc(src.split('\n'), rel), rel), rel), rel).join('\n'), rel)

for (const rel of files) {
  let src = fs.readFileSync(path.join(docsDir, rel), 'utf8')
  src = src.replace(/^\[TOC\]\s*\n/m, '')
  src = src.replace(/\]\(([^)\s]+)\)/g, (m, target) => {
    if (/^(https?:|mailto:|#)/.test(target)) return m
    const [p, hash] = target.split('#')
    const abs = path.posix.normalize(path.posix.join('docs', path.posix.dirname(rel), p))
    let url
    if (abs.startsWith('docs/') && abs.endsWith('.md')) url = slug(abs.slice(5))
    else {
      const isDir = p.endsWith('/') || (fs.existsSync(path.join(repo, abs)) && fs.statSync(path.join(repo, abs)).isDirectory())
      if (!fs.existsSync(path.join(repo, abs))) report.push(`MISSING ${rel}: ${target}`)
      url = `${GH}/${isDir ? 'tree' : 'blob'}/${commit}/${abs.replace(/\/$/, '')}`
    }
    return `](${url}${hash ? '#' + hash : ''})`
  })
  src = vocsify(src, rel)
  const dest = path.join(out, slug(rel).slice(1) + '.md')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, src)
  report.push(`${rel} -> ${slug(rel)}`)
}
// Pinned commit, read by vocs.config.ts for the banner.
fs.writeFileSync(path.join(out, '..', 'sync.json'), JSON.stringify({ commit }, null, 2) + '\n')
console.log(report.join('\n'))
