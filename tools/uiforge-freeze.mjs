#!/usr/bin/env node
// uiforge-freeze — stage 4b of the clone pipeline: the FAITHFUL, offline ORACLE.
//
// uiforge-reconstruct re-derives every style from computed values and THROWS AWAY the
// original CSS, which makes it lossy (collapse, empty boxes, drift). uiforge-freeze does
// the opposite: it KEEPS the site's real stylesheets and its fully-rendered DOM, so it
// renders pixel-faithful to the live site. Every <script> is stripped, so the frozen DOM
// can't re-animate or mutate — it's deterministic. That frozen page becomes the offline
// baseline a later clean React rebuild is pixel-diffed against.
//
// Usage:
//   node uiforge-freeze.mjs <url│file.html> [--out freeze.html] [--viewport 1440x900]
//
// Needs Playwright:  npm i -D playwright && npx playwright install chromium

import process from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { writeFileSync } from 'node:fs'
import { loadChromium, launchFor, challengeGoto } from './uiforge-capture.mjs'

const attrEsc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')

// Rewrite every url(...) in a stylesheet to an absolute URL against that sheet's href —
// the same replace logic uiforge-capture's recoverCss() uses on @font-face blocks, but
// applied to the WHOLE sheet so background-images, masks, cursors, and @font-face srcs all
// resolve once the CSS is inlined (relative → absolute; already-absolute passes through).
function rewriteCssUrls(css, base) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_m, _q, u) => {
    if (/^data:/.test(u)) return `url(${u})`
    try { return `url("${new URL(u, base).href}")` } catch { return `url("${u}")` }
  })
}

// Fetch each external stylesheet server-side (no CORS on a server fetch — the whole reason
// this can KEEP the real CSS) and rewrite its url()s to absolute. Returns results in the
// SAME order as the input so the original cascade order is preserved.
async function fetchSheets(sheets) {
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
  return Promise.all((sheets || []).map(async ({ href, media }) => {
    try {
      const res = await fetch(href, { redirect: 'follow', headers: { 'user-agent': UA } })
      if (!res.ok) return { href, media, ok: false }
      const css = await res.text()
      return { href, media, ok: true, css: rewriteCssUrls(css, href) }
    } catch { return { href, media, ok: false } }
  }))
}

// Render the target, settle it (scroll-through so reveals fire + lazy media loads, copied
// from uiforge-capture), then grab the fully-rendered outerHTML plus the ordered list of
// external stylesheet hrefs (carrying their media so print/responsive sheets stay scoped).
async function freeze(target, viewport, opts = {}) {
  const chromium = await loadChromium()
  if (!chromium) { console.error('\n  Playwright not found:  npm i -D playwright && npx playwright install chromium\n'); process.exit(3) }
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(path.resolve(target)).href
  // Robust launch: --headed/--profile run a real browser (automation fingerprint hidden, Chrome
  // channel, persistent cf_clearance) so a Cloudflare/bot wall clears and STAYS cleared next run.
  const { page, close } = await launchFor(chromium, viewport, opts)
  let snap
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})
    // Install a controllable clock BEFORE navigation (it must hook timers at init). Time flows
    // normally through load + settle, then we PAUSE it at the snapshot instant — so carousels,
    // rotating heroes, and any setInterval-driven content stop dead. This is what makes the
    // freeze deterministic on JS-personalized pages (openai-style "different slide per look").
    if (!opts.liveTimers) await page.clock.install().catch(() => {})
    await challengeGoto(page, url)
    await page.waitForTimeout(700)
    // Scroll the whole page top→bottom→top so IntersectionObserver reveals fire and lazy
    // media loads — otherwise below-fold sections freeze in their initial hidden state
    // (opacity:0, translated). reduced-motion makes the reveals settle instantly.
    await page.evaluate(async () => {
      const step = Math.max(200, window.innerHeight * 0.8)
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)) }
      window.scrollTo(0, 0)
    }).catch(() => {})
    await page.waitForTimeout(400)
    // STOP THE WORLD at the snapshot instant: pause the virtual clock (setInterval carousels,
    // rotating heroes) and every running animation (WAAPI + CSS). The optional --shot screenshot
    // is taken at this exact frozen instant, so "original" and "freeze" come from the SAME frame —
    // the aligned proof pair. Pausing via the animation API leaves no trace in the DOM/outerHTML.
    if (!opts.liveTimers) {
      await page.clock.pauseAt(new Date()).catch(() => {})
      await page.evaluate(() => { try { for (const a of document.getAnimations({ subtree: true })) a.pause() } catch {} }).catch(() => {})
    }
    if (opts.shot) await page.screenshot({ path: opts.shot, clip: { x: 0, y: 0, width: viewport.width, height: viewport.height } }).catch(() => {})
    if (opts.fullShot) await page.screenshot({ path: opts.fullShot, fullPage: true }).catch(() => {})
    // Collect external stylesheet hrefs (links first, in document order, then any @import'd
    // sheets not already seen), de-duped, each carrying its media query. Then grab the fully
    // rendered document — outerHTML already contains the inline <style> blocks injected by
    // CSS-in-JS, the settled DOM, and inlined SVGs.
    snap = await page.evaluate(() => {
      const seen = new Set(), sheets = []
      for (const l of document.querySelectorAll('link[rel=stylesheet]')) {
        if (!l.href || seen.has(l.href)) continue
        seen.add(l.href); sheets.push({ href: l.href, media: (l.media || '').trim() })
      }
      for (const s of document.styleSheets) {
        if (!s.href || seen.has(s.href)) continue
        seen.add(s.href); sheets.push({ href: s.href, media: ((s.media && s.media.mediaText) || '').trim() })
      }
      return { sheets, html: document.documentElement.outerHTML, href: location.href, origin: location.origin }
    })
  } finally { await close() }
  return snap
}

