#!/usr/bin/env node
// uiforge-tailwindify — stage 5b of the clone pipeline: turn a captured node's
// short-keyed style object into a Tailwind v4 utility class string.
//
// The export (uiforge-export) currently emits every node with a giant inline
// `style={{ … }}` object. That's faithful but unreadable and un-editable. This maps
// the common, mechanical stuff — layout, spacing, type, color, border, radius — to
// utility classes, preferring the EXTRACTED THEME TOKENS (roles like text-fg / bg-accent,
// the matched radii/shadows) and falling back to arbitrary [values] otherwise. What
// genuinely can't be a utility (gradients, transforms, transitions, filters, blends,
// keyframe animation) is returned as `leftover` so the emitter keeps it inline.
//
//   import { tw } from './uiforge-tailwindify.mjs'
//   const { classes, leftover } = tw(node.style, theme)   // theme = uiforge-theme.mjs JSON
//
// CLI (for testing / coverage):
//   node uiforge-tailwindify.mjs capture.json theme.json [--sample N]

import process from 'node:process'
import { readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/* ================================ color ================================ */
// mirror of uiforge-theme's parser: computed styles are rgb()/rgba(); role tokens are hex.
function parse(s) {
  s = String(s || '').trim()
  let m = s.match(/^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+))?/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] }
  m = s.match(/^#([0-9a-f]{6})$/i); if (m) { const n = parseInt(m[1], 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 } }
  m = s.match(/^#([0-9a-f]{3})$/i); if (m) { const h = m[1]; return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 } }
  return null
}
const clamp = x => Math.max(0, Math.min(255, Math.round(x)))
const hex = c => '#' + [c.r, c.g, c.b].map(x => clamp(x).toString(16).padStart(2, '0')).join('')
const rgbaStr = c => `rgba(${clamp(c.r)},${clamp(c.g)},${clamp(c.b)},${+(+c.a).toFixed(3)})`
// CIE76 ΔE (Lab euclidean) — good enough to snap a color to a near-identical theme token.
function lab({ r, g, b }) {
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const R = lin(r), G = lin(g), B = lin(b)
  let X = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  let Y = (R * 0.2126 + G * 0.7152 + B * 0.0722)
  let Z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116
  const fx = f(X), fy = f(Y), fz = f(Z)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}
function deltaE(a, b) { const p = lab(a), q = lab(b); return Math.hypot(p.L - q.L, p.a - q.a, p.b - q.b) }

const ROLE_DE = 8                                   // how close a color must be to snap to a role token
const TEXT_ROLES = ['fg', 'accent', 'muted']        // candidate roles per color property (keeps names sensible)
const BG_ROLES = ['bg', 'surface', 'accent', 'muted']
const BORDER_ROLES = ['border', 'accent', 'muted', 'fg']

function nearestRole(c, theme, cands) {
  const roles = (theme && theme.roles) || {}
  let best = null, bd = Infinity
  for (const name of cands) { const h = roles[name]; if (!h) continue; const rc = parse(h); if (!rc) continue; const d = deltaE(c, rc); if (d < bd) { bd = d; best = name } }
  return bd <= ROLE_DE ? best : null
}
// The color "suffix" shared by text-/bg-/border- : a role name, white/black, transparent,
// role/alpha, or an arbitrary [#hex] / [rgba(...)]. null → unparseable → keep inline.
function colorSuffix(v, theme, cands) {
  const c = parse(v); if (!c) return null
  if (c.a === 0) return 'transparent'
  const h = hex(c)
  const base = h === '#ffffff' ? 'white' : h === '#000000' ? 'black' : null
  if (c.a >= 0.95) return base || nearestRole(c, theme, cands) || `[${h}]`
  const pct = Math.round(c.a * 100)                 // translucent → Tailwind /opacity modifier
  if (base) return `${base}/${pct}`
  const role = nearestRole(c, theme, cands)
  return role ? `${role}/${pct}` : `[${rgbaStr(c)}]`
}

/* ============================ length / scale ============================ */
const OMIT = Symbol('omit')                         // handled, but needs no class (e.g. font-weight:400)
const pxNum = v => { const m = String(v).trim().match(/^(-?[\d.]+)px$/); return m ? parseFloat(m[1]) : null }
const trimNum = n => Number.isInteger(n) ? String(n) : String(+n.toFixed(3))
const cssArb = v => String(v).trim().replace(/\s+/g, '_')   // spaces → underscores for a [arbitrary] value

// A length → a Tailwind spacing token: /4 scale when a clean multiple of 4px, else arbitrary.
function spaceTok(v) {
  v = String(v).trim()
  if (v === 'auto') return 'auto'
  const px = pxNum(v)
  if (px == null) return `[${cssArb(v)}]`
  if (px === 0) return '0'
  if (px > 0 && Number.isInteger(px) && px % 4 === 0) return String(px / 4)
  return `[${trimNum(px)}px]`
}

/* ========================= side collapse (p/m/inset/border) ========================= */
// Generic 4-side collapser: all-equal → `p-4`, symmetric → `px-/py-`, else per-side.
// tokOf(v) gives a comparable token (null ⇒ that side can't map → stays inline);
// mk(sideLetter, rawValue) builds the class ('' | 'x' | 'y' | 't'|'r'|'b'|'l').
function collapse4(keys, s, tokOf, mk, out, leftover) {
  const raw = {}, pres = []
  for (const side of ['t', 'r', 'b', 'l']) { const k = keys[side], v = s[k]; if (v != null && v !== '') { raw[side] = v; pres.push(side) } }
  if (!pres.length) return
  const tk = {}
  for (const side of pres) { tk[side] = tokOf(raw[side]); if (tk[side] == null) leftover[keys[side]] = raw[side] }
  const ok = side => tk[side] != null
  const okSides = pres.filter(ok)
  if (!okSides.length) return
  const eq = (a, b) => ok(a) && ok(b) && tk[a] === tk[b]
  if (okSides.length === 4 && eq('t', 'r') && eq('r', 'b') && eq('b', 'l')) { push(out, mk('', raw.t)); return }
  const done = new Set()
  if (eq('t', 'b')) { push(out, mk('y', raw.t)); done.add('t').add('b') }
  if (eq('r', 'l')) { push(out, mk('x', raw.r)); done.add('r').add('l') }
  for (const side of okSides) if (!done.has(side)) push(out, mk(side, raw[side]))
}
const push = (arr, c) => { if (c) arr.push(c) }

// border-width side token: 1px→'' (bare `border`), 2/4/8 default steps, else arbitrary.
function bwTok(v) { const px = pxNum(v); if (px == null) return `[${cssArb(v)}]`; if (px === 1) return '1'; if (px === 2 || px === 4 || px === 8) return String(px); return `[${trimNum(px)}px]` }
const bwClass = (side, v) => { const t = bwTok(v), suf = t === '1' ? '' : t; return 'border' + (side ? `-${side}` : '') + (suf ? `-${suf}` : '') }

// radius per-corner → rounded-*; pairs by row/column; theme-agnostic standard names by px.
const RADII = [['xs', 2], ['sm', 4], ['md', 6], ['lg', 8], ['xl', 12], ['2xl', 16], ['3xl', 24], ['4xl', 32]]
function radiusTok(v) {
  v = String(v).trim()
  if (/%/.test(v)) { const p = parseFloat(v); return p >= 50 ? 'full' : `[${cssArb(v)}]` }
  const px = pxNum(v)
  if (px == null) return `[${cssArb(v)}]`
  if (px === 0) return 'none'
  if (px >= 999) return 'full'
  for (const [n, p] of RADII) if (Math.abs(px - p) <= 1) return n
  return `[${trimNum(px)}px]`
}
function mapRadius(s, out) {
  const K = { tl: 'rtl', tr: 'rtr', br: 'rbr', bl: 'rbl' }
  const raw = {}, pres = []
  for (const c of ['tl', 'tr', 'br', 'bl']) { const v = s[K[c]]; if (v != null && v !== '') { raw[c] = v; pres.push(c) } }
  if (!pres.length) return
  const tk = {}; for (const c of pres) tk[c] = radiusTok(raw[c])
  const has = c => c in tk, eq = (a, b) => has(a) && has(b) && tk[a] === tk[b]
  const mk = (side, v) => `rounded${side ? '-' + side : ''}-${radiusTok(v)}`
  if (pres.length === 4 && eq('tl', 'tr') && eq('tr', 'br') && eq('br', 'bl')) { push(out, mk('', raw.tl)); return }
  const done = new Set()                                     // pair rows first, then columns, then singles
  if (eq('tl', 'tr')) { push(out, mk('t', raw.tl)); done.add('tl'); done.add('tr') }
  if (eq('bl', 'br')) { push(out, mk('b', raw.bl)); done.add('bl'); done.add('br') }
  if (eq('tl', 'bl') && !done.has('tl') && !done.has('bl')) { push(out, mk('l', raw.tl)); done.add('tl'); done.add('bl') }
  if (eq('tr', 'br') && !done.has('tr') && !done.has('br')) { push(out, mk('r', raw.tr)); done.add('tr'); done.add('br') }
  for (const c of pres) if (!done.has(c)) push(out, mk(c, raw[c]))
}

/* ============================ enum + single-prop maps ============================ */
const DSP = { flex: 'flex', grid: 'grid', none: 'hidden', 'inline-block': 'inline-block', inline: 'inline', 'inline-flex': 'inline-flex', 'inline-grid': 'inline-grid', contents: 'contents', 'flow-root': 'flow-root', table: 'table', 'table-row': 'table-row', 'table-cell': 'table-cell', 'list-item': 'list-item', block: OMIT, '-webkit-box': 'flex', '-webkit-flex': 'flex', '-webkit-inline-box': 'inline-flex' }
const FD = { column: 'flex-col', 'column-reverse': 'flex-col-reverse', row: OMIT, 'row-reverse': 'flex-row-reverse' }
const FW = { wrap: 'flex-wrap', 'wrap-reverse': 'flex-wrap-reverse', nowrap: OMIT }
const JC = { center: 'justify-center', 'space-between': 'justify-between', 'flex-end': 'justify-end', 'flex-start': 'justify-start', 'space-around': 'justify-around', 'space-evenly': 'justify-evenly', start: 'justify-start', end: 'justify-end', left: 'justify-start', right: 'justify-end', stretch: 'justify-stretch', normal: OMIT }
const AI = { center: 'items-center', 'flex-start': 'items-start', 'flex-end': 'items-end', stretch: 'items-stretch', baseline: 'items-baseline', start: 'items-start', end: 'items-end', normal: OMIT }
const TA = { center: 'text-center', right: 'text-right', left: 'text-left', justify: 'text-justify', end: 'text-end', start: OMIT, '-webkit-center': 'text-center' }
const TT = { uppercase: 'uppercase', lowercase: 'lowercase', capitalize: 'capitalize', none: OMIT }
const POS = { relative: 'relative', absolute: 'absolute', fixed: 'fixed', sticky: 'sticky', '-webkit-sticky': 'sticky', static: OMIT }
const FST = { italic: 'italic', oblique: 'italic', normal: OMIT }
const WS = { nowrap: 'whitespace-nowrap', pre: 'whitespace-pre', 'pre-wrap': 'whitespace-pre-wrap', 'pre-line': 'whitespace-pre-line', 'break-spaces': 'whitespace-break-spaces', normal: OMIT }
const BST = { solid: OMIT, none: OMIT, hidden: OMIT, dashed: 'border-dashed', dotted: 'border-dotted', double: 'border-double' }
const BSZ = { cover: 'bg-cover', contain: 'bg-contain', auto: OMIT }
const BR = { 'no-repeat': 'bg-no-repeat', repeat: OMIT, 'repeat-x': 'bg-repeat-x', 'repeat-y': 'bg-repeat-y', round: 'bg-repeat-round', space: 'bg-repeat-space', 'no-repeat no-repeat': 'bg-no-repeat', 'repeat repeat': OMIT }
const BGPOS = { '50% 50%': 'bg-center', '50% 0%': 'bg-top', '50% 100%': 'bg-bottom', '0% 50%': 'bg-left', '100% 50%': 'bg-right', '0% 0%': OMIT, '0% 100%': 'bg-left-bottom', '100% 0%': 'bg-right-top', '100% 100%': 'bg-right-bottom', center: 'bg-center' }
const FWT = { 100: 'font-thin', 200: 'font-extralight', 300: 'font-light', 400: OMIT, 500: 'font-medium', 600: 'font-semibold', 700: 'font-bold', 800: 'font-extrabold', 900: 'font-black', normal: OMIT, bold: 'font-bold', lighter: 'font-light', bolder: 'font-bold' }
const TEXT = [['xs', 12], ['sm', 14], ['base', 16], ['lg', 18], ['xl', 20], ['2xl', 24], ['3xl', 30], ['4xl', 36], ['5xl', 48], ['6xl', 60], ['7xl', 72], ['8xl', 96], ['9xl', 128]]
const LEFTOVER = new Set(['bi', 'flt', 'bdf', 'tf', 'tr', 'mbm', 'an', 'ad', 'atf', 'adl', 'aic', 'adr', 'afm'])

const enumOut = (map, v) => (v in map) ? map[v] : null
function mapTd(v) { v = String(v).trim(); if (v === 'none') return OMIT; const o = []; if (/underline/.test(v)) o.push('underline'); if (/line-through/.test(v)) o.push('line-through'); if (/overline/.test(v)) o.push('overline'); return o.length ? o : null }
function mapOverflow(v) {
  const p = String(v).trim().split(/\s+/)
  const OV = { hidden: 'hidden', scroll: 'scroll', auto: 'auto', clip: 'clip', visible: null }
  if (p.length === 1) { if (p[0] === 'visible') return OMIT; return OV[p[0]] ? `overflow-${OV[p[0]]}` : null }
  const out = []; if (OV[p[0]] && p[0] !== 'visible') out.push(`overflow-x-${OV[p[0]]}`); if (OV[p[1]] && p[1] !== 'visible') out.push(`overflow-y-${OV[p[1]]}`)
  return out.length ? out : OMIT
}
function mapGap(v) {
  const p = String(v).trim().split(/\s+/)
  if (p.length === 1) return `gap-${spaceTok(p[0])}`
  if (spaceTok(p[0]) === spaceTok(p[1])) return `gap-${spaceTok(p[0])}`
  return [`gap-y-${spaceTok(p[0])}`, `gap-x-${spaceTok(p[1])}`]      // CSS `gap: row col`
}
function mapFwt(v) { if (v in FWT) return FWT[v]; if (/^\d+$/.test(String(v))) return `font-[${v}]`; return null }
function mapFontSize(v) { const px = pxNum(v); if (px == null) return `text-[${cssArb(v)}]`; let best = null, bd = Infinity; for (const [n, p] of TEXT) { const d = Math.abs(px - p); if (d < bd) { bd = d; best = n } }; return bd <= 1 ? `text-${best}` : `text-[${trimNum(px)}px]` }
const mapLh = v => (v === 'normal') ? OMIT : `leading-[${cssArb(v)}]`
const mapLs = v => (v === 'normal') ? OMIT : `tracking-[${cssArb(v)}]`
function mapOp(v) { const n = parseFloat(v); if (isNaN(n)) return null; const pct = n * 100; if (Math.abs(pct - Math.round(pct)) < 1e-6 && Math.round(pct) % 5 === 0 && pct >= 0 && pct <= 100) return `opacity-${Math.round(pct)}`; return `opacity-[${trimNum(n)}]` }
function mapZ(v) { if (v === 'auto') return OMIT; const n = parseInt(v, 10); if (isNaN(n)) return null; if ([0, 10, 20, 30, 40, 50].includes(n)) return `z-${n}`; return n < 0 ? `-z-[${-n}]` : `z-[${n}]` }
function mapGrow(v) { if (v === '1') return 'grow'; if (v === '0') return OMIT; return /^[\d.]+$/.test(v) ? `grow-[${v}]` : null }
function mapShrink(v) { if (v === '0') return 'shrink-0'; if (v === '1') return OMIT; return /^[\d.]+$/.test(v) ? `shrink-[${v}]` : null }
const mapBasis = v => (v === 'auto') ? OMIT : `basis-${spaceTok(v)}`
function mapFont(v, theme) {
  const first = String(v).split(',')[0].replace(/["']/g, '').trim().toLowerCase()
  const f = (theme && theme.fonts) || {}
  const of = s => String(s || '').split(',')[0].replace(/["']/g, '').trim().toLowerCase()
  if (first && first === of(f.sans)) return 'font-sans'
  if (first && first === of(f.mono)) return 'font-mono'
  if (/mono/.test(first)) return 'font-mono'
  return null                                     // an exact custom face → keep inline
}
const colorOut = (prefix, v, theme, cands) => { const suf = colorSuffix(v, theme, cands); return suf ? `${prefix}-${suf}` : null }
const splitTopLevel = v => String(v).trim().split(/\s+(?![^(]*\))/)   // split spaces not inside ()
function mapGridCols(v) { v = String(v).trim(); if (v === 'none') return OMIT; const p = splitTopLevel(v); return (p.length >= 1 && p.length <= 12 && p.every(x => x === p[0])) ? `grid-cols-${p.length}` : null }
function mapGridRows(v) { v = String(v).trim(); if (v === 'none') return OMIT; const p = splitTopLevel(v); return (p.length >= 1 && p.length <= 12 && p.every(x => x === p[0])) ? `grid-rows-${p.length}` : null }
function mapSpan(kind, v) { v = String(v).trim(); if (v === 'auto') return OMIT; const m = v.match(/span\s+(\d+)/); return m ? `${kind}-span-${m[1]}` : null }
const mapBgPos = v => (String(v).trim() in BGPOS) ? BGPOS[String(v).trim()] : null
function mapShadow(v, theme) { if (v === 'none') return OMIT; const norm = s => String(s).replace(/\s+/g, ' ').trim(); const list = (theme && theme.shadows) || []; const i = list.findIndex(s => norm(s) === norm(v)); return i >= 0 ? `shadow-e${i + 1}` : null }

/* ================================ tw() ================================ */
export function tw(style, theme) {
  const s = style || {}
  theme = theme || {}
  const classes = []
  const leftover = {}

  // grouped collapses first (each consumes several keys)
  collapse4({ t: 'pt', r: 'pr', b: 'pb', l: 'pl' }, s, spaceTok, (side, v) => `p${side}-${spaceTok(v)}`, classes, leftover)
  collapse4({ t: 'mt', r: 'mr', b: 'mb', l: 'ml' }, s, spaceTok, (side, v) => `m${side}-${spaceTok(v)}`, classes, leftover)
  const insetName = { '': 'inset', x: 'inset-x', y: 'inset-y', t: 'top', r: 'right', b: 'bottom', l: 'left' }
  collapse4({ t: 'top', r: 'rgt', b: 'bot', l: 'lft' }, s, spaceTok, (side, v) => `${insetName[side]}-${spaceTok(v)}`, classes, leftover)
  collapse4({ t: 'bwt', r: 'bwr', b: 'bwb', l: 'bwl' }, s, bwTok, bwClass, classes, leftover)
  collapse4({ t: 'bct', r: 'bcr', b: 'bcb', l: 'bcl' }, s, v => colorSuffix(v, theme, BORDER_ROLES),
    (side, v) => { const suf = colorSuffix(v, theme, BORDER_ROLES); return suf ? `border${side ? '-' + side : ''}-${suf}` : null }, classes, leftover)
  mapRadius(s, classes)
  const grouped = new Set(['pt', 'pr', 'pb', 'pl', 'mt', 'mr', 'mb', 'ml', 'top', 'rgt', 'bot', 'lft', 'bwt', 'bwr', 'bwb', 'bwl', 'bct', 'bcr', 'bcb', 'bcl', 'rtl', 'rtr', 'rbr', 'rbl'])

  // per-key handlers (return a class, class[], OMIT, or null⇒leftover)
  const e = enumOut
  const H = {
    dsp: v => e(DSP, v), fd: v => e(FD, v), fw: v => e(FW, v), jc: v => e(JC, v), ai: v => e(AI, v),
    ta: v => e(TA, v), tt: v => e(TT, v), td: v => mapTd(v), pos: v => e(POS, v), fst: v => e(FST, v),
    ws: v => e(WS, v), bst: v => e(BST, v), ov: v => mapOverflow(v), gap: v => mapGap(v),
    fwt: v => mapFwt(v), fs: v => mapFontSize(v), lh: v => mapLh(v), ls: v => mapLs(v),
    op: v => mapOp(v), z: v => mapZ(v), fg: v => mapGrow(v), fsh: v => mapShrink(v), fb: v => mapBasis(v),
    ff: v => mapFont(v, theme), col: v => colorOut('text', v, theme, TEXT_ROLES), bc: v => colorOut('bg', v, theme, BG_ROLES),
    gtc: v => mapGridCols(v), gtr: v => mapGridRows(v), gcol: v => mapSpan('col', v), grow_: v => mapSpan('row', v),
    bsz: v => e(BSZ, v), bp: v => mapBgPos(v), br: v => e(BR, v), sh: v => mapShadow(v, theme),
  }

  for (const [k, v] of Object.entries(s)) {
    if (grouped.has(k)) continue
    if (LEFTOVER.has(k)) { leftover[k] = v; continue }
    const h = H[k]
    if (!h) { leftover[k] = v; continue }
    const r = h(v)
    if (r === OMIT) continue
    const arr = (Array.isArray(r) ? r : [r]).filter(Boolean)
    if (!arr.length) { leftover[k] = v; continue }
    for (const c of arr) classes.push(c)
  }

  const seen = new Set(), uniq = []
  for (const c of classes) if (!seen.has(c)) { seen.add(c); uniq.push(c) }
  return { classes: uniq.sort((a, b) => rank(a) - rank(b) || 0).join(' '), leftover }
}

// purely cosmetic ordering (Tailwind is order-independent) so demo output reads top-down.
const RANK = [
  [/^(relative|absolute|fixed|sticky|static)$/, 0], [/^(inset|top|right|bottom|left)|^-?z-/, 1],
  [/^(block|inline|flex|grid|hidden|contents|flow-root|table)/, 2], [/^(flex-|grow|shrink|basis-|justify-|items-|gap-)/, 3],
  [/^(grid-cols|grid-rows|col-|row-)/, 4], [/^(p[trblxy]?-|m[trblxy]?-)/, 5], [/^(w-|h-)/, 6],
  [/^(font-|leading-|tracking-|uppercase|lowercase|capitalize|italic|not-italic|underline|line-through|overline|whitespace-)/, 7],
  [/^text-(center|left|right|justify|end)$/, 7], [/^text-/, 8], [/^bg-/, 9], [/^border/, 10], [/^rounded/, 11], [/^(shadow|opacity-|overflow|mix-)/, 12],
]
function rank(c) { for (const [re, r] of RANK) if (re.test(c)) return r; return 8.5 }

/* ================================= CLI ================================= */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`\n  uiforge-tailwindify — map captured styles → Tailwind v4 utility classes.\n\n  node uiforge-tailwindify.mjs capture.json theme.json [--sample N]\n\n  Prints (inline → classes) examples for the N richest nodes and a mapped-vs-leftover\n  coverage %. Import { tw } elsewhere to use it in the exporter.\n`)
    process.exit(0)
  }
  const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
  const vIdx = new Set(); for (const nm of ['--sample']) { const i = argv.indexOf(nm); if (i >= 0) vIdx.add(i + 1) }
  const pos = argv.filter((a, i) => !a.startsWith('--') && !vIdx.has(i))
  const capPath = pos[0], themePath = pos[1]
  if (!capPath || !themePath) { console.error('\n  need: capture.json theme.json\n'); process.exit(2) }
  const cap = JSON.parse(readFileSync(capPath, 'utf8'))
  const theme = JSON.parse(readFileSync(themePath, 'utf8'))
  const nodes = cap.nodes || []
  const sampleN = Math.max(1, parseInt(valAt('--sample') || '6', 10) || 6)

  // kebab CSS names, for a readable inline print
  const NAME = { dsp: 'display', pos: 'position', top: 'top', rgt: 'right', bot: 'bottom', lft: 'left', z: 'z-index', ov: 'overflow', fd: 'flex-direction', fw: 'flex-wrap', jc: 'justify-content', ai: 'align-items', gap: 'gap', gtc: 'grid-template-columns', gtr: 'grid-template-rows', gcol: 'grid-column', grow_: 'grid-row', fg: 'flex-grow', fsh: 'flex-shrink', fb: 'flex-basis', mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left', pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left', ff: 'font-family', fs: 'font-size', fwt: 'font-weight', fst: 'font-style', lh: 'line-height', ls: 'letter-spacing', ta: 'text-align', tt: 'text-transform', td: 'text-decoration', col: 'color', ws: 'white-space', bc: 'background-color', bi: 'background-image', bsz: 'background-size', bp: 'background-position', br: 'background-repeat', bwt: 'border-top-width', bwr: 'border-right-width', bwb: 'border-bottom-width', bwl: 'border-left-width', bst: 'border-style', bct: 'border-top-color', bcr: 'border-right-color', bcb: 'border-bottom-color', bcl: 'border-left-color', rtl: 'border-top-left-radius', rtr: 'border-top-right-radius', rbr: 'border-bottom-right-radius', rbl: 'border-bottom-left-radius', sh: 'box-shadow', op: 'opacity', flt: 'filter', bdf: 'backdrop-filter', tf: 'transform', tr: 'transition', mbm: 'mix-blend-mode', an: 'animation-name', ad: 'animation-duration', atf: 'animation-timing-function', adl: 'animation-delay', aic: 'animation-iteration-count', adr: 'animation-direction', afm: 'animation-fill-mode' }
  const decls = obj => Object.entries(obj).map(([k, v]) => { const val = String(v).length > 42 ? String(v).slice(0, 39) + '…' : String(v); return `${NAME[k] || k}:${val}` }).join('; ')

  // coverage over every styled node
  let total = 0, left = 0, nClass = 0, fullNodes = 0, styledNodes = 0
  const leftFreq = new Map()
  for (const n of nodes) {
    const st = n.style || {}; const keys = Object.keys(st); if (!keys.length) continue
    styledNodes++
    const { classes, leftover } = tw(st, theme)
    total += keys.length
    const lk = Object.keys(leftover); left += lk.length
    if (!lk.length) fullNodes++
    for (const k of lk) leftFreq.set(k, (leftFreq.get(k) || 0) + 1)
    nClass += classes ? classes.split(' ').filter(Boolean).length : 0
  }
  const cov = total ? (total - left) / total * 100 : 0

  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', Y = '\x1b[33m', X = '\x1b[0m'
  console.log(`\n  ${B}UIForge tailwindify${X} ${D}← ${capPath}  ·  theme ${themePath}${X}`)
  console.log(`    ${C}roles${X} ${Object.entries(theme.roles || {}).map(([k, v]) => `${k}:${v}`).join('  ')}`)

  // richest nodes as (inline → classes) examples
  const ranked = nodes.filter(n => n.style && Object.keys(n.style).length).sort((a, b) => Object.keys(b.style).length - Object.keys(a.style).length).slice(0, sampleN)
  console.log(`\n  ${B}samples${X} ${D}(${sampleN} richest nodes)${X}`)
  for (const n of ranked) {
    const st = n.style, { classes, leftover } = tw(st, theme)
    const nk = Object.keys(st).length, lk = Object.keys(leftover).length
    console.log(`\n  ${D}#${n.i} <${n.tag}>  ${nk} props → ${nk - lk} mapped / ${lk} inline${X}`)
    console.log(`    ${D}inline  ${X}${decls(st)}`)
    console.log(`    ${G}classes ${X}${classes || D + '(none)' + X}`)
    if (lk) console.log(`    ${Y}leftover${X} ${decls(leftover)}`)
  }

  // which props most often stay inline — should be the exotic ones
  const topLeft = [...leftFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, c]) => `${NAME[k] || k}×${c}`).join('  ')
  console.log(`\n  ${B}coverage${X}  ${G}${cov.toFixed(1)}%${X} ${D}of style props → classes${X}`)
  console.log(`    ${D}${total} props across ${styledNodes} styled nodes · ${nClass} classes emitted · ${fullNodes} nodes fully mapped (0 inline)${X}`)
  console.log(`    ${C}stays inline${X} ${topLeft || D + '—' + X}`)
  console.log('')
}
