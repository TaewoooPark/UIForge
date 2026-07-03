#!/usr/bin/env node
// uiforge-segment — stage 2 of the clone pipeline: structural segmentation.
//
// capture.json is a flat, styled element tree (up to ~2500 nodes). Emitting React
// straight from it yields ONE enormous component and a 1000-node flat dump. This
// tool finds the reusable structure hidden in that tree so the export can emit
// componentized React instead:
//   sections     — the page's top-level vertical bands (nav / hero / feature grid /
//                  pricing / footer …), one React section per band.
//   repeatGroups — sibling subtrees that share a structural SHAPE (the logo row, the
//                  pricing cards, the nav links). One React component per group, mapped
//                  over its data, instead of N copies of the same markup.
//
// It reads only structure (tag + display + hierarchy) and geometry — never text or
// exact style values — so a group is "the same component" by shape, not by content.
//
// Usage:
//   node uiforge-segment.mjs capture.json [--out segment.json]

import process from 'node:process'
import { readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

/* =============================== core pass =============================== */
// Pure: capture object → { source, viewport, sections, repeatGroups }.
function segment(cap) {
  const nodes = cap.nodes || []
  const vw = (cap.viewport && cap.viewport.w) || 1440

  // byId + kids, exactly as reconstruct builds them: a node whose pid isn't a real
  // node reparents to -1 (a root), so orphaned subtrees stay reachable from -1.
  const byId = new Map(nodes.map(n => [n.i, n]))
  const kids = new Map()
  for (const n of nodes) { const p = byId.has(n.pid) ? n.pid : -1; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n) }
  const childrenOf = id => kids.get(id) || []

  /* ------------------------------- SECTIONS ------------------------------- */
  const SEMANTIC_TAGS = new Set(['nav', 'header', 'footer', 'main', 'section', 'aside'])
  const ROLE_MAP = { banner: 'header', navigation: 'nav', contentinfo: 'footer', main: 'main', complementary: 'aside', region: 'section' }
  const semanticName = n => (SEMANTIC_TAGS.has(n.tag) ? n.tag : null) || (n.role && ROLE_MAP[n.role]) || null

  const isWide = n => n.w >= 0.6 * vw
  const isTall = n => n.h >= 40
  // bands = wide + tall children, top-to-bottom. They inherently stack vertically:
  // each spans ≥60% of the viewport, so two can't sit side by side — sorting by y
  // yields the visual band order.
  const bandsFrom = ch => ch.filter(c => isWide(c) && isTall(c)).sort((a, b) => a.y - b.y)

  // Descend the wrapper chain from the main root to the container whose children ARE the
  // page's vertical bands. Two things to see through on the way:
  //   • lone wide wrappers (body > #app > #__next > main …) — descend straight through them.
  //   • a mega-wrapper flanked only by thin chrome — e.g. #1 = [header 76px, main 13490px].
  //     `main` isn't a band, it's the band CONTAINER; peel the header/nav/footer chrome off
  //     as sections and descend into it.
  // Stop at the first container with ≥2 COMPARABLE bands — that's the real section stack
  // (a genuine tall section is only ~half its stack, never an 0.85+ mega-wrapper).
  function collectSections() {
    const roots = childrenOf(-1)
    // ignore degenerate roots (1×1 tracking pixels, 0-size bits reparented to -1)
    const real = roots.filter(n => isWide(n) || isTall(n) || childrenOf(n.i).length)
    const start = real.length ? real : roots
    if (!start.length) return []
    let node = start.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a))   // the main tree
    const chrome = []                                                    // thin bars peeled on the way down
    for (let guard = 0; guard < 500 && node; guard++) {
      const bands = bandsFrom(childrenOf(node.i))
      if (bands.length === 0) break                                      // bottomed out into content
      if (bands.length === 1) { node = bands[0]; continue }              // lone wide wrapper → descend
      const total = bands.reduce((s, b) => s + b.h, 0)
      const dom = bands.reduce((a, b) => (b.h > a.h ? b : a))
      const megaWrapper = dom.h > 0.85 * total && bands.every(b => b === dom || b.h < 0.15 * total)
      if (megaWrapper) { for (const b of bands) if (b !== dom) chrome.push(b); node = dom; continue }
      return [...chrome, ...bands].sort((a, b) => a.y - b.y)             // the section stack
    }
    return (chrome.length ? [...chrome, node] : [node]).sort((a, b) => a.y - b.y)
  }

  let bands = collectSections()
  // Fallback: descent degenerated to a single band (irregular/absolute wrappers).
  // Scan every container and take the one whose wide+tall children cover the most
  // vertical extent — the main content region, wherever it sits.
  if (bands.length < 2) {
    let best = null, bestCover = 0
    for (const [, ch] of kids) {
      const b = bandsFrom(ch); if (b.length < 2) continue
      const cover = b.reduce((s, c) => s + c.h, 0)
      if (cover > bestCover) { best = b; bestCover = cover }
    }
    if (best) bands = best
  }

  const taken = new Set()
  const uniqName = base => { let nm = base, k = 2; while (taken.has(nm)) nm = `${base}-${k++}`; taken.add(nm); return nm }
  const sections = bands.map((n, idx) => ({
    id: n.i,
    name: uniqName(semanticName(n) || `section-${idx + 1}`),
    tag: n.tag,
    y: n.y,
    h: n.h,
  }))

  /* ---------------------------- REPEAT GROUPS ---------------------------- */
  // Structural signature: tag + display, recursively over children, capped at depth 6,
  // ignoring text and exact style values. Hash-consed — a subtree collapses to a short
  // symbol (h0, h1, …) that its parent references, so the string can't blow up on wide
  // or deep trees while identical shapes still produce an identical signature.
  const HASH_DEPTH = 6
  const memo = new Map()        // `${i}:${depth}` → { sym, sig }
  const intern = new Map()      // sig string → short symbol
  function structOf(n, depth) {
    const key = n.i + ':' + depth
    const hit = memo.get(key); if (hit) return hit
    const dsp = (n.style && n.style.dsp) || ''
    const sig = depth <= 0
      ? n.tag + dsp + '(*)'                                                   // depth cap: stop describing deeper
      : n.tag + dsp + '(' + childrenOf(n.i).map(c => structOf(c, depth - 1).sym).join(',') + ')'
    let sym = intern.get(sig); if (sym === undefined) { sym = 'h' + intern.size; intern.set(sig, sym) }
    const rec = { sym, sig }
    memo.set(key, rec)
    return rec
  }

  // true subtree node-count (uncapped), memoized — used for the size gates below.
  const sizeMemo = new Map()
  function sizeOf(n) {
    const hit = sizeMemo.get(n.i); if (hit !== undefined) return hit
    sizeMemo.set(n.i, 1)                                   // cycle guard (shouldn't happen)
    let s = 1; for (const c of childrenOf(n.i)) s += sizeOf(c)
    sizeMemo.set(n.i, s); return s
  }

  const repeatGroups = []
  for (const [containerId, ch] of kids) {
    if (ch.length < 2) continue
    const bySym = new Map()                                // sym → { sig, memberIds[] }
    for (const c of ch) {
      const r = structOf(c, HASH_DEPTH)
      let g = bySym.get(r.sym); if (!g) { g = { sig: r.sig, memberIds: [] }; bySym.set(r.sym, g) }
      g.memberIds.push(c.i)                               // ch is in document order → so are memberIds
    }
    for (const { sig, memberIds } of bySym.values()) {
      const count = memberIds.length
      if (count < 2) continue
      const size = sizeOf(byId.get(memberIds[0]))
      if (size < 2) continue                              // drop single-leaf groups (repeated bare leaves)
      // ≥3 copies of anything, OR ≥2 copies of a non-trivial (>3-node) subtree.
      if (!(count >= 3 || size > 3)) continue
      repeatGroups.push({
        containerId,
        hash: sig.slice(0, 400),
        tag: byId.get(memberIds[0]).tag,
        size,
        count,
        memberIds,
        repId: memberIds[0],
      })
    }
  }
  // prefer larger, non-trivial groups first (size × count), then raw count.
  repeatGroups.sort((a, b) => (b.size * b.count) - (a.size * a.count) || b.count - a.count)

  return { source: cap.source || null, viewport: cap.viewport || { w: vw, h: 0 }, sections, repeatGroups }
}

