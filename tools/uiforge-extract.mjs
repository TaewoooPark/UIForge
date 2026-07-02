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

if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-extract — a reference in, a measured signature out.

  node uiforge-extract.mjs <url|file.html> [--out signature.json] [--config uiforge.config.json] [--viewport WxH]
  node uiforge-extract.mjs <url|file.html> --print

  Emits the signature the render-audit gate enforces:
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
for (const nm of ['--viewport', '--out', '--config']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const ref = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))

if (!ref) { console.error('give a reference: a URL or a .html file'); process.exit(2) }
if (/\.(png|jpe?g|webp|gif|avif|svg)$/i.test(ref)) {
  console.error('image references need the vision path (not in this milestone). Give a URL or .html for now.')
  process.exit(2)
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
