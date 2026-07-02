#!/usr/bin/env node
// uiforge-extract — turn a REFERENCE into a measured signature (and a project ruleset).
//
// This is the front of the "taste compiler": the rules come from YOUR reference,
// not from UIForge's generic defaults. Point it at a page you admire (or your own
// brand), and it emits the quantified signature — type ramp, accent + its budget,
// grid unit, layout posture — that the render-audit gate then enforces with --spec.
//
// Usage:
//   node uiforge-extract.mjs <url|file.html> [--out signature.json] [--config uiforge.config.json] [--viewport WxH]
//   node uiforge-extract.mjs <url|file.html> --print        # just print the signature, write nothing
//
// URL / .html: rendered via uiforge-render-audit (Playwright) and measured.
// Image reference: TODO (vision) — not in this milestone.

import { spawnSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)

// ---- signature schema: the ONE contract the URL path and the vision path both satisfy,
// so an image-derived signature is interchangeable with a rendered one downstream ----
const RADII = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', 'full']
const SIG_SCHEMA = `signature.json — the reference's measured DNA:
  source       string    the reference
  typeRamp     number[]  distinct font sizes in px, ascending (3–8)
  typeRatio    number|null   dominant modular ratio (~1.1–1.7)
  accent       { hue: 0–360 | null, budgetPct: 0–100 }   the ONE accent + its surface %
  gridUnit     number    spacing base in px (usually 4 or 8)
  radii        string[]  subset of ${RADII.join('/')}
  contrastMin  number    WCAG floor, >= 4.5 (never lower)
  layout       { posture: "asymmetric" | "centered", centeredHero: boolean }`

function validateSignature(s) {
  const e = []
  const num = (v, lo, hi, name) => { if (typeof v !== 'number' || Number.isNaN(v) || v < lo || v > hi) e.push(`${name}: expected number ${lo}–${hi}, got ${JSON.stringify(v)}`) }
  if (!s || typeof s !== 'object') return { ok: false, errors: ['not an object'] }
  if (!Array.isArray(s.typeRamp) || s.typeRamp.length < 1 || !s.typeRamp.every(n => typeof n === 'number' && n > 0)) e.push('typeRamp: expected number[] of px sizes')
  if (s.typeRatio != null) num(s.typeRatio, 1, 3, 'typeRatio')
  if (!s.accent || typeof s.accent !== 'object') e.push('accent: expected { hue, budgetPct }')
  else { if (s.accent.hue != null) num(s.accent.hue, 0, 360, 'accent.hue'); num(s.accent.budgetPct, 0, 100, 'accent.budgetPct') }
  num(s.gridUnit, 1, 64, 'gridUnit')
  if (!Array.isArray(s.radii) || !s.radii.every(r => RADII.includes(r))) e.push(`radii: expected a subset of ${RADII.join('/')}`)
  num(s.contrastMin ?? 4.5, 4.5, 21, 'contrastMin')
  if (!s.layout || !['asymmetric', 'centered'].includes(s.layout.posture)) e.push('layout.posture: "asymmetric" | "centered"')
  return { ok: e.length === 0, errors: e }
}

// a schema-valid template for the vision path — the model fills it by LOOKING at the image
function skeleton(ref) {
  return {
    source: ref,
    _vision: 'Fill this by looking at the reference. Read the DNA (type sizes, the ONE accent + roughly its surface %, spacing base, corner radius bucket, layout posture) — never the pixels. Then: uiforge-extract.mjs --validate <this file>.',
    typeRamp: [14, 16, 20, 32, 56],
    typeRatio: null,
    accent: { hue: null, budgetPct: 0 },
    gridUnit: 8,
    radii: ['md'],
    contrastMin: 4.5,
    layout: { posture: 'asymmetric', centeredHero: false },
  }
}

if (argv.includes('--self-test')) {
  const good = { source: 'x', typeRamp: [14, 16, 22, 40], typeRatio: 1.4, accent: { hue: 12, budgetPct: 6 }, gridUnit: 8, radii: ['sm', 'md'], contrastMin: 4.5, layout: { posture: 'asymmetric', centeredHero: false } }
  const bad = { typeRamp: [], accent: { hue: 999, budgetPct: -5 }, gridUnit: 0, radii: ['huge'], layout: { posture: 'diagonal' } }
  const g = validateSignature(good), b = validateSignature(bad)
  console.log('\n  uiforge-extract — schema self-test\n')
  console.log(`  GOOD  ok=${g.ok}`)
  console.log(`  BAD   ok=${b.ok}  (${b.errors.length} errors: ${b.errors.map(x => x.split(':')[0]).join(', ')})`)
  const ok = g.ok && !b.ok && b.errors.length >= 4
  console.log(ok ? '\n  \x1b[32m✓ PASS — schema accepts a valid signature, rejects a broken one\x1b[0m\n' : '\n  \x1b[31m✗ FAIL\x1b[0m\n')
  process.exit(ok ? 0 : 1)
}
if (argv.includes('--schema')) { console.log('\n' + SIG_SCHEMA + '\n'); process.exit(0) }

