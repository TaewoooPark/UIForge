#!/usr/bin/env node
// uiforge-archive — the COMPLETE behavior clone. Not a re-render of one state: a record of the
// site's real code + all its network, replayed so the ORIGINAL JavaScript runs against cached
// responses. Click a tab and it switches; filter a list and it updates; scroll and it lazy-loads
// — because it is the real code, driven by the data it actually received. This is the Webrecorder
// / replayweb.page model (record everything, intercept every request on replay), adapted to a
// self-contained folder + a zero-dependency static replay server (no service worker, no HTTPS).
//
// Usage:
//   node uiforge-archive.mjs <url> --out-dir ./archive [--explore] [--headed] [--profile dir] [--viewport WxH]
//   then:  node ./archive/serve.mjs   → open the printed http://localhost:PORT

import process from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdirSync, writeFileSync } from 'node:fs'
import { loadChromium, launchFor, challengeGoto } from './uiforge-capture.mjs'

const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`\n  uiforge-archive — record a site's code + network, replay it so the REAL behavior runs offline.\n\n  node uiforge-archive.mjs <url> --out-dir ./archive [--explore] [--headed] [--profile dir] [--viewport WxH]\n  then  node ./archive/serve.mjs  and open the printed URL.\n`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const outDir = valAt('--out-dir') || './archive'
const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
const explore = argv.includes('--explore')
const capOpts = { headed: argv.includes('--headed'), profile: valAt('--profile'), storageState: valAt('--storage-state') }
const valueIdx = new Set(); for (const nm of ['--out-dir', '--viewport', '--profile', '--storage-state']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const start = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
if (!start) { console.error('  no url'); process.exit(1) }

const MAX_BODY = 12 * 1024 * 1024
const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36) }

// In-page exploration to WARM the cache: fire the interactions that lazy-load data or reveal
// client-side state, so their responses get recorded. Bounded + safe (no navigations away).
async function warm(page) {
  try {
    await page.evaluate(async () => {
      const sleep = ms => new Promise(r => setTimeout(r, ms))
      // 1. scroll the whole page (infinite scroll / lazy sections)
      for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.9) { window.scrollTo(0, y); await sleep(120) }
      window.scrollTo(0, 0); await sleep(150)
      // 2. click in-page controls that swap content WITHOUT navigating: tabs, aria toggles,
      //    "load more"/"show more"/pagination. Never click a plain <a href> (would navigate).
      const clickable = [...document.querySelectorAll('[role=tab],[aria-controls],[aria-expanded],[data-tab],button,summary,[role=button]')]
        .filter(el => { const a = el.closest('a[href]'); if (a && !/^#/.test(a.getAttribute('href') || '')) return false
          const t = (el.textContent || '').trim().toLowerCase()
          return el.tagName === 'SUMMARY' || el.hasAttribute('role') || el.hasAttribute('aria-controls') || el.hasAttribute('aria-expanded') || el.hasAttribute('data-tab') || /more|load|show|next|prev|tab|view all|see all|filter|sort/.test(t) })
        .slice(0, 40)
      for (const el of clickable) { try { el.click(); await sleep(160) } catch {} }
      await sleep(300)
    })
  } catch {}
}

