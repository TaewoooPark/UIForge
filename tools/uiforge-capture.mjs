#!/usr/bin/env node
// uiforge-capture — stage 1 of the clone pipeline.
//
// Render a reference and extract its FULL design, not a summary: every
// reproduction-relevant computed style per element, geometry, text, and assets,
// plus a deduped token set (the design system's palette, type scale, spacing,
// radii, shadows, and fonts). This is the raw material a faithful, editable
// React + Tailwind reconstruction is built from.
//
// Usage:
//   node uiforge-capture.mjs <url│file.html> [--out capture.json] [--viewport 1440x900] [--json] [--summary]
//
// Needs Playwright:  npm i -D playwright && npx playwright install chromium

import process from 'node:process'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'

/* ------------------------------- playwright ------------------------------- */
async function loadChromium() {
  const pick = m => m && (m.chromium ?? (m.default && m.default.chromium))
  try { const c = pick(await import('playwright')); if (c) return c } catch {}
  try {
    const { createRequire } = await import('node:module')
    const require = createRequire(import.meta.url)
    const entry = require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(/[:;]/)].filter(Boolean) })
    const c = pick(await import(pathToFileURL(entry).href)); if (c) return c
  } catch {}
  return null
}

/* --------------------- in-page rich extraction (browser) --------------------- */
// Serialized to the page. Returns { viewport, nodes:[…] } with the full style set.
function CAPTURE() {
  const V = { w: window.innerWidth, h: window.innerHeight }
  // reproduction-relevant properties, short keys to keep the file lean
  const PROPS = {
    dsp: 'display', pos: 'position', top: 'top', rgt: 'right', bot: 'bottom', lft: 'left', z: 'zIndex', ov: 'overflow',
    fd: 'flexDirection', fw: 'flexWrap', jc: 'justifyContent', ai: 'alignItems', gap: 'gap',
    gtc: 'gridTemplateColumns', gtr: 'gridTemplateRows', gcol: 'gridColumn', grow_: 'gridRow',
    fg: 'flexGrow', fsh: 'flexShrink', fb: 'flexBasis',
    mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft',
    pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft',
    ff: 'fontFamily', fs: 'fontSize', fwt: 'fontWeight', fst: 'fontStyle', lh: 'lineHeight',
    ls: 'letterSpacing', ta: 'textAlign', tt: 'textTransform', td: 'textDecorationLine', col: 'color', ws: 'whiteSpace',
    bc: 'backgroundColor', bi: 'backgroundImage', bsz: 'backgroundSize', bp: 'backgroundPosition', br: 'backgroundRepeat',
    bwt: 'borderTopWidth', bwr: 'borderRightWidth', bwb: 'borderBottomWidth', bwl: 'borderLeftWidth', bst: 'borderTopStyle',
    bct: 'borderTopColor', bcr: 'borderRightColor', bcb: 'borderBottomColor', bcl: 'borderLeftColor',
    rtl: 'borderTopLeftRadius', rtr: 'borderTopRightRadius', rbr: 'borderBottomRightRadius', rbl: 'borderBottomLeftRadius',
    sh: 'boxShadow', op: 'opacity', flt: 'filter', bdf: 'backdropFilter', tf: 'transform', tr: 'transition', mbm: 'mixBlendMode',
    an: 'animationName', ad: 'animationDuration', atf: 'animationTimingFunction', adl: 'animationDelay',
    aic: 'animationIterationCount', adr: 'animationDirection', afm: 'animationFillMode',
  }
  const DEFAULTS = { // omit these to keep the file lean
    dsp: 'block', pos: 'static', top: 'auto', rgt: 'auto', bot: 'auto', lft: 'auto', z: 'auto', ov: 'visible',
    fd: 'row', fw: 'nowrap', jc: 'normal', ai: 'normal', gap: 'normal', gtc: 'none', gtr: 'none', gcol: 'auto', grow_: 'auto',
    fg: '0', fsh: '1', fb: 'auto', mt: '0px', mr: '0px', mb: '0px', ml: '0px', pt: '0px', pr: '0px', pb: '0px', pl: '0px',
    fst: 'normal', ls: 'normal', ta: 'start', tt: 'none', td: 'none', ws: 'normal',
    bi: 'none', bsz: 'auto', bp: '0% 0%', br: 'repeat', bwt: '0px', bwr: '0px', bwb: '0px', bwl: '0px', bst: 'none',
    rtl: '0px', rtr: '0px', rbr: '0px', rbl: '0px', sh: 'none', op: '1', flt: 'none', bdf: 'none', tf: 'none', tr: 'all 0s ease 0s', mbm: 'normal',
    an: 'none', ad: '0s', atf: 'ease', adl: '0s', aic: '1', adr: 'normal', afm: 'none',
  }
  const directText = el => { let s = ''; for (const c of el.childNodes) if (c.nodeType === 3) s += c.textContent; return s.trim() }
  const all = [...document.querySelectorAll('body *')]
  const idOf = new Map(); all.forEach((el, i) => idOf.set(el, i))
  const captured = new Set()   // elements we actually kept — so children reparent to the nearest KEPT ancestor
  const nodes = []
  for (const el of all) {
    if (el.closest('svg') && el.tagName.toLowerCase() !== 'svg') continue   // capture <svg> whole, skip its internals
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width < 1 && r.height < 1) continue
    if (r.bottom < -200 || r.top > V.h * 6) continue
    const style = {}
    for (const [k, prop] of Object.entries(PROPS)) {
      const v = cs[prop]
      if (v != null && v !== '' && v !== DEFAULTS[k]) style[k] = v
    }
    const txt = directText(el)
    const tag = el.tagName.toLowerCase()
    // reparent to the nearest ANCESTOR WE KEPT — box-less wrappers (display:contents,
    // 0×0, opacity:0) are skipped, and pointing pid at a skipped element orphans the
    // subtree to root. Ancestors precede this node in document order, so `captured` is
    // already populated for them. This is what keeps e.g. a nav's links inside the nav.
    let pe = el.parentElement
    while (pe && !captured.has(pe)) pe = pe.parentElement
    const node = {
      i: idOf.get(el), pid: pe ? idOf.get(pe) : -1, tag,
      x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
      cls: (typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 4).join(' ') : '') || undefined,
      role: el.getAttribute('role') || undefined,
      style,
    }
    // Mixed inline content — "AI <a>research</a> and <a>products</a> that put safety…" —
    // has text INTERLEAVED with child elements. Capture that ordering so it survives:
    //   pre  = the text right before this element inside its parent (incl. its whitespace)
    //   text = the element's own text, but only when it has no element children (a leaf)
    //   post = the trailing text after this element's LAST child
    // Downstream, a parent renders  child.pre + child + … + parent.post , in order.
    const hasEls = el.children.length > 0
    if (txt && !hasEls) node.text = txt.slice(0, 400)
    { let p = '', s = el.previousSibling; while (s && s.nodeType === 3) { p = s.textContent + p; s = s.previousSibling }
      p = p.replace(/\s+/g, ' '); if (p && p !== '' && /\S|^ $/.test(p)) node.pre = p.slice(0, 400) }
    if (hasEls) { let q = '', c = el.lastChild; while (c && c.nodeType === 3) { q = c.textContent + q; c = c.previousSibling }
      q = q.replace(/\s+/g, ' '); if (q && /\S|^ $/.test(q)) node.post = q.slice(0, 400) }
    if (tag === 'a') node.href = el.getAttribute('href') || undefined
    if (tag === 'img') { node.src = el.currentSrc || el.getAttribute('src') || undefined; node.alt = el.getAttribute('alt') || undefined }
    if (tag === 'svg') { try { node.svgHTML = el.outerHTML.slice(0, 40000) } catch { node.svg = true } }
    if (/^h[1-6]$/.test(tag)) node.level = +tag[1]
    for (const [slot, pe] of [['before', '::before'], ['after', '::after']]) {   // decorative pseudo-elements
      const pcs = getComputedStyle(el, pe), content = pcs.content
      if (!content || content === 'none' || content === 'normal') continue
      const ps = {}
      for (const [k, prop] of Object.entries(PROPS)) { const v = pcs[prop]; if (v != null && v !== '' && v !== DEFAULTS[k]) ps[k] = v }
      ps.w = pcs.width; ps.h = pcs.height
      node[slot] = { content: content.replace(/^["']|["']$/g, '').slice(0, 120), style: ps }
    }
    nodes.push(node)
    captured.add(el)
    if (nodes.length >= 2500) break
  }
  // the reference's own stylesheet links (they serve its webfonts) — re-injected by the
  // reconstruction so text renders in the real face; the replayed inline styles win.
  const sheets = [...new Set([...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href)
    .concat([...document.styleSheets].map(s => s.href)).filter(Boolean))].slice(0, 60)
  const fontFaces = []
  try { for (const ss of document.styleSheets) { try { for (const rule of ss.cssRules) if (rule.constructor.name === 'CSSFontFaceRule') fontFaces.push(rule.cssText) } catch {} } } catch {}
  return { viewport: V, url: location.href, title: document.title, sheets, fontFaces: fontFaces.slice(0, 60), nodes }
}

/* ------------------------- token dedup (design system) ------------------------- */
const isColor = s => /^rgba?\(|^#/.test(String(s || ''))
function tokenize(nodes) {
  const bump = (m, k) => { if (k == null || k === '') return; m.set(k, (m.get(k) || 0) + 1) }
  const colors = new Map(), fonts = new Map(), sizes = new Map(), weights = new Map(),
    space = new Map(), radii = new Map(), shadows = new Map(), gradients = new Map()
  for (const n of nodes) {
    const s = n.style || {}
    for (const key of ['col', 'bc', 'bct', 'bcr', 'bcb', 'bcl']) if (isColor(s[key])) bump(colors, s[key])
    if (s.ff) bump(fonts, s.ff.split(',')[0].replace(/["']/g, '').trim())
    if (s.fs) bump(sizes, s.fs)
    if (s.fwt) bump(weights, s.fwt)
    for (const key of ['mt', 'mr', 'mb', 'ml', 'pt', 'pr', 'pb', 'pl', 'gap']) if (s[key] && /px$/.test(s[key])) bump(space, s[key])
    for (const key of ['rtl', 'rtr', 'rbr', 'rbl']) if (s[key] && s[key] !== '0px') bump(radii, s[key])
    if (s.sh && s.sh !== 'none') bump(shadows, s.sh)
    if (s.bi && /gradient/.test(s.bi)) bump(gradients, s.bi)
  }
  const rank = m => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => ({ v, n }))
  const px = m => rank(m).map(o => ({ ...o, px: parseFloat(o.v) })).sort((a, b) => a.px - b.px)
  return {
    colors: rank(colors), fonts: rank(fonts), fontSizes: px(sizes), fontWeights: rank(weights),
    spacing: px(space), radii: px(radii), shadows: rank(shadows).slice(0, 12), gradients: rank(gradients).slice(0, 12),
  }
}

/* --------------- server-side @font-face recovery (no CORS) --------------- */
// The browser can't read cross-origin cssRules, so the in-page @font-face scan comes
// back empty. But Node fetching the same stylesheet URLs isn't subject to CORS — and
// the font files themselves are public (served with Access-Control-Allow-Origin: *),
// so once the rule is declared they load cross-origin from a file:// reconstruction.
// This is what recovers the reference's REAL typeface instead of a system fallback.
// Also recovers the @keyframes rules for the animations actually in use — same server-side
// fetch, so CSS-defined MOTION (spinners, slide/fade-ins, the nav-arrow) comes across too.
async function recoverCss(sheetHrefs, already = [], usedAnim = new Set()) {
  const faces = [], seen = new Set(), kf = new Map()
  const keyOf = b => {
    const g = re => (b.match(re) || [])[1]?.trim().toLowerCase() || ''
    return `${g(/font-family:\s*([^;}]+)/i)}|${g(/font-weight:\s*([^;}]+)/i)}|${g(/font-style:\s*([^;}]+)/i)}`
  }
  const push = b => { const k = keyOf(b); if (seen.has(k)) return; seen.add(k); faces.push(b) }
  for (const b of already) push(String(b).replace(/\s+/g, ' ').trim())
  await Promise.all((sheetHrefs || []).map(async href => {
    try {
      const res = await fetch(href, { redirect: 'follow' }); if (!res.ok) return
      const css = await res.text()
      for (let block of (css.match(/@font-face\s*\{[^}]*\}/gi) || [])) {
        block = block.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (_m, _q, u) => {
          if (/^data:/.test(u)) return `url(${u})`
          try { return `url("${new URL(u, href).href}")` } catch { return `url("${u}")` }
        }).replace(/\s+/g, ' ').trim()
        push(block)
      }
      // @keyframes <name> { ... } — nested braces, so match one level of them
      for (const block of (css.match(/@(?:-webkit-)?keyframes\s+[\w-]+\s*\{(?:[^{}]|\{[^{}]*\})*\}/gi) || [])) {
        const name = (block.match(/keyframes\s+([\w-]+)/i) || [])[1]
        if (name && usedAnim.has(name) && !kf.has(name)) kf.set(name, block.replace(/\s+/g, ' ').trim())
      }
    } catch {}
  }))
  return { fontFaces: faces.slice(0, 40), keyframes: [...kf.values()].slice(0, 40) }
}

/* ------------------------------- harness ------------------------------- */
async function capture(target, viewport) {
  const chromium = await loadChromium()
  if (!chromium) { console.error('\n  Playwright not found:  npm i -D playwright && npx playwright install chromium\n'); process.exit(3) }
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(path.resolve(target)).href
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport })
    await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url, { timeout: 30000 }).catch(() => {}))
    await page.waitForTimeout(700)
    await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height > 140) el.remove() } document.documentElement.style.overflow = 'auto' }).catch(() => {})
    await page.waitForTimeout(300)
    var snap = await page.evaluate(`(${CAPTURE.toString()})()`)
  } finally { await browser.close() }
  // server-side: recover the @font-face + used @keyframes rules the browser can't read past CORS
  const usedAnim = new Set()
  for (const n of snap.nodes) { const a = (n.style || {}).an; if (a && a !== 'none') for (const nm of a.split(',')) usedAnim.add(nm.trim()) }
  const rec = await recoverCss(snap.sheets, snap.fontFaces || [], usedAnim)
  snap.fontFaces = rec.fontFaces
  snap.keyframes = rec.keyframes
  return snap
}

