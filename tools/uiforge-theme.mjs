#!/usr/bin/env node
// uiforge-theme — stage 2 of the clone pipeline.
//
// Turn a capture.json's raw tokens into a Tailwind v4 theme: infer the semantic
// roles (background, foreground, muted, accent, border, surface) by how the colors
// are actually used, and emit theme.css (@theme with the exact palette, type scale,
// spacing, radii, shadows, fonts) + theme.json (structured, for the emitter).
//
// Usage:
//   node uiforge-theme.mjs capture.json [--out-css theme.css] [--out-json theme.json] [--json]

import process from 'node:process'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/* ------------------------------ color helpers ------------------------------ */
function parse(s) {
  s = String(s || '').trim()
  let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  m = s.match(/^#([0-9a-f]{6})$/i); if (m) { const n = parseInt(m[1], 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 } }
  m = s.match(/^#([0-9a-f]{3})$/i); if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 } }
  return null
}
const hex = c => '#' + [c.r, c.g, c.b].map(x => Math.round(x).toString(16).padStart(2, '0')).join('')
function hsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360 }
  const l = (mx + mn) / 2, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s, l }
}
const chroma = c => (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255
const isNeutral = c => { const { s, l } = hsl(c); return chroma(c) < 0.10 || s < 0.15 || l > 0.92 || l < 0.05 }
const contrast = (a, b) => { const L = c => { const f = x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4 }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b) }; const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x); return (hi + .05) / (lo + .05) }

/* ------------------------------ role inference ------------------------------ */
function roles(nodes) {
  // background: the opaque color covering the most area
  const bgArea = new Map(), textCount = new Map(), borderCount = new Map()
  for (const n of nodes) {
    const s = n.style || {}
    const bg = parse(s.bc)
    if (bg && bg.a >= 0.9) bgArea.set(hex(bg), (bgArea.get(hex(bg)) || 0) + Math.max(0, n.w) * Math.max(0, n.h))
    const col = parse(s.col); if (col && col.a >= 0.5 && n.text) textCount.set(hex(col), (textCount.get(hex(col)) || 0) + (n.text.length || 1))
    for (const k of ['bct', 'bcr', 'bcb', 'bcl']) { const bc = parse(s[k]); if (bc && bc.a >= 0.3 && !isNeutral(bc) === false) borderCount.set(hex(bc), (borderCount.get(hex(bc)) || 0) + 1) }
  }
  const top = m => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v)
  const bg = parse(top(bgArea)[0] || '#ffffff')
  const texts = top(textCount).map(parse)
  const fg = texts.find(c => contrast(c, bg) >= 6) || texts[0] || (hsl(bg).l > 0.5 ? { r: 17, g: 17, b: 17 } : { r: 245, g: 245, b: 245 })
  const muted = texts.find(c => { const k = contrast(c, bg); return k >= 3 && k < 6 }) || null
  const border = top(borderCount).map(parse).find(c => c) || null
  // accent: the most-used saturated (non-neutral) color across text/bg/border
  const accentUse = new Map()
  for (const n of nodes) { const s = n.style || {}; for (const k of ['col', 'bc', 'bct', 'bcr', 'bcb', 'bcl']) { const c = parse(s[k]); if (c && c.a >= 0.5 && !isNeutral(c)) accentUse.set(hex(c), (accentUse.get(hex(c)) || 0) + 1) } }
  const accent = top(accentUse).map(parse)[0] || null
  // surface: a bg color distinct from the main bg (cards/panels)
  const surface = top(bgArea).map(parse).find(c => c && hex(c) !== hex(bg) && Math.abs(hsl(c).l - hsl(bg).l) < 0.25) || null
  const r = { bg: hex(bg), fg: hex(fg) }
  if (muted) r.muted = hex(muted); if (surface) r.surface = hex(surface); if (border) r.border = hex(border); if (accent) r.accent = hex(accent)
  return r
}

