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
  return { viewport: V, url: location.href, title: document.title, sheets, fontFaces: fontFaces.slice(0, 60), nodes, canvasCount: document.querySelectorAll('canvas').length }
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
// visual props that are safe to change on :hover/:focus (won't reflow the layout)
const INTERACT_PROPS = /^(color|background|background-color|background-image|border|border-[\w-]*color|border-color|box-shadow|opacity|transform|scale|translate|rotate|filter|backdrop-filter|text-decoration[\w-]*|outline[\w-]*|fill|stroke|--[\w-]+)$/
async function recoverCss(sheetHrefs, already = [], usedAnim = new Set()) {
  const faces = [], seen = new Set(), kf = new Map(), interRules = []
  // pull the :hover/:focus/:active rules where the pseudo is on the LAST simple selector
  // (the styled element IS the interactive one — the common, replayable case)
  const scanInteractions = css => {
    for (const m of css.matchAll(/([^{}@]+?)\{([^{}]*)\}/g)) {
      const sel = m[1].trim(), body = m[2]
      if (!/:(hover|focus|focus-visible|active)/.test(sel)) continue
      for (let sub of sel.split(',')) {
        const mm = sub.trim().match(/^(.*?)\s*:(hover|focus|focus-visible|active)$/)
        if (!mm || !mm[1] || /::/.test(mm[1])) continue
        const decl = body.split(';').map(d => d.trim()).filter(d => { const p = d.split(':')[0]?.trim().toLowerCase(); return p && INTERACT_PROPS.test(p) }).join(';')
        if (decl) interRules.push({ base: mm[1].trim(), pseudo: mm[2] === 'focus-visible' ? 'focus' : mm[2], decl })
      }
    }
  }
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
      scanInteractions(css)
    } catch {}
  }))
  // de-dupe interaction rules and cap (a huge site can have hundreds)
  const seenR = new Set(), rules = []
  for (const r of interRules) { const k = `${r.pseudo}|${r.base}|${r.decl}`; if (seenR.has(k)) continue; seenR.add(k); rules.push(r) }
  return { fontFaces: faces.slice(0, 40), keyframes: [...kf.values()].slice(0, 40), interRules: rules.slice(0, 600) }
}

// Record each on-screen <canvas> to a WebM via captureStream() + MediaRecorder (runs in
// the page — the only way to tap live WebGL/2d pixels). Returns [{ i, w, h, b64 }] keyed by
// the same body-order index the node tree uses, so reconstruct can place the <video> exactly.
async function recordCanvases(page, secs) {
  return await page.evaluate(async (secs) => {
    const all = [...document.querySelectorAll('body *')]
    const out = []
    for (let i = 0; i < all.length && out.length < 4; i++) {
      const el = all[i]
      if (el.tagName !== 'CANVAS') continue
      const r = el.getBoundingClientRect()
      if (r.width < 40 || r.height < 40) continue
      if (typeof el.captureStream !== 'function') continue
      try {
        const stream = el.captureStream(30)
        const rec = new MediaRecorder(stream, { mimeType: 'video/webm' })
        const chunks = []; rec.ondataavailable = e => e.data.size && chunks.push(e.data)
        rec.start(); await new Promise(r => setTimeout(r, secs * 1000))
        await new Promise(r => { rec.onstop = r; rec.stop() })
        const buf = await new Blob(chunks, { type: 'video/webm' }).arrayBuffer()
        let bin = ''; const bytes = new Uint8Array(buf); for (let j = 0; j < bytes.length; j++) bin += String.fromCharCode(bytes[j])
        if (bytes.length > 1024) out.push({ i, w: Math.round(r.width), h: Math.round(r.height), b64: btoa(bin) })
      } catch {}
    }
    return out
  }, secs)
}