/* --------------------------------- CLI --------------------------------- */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`
  uiforge-capture — a reference's full design, extracted (stage 1 of the clone pipeline).

  node uiforge-capture.mjs <url│file.html> [--out capture.json] [--viewport 1440x900] [--summary] [--json]

  Emits capture.json — the styled element tree + a deduped token set (palette,
  type scale, spacing, radii, shadows, fonts). The raw material for reconstruction.
`)
    process.exit(0)
  }
  const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
  const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
  const outPath = valAt('--out') || 'capture.json'
  const valueIdx = new Set(); for (const nm of ['--out', '--viewport']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
  const target = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))

  const snap = await capture(target, { width: vw, height: vh })
  const tokens = tokenize(snap.nodes)
  const out = { source: target, capturedAt: null, viewport: snap.viewport, title: snap.title, sheets: snap.sheets || [], fontFaces: snap.fontFaces || [], keyframes: snap.keyframes || [], tokens, nodes: snap.nodes }

  if (argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0) }
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')

  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
  console.log(`\n  ${B}UIForge capture${X} ${D}← ${target}${X}`)
  console.log(`    ${snap.nodes.length} nodes @ ${vw}×${vh}`)
  console.log(`    ${C}palette${X}    ${tokens.colors.slice(0, 8).map(c => c.v).join('  ')}${tokens.colors.length > 8 ? ` ${D}(+${tokens.colors.length - 8})${X}` : ''}`)
  console.log(`    ${C}fonts${X}      ${tokens.fonts.slice(0, 4).map(f => f.v).join(', ') || '—'}`)
  console.log(`    ${C}type scale${X} ${tokens.fontSizes.map(s => s.v).join(' ')}`)
  console.log(`    ${C}spacing${X}    ${tokens.spacing.slice(0, 12).map(s => s.v).join(' ')}`)
  console.log(`    ${C}radii${X}      ${tokens.radii.map(r => r.v).join(' ') || '—'}`)
  console.log(`    ${C}shadows${X}    ${tokens.shadows.length} distinct · ${C}gradients${X} ${tokens.gradients.length}`)
  console.log(`\n  ${G}→ ${outPath}${X}  ${D}(${(JSON.stringify(out).length / 1024).toFixed(0)} KB)${X}\n`)
}

export { capture, tokenize, CAPTURE, loadChromium }
