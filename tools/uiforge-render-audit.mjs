#!/usr/bin/env node
// UIForge render audit — the DEEP tier. Where uiforge-lint greps SOURCE, this
// renders the page and measures the craft dimensions a professional actually
// critiques on the RESULT:
//   1. real WCAG contrast (computed, per text node — not a keyword)
//   2. accent surface-area   (the "<10% of the surface" rule, finally measured)
//   3. spacing rhythm         (distinct vertical gaps from real geometry)
//   4. type-scale coherence   (distinct sizes; do they follow ONE ratio?)
//   5. AI layout patterns      (N equal-width cards · centered mega-hero)
// These are properties of the rendered artifact — objective and non-gameable:
// avoiding the word "seamless" can't fake a 2.9:1 contrast ratio away.
//
// Usage:
//   node uiforge-render-audit.mjs <url|file.html> [--json] [--viewport 1280x800]
//   node uiforge-render-audit.mjs --self-test     # pure-logic regression, no browser
//
// Live rendering needs Playwright (heavier than the zero-dep grep tier, on purpose):
//   npm i -D playwright && npx playwright install chromium
// The analyze() core is pure and browser-free.

import process from 'node:process'

/* ============================ pure color core ============================ */
// getComputedStyle returns rgb()/rgba(); we also accept hex for the self-test.
function parseColor(s) {
  if (!s) return { r: 0, g: 0, b: 0, a: 0 }
  s = String(s).trim()
  let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?\s*\)$/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  m = s.match(/^#([0-9a-f]{6})$/i)
  if (m) { const n = parseInt(m[1], 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 } }
  if (/^transparent$/i.test(s)) return { r: 0, g: 0, b: 0, a: 0 }
  return { r: 0, g: 0, b: 0, a: 0 }
}
// src-over composite, bg assumed opaque
function over(fg, bg) {
  const a = fg.a + bg.a * (1 - fg.a)
  if (a === 0) return { r: 0, g: 0, b: 0, a: 0 }
  return {
    r: (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a,
    g: (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a,
    b: (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a, a,
  }
}
function relLum({ r, g, b }) {
  const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}
function contrast(fg, bg) {
  const L1 = relLum(fg), L2 = relLum(bg)
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1]
  return (hi + 0.05) / (lo + 0.05)
}
function hsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60; if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s, l }
}
// tinted-but-near-white/near-black neutrals (warm paper, ink) read as neutral to the eye
const isNeutral = c => { const { s, l } = hsl(c); return s < 0.15 || l > 0.9 || l < 0.06 }

