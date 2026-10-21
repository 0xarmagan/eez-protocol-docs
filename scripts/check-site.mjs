// Check the built site, not just configuration: a successful build can still
// publish HTML whose CSS, scripts and navigation point at a stale base path.
import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const origin = 'https://docs.eez.io'
const output = 'dist/public'
const routes = ['/', '/core-protocol-spec', '/blobs/blob-format-spec']

function isFile(file) {
  return statSync(file, { throwIfNoEntry: false })?.isFile() ?? false
}

function resolveFile(pathname) {
  const file = join(output, decodeURIComponent(pathname))
  return [file, `${file}.html`, join(file, 'index.html')].find(isFile)
}

for (const route of routes) {
  const file = resolveFile(route)
  assert.ok(file, `Missing generated page: ${route}`)
  const html = readFileSync(file, 'utf8')
  assert.ok(html.includes(`rel="canonical" href="${origin}${route}"`), `${route}: incorrect canonical URL`)
  const image = `/og/${route === '/' ? 'index' : route.slice(1)}.png`
  for (const attribute of ['property="og:image"', 'name="twitter:image"']) {
    assert.ok(html.includes(`${attribute} content="${origin}${image}"`), `${route}: incorrect preview URL`)
  }
  assert.ok(isFile(join(output, image)), `${route}: missing preview image`)

  const urls = [...html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)]
    .map((match) => new URL(match[1].replaceAll('&amp;', '&'), `${origin}${route}`))
    .filter((url) => url.origin === origin)
  assert.ok(urls.some((url) => url.pathname.endsWith('.css')), `${route}: missing stylesheet`)
  assert.ok(urls.some((url) => url.pathname.endsWith('.js')), `${route}: missing script`)
  for (const url of urls) {
    assert.ok(!url.pathname.startsWith('/eez-protocol-docs/'), `${route}: stale repository prefix in ${url}`)
    assert.ok(resolveFile(url.pathname), `${route}: missing local target ${url.pathname}`)
  }
  console.log(`Checked ${route}: canonical, previews and ${urls.length} local URLs`)
}
