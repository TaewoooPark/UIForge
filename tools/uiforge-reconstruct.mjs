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
  an: 'animation-name', ad: 'animation-duration', atf: 'animation-timing-function', adl: 'animation-delay',
  aic: 'animation-iteration-count', adr: 'animation-direction', afm: 'animation-fill-mode',
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

// the `animation` shorthand for a node's captured motion: exact WAAPI timing (real easing,
// iteration count, delay, direction, fill) when we have it, else a sampled loop.
export function animShorthand(n) {
  const m = n.motion, name = `uif-js-${n.i}`
  if (!m.exact) return `${name} ${m.dur}s linear infinite`
  return `${name} ${m.dur}s ${m.ease || 'linear'} ${m.delay || 0}s ${m.iter || 1} ${m.dir || ''} ${m.fill || 'both'}`.replace(/\s+/g, ' ').trim()
}

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
    // Pin min-height only where flow truly can't reproduce the box: an empty leaf, or a box
    // whose children are ALL out of flow (absolute/fixed, adding 0 flow height). Pinning more
    // than this is a trap — a section sized around canvas/WebGL art (which we can't render) is
    // structurally identical to a collapsing one, so any rule that props up the collapse also
    // inflates the canvas box into a visible empty rectangle. So we don't; see "Honest limits".
    const ch = kids.get(n.i) || []
    const allOut = ch.length > 0 && ch.every(c => { const p = (c.style || {}).pos; return p === 'absolute' || p === 'fixed' })
    if (n.h && ((ch.length === 0 && !n.text) || allOut)) decl.push(`min-height:${n.h}px`)
  }
  if (n.motion) decl.push(`animation:${animShorthand(n)}`)  // exact WAAPI timing, or sampled → loop
  return decl.join(';')
}
function pseudoStyle(ps) {
  const decl = []
  for (const [k, v] of Object.entries(ps)) { const prop = CSS[k]; if (prop && v) decl.push(`${prop}:${v}`) }
  if (ps.w && ps.w !== 'auto') decl.push(`width:${ps.w}`)
  if (ps.h && ps.h !== 'auto') decl.push(`height:${ps.h}`)
  decl.push('display:inline-block', 'box-sizing:border-box')
  return decl.join(';')
}
const pseudo = p => (p && p.content !== 'none') ? `<span style="${attr(pseudoStyle(p.style || {}))}">${esc(p.content || '')}</span>` : ''

function render(n, depth) {
  if (depth > 40) return ''
  // a recorded canvas/WebGL hero → a looping muted video sized exactly like the canvas
  if (n.video) return `<video src="${attr(n.video)}" autoplay loop muted playsinline style="${attr(styleOf(n))}"></video>`
  if (n.svgHTML) return `<div style="${attr(styleOf(n))}">${n.svgHTML}</div>`  // replay the captured SVG whole
  const tag = /^[a-z][a-z0-9]*$/.test(n.tag) ? n.tag : 'div'
  const st = styleOf(n)
  let open = `<${tag} style="${attr(st)}"`
  if (n.hover || n.focus || n.active) open += ` class="uif-${n.i}"`   // interaction states via the companion stylesheet
  if (n.toggleTarget != null) open += ` data-uif-tog="${n.toggleTarget}"`   // opens the panel below on click
  if (n.open) open += ` id="uif-t-${n.i}"`                                  // a panel that has a captured open state
  if (n.href) open += ` href="${attr(n.href)}"`
  if (tag === 'img') open += ` src="${attr(n.src || '')}"${n.alt ? ` alt="${attr(n.alt)}"` : ''} width="${n.w}" height="${n.h}"`
  if (VOID.has(tag)) return open + '>'
  open += '>'
  let inner = ''
  const children = kids.get(n.i) || []
  if (n.tag === 'svg') inner = '' // skip raw svg for the baseline (placeholder box via styles)
  else if (children.length) inner = children.map(c => esc(c.pre || '') + render(c, depth + 1)).join('') + esc(n.post || '')
  else if (n.text) inner = esc(n.text)
  inner = pseudo(n.before) + inner + pseudo(n.after)
  return open + inner + `</${tag}>`
}
const roots = kids.get(-1) || []
const body = roots.map(n => render(n, 0)).join('\n')
const bodyStyle = mode === 'absolute'
  ? `margin:0;position:relative;width:${cap.viewport?.w || 1440}px;min-height:${Math.max(...nodes.map(n => n.y + n.h), 0)}px;background:#fff`
  : `margin:0;background:#fff`