/* ============================ measurement core ============================ */
// snapshot = { viewport:{w,h}, nodes:[ {x,y,w,h, fg, bg, fontSize, fontWeight, isText, textLen} ] }
// fg = raw text color string; bg = effective OPAQUE background string.
function analyze(snap) {
  const V = snap.viewport, nodes = snap.nodes || []
  const findings = []

  /* 1. contrast (WCAG AA) */
  const contrastFails = []
  for (const n of nodes) {
    if (!n.isText || !n.textLen || !n.fontSize) continue
    const bg = parseColor(n.bg); if (bg.a === 0) continue
    const fg = over(parseColor(n.fg), bg)
    const ratio = contrast(fg, bg)
    const large = n.fontSize >= 24 || (n.fontSize >= 18.66 && (n.fontWeight || 400) >= 700)
    const need = large ? 3.0 : 4.5
    if (ratio + 1e-9 < need)
      contrastFails.push({ ratio: +ratio.toFixed(2), need, fontSize: Math.round(n.fontSize), at: n.sel })
  }
  contrastFails.sort((a, b) => a.ratio - b.ratio)

  /* 2. accent surface-area — from a non-overlapping sample grid (true visible coverage,
        not summed element areas, which double-count nested boxes past 100%) */
  const samples = (snap.samples || []).map(parseColor).filter(c => c.a > 0)
  const hueCount = new Map()
  for (const c of samples) {
    if (isNeutral(c)) continue
    const bucket = Math.round(hsl(c).h / 30) * 30
    hueCount.set(bucket, (hueCount.get(bucket) || 0) + 1)
  }
  let accentHue = null, accentN = 0
  for (const [h, n] of hueCount) if (n > accentN) { accentN = n; accentHue = h }
  const accentPct = samples.length ? +(100 * accentN / samples.length).toFixed(1) : 0

  /* 3. spacing rhythm — distinct vertical gaps between siblings, from geometry */
  const byParent = new Map()
  for (const n of nodes) { if (!byParent.has(n.pid)) byParent.set(n.pid, []); byParent.get(n.pid).push(n) }
  const gaps = []
  for (const sibs of byParent.values()) {
    const s = sibs.filter(n => n.w > 0 && n.h > 0).sort((a, b) => a.y - b.y)
    for (let i = 1; i < s.length; i++) {
      const g = Math.round(s[i].y - (s[i - 1].y + s[i - 1].h))
      if (g >= 2 && g <= 200) gaps.push(g)
    }
  }
  const distinctGaps = new Set(gaps).size
  const offGrid = gaps.filter(g => g % 4 !== 0).length
  const offGridPct = gaps.length ? Math.round(100 * offGrid / gaps.length) : 0

  /* 4. type-scale coherence */
  const sizes = [...new Set(nodes.filter(n => n.isText && n.textLen).map(n => Math.round(n.fontSize)))]
    .filter(Boolean).sort((a, b) => a - b)
  let ratioOK = true
  if (sizes.length >= 3) {
    const ratios = []
    for (let i = 1; i < sizes.length; i++) if (sizes[i - 1] > 0) ratios.push(sizes[i] / sizes[i - 1])
    const big = ratios.filter(r => r > 1.03) // ignore near-duplicates
    if (big.length) {
      const mean = big.reduce((a, b) => a + b, 0) / big.length
      ratioOK = big.every(r => Math.abs(r - mean) / mean < 0.12) // one ratio, ±12%
    }
  }

  /* 5. AI layout patterns */
  let equalCards = 0
  for (const sibs of byParent.values()) {
    const s = sibs.filter(n => n.w > 40 && n.h > 40)
    const bands = new Map()
    for (const n of s) { const band = Math.round(n.y / 24); if (!bands.has(band)) bands.set(band, []); bands.get(band).push(n) }
    for (const row of bands.values()) {
      if (row.length < 3) continue
      const w0 = row[0].w
      if (row.every(n => Math.abs(n.w - w0) / w0 < 0.02)) equalCards = Math.max(equalCards, row.length)
    }
  }
  let centeredHero = false
  const hero = nodes.filter(n => n.isText && n.textLen && n.y < V.h * 0.45)
    .sort((a, b) => b.fontSize - a.fontSize)[0]
  if (hero && hero.fontSize >= 30) {
    const cx = hero.x + hero.w / 2
    if (Math.abs(cx - V.w / 2) < V.w * 0.06) centeredHero = true
  }

  /* ---- grade: one coherent 0–100, letter derived from it ---- */
  let pen = 0
  pen += Math.min(35, contrastFails.length * 7)
  if (accentPct > 10) pen += Math.min(22, (accentPct - 10) * 1.2)
  pen += Math.min(16, Math.max(0, distinctGaps - 8) * 1.5) + Math.min(8, offGridPct * 0.12)
  if (sizes.length > 6) pen += Math.min(12, (sizes.length - 6) * 2)
  if (!ratioOK) pen += 6
  if (equalCards >= 3) pen += 6
  if (centeredHero) pen += 4
  const pct = Math.max(0, Math.round(100 - pen))
  const grade = pct >= 97 ? 'A+' : pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F'

  if (contrastFails.length) findings.push({ id: 'contrast', sev: 'BLOCKER', n: contrastFails.length,
    msg: `${contrastFails.length} text node(s) below WCAG AA`, detail: contrastFails.slice(0, 5) })
  if (accentPct > 10) findings.push({ id: 'accent-overexposed', sev: 'WARN', n: accentPct,
    msg: `accent hue ~${accentHue}° covers ${accentPct}% of the surface (signature rule: <10%)` })
  if (distinctGaps > 8 || offGridPct > 20) findings.push({ id: 'spacing-rhythm', sev: 'WARN', n: distinctGaps,
    msg: `${distinctGaps} distinct vertical gaps (coherent ≈ ≤8) · ${offGridPct}% off the 4px grid` })
  if (sizes.length > 6 || !ratioOK) findings.push({ id: 'type-scale', sev: 'WARN', n: sizes.length,
    msg: `${sizes.length} distinct font sizes${ratioOK ? '' : ', not one modular ratio'} (${sizes.join('/')})` })
  if (equalCards >= 3) findings.push({ id: 'equal-cards', sev: 'WARN', n: equalCards,
    msg: `${equalCards} equal-width sibling blocks in a row — the "three identical cards" tell` })
  if (centeredHero) findings.push({ id: 'centered-hero', sev: 'WARN', n: 1,
    msg: `largest headline is dead-centered — the default AI hero composition` })

  return { grade, pct, viewport: V, nodes: nodes.length,
    metrics: { contrastFails: contrastFails.length, accentPct, distinctGaps, offGridPct,
      typeSizes: sizes.length, oneRatio: ratioOK, equalCards, centeredHero }, findings }
}

