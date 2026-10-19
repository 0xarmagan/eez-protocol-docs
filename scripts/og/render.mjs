// Social preview images (1200×630 PNG), styled per the EEZ DESIGN.md.
import fs from 'node:fs'
import path from 'node:path'
import { createElement as h } from 'react'
import { ImageResponse } from '@takumi-rs/image-response'

const dir = path.dirname(new URL(import.meta.url).pathname)
const font = (file, name, weight) => ({ name, weight, data: fs.readFileSync(path.join(dir, 'fonts', file)) })
const fonts = [
  font('Geist-Light.ttf', 'Geist', 300),
  font('Geist-Regular.ttf', 'Geist', 400),
  font('Geist-Black.ttf', 'Geist', 800),
  font('GeistMono-Regular.ttf', 'Geist Mono', 400),
  font('GeistMono-Medium.ttf', 'Geist Mono', 500),
]
const logo = `data:image/svg+xml;base64,${fs.readFileSync(path.join(dir, '../../public/logo.svg')).toString('base64')}`

const color = {
  canvas: '#0A0A0A',
  muted: '#9aa3b3',
  lede: '#c9cfda',
  light: '#dcdcdc',
  pinned: '#A8F3CE',
  rail: 'linear-gradient(90deg, #8AE5AC 0%, #6283BD 55%, #4439CB 100%)',
  grid: 'rgba(255,255,255,.045)',
}

// Long titles step down so they stay within two lines.
const titleSize = (t) => (t.length > 32 ? 64 : t.length > 22 ? 76 : 88)

const minor = new Set(['a', 'an', 'and', 'for', 'of', 'the', 'to', 'in', 'on'])

// Mixed-weight display h1: weight 800 white against weight 300 #dcdcdc. Titles with
// minor words set only those light, so long titles stay readable; others alternate.
function Title({ title }) {
  const words = title.split(' ')
  const light = words.some((w) => minor.has(w.toLowerCase()))
    ? (w) => minor.has(w.toLowerCase())
    : (_, i) => i % 2 === 1
  return h(
    'div',
    { style: { display: 'flex', flexWrap: 'wrap', fontSize: titleSize(title), lineHeight: 1.08, letterSpacing: '-0.01em', maxWidth: 1000 } },
    words.map((w, i) =>
      h('span', {
        key: i,
        style: {
          fontWeight: light(w, i) ? 300 : 800,
          color: light(w, i) ? color.light : '#ffffff',
          marginRight: i < words.length - 1 ? '0.25em' : 0,
        },
      }, w),
    ),
  )
}

export function card({ eyebrow, title, description, commit }) {
  return h(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: color.canvas,
        backgroundImage: `linear-gradient(${color.grid} 1px, transparent 1px), linear-gradient(90deg, ${color.grid} 1px, transparent 1px)`,
        backgroundSize: '42px 42px',
        fontFamily: 'Geist',
        color: '#ffffff',
      },
    },
    h('div', { style: { display: 'flex', height: 4, width: 1200, flexShrink: 0, background: color.rail } }),
    h(
      'div',
      { style: { flex: 1, display: 'flex', flexDirection: 'column', padding: '64px 72px 56px' } },
      h('div', { style: { fontFamily: 'Geist Mono', fontSize: 22, letterSpacing: '0.1em', color: color.muted } }, `[ ${eyebrow.toUpperCase()} ]`),
      h('div', { style: { display: 'flex', marginTop: 28 } }, h(Title, { title })),
      h('div', { style: { marginTop: 28, fontSize: 28, lineHeight: 1.45, color: color.lede, maxWidth: 960 } }, description),
      h(
        'div',
        { style: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' } },
        h('img', { src: logo, style: { width: 196, height: 92 } }),
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', flexShrink: 0, whiteSpace: 'nowrap', fontFamily: 'Geist Mono', fontSize: 20, letterSpacing: '0.08em', color: color.muted } },
          h('div', { style: { width: 11, height: 11, flexShrink: 0, backgroundColor: color.pinned, transform: 'rotate(45deg)', marginRight: 14 } }),
          `PINNED ${commit}`,
        ),
      ),
    ),
  )
}

export async function render(props) {
  const res = new ImageResponse(card(props), { width: 1200, height: 630, format: 'png', fonts })
  return Buffer.from(await res.arrayBuffer())
}
