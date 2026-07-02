#!/usr/bin/env node
// uiforge-attention — predict where the eye LANDS, and check the hierarchy.
//
// The most common design critique — "the hierarchy is weak", "it doesn't lead the
// eye" — is subjective until you measure it. This predicts a gaze order from a
// saliency proxy (size · contrast · position · accent · weight) on the rendered
// page, then checks: is there ONE clear focal point? does the eye reach the
// headline first? is the primary action buried? Turns a felt critique into a
// testable claim.
//
// Usage:
//   node uiforge-attention.mjs <url|file.html> [--expect "text or selector"] [--json] [--viewport WxH]
//   node uiforge-attention.mjs --self-test     # pure-logic regression, no browser
//
// Reuses the render-audit Playwright harness + measurement helpers.

import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { renderSnapshot, measure, contrast, parseColor, over, hsl } from './uiforge-render-audit.mjs'

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }
const isNeutralC = c => { const { s, l } = hsl(c); return s < 0.15 || l > 0.9 || l < 0.06 }

// snapshot → { viewport, order:[{rank,sel,saliency,kind,accent}], verdict:{status,clear,headline,cta,notes} }
function attention(snap) {
  const V = snap.viewport, nodes = snap.nodes || [], vpArea = Math.max(1, V.w * V.h)
  const accentHue = measure(snap).accentHue

  const cands = nodes.filter(n => {
    const area = n.w * n.h
    if (area < 200) return false
    if (n.isText && n.textLen) return true
    const c = parseColor(n.bg)                       // a colored block (button/badge/card), not the full hero bg
    return c.a > 0 && !isNeutralC(c) && area > 1000 && area < vpArea * 0.4
  })
  if (cands.length < 2) return { viewport: V, order: [], verdict: { status: 'empty', clear: false, headline: null, cta: null, notes: ['not enough salient elements to rank'] } }

  const raw = cands.map(n => {
    const bg = parseColor(n.bg), isTxt = !!(n.isText && n.textLen)
    const size = isTxt ? n.fontSize : Math.sqrt(n.w * n.h) / 6
    const cont = isTxt ? contrast(over(parseColor(n.fg), bg), bg) : contrast(bg, { r: 255, g: 255, b: 255, a: 1 })
    const pos = clamp(1 - clamp(n.y / (V.h * 1.4)) * 0.8 - clamp(n.x / V.w) * 0.2)   // reading order: top-left first
    const col = isTxt ? parseColor(n.fg) : bg
    const acc = (accentHue != null && !isNeutralC(col) && hueDist(hsl(col).h, accentHue) < 30) ? 1 : 0
    const wt = isTxt ? clamp((n.fontWeight || 400) / 900) : 0.5
    return { n, isTxt, size, cont, pos, acc, wt }
  })
  const norm = key => { const vs = raw.map(r => r[key]), mn = Math.min(...vs), mx = Math.max(...vs); return v => mx > mn ? (v - mn) / (mx - mn) : 0.5 }
  const nSize = norm('size'), nCont = norm('cont')
  const scored = raw.map(r => ({ ...r, saliency: +(0.34 * nSize(r.size) + 0.24 * nCont(r.cont) + 0.22 * r.pos + 0.12 * r.acc + 0.08 * r.wt).toFixed(3) }))
    .sort((a, b) => b.saliency - a.saliency)

  const headline = scored.filter(r => r.isTxt).slice().sort((a, b) => b.n.fontSize - a.n.fontSize)[0]
  const cta = scored.filter(r => r.acc && r.n.w * r.n.h < vpArea * 0.08).sort((a, b) => b.saliency - a.saliency)[0]
  const rankOf = r => scored.indexOf(r) + 1

  const notes = []; let status = 'ok'
  const s0 = scored[0].saliency, s1 = scored[1] ? scored[1].saliency : 0
  const clear = s0 > 0 && (s0 - s1) / s0 >= 0.12
  if (!clear) { status = 'flat'; notes.push(`flat hierarchy — the top two elements are within ${Math.round(100 * (s0 - s1) / Math.max(s0, 1e-6))}% saliency; the eye has no single place to land`) }
  else notes.push(`clear focal point — ${scored[0].n.sel} leads`)
  if (headline) { const hr = rankOf(headline); if (hr > 2) { status = status === 'ok' ? 'weak' : status; notes.push(`the eye lands on ${scored[0].n.sel} (#1), not your headline ${headline.n.sel} (#${hr})`) } }
  if (cta) { const cr = rankOf(cta); if (cr > 4) { status = status === 'ok' ? 'weak' : status; notes.push(`primary action ${cta.n.sel} is buried at #${cr}`) } }

  return {
    viewport: V,
    order: scored.slice(0, 6).map((r, i) => ({ rank: i + 1, sel: r.n.sel, saliency: r.saliency, kind: r.isTxt ? `text ${Math.round(r.n.fontSize)}px` : 'block', accent: !!r.acc })),
    verdict: { status, clear, headline: headline?.n.sel || null, cta: cta?.n.sel || null, notes },
  }
}