/* ===================== in-page extraction (browser) ===================== */
// Serialized and run via page.evaluate(). Returns a snapshot the core can grade.
function EXTRACT() {
  const V = { w: window.innerWidth, h: window.innerHeight }
  const parse = s => {
    const m = String(s).match(/rgba?\(([^)]+)\)/i); if (!m) return { a: 0 }
    const p = m[1].split(/[,\s/]+/).map(Number)
    return { r: p[0], g: p[1], b: p[2], a: p[3] === undefined ? 1 : p[3] }
  }
  const overOpaque = (fg, bg) => {
    const a = fg.a + bg.a * (1 - fg.a); if (!a) return bg
    return { r: (fg.r * fg.a + bg.r * (1 - fg.a)), g: (fg.g * fg.a + bg.g * (1 - fg.a)),
      b: (fg.b * fg.a + bg.b * (1 - fg.a)), a: 1 }
  }
  const effBg = el => {
    const layers = []; let node = el
    while (node && node.nodeType === 1) {
      const c = parse(getComputedStyle(node).backgroundColor)
      if (c.a > 0) { layers.push(c); if (c.a >= 1) break }
      node = node.parentElement
    }
    let base = { r: 255, g: 255, b: 255, a: 1 } // assume white canvas
    for (let i = layers.length - 1; i >= 0; i--) base = overOpaque(layers[i], base)
    return `rgb(${Math.round(base.r)}, ${Math.round(base.g)}, ${Math.round(base.b)})`
  }
  const directText = el => {
    let s = ''
    for (const c of el.childNodes) if (c.nodeType === 3) s += c.textContent
    return s.trim()
  }
  const sel = el => {
    const id = el.id ? `#${el.id}` : ''
    const cls = (el.className && typeof el.className === 'string')
      ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
    return (el.tagName.toLowerCase() + id + cls).slice(0, 40)
  }
  const all = [...document.querySelectorAll('body *')]
  const idOf = new Map(); all.forEach((el, i) => idOf.set(el, i))
  const nodes = []
  for (const el of all) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) continue
    if (r.bottom < 0 || r.top > V.h * 3 || r.right < 0 || r.left > V.w) continue
    const txt = directText(el)
    nodes.push({
      sel: sel(el), pid: el.parentElement ? (idOf.get(el.parentElement) ?? -1) : -1,
      x: r.x, y: r.y, w: r.width, h: r.height,
      fg: cs.color, bg: effBg(el),
      fontSize: parseFloat(cs.fontSize) || 0, fontWeight: parseInt(cs.fontWeight) || 400,
      isText: txt.length > 0, textLen: txt.length,
    })
    if (nodes.length >= 2000) break
  }
  // non-overlapping surface sampling → true accent coverage (grid of effective bg colors)
  const cols = 48, rows = 30, samples = []
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const el = document.elementFromPoint((i + 0.5) / cols * V.w, (j + 0.5) / rows * V.h)
    samples.push(el ? effBg(el) : 'rgb(255,255,255)')
  }
  return { viewport: V, nodes, samples }
}

