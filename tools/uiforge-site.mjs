#!/usr/bin/env node
// uiforge-site — clone a WHOLE site, not one page. Crawl same-origin links from a start URL,
// capture each page, export each as a componentized React tree under its own class namespace,
// and stitch them into ONE Vite + React + React-Router project: a route per page, one shared
// theme, deduped fonts/keyframes. The "one snapshot" limit, lifted to a browsable site.
//
// Usage:
//   node uiforge-site.mjs <start-url> --out-dir ./site [--max 6] [--assets] [--headed] [--profile dir]

import process from 'node:process'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync, copyFileSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { capture, tokenize, loadChromium, launchFor, challengeGoto } from './uiforge-capture.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`\n  uiforge-site — crawl + clone a whole site into one React-Router project.\n\n  node uiforge-site.mjs <start-url> --out-dir ./site [--max 6] [--depth 1] [--assets] [--headed] [--profile dir] [--viewport WxH]\n`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const outDir = valAt('--out-dir') || './site'
const max = +(valAt('--max') || 6)
const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
const withAssets = argv.includes('--assets')
const capOpts = { headed: argv.includes('--headed'), profile: valAt('--profile'), storageState: valAt('--storage-state') }
const valueIdx = new Set(); for (const nm of ['--out-dir', '--max', '--depth', '--viewport', '--profile', '--storage-state']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const start = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
if (!start) { console.error('  no start url'); process.exit(1) }

const slugOf = p => (p.replace(/^\/+|\/+$/g, '').replace(/[^a-z0-9]+/gi, '-') || 'home').toLowerCase().slice(0, 40)
const compName = s => 'Page_' + s.replace(/[^a-z0-9]/gi, '_')

/* ---------------- 1. discover same-origin pages (one BFS level) ---------------- */
async function discover(startUrl) {
  const chromium = await loadChromium()
  const { page, close } = await launchFor(chromium, { width: vw, height: vh }, capOpts)
  let links = []
  try {
    await challengeGoto(page, startUrl)
    links = await page.evaluate(() => {
      const origin = location.origin
      const out = new Set()
      for (const a of document.querySelectorAll('a[href]')) {
        try { const u = new URL(a.href, location.href)
          if (u.origin !== origin) continue
          if (/\.(pdf|zip|png|jpe?g|svg|mp4|webm|dmg|exe)$/i.test(u.pathname)) continue
          out.add(u.pathname.replace(/\/$/, '') || '/') } catch {}
      }
      return [...out]
    })
  } catch {} finally { await close() }
  const startPath = (() => { try { return new URL(startUrl).pathname.replace(/\/$/, '') || '/' } catch { return '/' } })()
  const origin = new URL(startUrl).origin
  const paths = [startPath, ...links.filter(p => p !== startPath)].slice(0, max)
  return { origin, paths }
}

/* ---------------- 2. capture + export each page under its own prefix ---------------- */
function mergeCss(pageCssList) {
  // one @import "tailwindcss"; then every page's font-faces/keyframes/rules (prefixed, no clash), deduped
  const seen = new Set(); const body = []
  for (const css of pageCssList) {
    for (const line of css.replace(/@import\s+["']tailwindcss["'];?/g, '').split('\n')) {
      const t = line.trim(); if (!t || seen.has(t)) continue; seen.add(t); body.push(line)
    }
  }
  return `@import "tailwindcss";\n\n${body.join('\n')}\n`
}
function copyDir(from, to) { mkdirSync(to, { recursive: true }); for (const e of readdirSync(from)) { const s = path.join(from, e), d = path.join(to, e); if (statSync(s).isDirectory()) copyDir(s, d); else copyFileSync(s, d) } }

async function run() {
  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
  const { origin, paths } = await discover(start)
  console.log(`\n  ${B}UIForge site${X} ${D}← ${start}${X}\n    ${C}discovered${X} ${paths.length} page(s): ${D}${paths.join('  ')}${X}\n`)

  const tmp = path.join(outDir, '.uif-tmp')
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(path.join(outDir, 'src', 'pages'), { recursive: true })
  const pages = [], cssList = []
  let themeJson = null
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i], slug = slugOf(p), url = origin + p
    process.stdout.write(`    ${C}[${i + 1}/${paths.length}]${X} ${p} … `)
    let snap
    try { snap = await capture(url, { width: vw, height: vh }, capOpts) } catch (e) { console.log(`skip (${e.message})`); continue }
    if (!snap || !snap.nodes || snap.nodes.length < 3) { console.log('skip (empty)'); continue }
    const capFile = path.join(tmp, `${slug}.json`); mkdirSync(tmp, { recursive: true })
    writeFileSync(capFile, JSON.stringify({ source: url, viewport: snap.viewport, title: snap.title, sheets: snap.sheets || [], fontFaces: snap.fontFaces || [], keyframes: snap.keyframes || [], tokens: tokenize(snap.nodes), coverage: snap.coverage, nodes: snap.nodes }))
    const buildDir = path.join(tmp, `build-${slug}`)
    const exArgs = [path.join(HERE, 'uiforge-export.mjs'), capFile, '--out-dir', buildDir, '--prefix', `p${i}_`]
    if (withAssets) exArgs.push('--assets')
    try { execFileSync('node', exArgs, { stdio: 'ignore', env: process.env }) } catch (e) { console.log('export failed'); continue }
    // fold the page's src into site/src/pages/<slug>/ (App.tsx → index.tsx; imports resolve locally)
    const pdst = path.join(outDir, 'src', 'pages', slug)
    if (existsSync(path.join(buildDir, 'src', 'components'))) copyDir(path.join(buildDir, 'src', 'components'), path.join(pdst, 'components'))
    if (existsSync(path.join(buildDir, 'src', 'content.ts'))) copyFileSync(path.join(buildDir, 'src', 'content.ts'), path.join(pdst, 'content.ts'))
    writeFileSync(path.join(pdst, 'index.tsx'), readFileSync(path.join(buildDir, 'src', 'App.tsx'), 'utf8').replace('export default function App(', `export default function ${compName(slug)}(`))
    cssList.push(readFileSync(path.join(buildDir, 'src', 'index.css'), 'utf8'))
    if (withAssets && existsSync(path.join(buildDir, 'public'))) copyDir(path.join(buildDir, 'public'), path.join(outDir, 'public'))
    pages.push({ path: p, slug, title: snap.title || slug, comp: compName(slug) })
    console.log(`${G}ok${X} ${D}(${snap.nodes.length} nodes)${X}`)
  }
  if (!pages.length) { console.error('  no pages captured'); process.exit(2) }

  // 3. router App + shared scaffold
  const imports = pages.map(pg => `import ${pg.comp} from './pages/${pg.slug}'`).join('\n')
  const routes = pages.map(pg => `        <Route path=${JSON.stringify(pg.path)} element={<${pg.comp} />} />`).join('\n')
  const nav = pages.map(pg => `<Link to=${JSON.stringify(pg.path)} style={{ marginRight: 16 }}>${pg.title.slice(0, 24)}</Link>`).join(' ')
  const app = `import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'\n${imports}\n\nexport default function App() {\n  return (\n    <BrowserRouter>\n      {/* generated cross-page nav — the captured site's own nav lives inside each page */}\n      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: 8, background: '#111', color: '#fff', fontFamily: 'system-ui', fontSize: 13, zIndex: 2147483647 }}>${nav}</nav>\n      <Routes>\n${routes}\n      </Routes>\n    </BrowserRouter>\n  )\n}\n`
  const files = {
    'package.json': JSON.stringify({ name: 'uiforge-site', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router-dom': '^6.26.0' }, devDependencies: { '@tailwindcss/vite': '^4.0.0', '@vitejs/plugin-react': '^4.3.0', tailwindcss: '^4.0.0', vite: '^5.4.0' } }, null, 2) + '\n',
    'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nexport default defineConfig({ plugins: [react(), tailwindcss()] })\n`,
    'index.html': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>UIForge site clone</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    'src/main.tsx': `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)\n`,
    'src/index.css': mergeCss(cssList),
    'src/App.tsx': app,
    'README.md': `# UIForge site clone\n\nCrawled from \`${start}\` — ${pages.length} page(s):\n\n${pages.map(p => `- \`${p.path}\` → \`src/pages/${p.slug}/\``).join('\n')}\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nEach page is a componentized React tree under its own class namespace (\`p<i>_uif-*\`), wired to a route in \`src/App.tsx\` (React Router). Shared theme + fonts + keyframes in \`src/index.css\`.\n`,
  }
  for (const [f, c] of Object.entries(files)) { const abs = path.join(outDir, f); mkdirSync(path.dirname(abs), { recursive: true }); writeFileSync(abs, c) }
  rmSync(tmp, { recursive: true, force: true })

  console.log(`\n  ${G}${outDir}/${X}  ${D}${pages.length} pages → src/pages/*/ · React Router · shared @theme${X}`)
  console.log(`    ${D}cd ${outDir} && npm install && npm run dev${X}\n`)
}
run()