/* ============================= self-test ============================= */
function selfTest() {
  const mk = nodes => ({ viewport: { w: 1280, h: 800 }, nodes, samples: [] })
  // CLEAR: one big headline top-left, small body, an accent button
  const clear = mk([
    { sel: 'h1', pid: 0, x: 80, y: 90, w: 620, h: 64, fg: 'rgb(20,22,28)', bg: 'rgb(246,247,249)', fontSize: 56, fontWeight: 700, radius: 0, isText: true, textLen: 30 },
    { sel: 'p', pid: 0, x: 80, y: 180, w: 460, h: 22, fg: 'rgb(70,74,82)', bg: 'rgb(246,247,249)', fontSize: 17, fontWeight: 400, radius: 0, isText: true, textLen: 90 },
    { sel: 'button.cta', pid: 0, x: 80, y: 230, w: 150, h: 44, fg: 'rgb(255,255,255)', bg: 'rgb(30,64,175)', fontSize: 16, fontWeight: 600, radius: 2, isText: true, textLen: 12 },
    { sel: 'small', pid: 0, x: 80, y: 300, w: 300, h: 16, fg: 'rgb(120,124,130)', bg: 'rgb(246,247,249)', fontSize: 13, fontWeight: 400, radius: 0, isText: true, textLen: 40 },
  ])
  // FLAT: four equal mid-size blocks competing, no dominant element
  const flat = mk(Array.from({ length: 4 }, (_, i) => ({
    sel: `card${i}`, pid: 0, x: 80 + (i % 2) * 400, y: 120 + Math.floor(i / 2) * 220, w: 360, h: 200,
    fg: 'rgb(30,34,40)', bg: 'rgb(228,230,234)', fontSize: 20, fontWeight: 500, radius: 8, isText: true, textLen: 40,
  })))

  const c = attention(clear), f = attention(flat)
  const show = (name, r) => `  ${name.padEnd(6)} status=${r.verdict.status.padEnd(5)} #1=${r.order[0]?.sel} clear=${r.verdict.clear} headline=${r.verdict.headline}`
  console.log('\n  UIForge attention — self-test (pure logic, no browser)\n')
  console.log(show('CLEAR', c)); console.log(show('FLAT', f)); console.log()
  const clearOK = c.verdict.clear && c.order[0].sel === 'h1' && c.verdict.status !== 'flat'
  const flatOK = !f.verdict.clear && f.verdict.status === 'flat'
  const ok = clearOK && flatOK
  console.log(ok ? '  \x1b[32m✓ PASS — a designed page has a focal point; a flat one is caught\x1b[0m\n'
    : `  \x1b[31m✗ FAIL — clearOK=${clearOK} flatOK=${flatOK}\x1b[0m\n`)
  process.exit(ok ? 0 : 1)
}

/* ============================= CLI ============================= */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (argv.includes('--self-test')) selfTest()
  else if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`
  uiforge-attention — predict the gaze order + check the hierarchy.

  node uiforge-attention.mjs <url|file.html> [--expect "text/sel"] [--json] [--viewport WxH]
  node uiforge-attention.mjs --self-test

  Saliency proxy: size · contrast · position · accent · weight. Reports where the
  eye lands 1st→6th, whether there's ONE focal point, and if the headline/CTA lead.
`)
    process.exit(0)
  } else {
    const JSON_OUT = argv.includes('--json')
    const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
    const [vw, vh] = (valAt('--viewport') || '1280x800').split('x').map(Number)
    const expect = valAt('--expect')
    const valueIdx = new Set(); for (const nm of ['--viewport', '--expect']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
    const target = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))

    const snap = await renderSnapshot(target, { width: vw, height: vh })
    const rep = attention({ viewport: { w: vw, h: vh }, nodes: snap.nodes, samples: snap.samples })

    if (expect && rep.order.length) {
      const q = expect.toLowerCase()
      const hit = rep.order.find(o => o.sel.toLowerCase().includes(q))
      rep.expect = { query: expect, rank: hit ? hit.rank : null, pass: !!hit && hit.rank <= 3 }
    }
    if (JSON_OUT) { console.log(JSON.stringify({ target, ...rep }, null, 2)); process.exit(rep.verdict.status === 'flat' ? 1 : 0) }

    const R = '\x1b[31m', Y = '\x1b[33m', G = '\x1b[32m', B = '\x1b[1m', C = '\x1b[36m', D = '\x1b[2m', X = '\x1b[0m'
    const sc = rep.verdict.status === 'flat' ? R : rep.verdict.status === 'weak' ? Y : G
    console.log(`\n  ${B}UIForge attention${X} ${D}— gaze order @ ${vw}×${vh}${X}\n`)
    for (const o of rep.order) console.log(`  ${C}#${o.rank}${X} ${B}${o.sel}${X} ${D}${o.saliency} · ${o.kind}${o.accent ? ' · accent' : ''}${X}`)
    console.log(`\n  ${sc}${B}hierarchy: ${rep.verdict.status}${X}`)
    for (const n of rep.verdict.notes) console.log(`  ${D}· ${n}${X}`)
    if (rep.expect) console.log(`  ${rep.expect.pass ? G : R}· expected "${rep.expect.query}" → ${rep.expect.rank ? `#${rep.expect.rank}` : 'not in top 6'}${X}`)
    console.log()
    process.exit(rep.verdict.status === 'flat' ? 1 : 0)
  }
}

export { attention }
