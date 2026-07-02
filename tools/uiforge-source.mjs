#!/usr/bin/env node
// uiforge-source — the SOURCE stage. Given a need ("pricing card", "dialog") and,
// optionally, a reference signature (from uiforge-extract), rank the catalog's
// components by FIT and return install candidates — not "any tasteful component",
// but the ones closest to the signature you committed to, preferring provenance
// (radix), variants, and real a11y.
//
// Usage:
//   node uiforge-source.mjs "<need>" [--spec signature.json] [--type ui] [--limit N] [--json]
//   node uiforge-source.mjs "dialog" --spec signature.json --type ui
//
// Ranking = semantic fit (need ↔ name/tags/type) · style fit (spec.radii ↔ item radii)
//         · taste grade (a11y + radix provenance + variants − raw color).

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

// silence only the node:sqlite experimental warning
const _emit = process.emitWarning
process.emitWarning = (w, ...a) => { if (String(w).includes('SQLite')) return; return _emit.call(process, w, ...a) }
const { DatabaseSync } = await import('node:sqlite')

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)
if (argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-source — rank catalog components by fit to a need (+ a reference signature).

  node uiforge-source.mjs "<need>" [--spec signature.json] [--type ui] [--limit N] [--json]

  Score = semantic(need↔name/tags/type)·0.5 + style(spec.radii↔item)·0.3 + taste(a11y/radix/variants)·0.2
  Needs the catalog: build it with  node uiforge-harvest.mjs
`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const JSON_OUT = argv.includes('--json')
const typeFilter = valAt('--type')
const limit = Number(valAt('--limit') || 8)
const specPath = valAt('--spec')
const dbPath = valAt('--db') || path.join(HERE, 'catalog', 'catalog.db')
const valueIdx = new Set()
for (const nm of ['--spec', '--type', '--limit', '--db']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const need = (argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx)) || '').toLowerCase()

if (!existsSync(dbPath)) { console.error(`no catalog at ${dbPath}\n  build it:  node ${path.relative(process.cwd(), path.join(HERE, 'uiforge-harvest.mjs'))}`); process.exit(2) }

let spec = null
if (specPath) { const raw = JSON.parse((await import('node:fs')).readFileSync(specPath, 'utf8')); spec = raw.signature || raw }

// radius sharpness as an ordinal, so style fit is a gradient (a sharp reference
// partially matches sm/md and mismatches xl/full) instead of jaccard's 0/1.
const RO = { none: 0, sm: 1, md: 2, lg: 3, xl: 4, '2xl': 5, '3xl': 6, full: 7 }
const avgRad = arr => arr && arr.length ? arr.reduce((s, r) => s + (RO[r] ?? 3), 0) / arr.length : null
function styleFit(spec, sig) {
  if (!spec) return 0.5
  if (!spec.radii || !spec.radii.length) return 0.4
  const a = avgRad(spec.radii), b = avgRad(sig.radii || [])
  if (a == null || b == null) return 0.35              // no radius signal on one side
  return +(1 - Math.min(Math.abs(a - b) / 4, 1)).toFixed(2)
}
const tokens = s => String(s || '').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)
const needTok = tokens(need)
function semanticFit(name, tags, type) {
  if (!needTok.length) return 0.5
  const hay = new Set(tokens(`${name} ${tags} ${type}`))
  let hit = 0; for (const t of needTok) if (hay.has(t)) hit++
  let s = hit / needTok.length
  if (needTok.some(t => name === t)) s = Math.min(1, s + 0.5)      // exact name match
  else if (needTok.some(t => name.includes(t))) s = Math.min(1, s + 0.2)
  return s
}

const db = new DatabaseSync(dbPath, { readOnly: true })
let rows = db.prepare('SELECT id, name, type, tags, deps, signature FROM components').all()
if (typeFilter) rows = rows.filter(r => r.type === typeFilter)

const ranked = rows.map(r => {
  const sig = JSON.parse(r.signature || '{}')
  const a11y = sig.a11y || {}
  const semantic = semanticFit(r.name, r.tags, r.type)
  const style = styleFit(spec, sig)
  let taste = (a11y.hasFocusVisible ? 0.25 : 0) + (a11y.hasAria ? 0.15 : 0)
    + (sig.depsRadix ? 0.25 : 0) + (sig.hasVariants ? 0.15 : 0) + (sig.motion ? 0.05 : 0)
    - (sig.usesRawColor ? 0.2 : 0)
  taste = Math.max(0, Math.min(1, taste + 0.2))                    // baseline 0.2, clamp
  const score = semantic * 0.5 + style * 0.3 + taste * 0.2
  const why = []
  if (semantic >= 0.5) why.push('need')
  if (spec && spec.radii && style > 0) why.push(`radii:${(sig.radii || []).join('/') || '—'}`)
  if (sig.depsRadix) why.push('radix')
  if (a11y.hasFocusVisible) why.push('focus-visible')
  if (sig.hasVariants) why.push('variants')
  if (sig.usesRawColor) why.push('−rawcolor')
  return { id: r.id, name: r.name, type: r.type, score: +score.toFixed(3),
    semantic: +semantic.toFixed(2), style: +style.toFixed(2), taste: +taste.toFixed(2), why }
})
  .filter(r => !needTok.length || r.semantic > 0)                  // if a need was given, require some match
  .sort((a, b) => b.score - a.score)
  .slice(0, limit)
db.close()

if (JSON_OUT) { console.log(JSON.stringify({ need, spec: specPath || null, results: ranked }, null, 2)); process.exit(0) }

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge source${X} ${D}— "${need || 'any'}"${spec ? ` · fit to ${(spec.source || specPath).split('/').pop()}` : ''}${typeFilter ? ` · type=${typeFilter}` : ''}${X}\n`)
if (!ranked.length) console.log(`  ${D}no candidates. try a broader need or drop --type.${X}\n`)
for (const r of ranked) {
  console.log(`  ${C}${r.score.toFixed(2)}${X} ${B}${r.id}${X} ${D}[${r.type}]${X}`)
  console.log(`       ${D}semantic ${r.semantic} · style ${r.style} · taste ${r.taste}  ·  ${r.why.join(' · ')}${X}`)
}
if (ranked.length) {
  const top = ranked.slice(0, 3).map(r => r.id).join(' ')
  console.log(`\n  ${G}install the top picks:${X}  npx shadcn@latest add ${top}\n`)
}
