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

const report = []
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
  const dest = path.join(out, slug(rel).slice(1) + '.md')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, src)
  report.push(`${rel} -> ${slug(rel)}`)
}
console.log(report.join('\n'))