if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-extract — a reference in, a measured signature out.

  node uiforge-extract.mjs <url|file.html> [--out signature.json] [--config uiforge.config.json] [--viewport WxH]
  node uiforge-extract.mjs <image>                    # vision path: write a schema skeleton to fill by looking
  node uiforge-extract.mjs --validate signature.json  # check a vision/hand-written signature
  node uiforge-extract.mjs --schema                   # print the signature schema

  URL/.html is measured (Playwright). An image emits a skeleton the model fills from
  vision — SAME schema, so it's interchangeable downstream. The signature drives:
    node uiforge-render-audit.mjs <target> --spec signature.json
`)
  process.exit(0)
}

const valAt = name => { const i = argv.indexOf(name); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const viewport = valAt('--viewport')
const outPath = valAt('--out') || 'signature.json'
const configPath = valAt('--config')
const printOnly = argv.includes('--print')
const valueIdx = new Set()
for (const nm of ['--viewport', '--out', '--config', '--validate']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }

// --validate <file>: check a vision- or hand-written signature against the schema
const validatePath = valAt('--validate')
if (validatePath) {
  const fs = await import('node:fs')
  let sig; try { sig = JSON.parse(fs.readFileSync(validatePath, 'utf8')) } catch (err) { console.error(`cannot read ${validatePath}: ${err.message}`); process.exit(2) }
  const v = validateSignature(sig.signature || sig)
  if (v.ok) { console.log(`\n  \x1b[32m✓ ${validatePath} is a valid signature\x1b[0m\n`); process.exit(0) }
  console.error(`\n  \x1b[31m✗ ${validatePath} is invalid:\x1b[0m`)
  for (const err of v.errors) console.error(`    · ${err}`)
  console.error(`  schema:  node uiforge-extract.mjs --schema\n`)
  process.exit(1)
}

const ref = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
if (!ref) { console.error('give a reference: a URL, a .html file, or an image (vision path)'); process.exit(2) }

// image → vision path: the tool can't see the image, so emit a schema-valid skeleton for
// the model (/reskin) to fill by looking at it, then --validate. Same schema as the URL path.
if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(ref)) {
  const fs = await import('node:fs')
  const skel = skeleton(ref)
  if (printOnly) console.log(JSON.stringify(skel, null, 2))
  else {
    fs.writeFileSync(outPath, JSON.stringify(skel, null, 2) + '\n')
    console.log(`\n  vision path — wrote a skeleton to ${outPath}.`)
    console.log(`  Fill it by LOOKING at ${ref} (type ramp · the one accent + its surface % · grid · radii · posture), then:`)
    console.log(`    node ${path.relative(process.cwd(), path.join(HERE, 'uiforge-extract.mjs'))} --validate ${outPath}\n`)
  }
  process.exit(0)
}

// Reuse render-audit's Playwright harness: it renders + derives the signature for us.
const args = [path.join(HERE, 'uiforge-render-audit.mjs'), ref, '--signature']
if (viewport) args.push('--viewport', viewport)
const r = spawnSync(process.execPath, args, { encoding: 'utf8', env: process.env })
if (r.status !== 0 || !r.stdout.trim()) {
  console.error('could not extract signature:\n', (r.stderr || r.stdout || '').trim())
  process.exit(r.status || 2)
}
const signature = JSON.parse(r.stdout)

if (printOnly) { console.log(JSON.stringify(signature, null, 2)); process.exit(0) }

writeFileSync(outPath, JSON.stringify(signature, null, 2) + '\n')

// COMPILE → a project-local ruleset. The signature IS the render-audit spec; the
// `gate` block re-surfaces the load-bearing values for the source linter (later).
if (configPath) {
  const config = {
    $schema: 'uiforge/config@1',
    version: 1,
    source: signature.source || ref,
    signature,
    gate: {
      contrastMin: signature.contrastMin ?? 4.5,
      accentHue: signature.accent?.hue ?? null,
      accentBudgetPct: signature.accent?.budgetPct ?? null,
      gridUnit: signature.gridUnit ?? null,
      typeRamp: signature.typeRamp ?? null,
      layoutPosture: signature.layout?.posture ?? null,
    },
  }
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n')
}

// report
const a = signature.accent || {}
const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge signature${X} ${D}← ${ref}${X}`)
console.log(`    type ramp   ${(signature.typeRamp || []).join(' · ')}${signature.typeRatio ? `  (ratio ~${signature.typeRatio})` : ''}`)
console.log(`    accent      hue ~${a.hue ?? '—'}°  ·  budget ${a.budgetPct ?? '—'}% of surface`)
console.log(`    grid unit   ${signature.gridUnit ?? '—'}px`)
console.log(`    layout      ${signature.layout?.posture ?? '—'}`)
console.log(`\n  ${G}→ ${outPath}${X}${configPath ? `  ${G}→ ${configPath}${X}` : ''}`)
console.log(`  ${D}grade a target against it:  node ${path.relative(process.cwd(), path.join(HERE, 'uiforge-render-audit.mjs'))} <target> --spec ${outPath}${X}\n`)
