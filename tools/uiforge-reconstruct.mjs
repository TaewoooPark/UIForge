#!/usr/bin/env node
// uiforge-reconstruct — stage 4a of the clone pipeline: a DETERMINISTIC replay.
//
// capture.json already holds every element's exact computed styles, geometry, text,
// and hierarchy. This replays that into a standalone index.html — a high-fidelity
// baseline the diff-loop and the token/React refactor build on, instead of asking the
// agent to hand-write a copy from scratch (which doesn't scale to a real site).
//
// Usage:
//   node uiforge-reconstruct.mjs capture.json [--out index.html] [--mode flow|absolute]

import process from 'node:process'
import { readFileSync, writeFileSync } from 'node:fs'

// short key → CSS property (mirror of capture's PROPS)
const CSS = {
  dsp: 'display', pos: 'position', top: 'top', rgt: 'right', bot: 'bottom', lft: 'left', z: 'z-index', ov: 'overflow',
  fd: 'flex-direction', fw: 'flex-wrap', jc: 'justify-content', ai: 'align-items', gap: 'gap',
  gtc: 'grid-template-columns', gtr: 'grid-template-rows', gcol: 'grid-column', grow_: 'grid-row',
  fg: 'flex-grow', fsh: 'flex-shrink', fb: 'flex-basis',
  mt: 'margin-top', mr: 'margin-right', mb: 'margin-bottom', ml: 'margin-left',
  pt: 'padding-top', pr: 'padding-right', pb: 'padding-bottom', pl: 'padding-left',
  ff: 'font-family', fs: 'font-size', fwt: 'font-weight', fst: 'font-style', lh: 'line-height',
  ls: 'letter-spacing', ta: 'text-align', tt: 'text-transform', td: 'text-decoration-line', col: 'color', ws: 'white-space',
  bc: 'background-color', bi: 'background-image', bsz: 'background-size', bp: 'background-position', br: 'background-repeat',
  bwt: 'border-top-width', bwr: 'border-right-width', bwb: 'border-bottom-width', bwl: 'border-left-width',
  bct: 'border-top-color', bcr: 'border-right-color', bcb: 'border-bottom-color', bcl: 'border-left-color',
  rtl: 'border-top-left-radius', rtr: 'border-top-right-radius', rbr: 'border-bottom-right-radius', rbl: 'border-bottom-left-radius',
  sh: 'box-shadow', op: 'opacity', flt: 'filter', bdf: 'backdrop-filter', tf: 'transform', tr: 'transition', mbm: 'mix-blend-mode',
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const attr = s => String(s).replace(/"/g, '&quot;')
const VOID = new Set(['img', 'input', 'br', 'hr', 'source', 'meta', 'link'])

const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`\n  uiforge-reconstruct — capture.json → a faithful standalone index.html (deterministic replay).\n\n  node uiforge-reconstruct.mjs capture.json [--out index.html] [--mode flow|absolute]\n`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const mode = valAt('--mode') || 'flow'
const outPath = valAt('--out') || 'index.html'
const valueIdx = new Set(); for (const nm of ['--out', '--mode']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const capPath = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
const cap = JSON.parse(readFileSync(capPath, 'utf8'))
const nodes = cap.nodes || []
const byId = new Map(nodes.map(n => [n.i, n]))
const kids = new Map()
for (const n of nodes) { const p = byId.has(n.pid) ? n.pid : -1; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n) }

function styleOf(n) {
  const s = n.style || {}, decl = []
  for (const [k, v] of Object.entries(s)) { const prop = CSS[k]; if (prop && v != null && v !== '') decl.push(`${prop}:${v}`) }
  // capture only stored border-top-style; apply it to all sides where a width exists
  const bst = s.bst || (['bwt', 'bwr', 'bwb', 'bwl'].some(k => s[k] && s[k] !== '0px') ? 'solid' : null)
  if (bst) decl.push(`border-style:${bst}`)
  decl.push('box-sizing:border-box')
  if (mode === 'absolute') {
    decl.push('position:absolute', `left:${n.x}px`, `top:${n.y}px`, `width:${n.w}px`, `height:${n.h}px`, 'margin:0')
  } else {
    // flow: pin the box size so content-less containers keep their footprint
    if (n.w) decl.push(`width:${n.w}px`)
    if (n.h && (kids.get(n.i) || []).length === 0 && !n.text) decl.push(`min-height:${n.h}px`)
  }
  return decl.join(';')
}
function render(n, depth) {
  if (depth > 40) return ''
  if (n.svgHTML) return `<div style="${attr(styleOf(n))}">${n.svgHTML}</div>`  // replay the captured SVG whole
  const tag = /^[a-z][a-z0-9]*$/.test(n.tag) ? n.tag : 'div'
  const st = styleOf(n)
  let open = `<${tag} style="${attr(st)}"`
  if (n.href) open += ` href="${attr(n.href)}"`
  if (tag === 'img') open += ` src="${attr(n.src || '')}"${n.alt ? ` alt="${attr(n.alt)}"` : ''} width="${n.w}" height="${n.h}"`
  if (VOID.has(tag)) return open + '>'
  open += '>'
  let inner = ''
  const children = kids.get(n.i) || []
  if (n.tag === 'svg') inner = '' // skip raw svg for the baseline (placeholder box via styles)
  else if (children.length) inner = children.map(c => render(c, depth + 1)).join('')
  else if (n.text) inner = esc(n.text)
  return open + inner + `</${tag}>`
}
const roots = kids.get(-1) || []
const body = roots.map(n => render(n, 0)).join('\n')
const bodyStyle = mode === 'absolute'
  ? `margin:0;position:relative;width:${cap.viewport?.w || 1440}px;min-height:${Math.max(...nodes.map(n => n.y + n.h), 0)}px;background:#fff`
  : `margin:0;background:#fff`
const sheetLinks = (cap.sheets || []).map(h => `<link rel="stylesheet" href="${attr(h)}">`).join('\n')
const faces = (cap.fontFaces || []).length ? `<style>${cap.fontFaces.join('\n')}</style>` : ''
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(cap.title || 'clone')}</title>
${sheetLinks}
${faces}
<style>*{box-sizing:border-box}html,body{margin:0}img{max-width:none}</style></head>
<body style="${attr(bodyStyle)}">
${body}
</body></html>`
writeFileSync(outPath, html)
const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge reconstruct${X} ${D}(${mode})${X}  ${nodes.length} nodes → ${G}${outPath}${X} ${D}(${(html.length / 1024).toFixed(0)} KB)${X}\n`)