// Inject ONLY the recovered @font-face rules — not the raw stylesheets, which carry the
// site's own resets/utilities and would fight our replayed inline styles. This alone
// renders text in the reference's real webfont (fonts served ACAO:* load from file://).
// @font-face renders the real webfont; @keyframes replay the reference's CSS motion
// (spinners, slide/fade-ins) — the `animation-*` values are replayed inline per element.
const motionCss = [...(cap.fontFaces || []), ...(cap.keyframes || [])]
// interaction states — the inline base can't express :hover/:focus, so each interactive
// element gets a .uif-<i> class and a companion rule. !important so it beats the inline base.
const imp = decl => decl.split(';').map(d => d.trim()).filter(Boolean).map(d => `${d} !important`).join(';')
for (const n of nodes) {
  if (n.hover) motionCss.push(`.uif-${n.i}:hover{${imp(n.hover)}}`)
  if (n.focus) motionCss.push(`.uif-${n.i}:focus-visible{${imp(n.focus)}}`)
  if (n.active) motionCss.push(`.uif-${n.i}:active{${imp(n.active)}}`)
  if (n.motion) motionCss.push(`@keyframes uif-js-${n.i}{${n.motion.kf}}`)   // sampled JS motion → looping keyframes
}
const faces = motionCss.length ? `<style>\n${motionCss.join('\n')}\n</style>` : ''
// disclosure runtime: a [data-uif-tog] toggle applies its panel's captured OPEN styles on
// click (and toggles back), so dropdowns/accordions/menus actually open in the clone.
const OKEY = { dsp: 'display', op: 'opacity', vis: 'visibility', h: 'height', mh: 'maxHeight', tf: 'transform', pe: 'pointerEvents' }
const openMap = {}
for (const n of nodes) if (n.open) openMap[n.i] = Object.fromEntries(Object.entries(n.open).map(([k, v]) => [OKEY[k] || k, v]))
const toggleScript = Object.keys(openMap).length ? `<script>
const _uifOpen=${JSON.stringify(openMap)};
document.addEventListener('click',e=>{const t=e.target.closest('[data-uif-tog]');if(!t)return;e.preventDefault();
const id=t.getAttribute('data-uif-tog'),p=document.getElementById('uif-t-'+id);if(!p)return;
const on=p.dataset.uifOn==='1';p.dataset.uifOn=on?'0':'1';t.setAttribute('aria-expanded',on?'false':'true');
const s=_uifOpen[id]||{};for(const k in s){p.style[k]=on?'':s[k]}});
</script>` : ''
const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(cap.title || 'clone')}</title>
${faces}
<style>*{box-sizing:border-box}html,body{margin:0}img{max-width:none}
/* neutralize UA-default chrome so it can't leak past the replayed inline styles:
   native button borders, link underlines, list bullets. Captured values (emitted
   inline) win over this by specificity, so real borders/underlines still render. */
button,input,select,textarea{appearance:none;-webkit-appearance:none;background:transparent;border:0;border-radius:0;margin:0;font:inherit;color:inherit;text-align:inherit}
a{text-decoration:none;color:inherit}ul,ol{list-style:none}fieldset{border:0;margin:0;padding:0}</style></head>
<body style="${attr(bodyStyle)}">
${body}
${toggleScript}
</body></html>`
writeFileSync(outPath, html)
const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge reconstruct${X} ${D}(${mode})${X}  ${nodes.length} nodes → ${G}${outPath}${X} ${D}(${(html.length / 1024).toFixed(0)} KB)${X}\n`)