// Sample JS-driven motion (Framer Motion / GSAP / rAF loops) that isn't in any stylesheet:
// watch each in-view element's transform+opacity over ~1.3s, and for the ones that actually
// move, synthesize an approximating looping @keyframes. Approximate by construction — it
// reproduces property-based motion (translate/scale/rotate/fade), not physics or canvas.
async function sampleJsMotion(page) {
  return await page.evaluate(async () => {
    const all = [...document.querySelectorAll('body *')], idx = new Map(all.map((el, i) => [el, i]))
    const cands = all.filter(el => { const r = el.getBoundingClientRect(); const c = getComputedStyle(el)
      return r.width > 16 && r.height > 16 && r.top < innerHeight && r.bottom > 0 && c.animationName === 'none' }).slice(0, 300)
    const N = 14, track = new Map()
    for (let f = 0; f < N; f++) {
      for (const el of cands) { const c = getComputedStyle(el); const k = `${c.transform}|${c.opacity}`
        if (!track.has(el)) track.set(el, []); track.get(el).push(k) }
      await new Promise(r => setTimeout(r, 90))
    }
    const out = []
    for (const [el, keys] of track) {
      if (new Set(keys).size < 3) continue                       // didn't move → not animated
      if (keys.every(k => k.startsWith('none|'))) continue       // opacity-only flicker w/o transform: skip noise
      const frames = []
      for (let f = 0; f < N; f++) { const [tf, op] = keys[f].split('|'); const pct = Math.round(f / (N - 1) * 100)
        const prev = frames[frames.length - 1]
        const rule = `${tf !== 'none' ? `transform:${tf};` : ''}opacity:${op}`
        if (!prev || prev.rule !== rule) frames.push({ pct, rule }) }
      if (frames.length < 2) continue
      out.push({ i: idx.get(el), kf: frames.map(fr => `${fr.pct}%{${fr.rule}}`).join(''), dur: (N * 0.09).toFixed(2) })
    }
    return out.slice(0, 40)
  })
}