async function run() {
  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
  const chromium = await loadChromium()
  if (!chromium) { console.error('  Playwright not found'); process.exit(3) }
  const { page, close } = await launchFor(chromium, { width: vw, height: vh }, capOpts)
  const rec = new Map()   // "METHOD normUrl" → { method, url, status, headers, body:Buffer }
  const norm = u => { try { const x = new URL(u); for (const p of ['_rsc', '__nextDataReq', '_', 'cb', 'ts', 'timestamp']) x.searchParams.delete(p); return x.origin + x.pathname + (x.search || '') } catch { return u } }
  const add = async r => {
    try {
      const req = r.request(); const method = req.method(); const url = r.url()
      if (/^data:|^blob:/.test(url)) return
      const key = method + ' ' + norm(url)
      const body = await r.body().catch(() => null); if (!body || body.length > MAX_BODY) return
      const h = r.headers(); const headers = {}
      for (const k of Object.keys(h)) { const lk = k.toLowerCase(); if (['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie', 'strict-transport-security', 'content-security-policy'].includes(lk)) continue; headers[lk] = h[k] }
      rec.set(key, { method, url, status: r.status(), headers, body })
    } catch {}
  }
  page.on('response', add)

  let docHtml = '', origin = start
  try {
    console.log(`\n  ${B}UIForge archive${X} ${D}← ${start}${X}`)
    await challengeGoto(page, start)
    await page.waitForTimeout(1200)
    if (explore) { process.stdout.write(`    ${C}exploring${X} ${D}(warming cache: scroll + in-page controls)…${X}\n`); await warm(page) }
    await page.waitForTimeout(500)
    origin = await page.evaluate(() => location.origin).catch(() => start)
    docHtml = await page.content().catch(() => '')
  } finally { await close() }

  // pick the main-document record for '/', else fall back to the rendered content()
  const startNorm = norm(start)
  const docRec = [...rec.values()].find(r => norm(r.url) === startNorm && (r.headers['content-type'] || '').includes('html'))

  /* ---------------- write the archive ---------------- */
  const dataDir = path.join(outDir, 'data')
  mkdirSync(dataDir, { recursive: true })
  const manifest = []
  for (const [key, r] of rec) {
    const file = `${hash(key)}.bin`
    writeFileSync(path.join(dataDir, file), r.body)
    manifest.push({ key, method: r.method, url: r.url, status: r.status, headers: r.headers, file, ct: r.headers['content-type'] || '' })
  }
  // if we never captured a real HTML document response, synthesize one from the rendered DOM
  if (!docRec && docHtml) {
    const file = 'index.bin'; writeFileSync(path.join(dataDir, file), Buffer.from(docHtml))
    manifest.push({ key: 'GET ' + startNorm, method: 'GET', url: start, status: 200, headers: { 'content-type': 'text/html; charset=utf-8' }, file, ct: 'text/html', synth: true })
  }
  writeFileSync(path.join(outDir, 'index.json'), JSON.stringify({ start, startNorm, origin, count: manifest.length, entries: manifest }))
  writeFileSync(path.join(outDir, 'serve.mjs'), SERVER)
  writeFileSync(path.join(outDir, 'README.md'), `# UIForge behavior archive — ${start}\n\nA complete, offline replica that RUNS THE REAL CODE against recorded responses. Client-side interactions (tabs, filters, lists, accordions, motion, scroll) work because it is the site's own JavaScript, replaying its own data.\n\n\`\`\`bash\nnode serve.mjs        # zero-dependency replay server\n\`\`\`\n\nThen open the printed http://localhost URL. ${manifest.length} responses archived.\n\nServer-dependent actions only work if their response was recorded during capture — run with \`--explore\` and interact more to widen coverage.\n`)

  const xhr = manifest.filter(m => /json|x-component|javascript|text\/plain/.test(m.ct) && !/html|css|font|image/.test(m.ct)).length
  console.log(`    ${C}recorded${X}   ${G}${manifest.length}${X} responses ${D}(scripts, css, ${xhr} data/API payloads, fonts, images)${X}`)
  console.log(`    ${C}replay${X}     ${G}${outDir}/${X}  ${D}→ node serve.mjs${X}`)
  console.log(`\n    ${D}cd ${outDir} && node serve.mjs${X}\n`)
}

/* ============ the zero-dependency replay server (written into the archive) ============ */
const SERVER = `#!/usr/bin/env node
// UIForge replay server — serves every recorded response from the archive so the site's own
// code runs offline. Exact URL match first, then normalized (volatile query params dropped),
// then pathname-only. No dependencies.
import http from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const idx = JSON.parse(readFileSync(path.join(HERE, 'index.json'), 'utf8'))
const norm = u => { try { const x = new URL(u); for (const p of ['_rsc','__nextDataReq','_','cb','ts','timestamp']) x.searchParams.delete(p); return x.origin + x.pathname + (x.search || '') } catch { return u } }
const byKey = new Map(), byNorm = new Map(), byPath = new Map()
for (const e of idx.entries) { byKey.set(e.key, e); byNorm.set(e.method + ' ' + norm(e.url), e); try { byPath.set(e.method + ' ' + new URL(e.url).pathname, e) } catch {} }
const PORT = +(process.env.PORT || 8787)
const inject = \`<script>(function(){try{var _d=Date;Date=class extends _d{constructor(){super(1751328000000)}static now(){return 1751328000000}};}catch(e){}
navigator.sendBeacon=function(){return true};try{window.WebSocket=function(){return{send:function(){},close:function(){},addEventListener:function(){}}}}catch(e){}})();</script>\`
http.createServer((req, res) => {
  const full = idx.origin + req.url
  const isRoot = req.url === '/' || req.url === '' || req.url.startsWith('/?')
  let e = byKey.get(req.method + ' ' + full) || byNorm.get(req.method + ' ' + norm(full)) || byPath.get(req.method + ' ' + (req.url.split('?')[0]))
  if (!e && isRoot) e = idx.entries.find(x => norm(x.url) === idx.startNorm && (x.ct || '').includes('html')) || idx.entries.find(x => (x.ct || '').includes('text/html')) || idx.entries[0]
  if (!e) { res.writeHead(204, { 'access-control-allow-origin': '*' }); return res.end() }
  let body = readFileSync(path.join(HERE, 'data', e.file))
  const h = Object.assign({}, e.headers, { 'access-control-allow-origin': '*', 'cache-control': 'no-store' })
  if ((e.ct || '').includes('text/html')) { let s = body.toString('utf8').replace(/<head[^>]*>/i, m => m + inject); body = Buffer.from(s) }
  h['content-length'] = body.length
  res.writeHead(e.status && e.status < 500 ? e.status : 200, h); res.end(body)
}).listen(PORT, () => console.log('\\n  UIForge replay → http://localhost:' + PORT + '  (' + idx.count + ' responses, ' + idx.start + ')\\n'))
`

run()