// Transform the captured outerHTML into a standalone, script-free, real-CSS page.
function assemble(snap, sheets) {
  let html = snap.html
  // origin for <base> — prefer the page's final location (survives http→https redirects);
  // for a file:// target fall back to the containing directory URL.
  let origin = snap.origin && snap.origin !== 'null' ? snap.origin : ''
  if (!origin) { try { origin = new URL('.', snap.href).href } catch {} }

  // 1. Remove every stylesheet <link> — we inline the real CSS below instead (attribute
  //    order is arbitrary, so test the whole tag for a rel that contains "stylesheet").
  let linksRemoved = 0
  html = html.replace(/<link\b[^>]*>/gi, m => {
    if (/rel\s*=\s*['"]?[^'">]*stylesheet/i.test(m)) { linksRemoved++; return '' }
    return m
  })

  // 2. Remove ALL <script> tags (paired + self-closing) so the frozen DOM can't re-animate
  //    or mutate — this is what makes the oracle deterministic.
  let scriptsRemoved = 0
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, () => { scriptsRemoved++; return '' })
             .replace(/<script\b[^>]*\/>/gi, () => { scriptsRemoved++; return '' })

  // 3. Insert <base href="origin"> right after <head> so any remaining relative asset URLs
  //    (images, videos) still resolve against the live origin.
  if (origin) html = html.replace(/<head\b[^>]*>/i, m => `${m}<base href="${attrEsc(origin)}">`)

  // 4. Inject the fetched+rewritten stylesheets as <style> blocks just before </head>, in
  //    original order (cascade order preserved; the page's own inline <style> that were
  //    already in <head> stay where they are). media is carried through on <style media>
  //    so print/responsive sheets don't leak onto the screen render.
  const styleBlocks = sheets.filter(s => s.ok && s.css).map(s => {
    const mediaAttr = s.media && !/^(all|screen)$/i.test(s.media) ? ` media="${attrEsc(s.media)}"` : ''
    return `<style${mediaAttr}>\n${s.css}\n</style>`
  }).join('\n')
  if (styleBlocks) {
    if (/<\/head>/i.test(html)) html = html.replace(/<\/head>/i, `${styleBlocks}\n</head>`)
    else if (/<body\b[^>]*>/i.test(html)) html = html.replace(/(<body\b[^>]*>)/i, `${styleBlocks}\n$1`)
    else html = styleBlocks + '\n' + html
  }

  // 5. outerHTML omits the doctype — prepend it so the page renders in standards mode.
  if (!/^\s*<!doctype/i.test(html)) html = '<!doctype html>\n' + html
  return { html, origin, linksRemoved, scriptsRemoved }
}

// --inline: embed every referenced font/image/background as a data: URI, server-side (no CORS —
// so even CORS-locked webfonts come across), producing a TRULY self-contained single .html that
// renders offline. Each fetch is hard-bounded so one slow asset can't stall the run.
async function inlineAssets(html, base) {
  const PER = 8000, MAX = 6 * 1024 * 1024, cache = new Map()
  const absOf = u => { try { return new URL(u, base).href } catch { return u } }
  const grab = async u => {
    if (/^data:/.test(u)) return null
    const a = absOf(u); if (cache.has(a)) return cache.get(a)
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), PER)
    let out = null
    try {
      const r = await fetch(a, { redirect: 'follow', signal: ctrl.signal })
      if (r.ok) { const buf = Buffer.from(await r.arrayBuffer())
        if (buf.length && buf.length <= MAX) out = `data:${(r.headers.get('content-type') || 'application/octet-stream').split(';')[0]};base64,${buf.toString('base64')}` }
    } catch {} finally { clearTimeout(t) }
    cache.set(a, out); return out
  }
  const urls = new Set()
  for (const m of html.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) if (!/^data:/.test(m[2])) urls.add(m[2])
  for (const m of html.matchAll(/<img\b[^>]*?\ssrc=(['"])([^'"]+)\1/gi)) if (!/^data:/.test(m[2])) urls.add(m[2])
  const list = [...urls].slice(0, 500), map = new Map(), CONC = 8
  for (let i = 0; i < list.length; i += CONC) {
    const batch = list.slice(i, i + CONC), got = await Promise.all(batch.map(grab))
    got.forEach((d, j) => { if (d) map.set(batch[j], d) })
  }
  let out = html.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, _q, u) => { const d = map.get(u); return d ? `url("${d}")` : m })
  out = out.replace(/(<img\b[^>]*?\ssrc=)(['"])([^'"]+)\2/gi, (m, pre, q, u) => { const d = map.get(u); return d ? `${pre}${q}${d}${q}` : m })
  return { html: out, embedded: map.size, referenced: urls.size }
}

/* --------------------------------- CLI --------------------------------- */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`
  uiforge-freeze — the faithful, offline ORACLE (real CSS, frozen DOM, no scripts).

  node uiforge-freeze.mjs <url│file.html> [--out freeze.html] [--viewport 1440x900] [--inline]
                          [--shot ref.png] [--full-shot ref-full.png] [--headed] [--profile dir] [--live-timers]

  --inline embeds every font/image/background as a data: URI (server-side, past CORS) → a
           TRULY self-contained single file that renders offline, real webfonts and all.

  Keeps the site's REAL stylesheets + fully-rendered DOM — unlike uiforge-reconstruct,
  which re-derives every style from computed values and drifts (collapse, empty boxes).
  Renders pixel-faithful to the live site; deterministic because every <script> is stripped
  AND time is stopped at the snapshot instant (carousels/rotators frozen mid-frame).
  --shot saves a live screenshot at that exact frozen instant — the aligned proof pair.
  --live-timers opts out of the time-stop. The baseline the clean React rebuild is diffed against.
`)
    process.exit(0)
  }
  const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
  const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
  const outPath = valAt('--out') || 'freeze.html'
  const valueIdx = new Set(); for (const nm of ['--out', '--viewport', '--shot', '--full-shot', '--profile']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
  const target = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
  if (!target) { console.error('  no target given — pass a url or a .html file'); process.exit(1) }

  const snap = await freeze(target, { width: vw, height: vh }, {
    headed: argv.includes('--headed'), liveTimers: argv.includes('--live-timers'),
    shot: valAt('--shot'), fullShot: valAt('--full-shot'), profile: valAt('--profile'),
  })
  if (!snap || !snap.html) { console.error('  freeze failed: no document captured'); process.exit(2) }
  const sheets = await fetchSheets(snap.sheets || [])
  let { html, origin, linksRemoved, scriptsRemoved } = assemble(snap, sheets)
  let inlined = null
  if (argv.includes('--inline')) { const r = await inlineAssets(html, origin || snap.href); html = r.html; inlined = r }
  writeFileSync(outPath, html)

  const okSheets = sheets.filter(s => s.ok && s.css).length
  const failSheets = sheets.length - okSheets
  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', Y = '\x1b[33m', X = '\x1b[0m'
  console.log(`\n  ${B}UIForge freeze${X} ${D}← ${target}${X}`)
  console.log(`    ${C}stylesheets${X} ${okSheets} inlined${failSheets ? ` ${Y}(${failSheets} failed)${X}` : ''} · ${C}base${X} ${origin || '—'}`)
  console.log(`    ${C}stripped${X}    ${linksRemoved} <link> · ${scriptsRemoved} <script>  ${D}@ ${vw}×${vh}${X}`)
  if (inlined) console.log(`    ${C}inlined${X}     ${G}${inlined.embedded}${X}/${inlined.referenced} assets as data URIs ${D}— single-file, offline${X}`)
  console.log(`\n  ${G}→ ${outPath}${X} ${D}(${(html.length / 1024).toFixed(0)} KB)${X}\n`)
}

export { freeze, fetchSheets, rewriteCssUrls, assemble }