/* ------------------------------- harness ------------------------------- */
async function capture(target, viewport, opts = {}) {
  const chromium = await loadChromium()
  if (!chromium) { console.error('\n  Playwright not found:  npm i -D playwright && npx playwright install chromium\n'); process.exit(3) }
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(path.resolve(target)).href
  // --headed launches a real (non-headless) browser with the automation fingerprint hidden —
  // this clears the basic Cloudflare / bot JS challenge that returns "Just a moment…" to headless.
  const browser = await chromium.launch(opts.headed ? { headless: false, args: ['--disable-blink-features=AutomationControlled'] } : {})
  try {
    const page = await browser.newPage({ viewport, ...(opts.headed ? { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36' } : {}) })
    if (opts.headed) await page.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => undefined }) })
    // A stray toggle click can pop an alert()/confirm()/beforeunload — that would BLOCK the page
    // and hang the exploration evaluate forever. Auto-dismiss so interaction probing stays safe.
    page.on('dialog', d => d.dismiss().catch(() => {}))
    await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url, { timeout: 30000 }).catch(() => {}))
    await page.waitForTimeout(700)
    // Scroll the whole page so IntersectionObserver reveals fire and lazy media loads —
    // otherwise below-fold sections are captured in their initial hidden state (opacity:0,
    // translated) and reconstruct blank. reduced-motion makes the reveals settle instantly.
    const prime = async () => { await page.evaluate(async () => {
      const step = Math.max(200, window.innerHeight * 0.8)
      for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 90)) }
      window.scrollTo(0, 0)
    }).catch(() => {}) }
    await prime()
    await page.waitForTimeout(400)
    // Explore disclosure toggles (dropdowns, mega-menus, popovers, <details>) BEFORE the
    // sticky/fixed chrome is stripped — header nav menus live in exactly that chrome, so they
    // must still be mountable here. Each opened panel's styles are captured now (portal-aware);
    // results map back onto the post-removal snapshot by marker. Safe: clicks are restored,
    // navigations reverted, scroll reset. 75s backstop in case a probe wedges the page.
    const toggleFindings = await Promise.race([
      exploreToggles(page),
      new Promise(res => setTimeout(() => res({ findings: [], detected: 0, timedOut: true }), 75000)),
    ])
    // Close any stray modal/menu the probing left open, park the mouse, then strip sticky/fixed
    // chrome. NOTE: we HIDE sticky chrome with display:none rather than el.remove() — removing a
    // node the toggle probing just touched makes some frameworks (e.g. Stripe) thrash their
    // MutationObservers and wedge the renderer, stalling the geometry evaluate indefinitely.
    // display:none is captured-identically (CAPTURE skips it) and, for out-of-flow fixed/sticky
    // boxes, leaves every other element's geometry untouched — same snapshot, no wedge.
    await page.keyboard.press('Escape').catch(() => {})
    await page.mouse.move(2, 2).catch(() => {})
    await page.waitForTimeout(150)
    const removeSticky = () => page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height > 140) el.style.setProperty('display', 'none', 'important') } document.documentElement.style.overflow = 'auto' }).catch(() => {})
    await removeSticky()
    await page.waitForTimeout(300)
    // Geometry snapshot, stall-guarded: if a page is ever hostile enough to stall CAPTURE, one
    // reload + retry (toggle data is already captured) yields a clean pass.
    var snap
    try {
      snap = await Promise.race([
        page.evaluate(`(${CAPTURE.toString()})()`),
        new Promise((_, rej) => setTimeout(() => rej(new Error('CAPTURE-timeout')), 30000)),
      ])
    } catch {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(700); await prime(); await page.waitForTimeout(400); await removeSticky(); await page.waitForTimeout(300)
      snap = await page.evaluate(`(${CAPTURE.toString()})()`)
    }
    // server-side (no CORS): recover @font-face + used @keyframes + the :hover/:focus rules
    const usedAnim = new Set()
    for (const n of snap.nodes) { const a = (n.style || {}).an; if (a && a !== 'none') for (const nm of a.split(',')) usedAnim.add(nm.trim()) }
    const rec = await recoverCss(snap.sheets, snap.fontFaces || [], usedAnim)
    snap.fontFaces = rec.fontFaces; snap.keyframes = rec.keyframes
    // match the interaction rules to elements IN the page (querySelectorAll needs the DOM),
    // and attach each element's hover/focus/active declarations to its node by body-index.
    if (rec.interRules.length) {
      const map = await page.evaluate((rules) => {
        const all = [...document.querySelectorAll('body *')], idx = new Map(all.map((el, i) => [el, i])), out = {}
        for (const r of rules) { let els; try { els = document.querySelectorAll(r.base) } catch { continue }
          for (const el of els) { const i = idx.get(el); if (i == null) continue; (out[i] ||= {}); out[i][r.pseudo] = (out[i][r.pseudo] || '') + r.decl + ';' } }
        return out
      }, rec.interRules)
      for (const n of snap.nodes) { const m = map[n.i]; if (!m) continue; if (m.hover) n.hover = m.hover; if (m.focus) n.focus = m.focus; if (m.active) n.active = m.active }
    }
    // Canvas/WebGL can't be reproduced from computed styles — the pixels are drawn
    // imperatively. So we RECORD it: captureStream() → MediaRecorder → a WebM the
    // reconstruction embeds as a looping <video>. Opt-in (--record-canvas) — each clip ~2s.
    if (opts.recordCanvas) snap.canvasVideos = await recordCanvases(page, opts.canvasSecs || 2.2)
    // Sample JS-driven motion → synthesized looping @keyframes on the elements that move.
    // Lift reduced-motion first (we set it for a stable snapshot; but it also freezes the very
    // JS motion we want to sample — most well-behaved sites honor it).
    if (opts.sampleMotion) {
      await page.emulateMedia({ reducedMotion: 'no-preference' }).catch(() => {})
      await page.waitForTimeout(250)
      const byId0 = new Map(snap.nodes.map(n => [n.i, n]))
      for (const m of await sampleJsMotion(page)) { const n = byId0.get(m.i); if (n) n.motion = { kf: m.kf, dur: m.dur } } }
    // Fold the (pre-removal) toggle exploration onto the snapshot: attach open styles to a
    // resting panel node when one survives, else keep a self-contained record in snap.toggles.
    await resolveToggles(page, snap, toggleFindings.findings)
    // Real hover-diff for interactive elements whose stylesheet-derived hover came back empty —
    // recovers JS-driven hovers, and honestly counts the rest as 'hover:js-or-none'.
    const hoverSample = await Promise.race([
      hoverDiffSample(page, snap),
      new Promise(res => setTimeout(() => res({ candidates: 0, sampled: 0, recovered: 0, jsOrNone: 0 }), 40000)),
    ])
    // Coverage manifest — FOUND vs CAPTURED vs SKIPPED(reason) for every dynamic dimension.
    snap.coverage = buildCoverage({ snap, interRules: rec.interRules, usedAnim, opts, toggleFindings, hoverSample })
    // --responsive: reconcile (a second read catches A/B or animated drift) + a mobile
    // re-capture whose per-node style diffs become node.mq.sm → responsive Tailwind variants.
    if (opts.responsive) {
      try {
        const snap2 = await page.evaluate(`(${CAPTURE.toString()})()`)
        const s2 = new Map((snap2.nodes || []).map(n => [n.i, n]))
        let sampled = 0, changed = 0
        for (const n of snap.nodes) { const b = s2.get(n.i); sampled++; if (!b || (n.text || '') !== (b.text || '') || Math.abs((n.y || 0) - (b.y || 0)) > 4) changed++ }
        if (snap.coverage) snap.coverage.stability = { sampledNodes: sampled, changedNodes: changed, note: changed > sampled * 0.05 ? 'A/B or animated content detected — some regions differ run-to-run' : 'stable across two reads' }
        await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(500)
        const mob = await page.evaluate(`(${CAPTURE.toString()})()`)
        const mById = new Map((mob.nodes || []).map(n => [n.i, n]))
        const RP = ['dsp', 'fd', 'fw', 'jc', 'ai', 'gap', 'fs', 'lh', 'pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml', 'ta']
        let respCount = 0
        for (const n of snap.nodes) {
          const m = mById.get(n.i)
          if (!m) { n.mq = { sm: { hidden: 1 } }; respCount++; continue }
          const d = {}
          for (const k of RP) { const a = (n.style || {})[k] || '', b = (m.style || {})[k] || ''; if (a !== b) d[k] = b }
          // width is left fluid (everything narrows to fit) — only LAYOUT diffs are worth a variant
          if (Object.keys(d).length) { n.mq = { sm: d }; respCount++ }
        }
        if (snap.coverage) snap.coverage.responsive = { nodesWithOverrides: respCount, mobileViewport: '390x844' }
      } catch {}
    }
  } finally { await browser.close() }
  return snap
}