/* ------------------------------ emit ------------------------------ */
const named = (arr, prefix) => arr.map((o, i) => [`${prefix}-${i + 1}`, o.v])
function buildTheme(cap) {
  const t = cap.tokens || {}
  const role = roles(cap.nodes || [])
  const sans = (t.fonts || []).map(f => f.v).find(f => !/mono/i.test(f)) || (t.fonts?.[0]?.v) || 'ui-sans-serif'
  const mono = (t.fonts || []).map(f => f.v).find(f => /mono/i.test(f)) || 'ui-monospace'
  const palette = (t.colors || []).map(c => parse(c.v)).filter(c => c && c.a >= 0.95).map(hex)
  const dedupPalette = [...new Set(palette)].slice(0, 24)
  const scale = (t.fontSizes || []).map(s => ({ px: s.px, v: s.v })).filter(s => s.px >= 10)
  const radii = (t.radii || []).map(r => r.v).filter(v => /px$/.test(v)).slice(0, 8)
  const shadows = (t.shadows || []).map(s => s.v).slice(0, 8)
  const gradients = (t.gradients || []).map(g => g.v).slice(0, 8)

  const css = [`@import "tailwindcss";`, ``, `@theme {`,
    `  --font-sans: ${JSON.stringify(sans)}, ui-sans-serif, system-ui, sans-serif;`,
    `  --font-mono: ${JSON.stringify(mono)}, ui-monospace, monospace;`, ``,
    `  /* roles (inferred by usage) */`,
    ...Object.entries(role).map(([k, v]) => `  --color-${k}: ${v};`), ``,
    `  /* full palette */`,
    ...dedupPalette.map((c, i) => `  --color-p${i + 1}: ${c};`), ``,
    `  /* type scale */`,
    ...scale.map((s, i) => `  --text-s${i + 1}: ${s.v};`), ``,
    ...(radii.length ? [`  /* radii */`, ...radii.map((r, i) => `  --radius-r${i + 1}: ${r};`), ``] : []),
    ...(shadows.length ? [`  /* shadows */`, ...shadows.map((s, i) => `  --shadow-e${i + 1}: ${s};`), ``] : []),
    `}`, ``,
    ...(gradients.length ? [`/* signature gradients (use as bg utilities) */`, `:root {`, ...gradients.map((g, i) => `  --gradient-g${i + 1}: ${g};`), `}`] : []),
  ].join('\n')

  const json = { source: cap.source, roles: role, fonts: { sans, mono }, palette: dedupPalette,
    typeScale: scale.map(s => s.v), radii, shadows, gradients }
  return { css, json }
}

/* ------------------------------ CLI ------------------------------ */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-theme — capture.json → a Tailwind v4 theme (roles inferred by usage).

  node uiforge-theme.mjs capture.json [--out-css theme.css] [--out-json theme.json] [--json]
`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const valueIdx = new Set(); for (const nm of ['--out-css', '--out-json']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const capPath = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
const cap = JSON.parse(readFileSync(capPath, 'utf8'))
const { css, json } = buildTheme(cap)

if (argv.includes('--json')) { console.log(JSON.stringify(json, null, 2)); process.exit(0) }
writeFileSync(valAt('--out-css') || 'theme.css', css + '\n')
writeFileSync(valAt('--out-json') || 'theme.json', JSON.stringify(json, null, 2) + '\n')

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge theme${X} ${D}← ${capPath}${X}`)
console.log(`    ${C}roles${X}   ${Object.entries(json.roles).map(([k, v]) => `${k} ${v}`).join('  ')}`)
console.log(`    ${C}fonts${X}   ${json.fonts.sans}${json.fonts.mono ? ` · ${json.fonts.mono}` : ''}`)
console.log(`    ${C}scale${X}   ${json.typeScale.join(' ')}`)
console.log(`    ${C}palette${X} ${json.palette.length} · ${C}radii${X} ${json.radii.length} · ${C}shadow${X} ${json.shadows.length} · ${C}grad${X} ${json.gradients.length}`)
console.log(`\n  ${G}→ theme.css + theme.json${X}\n`)
}

export { buildTheme, roles }