/* ============================= harness ============================= */
async function loadChromium() {
  const pick = m => m && (m.chromium ?? (m.default && m.default.chromium)) // CJS interop: default holds it
  // 1) normal: a local devDependency resolves the bare specifier
  try { const c = pick(await import('playwright')); if (c) return c } catch {}
  // 2) fallback: resolve via CJS (honors NODE_PATH / global installs), then import the entry
  try {
    const { createRequire } = await import('node:module')
    const { pathToFileURL } = await import('node:url')
    const require = createRequire(import.meta.url)
    const entry = require.resolve('playwright', { paths: [process.cwd(), ...(process.env.NODE_PATH || '').split(/[:;]/)].filter(Boolean) })
    const c = pick(await import(pathToFileURL(entry).href)); if (c) return c
  } catch {}
  return null
}
async function renderSnapshot(target, viewport) {
  const chromium = await loadChromium()
  if (!chromium) { console.error('\n  Playwright not found. Install the deep tier:\n    npm i -D playwright && npx playwright install chromium\n  (or set NODE_PATH to a global install)\n'); process.exit(3) }
  const url = /^https?:|^file:/.test(target) ? target
    : 'file://' + (await import('node:path')).resolve(target)
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage({ viewport })
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => page.goto(url, { timeout: 20000 }))
    await page.waitForTimeout(250)
    return await page.evaluate(`(${EXTRACT.toString()})()`)
  } finally { await browser.close() }
}

/* ============================= self-test ============================= */
function selfTest() {
  const good = { viewport: { w: 1280, h: 800 }, nodes: [] }
  const slop = { viewport: { w: 1280, h: 800 }, nodes: [] }
  // GOOD: strong contrast, small accent, tidy rhythm, one ratio, no equal cards
  good.nodes.push({ sel: 'h1', pid: 0, x: 80, y: 80, w: 620, h: 60, fg: 'rgb(20,22,28)', bg: 'rgb(246,247,249)', fontSize: 52, fontWeight: 700, isText: true, textLen: 30 })
  good.nodes.push({ sel: 'p', pid: 0, x: 80, y: 164, w: 520, h: 24, fg: 'rgb(60,64,72)', bg: 'rgb(246,247,249)', fontSize: 18, fontWeight: 400, isText: true, textLen: 80 })
  good.nodes.push({ sel: 'button', pid: 0, x: 80, y: 212, w: 160, h: 44, fg: 'rgb(255,255,255)', bg: 'rgb(30,64,175)', fontSize: 16, fontWeight: 600, isText: true, textLen: 12 })
  for (let i = 0; i < 4; i++) good.nodes.push({ sel: 'li', pid: 5, x: 80, y: 320 + i * 40, w: 400, h: 24, fg: 'rgb(30,34,40)', bg: 'rgb(246,247,249)', fontSize: 16, fontWeight: 400, isText: true, textLen: 40 })
  // SLOP: 2 low-contrast texts, 30% accent block, jittery gaps, 8 sizes, 3 equal cards, centered hero
  slop.nodes.push({ sel: 'div.accent', pid: 0, x: 0, y: 0, w: 1280, h: 300, fg: 'rgb(255,255,255)', bg: 'rgb(124,58,237)', fontSize: 14, fontWeight: 400, isText: false, textLen: 0 }) // ~30% viewport
  slop.nodes.push({ sel: 'h1', pid: 0, x: 440, y: 90, w: 400, h: 60, fg: 'rgb(178,150,240)', bg: 'rgb(124,58,237)', fontSize: 48, fontWeight: 700, isText: true, textLen: 24 }) // centered + low contrast
  slop.nodes.push({ sel: 'p', pid: 0, x: 200, y: 360, w: 300, h: 20, fg: 'rgb(200,200,200)', bg: 'rgb(255,255,255)', fontSize: 13, fontWeight: 400, isText: true, textLen: 60 }) // low contrast
  const jitter = [5, 13, 22, 7, 31, 18, 26, 9, 15]
  let yy = 400
  jitter.forEach((g, i) => { yy += 20 + g; slop.nodes.push({ sel: 'row', pid: 9, x: 80, y: yy, w: 300, h: 20, fg: 'rgb(40,40,40)', bg: 'rgb(255,255,255)', fontSize: [11, 15, 17, 19, 23, 29, 34, 41][i % 8], fontWeight: 400, isText: true, textLen: 30 }) })
  for (let i = 0; i < 3; i++) slop.nodes.push({ sel: 'card', pid: 20, x: 80 + i * 400, y: 700, w: 360, h: 200, fg: 'rgb(40,40,40)', bg: 'rgb(255,255,255)', fontSize: 16, fontWeight: 400, isText: false, textLen: 0 })
  // surface sample grids (1440 pts): good ~8% rust accent (tinted paper is neutral); slop ~35% purple
  good.samples = Array.from({ length: 1440 }, (_, i) => i < 115 ? 'rgb(180,71,46)' : 'rgb(244,241,234)')
  slop.samples = Array.from({ length: 1440 }, (_, i) => i < 505 ? 'rgb(124,58,237)' : 'rgb(255,255,255)')

  const g = analyze(good), s = analyze(slop)
  const line = (name, r) => `  ${name.padEnd(6)} grade ${r.grade.padEnd(2)} (${r.pct}/100)  ` +
    `contrast=${r.metrics.contrastFails} accent=${r.metrics.accentPct}% gaps=${r.metrics.distinctGaps} ` +
    `type=${r.metrics.typeSizes}${r.metrics.oneRatio ? '' : '✗ratio'} cards=${r.metrics.equalCards} hero=${r.metrics.centeredHero}`
  console.log('\n  UIForge render audit — self-test (pure logic, no browser)\n')
  console.log(line('GOOD', g)); console.log(line('SLOP', s)); console.log()
  const ok = ['A+', 'A', 'B'].includes(g.grade) && ['D', 'F'].includes(s.grade)
    && s.metrics.contrastFails >= 2 && s.metrics.equalCards === 3
  console.log(ok ? '  \x1b[32m✓ PASS — metrics separate designed from slop\x1b[0m\n'
    : '  \x1b[31m✗ FAIL — grades did not separate\x1b[0m\n')
  process.exit(ok ? 0 : 1)
}