/* =================================== CLI =================================== */
const isMain = import.meta.url === pathToFileURL(process.argv[1] || '').href
if (isMain) {
  const argv = process.argv.slice(2)
  if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
    console.log(`
  uiforge-segment — capture.json → segment.json (sections + repeated-component groups).

  node uiforge-segment.mjs capture.json [--out segment.json]

  sections     the page's top-level vertical bands (nav/header/main/section/footer …), y-ordered.
  repeatGroups sibling subtrees that share a structural shape (logo row, cards, nav links) —
               so the export emits one component mapped over data, not N copies of the markup.
`)
    process.exit(0)
  }
  const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
  const outPath = valAt('--out') || 'segment.json'
  const valueIdx = new Set(); { const i = argv.indexOf('--out'); if (i >= 0) valueIdx.add(i + 1) }
  const capPath = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
  if (!capPath) { console.error('\n  usage: node uiforge-segment.mjs capture.json [--out segment.json]\n'); process.exit(2) }

  const cap = JSON.parse(readFileSync(capPath, 'utf8'))
  const out = segment(cap)

  if (argv.includes('--json')) { console.log(JSON.stringify(out, null, 2)); process.exit(0) }
  writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n')

  const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
  const members = out.repeatGroups.reduce((s, g) => s + g.count, 0)
  console.log(`\n  ${B}UIForge segment${X} ${D}← ${capPath}${X}`)
  console.log(`    ${out.sections.length} sections · ${out.repeatGroups.length} repeat groups ${D}(${members} members)${X}`)
  console.log(`\n    ${C}sections${X}`)
  for (const s of out.sections) console.log(`      ${s.name.padEnd(14)} ${D}${s.tag}  y=${s.y} h=${s.h}  #${s.id}${X}`)
  console.log(`\n    ${C}repeat groups${X} ${D}(top ${Math.min(10, out.repeatGroups.length)})${X}`)
  for (const g of out.repeatGroups.slice(0, 10)) console.log(`      ${(`${g.tag}×${g.count}`).padEnd(10)} ${D}size=${g.size} in #${g.containerId}  ${g.hash.slice(0, 48)}${X}`)
  console.log(`\n  ${G}→ ${outPath}${X}  ${D}(${(JSON.stringify(out).length / 1024).toFixed(0)} KB)${X}\n`)
}

export { segment }