// Explore disclosure toggles — dropdowns, mega-menus, popovers, accordions, <details>.
// Broadened well past aria-controls: also [aria-haspopup] and [aria-expanded] WITHOUT a wired
// target (nearest visible panel is used), plus <summary>. PORTAL-AWARE — if the aria-controls
// target is missing OR doesn't change, it finds the element that BECAME visible (display:none /
// height:0 → shown) or was NEWLY INSERTED anywhere in the DOM, and records THAT as the panel.
// Both hover- and click-triggered menus are nudged open. Runs BEFORE sticky/fixed chrome is
// stripped so header menus are present. Every interaction is restored; navigations reverted.
// Returns { findings:[{k,sel,captured,kind,open,html,reason,…}], detected } — 'detected' is the
// count of visible toggle-like elements found (may exceed the explored cap).
async function exploreToggles(page) {
  try {
    return await page.evaluate(async () => {
      const startHref = location.href
      const fire = (el, type, Ctor) => { try { el.dispatchEvent(new Ctor(type, { bubbles: true, cancelable: true, view: window })) } catch {} }
      const PE = window.PointerEvent || MouseEvent
      const openSeq = (el, allowClick) => {   // nudge hover- and click-opened menus alike
        try { el.focus && el.focus() } catch {}
        fire(el, 'pointerover', PE); fire(el, 'pointerenter', PE); fire(el, 'mouseover', MouseEvent); fire(el, 'mouseenter', MouseEvent)
        if (allowClick) { fire(el, 'pointerdown', PE); fire(el, 'mousedown', MouseEvent); fire(el, 'pointerup', PE); fire(el, 'mouseup', MouseEvent); try { el.click() } catch {} }
      }
      const closeSeq = el => { fire(el, 'mouseout', MouseEvent); fire(el, 'mouseleave', MouseEvent); try { el.blur && el.blur() } catch {} }
      const isVis = el => { if (!el || el.nodeType !== 1) return false
        const c = getComputedStyle(el); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false
        const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
      const area = el => { const r = el.getBoundingClientRect(); return r.width * r.height }
      const bag = el => { const c = getComputedStyle(el), r = el.getBoundingClientRect()
        return { dsp: c.display, pos: c.position, op: c.opacity, vis: c.visibility, h: c.height, mh: c.maxHeight, tf: c.transform, z: c.zIndex, bc: c.backgroundColor, bi: c.backgroundImage, sh: c.boxShadow, pe: c.pointerEvents, ov: c.overflow, x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), ht: Math.round(r.height) } }
      const desc = el => { const id = el.id ? '#' + el.id : ''
        const cl = (typeof el.className === 'string' && el.className.trim()) ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
        return el.tagName.toLowerCase() + id + cl }
      // ---- broadened candidate detection ----
      const set = new Set()
      for (const sel of ['[aria-controls]', '[aria-haspopup]', '[aria-expanded]', 'summary']) document.querySelectorAll(sel).forEach(e => set.add(e))
      const filtered = [...set].filter(el => {
        if (el.tagName === 'SUMMARY') return true
        const hp = el.hasAttribute('aria-haspopup'), ex = el.hasAttribute('aria-expanded'), ac = el.hasAttribute('aria-controls')
        if (!(hp || ex || ac)) return false
        if (el.tagName === 'A') { const h = el.getAttribute('href') || ''; if (h && !h.startsWith('#') && !(hp || ex)) return false }  // don't click plain nav links
        return true
      })
      const vis = filtered.filter(isVis), cands = vis.slice(0, 30)
      const findings = []
      let k = 0
      const t0 = Date.now()
      const navGuard = e => { try { const a = e.target && e.target.closest && e.target.closest('a[href]'); if (a) e.preventDefault() } catch {} }
      document.addEventListener('click', navGuard, true)   // synthetic clicks must never navigate away
      for (const el of cands) {
        if (Date.now() - t0 > 22000) break   // in-page time budget — a slow/heavy menu never stalls the capture
        const rec = { k, tag: el.tagName.toLowerCase(), sel: desc(el), controls: el.getAttribute('aria-controls') || null, haspopup: el.getAttribute('aria-haspopup') || null }
        const allowClick = el.tagName !== 'A'   // hover-only for <a> so we never navigate
        let target = rec.controls ? document.getElementById(rec.controls) : null
        if (!target && el.tagName === 'SUMMARY') target = el.closest('details')
        if (!target && !rec.controls) target = el.nextElementSibling && !isVis(el.nextElementSibling) ? el.nextElementSibling : null  // nearest following panel
        const targetClosed = target ? bag(target) : null
        const preEls = new Set(document.querySelectorAll('body *'))
        const preSmall = []   // elements ~invisible at rest — the pool that can flip open (display:none / height:0)
        for (const e of preEls) { const r = e.getBoundingClientRect(); if (r.width * r.height < 4) preSmall.push(e) }
        el.setAttribute('data-uif-tog', String(k))
        openSeq(el, allowClick)
        await new Promise(r => setTimeout(r, 230))
        const navigated = location.href !== startHref
        let panel = null, kind = null
        // 1) explicit target that actually changed
        if (!navigated && target && isVis(target)) { const to = bag(target)
          if (JSON.stringify(targetClosed) !== JSON.stringify(to)) { panel = target; kind = rec.controls ? 'aria-controls' : 'sibling' } }
        // 2) portal / newly-visible detection (target missing or unchanged)
        if (!panel && !navigated) {
          let best = null, bestScore = 0
          const consider = e => {
            if (e === el || el.contains(e) || e.contains(el)) return
            if (!isVis(e)) return
            const a = area(e); if (a < 300) return
            const role = (e.getAttribute('role') || '').toLowerCase()
            const boost = (/menu|listbox|dialog|tooltip|region|group/.test(role) || e.hasAttribute('data-radix-popper-content-wrapper') || e.getAttribute('data-state') === 'open') ? 1e9 : 0
            const s = a + boost; if (s > bestScore) { bestScore = s; best = e }
          }
          for (const e of document.querySelectorAll('body *')) if (!preEls.has(e)) consider(e)   // newly inserted (portal)
          for (const e of preSmall) consider(e)                                                  // flipped display:none/height:0 → visible
          if (best) { panel = best; kind = preEls.has(best) ? 'newly-visible' : 'portal' }
        }
        if (panel) {
          rec.captured = true; rec.kind = kind; rec.open = bag(panel); rec.panelSel = desc(panel)
          rec.text = (panel.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200)
          try { rec.html = panel.outerHTML.replace(/\s*data-uif-(?:tog|panel)="\d+"/g, '').slice(0, 6000) } catch {}
          try { panel.setAttribute('data-uif-panel', String(k)) } catch {}
        } else rec.reason = navigated ? 'nav-away' : (target ? 'no-visual-change' : 'no-target')
        // ---- restore (safe) ----
        try {
          if (navigated) { history.back(); await new Promise(r => setTimeout(r, 260)) }
          else {
            closeSeq(el)
            if (el.tagName === 'SUMMARY') { const d = el.closest('details'); if (d) d.open = false }
            if (allowClick && el.getAttribute('aria-expanded') === 'true') { try { el.click() } catch {} }
            try { document.activeElement && document.activeElement.blur && document.activeElement.blur() } catch {}
            try { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', keyCode: 27, bubbles: true })) } catch {}
            await new Promise(r => setTimeout(r, 60))
          }
        } catch {}
        findings.push(rec); k++
      }
      document.removeEventListener('click', navGuard, true)
      try { window.scrollTo(0, 0) } catch {}   // geometry snapshot must see the page at top
      return { findings, detected: vis.length }
    })
  } catch { return { findings: [], detected: 0 } }
}

// Fold exploreToggles() findings onto the post-removal snapshot. Toggle & panel elements were
// tagged with data-uif-* markers; resolve those to current body-order indices (stable now the
// DOM is settled) and map to nodes. A resting panel node rarely survives (menus are hidden at
// rest, so CAPTURE skipped them) — when one does, open styles land on it and toggleTarget on the
// toggle; otherwise the self-contained record (open styles + capped html) lives in snap.toggles.
async function resolveToggles(page, snap, findings) {
  snap.toggles = []
  if (!findings || !findings.length) return
  let marks = { tog: {}, panel: {} }
  try {
    marks = await page.evaluate(() => {
      const all = [...document.querySelectorAll('body *')], idx = new Map(all.map((el, i) => [el, i])), tog = {}, panel = {}
      document.querySelectorAll('[data-uif-tog]').forEach(el => { tog[el.getAttribute('data-uif-tog')] = idx.get(el) })
      document.querySelectorAll('[data-uif-panel]').forEach(el => { panel[el.getAttribute('data-uif-panel')] = idx.get(el) })
      return { tog, panel }
    })
  } catch {}
  const byId = new Map(snap.nodes.map(n => [n.i, n]))
  for (const f of findings) {
    if (!f.captured) continue
    const ti = marks.tog[String(f.k)], pi = marks.panel[String(f.k)]
    const togNode = ti != null ? byId.get(ti) : null
    const panNode = pi != null ? byId.get(pi) : null
    if (togNode && panNode) { togNode.toggleTarget = panNode.i; panNode.open = f.open }
    else if (togNode) togNode.opensPanel = true
    snap.toggles.push({ toggle: f.sel, panel: f.panelSel, kind: f.kind, text: f.text, open: f.open, html: f.html,
      toggleIndex: togNode ? togNode.i : undefined, panelIndex: panNode ? panNode.i : undefined })
  }
}

// Real hover-diff for interactive elements whose stylesheet-derived :hover came back empty
// (cross-origin CSS, or JS-driven). Physically hover up to ~16 of them and diff the computed
// visual props; recovered hovers are attached (hoverSrc:'js'), the rest counted honestly as
// 'hover:js-or-none' in coverage. Safe — runs after the snapshot; mouse is parked afterward.
async function hoverDiffSample(page, snap) {
  const out = { candidates: 0, sampled: 0, recovered: 0, jsOrNone: 0 }
  try {
    const interactive = new Set(['a', 'button', 'summary', 'input', 'select', 'label', 'textarea'])
    const cand = (snap.nodes || []).filter(n => !n.hover && (interactive.has(n.tag) || n.role === 'button') && n.w > 8 && n.h > 8 && n.y < (snap.viewport.h * 2))
    out.candidates = cand.length
    const pick = cand.slice(0, 16)
    if (!pick.length) return out
    await page.evaluate(ids => { const all = [...document.querySelectorAll('body *')]; for (const i of ids) { const el = all[i]; if (el) el.setAttribute('data-uif-hov', String(i)) } }, pick.map(n => n.i))
    const handles = await page.$$('[data-uif-hov]')
    const byId = new Map(snap.nodes.map(n => [n.i, n]))
    const read = el => { const c = getComputedStyle(el); return { color: c.color, 'background-color': c.backgroundColor, 'background-image': c.backgroundImage, 'box-shadow': c.boxShadow, transform: c.transform, opacity: c.opacity, 'text-decoration-line': c.textDecorationLine, 'border-color': c.borderTopColor, filter: c.filter } }
    for (const h of handles) {
      try {
        const i = +(await h.evaluate(el => el.getAttribute('data-uif-hov')))
        const n = byId.get(i); if (!n) continue
        const before = await h.evaluate(read)
        await h.hover({ timeout: 800 })
        await page.waitForTimeout(70)
        const after = await h.evaluate(read)
        out.sampled++
        const decl = []
        for (const key in before) { const a = after[key]
          if (a && a !== before[key] && a !== 'none' && !/^rgba?\(0, 0, 0, 0\)/.test(a)) decl.push(`${key}:${a}`) }
        if (decl.length) { n.hover = (n.hover || '') + decl.join(';') + ';'; n.hoverSrc = 'js'; out.recovered++ } else out.jsOrNone++
      } catch { out.jsOrNone++ }
    }
    await page.mouse.move(2, 2).catch(() => {})
    await page.evaluate(() => document.querySelectorAll('[data-uif-hov]').forEach(el => el.removeAttribute('data-uif-hov'))).catch(() => {})
    for (const h of handles) { try { await h.dispose() } catch {} }
  } catch {}
  return out
}

// Assemble the coverage manifest: FOUND vs CAPTURED vs SKIPPED(reason) for each dynamic
// dimension. Honesty first — every zero is paired with a reason (never a bare, silent 0).
function buildCoverage({ snap, interRules, usedAnim, opts, toggleFindings, hoverSample }) {
  const nodes = snap.nodes || []
  // canvases — found = #<canvas>; recorded only with --record-canvas
  const cFound = snap.canvasCount || 0, cRec = (snap.canvasVideos || []).length
  let cNote
  if (cFound === 0) cNote = 'none in DOM'
  else if (!opts.recordCanvas) cNote = 'flag off (--record-canvas)'
  else if (cRec === 0) cNote = 'untappable — cross-origin or <40px'
  else if (cRec < cFound) cNote = `${cFound - cRec} not recorded (too small / untappable)`
  // animations — css @keyframes actually used + recovered; jsAnim only with --sample-motion
  const cssKf = (snap.keyframes || []).length
  const jsAnim = opts.sampleMotion ? nodes.filter(n => n.motion).length : 0
  let aNote = ''
  if (cssKf === 0 && (!usedAnim || usedAnim.size === 0)) aNote = 'no CSS animations in use'
  else if (usedAnim && usedAnim.size > cssKf) aNote = `${usedAnim.size - cssKf} anim ref unreachable (cross-origin keyframes)`
  if (!opts.sampleMotion) aNote = (aNote ? aNote + ' · ' : '') + 'jsAnim: flag off (--sample-motion)'
  else if (jsAnim === 0) aNote = (aNote ? aNote + ' · ' : '') + 'jsAnim: sampled, none moved'
  // interaction — stylesheet hover/focus rules + how many elements they matched + js recovery
  const ir = interRules || []
  const hoverRulesFound = ir.filter(r => r.pseudo === 'hover').length
  const focusRulesFound = ir.filter(r => r.pseudo === 'focus').length
  const elementsMatched = nodes.filter(n => n.hover || n.focus || n.active).length
  const hs = hoverSample || {}
  // toggles — found vs captured vs skipped(reason)
  const tf = (toggleFindings && toggleFindings.findings) || []
  const detected = (toggleFindings && toggleFindings.detected) || tf.length
  const captured = tf.filter(f => f.captured).length
  const skipped = tf.filter(f => !f.captured).map(f => ({ reason: f.reason || 'unknown', sel: f.sel }))
  return {
    canvases: { found: cFound, recorded: cRec, note: cNote },
    fonts: { faceRulesFound: (snap.fontFaces || []).length },
    animations: { cssKeyframesUsed: cssKf, jsAnimSampled: jsAnim, note: aNote || undefined },
    interaction: { hoverRulesFound, elementsMatched, focusRulesFound, hoverJsRecovered: hs.recovered || 0, hoverEmptyInteractive: hs.candidates || 0, hoverJsOrNone: hs.jsOrNone || 0 },
    toggles: { found: detected, explored: tf.length, captured, skipped, note: detected > tf.length ? `explored ${tf.length}/${detected} (cap)` : undefined },
  }
}

/* --------------------------------- CLI --------------------------------- */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`
  uiforge-capture — a reference's full design, extracted (stage 1 of the clone pipeline).

  node uiforge-capture.mjs <url│file.html> [--out capture.json] [--viewport 1440x900] [--record-canvas] [--sample-motion] [--json]

  Emits capture.json — the styled element tree + a deduped token set (palette,
  type scale, spacing, radii, shadows, fonts). The raw material for reconstruction.
  --record-canvas  records each <canvas> to a looping .webm (canvas/WebGL heroes).
  --sample-motion  samples JS-driven motion (Framer/GSAP/rAF) → looping @keyframes.
  --headed         launch a real (visible) browser to clear Cloudflare/bot JS walls.
  --responsive     also captures a mobile viewport → per-node responsive (max-sm:) diffs
                   + reconciles two reads to surface A/B / animated drift (coverage.stability).
`)
    process.exit(0)
  }
  const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
  const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
  const outPath = valAt('--out') || 'capture.json'
  const valueIdx = new Set(); for (const nm of ['--out', '--viewport']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
  const target = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
  const recordCanvas = argv.includes('--record-canvas')
  const sampleMotion = argv.includes('--sample-motion')
  const responsive = argv.includes('--responsive')
  const headed = argv.includes('--headed')

  const snap = await capture(target, { width: vw, height: vh }, { recordCanvas, sampleMotion, responsive, headed })
  const tokens = tokenize(snap.nodes)
  // write any recorded canvas clips next to the capture, and point the node at its file
  const byId = new Map(snap.nodes.map(n => [n.i, n]))
  const base = outPath.replace(/\.json$/, '')
  for (const v of snap.canvasVideos || []) {
    const file = `${base}.canvas-${v.i}.webm`
    writeFileSync(file, Buffer.from(v.b64, 'base64'))
    const node = byId.get(v.i); if (node) node.video = file.split('/').pop()
  }
  const out = { source: target, capturedAt: null, viewport: snap.viewport, title: snap.title, sheets: snap.sheets || [], fontFaces: snap.fontFaces || [], keyframes: snap.keyframes || [], tokens, coverage: snap.coverage, toggles: snap.toggles || [], nodes: snap.nodes }

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
  // coverage manifest — never a bare 0; always found-vs-captured and WHY
  const cov = out.coverage || {}
  console.log(`\n  ${B}coverage${X} ${D}(found → captured · why)${X}`)
  { const c = cov.canvases || {}
    console.log(`    ${C}canvases${X}   ${c.found || 0} found → ${c.recorded || 0} recorded${c.note ? `   ${D}(${c.note})${X}` : ''}`) }
  { const f = cov.fonts || {}
    console.log(`    ${C}fonts${X}      ${f.faceRulesFound || 0} @font-face recovered${!f.faceRulesFound ? `   ${D}(none — system fallback)${X}` : ''}`) }
  { const a = cov.animations || {}
    console.log(`    ${C}animation${X}  ${a.cssKeyframesUsed || 0} css keyframes · ${a.jsAnimSampled || 0} js-motion${a.note ? `   ${D}(${a.note})${X}` : ''}`) }
  { const it = cov.interaction || {}
    let s = `hover ${it.hoverRulesFound || 0} · focus ${it.focusRulesFound || 0} rules → ${it.elementsMatched || 0} el matched`
    if (it.hoverJsRecovered) s += ` · +${it.hoverJsRecovered} js-hover`
    if (it.hoverEmptyInteractive) s += ` · ${it.hoverJsOrNone || 0}/${it.hoverEmptyInteractive} js-or-none`
    if (!it.hoverRulesFound && !it.focusRulesFound && !it.hoverJsRecovered) s += `   ${D}(no stylesheet :hover/:focus — cross-origin or JS-driven)${X}`
    console.log(`    ${C}interact${X}   ${s}`) }
  { const t = cov.toggles || {}
    let s
    if (!t.found) s = `0 found   ${D}(no aria-controls / aria-haspopup / aria-expanded / <summary> in DOM)${X}`
    else {
      s = `${t.found} found → ${t.captured || 0} captured`
      const sk = t.skipped || []
      if (sk.length) { const g = {}; for (const x of sk) g[x.reason] = (g[x.reason] || 0) + 1
        s += ` · ${sk.length} skipped ${D}(${Object.entries(g).map(([r, n]) => `${r}×${n}`).join(', ')})${X}` }
      if (t.note) s += ` ${D}· ${t.note}${X}`
    }
    console.log(`    ${C}toggles${X}    ${s}`) }
  console.log(`\n  ${G}→ ${outPath}${X}  ${D}(${(JSON.stringify(out).length / 1024).toFixed(0)} KB)${X}\n`)
}

export { capture, tokenize, CAPTURE, loadChromium }