/* ============================= CLI ============================= */
const argv = process.argv.slice(2)
if (argv.includes('--self-test')) selfTest()
else if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-render-audit — grade the RENDERED page on real craft metrics.

  node uiforge-render-audit.mjs <url|file.html> [--json] [--viewport WxH]
  node uiforge-render-audit.mjs --self-test

  Measures: WCAG contrast · accent surface-area · spacing rhythm ·
  type-scale coherence · AI layout patterns. Needs Playwright for live render.
`)
  process.exit(0)
} else {
  const JSON_OUT = argv.includes('--json')
  const vi = argv.indexOf('--viewport')
  const [vw, vh] = vi >= 0 && argv[vi + 1] ? argv[vi + 1].split('x').map(Number) : [1280, 800]
  const vwIdx = vi >= 0 ? vi + 1 : -1
  const target = argv.find((a, idx) => !a.startsWith('--') && idx !== vwIdx)
  const snap = await renderSnapshot(target, { width: vw, height: vh })
  const rep = analyze({ viewport: { w: vw, h: vh }, nodes: snap.nodes, samples: snap.samples })
  if (JSON_OUT) { console.log(JSON.stringify({ target, ...rep }, null, 2)); process.exit(rep.metrics.contrastFails ? 1 : 0) }
  const R = '\x1b[31m', Y = '\x1b[33m', G = '\x1b[32m', B = '\x1b[1m', D = '\x1b[2m', X = '\x1b[0m'
  const col = rep.grade === 'F' ? R : rep.grade.startsWith('A') ? G : Y
  console.log(`\n  ${B}UIForge render audit:${X} ${col}${B}${rep.grade}${X} ${D}(${rep.pct}/100 · ${rep.nodes} nodes @ ${vw}×${vh})${X}\n`)
  if (!rep.findings.length) console.log(`  ${G}✓ clean on every measured craft dimension${X}\n`)
  for (const f of rep.findings) {
    const c = f.sev === 'BLOCKER' ? R : Y
    console.log(`  ${c}${f.sev === 'BLOCKER' ? '✗' : '⚠'} ${f.id}${X} ${D}·${X} ${f.msg}`)
    if (f.detail) for (const d of f.detail) console.log(`      ${D}${d.ratio}:1 (need ${d.need}) · ${d.fontSize}px · ${d.at}${X}`)
  }
  console.log()
  process.exit(rep.metrics.contrastFails ? 1 : 0)
}

export { analyze, parseColor, contrast, over }
