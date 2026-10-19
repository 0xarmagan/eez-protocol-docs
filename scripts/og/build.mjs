// Renders one preview image per page into public/og/, before `vocs build`.
// Title and description match the page's meta tags; the eyebrow is its sidebar section.
import fs from 'node:fs'
import path from 'node:path'
import config from '../../vocs.config.ts'
import { render } from './render.mjs'

const pages = 'src/pages'
const out = 'public/og'
const { commit } = JSON.parse(fs.readFileSync('src/sync.json', 'utf8'))

const section = new Map()
for (const item of config.sidebar) {
  if (item.link) section.set(item.link, 'EEZ Core Protocol')
  for (const child of item.items ?? []) section.set(child.link, item.text)
}

function meta(src) {
  const fm = src.match(/^---\n([\s\S]*?)\n---\n/)?.[1] ?? ''
  const field = (key) => {
    const v = fm.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]
    return v?.startsWith('"') ? JSON.parse(v) : v
  }
  let inFence = false
  const h1 = src.split('\n').find((l) => (/^\s*```/.test(l) ? ((inFence = !inFence), false) : !inFence && /^# /.test(l)))
  return { title: field('title') ?? h1?.slice(2).trim(), description: field('description') }
}

const files = fs.readdirSync(pages, { recursive: true }).filter((f) => /\.mdx?$/.test(f))
fs.rmSync(out, { recursive: true, force: true })
for (const file of files) {
  const route = '/' + file.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '')
  const { title = config.title, description = config.description } = meta(fs.readFileSync(path.join(pages, file), 'utf8'))
  const eyebrow = section.get(route === '/' ? '/' : route)
  if (!eyebrow) throw new Error(`og: ${route} is not in the sidebar`)
  const dest = path.join(out, (route === '/' ? 'index' : route.slice(1)) + '.png')
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.writeFileSync(dest, await render({ eyebrow, title, description, commit }))
  console.log(`og ${dest} ${(fs.statSync(dest).size / 1024).toFixed(0)} KB`)
}
