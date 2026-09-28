// Post-build prerender (SSG): render every route to static HTML with per-page <head>
// (title, meta, canonical, OG/Twitter, Service + FAQPage JSON-LD) so AI crawlers and search
// engines see full content + schema without executing JavaScript.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dist = join(__dirname, 'dist')
const siteUrl = 'https://desirsolutions.com'

const { render } = await import('./dist-server/entry-server.js')

// Routes to prerender (matches sitemap.xml; 404 excluded).
const routes = [
  '/', '/ai-continuity', '/modernization', '/devops', '/cloud', '/compliance', '/talent',
  '/assessment', '/proof', '/services', '/employers', '/candidates', '/careers',
  '/engagement', '/about', '/trust', '/terms-privacy', '/contact',
]

// Guard: every static route declared in App.jsx must be prerendered. nginx now serves
// unknown paths as a real 404 instead of masking them with index.html, so a route that
// ships without a prerendered file would 404 in production. Fail the build instead.
const appSrc = readFileSync(join(__dirname, 'src', 'App.jsx'), 'utf-8')
const declared = [...appSrc.matchAll(/<Route\s+path="([^"]+)"/g)]
  .map((m) => m[1])
  .filter((path) => path !== '*')
const missing = declared.filter((path) => !routes.includes(path))
if (missing.length) {
  throw new Error(`prerender: declared in App.jsx but not prerendered: ${missing.join(', ')}`)
}

// Template from the client build; strip the static <title> so helmet's per-page title is the only one.
let template = readFileSync(join(dist, 'index.html'), 'utf-8')
template = template.replace(/\s*<title>[\s\S]*?<\/title>/, '')

if (!template.includes('<div id="root"></div>') || !template.includes('</head>')) {
  throw new Error('prerender: expected injection points (<div id="root"></div> and </head>) not found')
}

let count = 0
for (const url of routes) {
  const { html, head } = render(url)
  const page = template
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  const outFile = url === '/' ? join(dist, 'index.html') : join(dist, url, 'index.html')
  mkdirSync(dirname(outFile), { recursive: true })
  writeFileSync(outFile, page)
  count++
}
console.log(`prerendered ${count} routes to static HTML`)

// 404 page: rendered through the router catch-all and written to dist/404.html for
// nginx's `error_page 404`, so unknown paths return a real 404 status instead of the
// old soft-404 (200 + this HTML). Deliberately excluded from `routes` — it must not
// enter the sitemap or get its own crawlable URL.
{
  const { html, head } = render('/404')
  const notFound = template
    .replace('</head>', `    ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${html}</div>`)
  writeFileSync(join(dist, '404.html'), notFound)
  console.log('prerendered 404.html for nginx error_page')
}

// Regenerate sitemap.xml with a build-time lastmod (today, UTC) instead of a
// hardcoded date. Overwrites the static copy Vite already placed in dist/ from public/.
const today = new Date().toISOString().slice(0, 10)
const sitemapUrls = routes
  .map((url) => `  <url><loc>${siteUrl}${url === '/' ? '/' : url}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`
writeFileSync(join(dist, 'sitemap.xml'), sitemap)
console.log(`sitemap.xml regenerated with lastmod ${today}`)
