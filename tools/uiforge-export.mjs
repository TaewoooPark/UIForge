#!/usr/bin/env node
// uiforge-export — stage 6 of the clone pipeline: emit a runnable, editable
// Vite + React + Tailwind v4 project from a capture (+ its theme).
//
// DEFAULT (componentized): the capture is segmented into sections + repeat groups
// (uiforge-segment), each section becomes src/components/<Name>.tsx, each repeat group
// becomes ONE component rendered as {DATA.map((d,i)=><Comp key={i} {...d}/>)} — never N
// copies of the same subtree — and every node's inline style is mapped to Tailwind utility
// classes (uiforge-tailwindify), keeping only the unmappable bits (gradients, transforms,
// transitions, filters) inline. The varying content of repeat instances (text, image src,
// href) is externalized into src/content.ts as typed data arrays; App.tsx just composes the
// sections in order. Theme + motion/interaction are emitted exactly as the flat path does.
//
// --flat: the original behavior — the whole tree dumped into one App.tsx with inline styles.
//
// Usage:
//   node uiforge-export.mjs capture.json --out-dir ./clone [--theme theme.css] [--theme-json theme.json] [--flat]

import process from 'node:process'
import path from 'node:path'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { segment } from './uiforge-segment.mjs'
import { tw } from './uiforge-tailwindify.mjs'
import { buildTheme } from './uiforge-theme.mjs'
import { downloadAssets } from './uiforge-assets.mjs'

/* ============================ shared primitives ============================ */
// short style key → camelCase CSS property (the set the exporter knows how to write inline).
// keys not in here (animation-*, border-*-style) are intentionally dropped, exactly as the
// flat exporter always has — CSS animation is replayed via @keyframes / sampled n.motion.
const CSS = { dsp: 'display', pos: 'position', top: 'top', rgt: 'right', bot: 'bottom', lft: 'left', z: 'zIndex', ov: 'overflow', fd: 'flexDirection', fw: 'flexWrap', jc: 'justifyContent', ai: 'alignItems', gap: 'gap', gtc: 'gridTemplateColumns', gtr: 'gridTemplateRows', gcol: 'gridColumn', grow_: 'gridRow', fg: 'flexGrow', fsh: 'flexShrink', fb: 'flexBasis', mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft', pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft', ff: 'fontFamily', fs: 'fontSize', fwt: 'fontWeight', fst: 'fontStyle', lh: 'lineHeight', ls: 'letterSpacing', ta: 'textAlign', tt: 'textTransform', td: 'textDecoration', col: 'color', ws: 'whiteSpace', bc: 'backgroundColor', bi: 'backgroundImage', bsz: 'backgroundSize', bp: 'backgroundPosition', br: 'backgroundRepeat', bwt: 'borderTopWidth', bwr: 'borderRightWidth', bwb: 'borderBottomWidth', bwl: 'borderLeftWidth', bct: 'borderTopColor', bcr: 'borderRightColor', bcb: 'borderBottomColor', bcl: 'borderLeftColor', rtl: 'borderTopLeftRadius', rtr: 'borderTopRightRadius', rbr: 'borderBottomRightRadius', rbl: 'borderBottomLeftRadius', sh: 'boxShadow', op: 'opacity', flt: 'filter', bdf: 'backdropFilter', tf: 'transform', tr: 'transition', mbm: 'mixBlendMode' }
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const jsxText = s => String(s).replace(/([{}<>])/g, '{"$1"}').replace(/&/g, '&amp;')
// a pre/post whitespace-carrying text fragment → JSX, preserving a leading/trailing space
const frag = t => t ? (/^ /.test(t) ? '{" "}' : '') + jsxText(t.trim()) + (/ $/.test(t) ? '{" "}' : '') : ''
const VOID = new Set(['img', 'input', 'br', 'hr', 'source'])
const SVGTAG = /svg|path|g|circle|rect|line|polyline|polygon|defs|clipPath|mask|use|stop|linearGradient|radialGradient|ellipse|text|tspan/
const q = s => JSON.stringify(String(s))
const indent = (s, pad) => s.split('\n').map(l => (l ? pad + l : l)).join('\n')

/* ================================== CLI ================================== */
const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-export — capture.json → a runnable Vite + React + Tailwind v4 project.

  node uiforge-export.mjs capture.json --out-dir ./clone [--theme theme.css] [--theme-json theme.json] [--flat]

  DEFAULT  componentized: segmented sections → src/components/*.tsx, repeat groups → one
           component mapped over data (src/content.ts), styles → Tailwind classes.
  --flat   the original single-file dump (whole tree in App.tsx, inline styles).
`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const outDir = valAt('--out-dir') || './clone'
const themePath = valAt('--theme')
const themeJsonPath = valAt('--theme-json')
const isFlat = argv.includes('--flat')
const withAssets = argv.includes('--assets')
// --prefix namespaces the generated uif-* classes / @keyframes / ids so N page components can
// share one bundle without .uif-<i> collisions (used by uiforge-site's multi-page router).
const PFX = valAt('--prefix') || ''
const valueIdx = new Set(); for (const nm of ['--out-dir', '--theme', '--theme-json']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const capPath = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
const cap = JSON.parse(readFileSync(capPath, 'utf8'))
const nodes = cap.nodes || []
const byId = new Map(nodes.map(n => [n.i, n]))
const kids = new Map()
for (const n of nodes) { const p = byId.has(n.pid) ? n.pid : -1; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n) }
const childrenOf = id => kids.get(id) || []

/* ---------- inline style from short-keyed props (shared by both paths) ---------- */
function inlineDecls(style) {
  const o = []
  for (const [k, v] of Object.entries(style || {})) { const prop = CSS[k]; if (prop && v != null && v !== '') o.push(`${q(camel(prop))}: ${q(v)}`) }
  return o
}

// the `animation` shorthand for a node's motion — exact WAAPI timing when captured, else a loop.
function animShorthand(n) {
  const m = n.motion, name = `${PFX}uif-js-${n.i}`
  if (m.scroll) return `${name} auto linear both`
  if (!m.exact) return `${name} ${m.dur}s linear infinite`
  return `${name} ${m.dur}s ${m.ease || 'linear'} ${m.delay || 0}s ${m.iter || 1} ${m.dir || ''} ${m.fill || 'both'}`.replace(/\s+/g, ' ').trim()
}

/* ---------- motion + interaction CSS, appended after the theme (both paths) ---------- */
// @font-face (real webfont) + @keyframes (CSS motion) + synthesized sampled-motion keyframes
// + .uif-<i>:hover/:focus/:active companion rules (!important so they beat the base styles).
function motionInteractionCss() {
  const imp = d => d.split(';').map(x => x.trim()).filter(Boolean).map(x => x + ' !important').join(';')
  let interCSS = ''
  for (const n of nodes) {
    if (n.hover) interCSS += `.${PFX}uif-${n.i}:hover{${imp(n.hover)}}\n`
    if (n.focus) interCSS += `.${PFX}uif-${n.i}:focus-visible{${imp(n.focus)}}\n`
    if (n.active) interCSS += `.${PFX}uif-${n.i}:active{${imp(n.active)}}\n`
  }
  const jsKf = nodes.filter(n => n.motion).map(n => `@keyframes ${PFX}uif-js-${n.i}{${n.motion.kf}}`).join('\n')
  return '\n\n' + (cap.fontFaces || []).join('\n') + '\n' + (cap.keyframes || []).join('\n') + '\n' + jsKf + '\n' + interCSS
}

/* ---------- disclosure runtime (both paths): delegated click applies captured open styles ---------- */
const OKEY = { dsp: 'display', op: 'opacity', vis: 'visibility', h: 'height', mh: 'maxHeight', tf: 'transform', pe: 'pointerEvents' }
function discloseRuntime() {
  const openMap = {}
  for (const n of nodes) if (n.open) openMap[n.i] = Object.fromEntries(Object.entries(n.open).map(([k, v]) => [OKEY[k] || k, v]))
  if (!Object.keys(openMap).length) return { hasToggles: false, effect: '' }
  const effect = `  useEffect(() => {
    const M = ${JSON.stringify(openMap)}
    const h = e => { const t = e.target.closest('[data-uif-tog]'); if (!t) return; e.preventDefault()
      const id = t.getAttribute('data-uif-tog'), p = document.getElementById('${PFX}uif-t-' + id); if (!p) return
      const on = p.dataset.uifOn === '1'; p.dataset.uifOn = on ? '0' : '1'; t.setAttribute('aria-expanded', String(!on))
      const s = M[id] || {}; for (const k in s) p.style[k] = on ? '' : s[k] }
    document.addEventListener('click', h); return () => document.removeEventListener('click', h)
  }, [])\n`
  return { hasToggles: true, effect }
}

/* ---------- common project scaffolding (identical for both paths) ---------- */
function commonFiles(indexCss) {
  return {
    'package.json': JSON.stringify({ name: 'uiforge-clone', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' }, devDependencies: { '@tailwindcss/vite': '^4.0.0', '@vitejs/plugin-react': '^4.3.0', tailwindcss: '^4.0.0', vite: '^5.4.0' } }, null, 2) + '\n',
    'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] })\n`,
    'index.html': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(cap.title || 'clone').replace(/</g, '')}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
    'src/main.tsx': `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)\n`,
    'src/index.css': indexCss,
  }
}
function copyVideos() {
  const vids = [...new Set(nodes.filter(n => n.video).map(n => n.video))]
  if (!vids.length) return
  mkdirSync(path.join(outDir, 'public'), { recursive: true })
  const srcDir = path.dirname(path.resolve(capPath))
  for (const v of vids) { const from = path.join(srcDir, v); if (existsSync(from)) copyFileSync(from, path.join(outDir, 'public', v)) }
}
function writeProject(files) {
  for (const [f, c] of Object.entries(files)) { const abs = path.join(outDir, f); mkdirSync(path.dirname(abs), { recursive: true }); writeFileSync(abs, c) }
  copyVideos()
}

/* ================================================================= *
 *                         FLAT PATH (--flat)                        *
 * ================================================================= */
function flatStyleObj(n) {
  const o = inlineDecls(n.style)
  if (n.w) o.push(`width: ${q(n.w + 'px')}`)
  if (n.motion) { o.push(`animation: ${q(animShorthand(n))}`); if (n.motion.scroll) o.push(`animationTimeline: ${q(n.motion.scroll + '()')}`) }
  o.push(`boxSizing: "border-box"`)
  return `{{ ${o.join(', ')} }}`
}
function flatJSX(n, d) {
  if (d > 40) return ''
  if (n.video) return `<video src=${q('/' + n.video)} autoPlay loop muted playsInline style=${flatStyleObj(n)} />`
  if (n.videoSrc) { const v = n.vattr || {}   // a real hero/background <video>
    const a = [v.autoplay && 'autoPlay', v.loop && 'loop', (v.muted || v.autoplay) && 'muted', v.controls && 'controls', 'playsInline'].filter(Boolean).join(' ')
    return `<video src=${q(n.videoSrc)}${n.poster ? ` poster=${q(n.poster)}` : ''} ${a} style=${flatStyleObj(n)} />` }
  if (n.svgHTML) return `<div style=${flatStyleObj(n)} dangerouslySetInnerHTML={{ __html: ${q(n.svgHTML)} }} />`
  const tag = /^[a-z][a-z0-9]*$/.test(n.tag) && !SVGTAG.test(n.tag) ? n.tag : 'div'
  let a = `<${tag} style=${flatStyleObj(n)}`
  const cls = [n.cls, (n.hover || n.focus || n.active) ? `${PFX}uif-${n.i}` : ''].filter(Boolean).join(' ')
  if (cls) a += ` className=${q(cls)}`
  if (n.toggleTarget != null) a += ` data-uif-tog=${q(String(n.toggleTarget))}`
  if (n.open) a += ` id=${q(PFX + 'uif-t-' + n.i)}`
  if (n.href) a += ` href=${q(n.href)}`
  if (tag === 'img') a += ` src=${q(n.src || '')} alt=${q(n.alt || '')} width={${n.w}} height={${n.h}}`
  if (VOID.has(tag)) return a + ' />'
  a += '>'
  const children = childrenOf(n.i)
  const inner = children.length ? '\n' + children.map(c => frag(c.pre) + flatJSX(c, d + 1)).join('\n') + frag(n.post) + '\n' : (n.text ? jsxText(n.text) : '')
  return a + inner + `</${tag}>`
}
function buildFlat() {
  const roots = childrenOf(-1)
  const { hasToggles, effect } = discloseRuntime()
  const app = `${hasToggles ? "import { useEffect } from 'react'\n\n" : ''}export default function App() {\n${effect}  return (\n    <div style={{ minHeight: "100vh", background: "#fff" }}>\n${roots.map(n => flatJSX(n, 0)).join('\n')}\n    </div>\n  )\n}\n`
  const themeCss = themePath ? readFileSync(themePath, 'utf8') : `@import "tailwindcss";`
  const files = commonFiles(themeCss + motionInteractionCss())
  files['src/App.tsx'] = app
  files['README.md'] = `# UIForge clone (flat)\n\nReconstructed from \`${cap.source || ''}\`.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nEdit \`src/App.tsx\` (content and structure) and \`src/index.css\` (the extracted \`@theme\`). Styles are inline from the capture; lift repeated blocks into \`src/components/\` and map to Tailwind utilities as you go — or re-run without \`--flat\` to get that componentized automatically.\n`
  return { files, appSrc: app, sectionCount: 0, repeatCount: 0 }
}

/* ================================================================= *
 *                   COMPONENTIZED PATH (default)                    *
 * ================================================================= */
function buildComponentized() {
  const seg = segment(cap)
  const built = buildTheme(cap)
  const themeCss = themePath ? readFileSync(themePath, 'utf8') : built.css
  const theme = themeJsonPath ? JSON.parse(readFileSync(themeJsonPath, 'utf8')) : built.json

  /* -- accept a non-overlapping set of repeat groups (greedy, biggest first) -- */
  const subtreeIds = id => { const acc = []; (function w(x) { acc.push(x); for (const c of childrenOf(x)) w(c.i) })(id); return acc }
  const claimed = new Set()
  const compNames = new Set(), dataNames = new Set()
  const uniq = (base, taken) => { let n = base, k = 2; while (taken.has(n)) n = base + (k++); taken.add(n); return n }
  const TAGNAME = { li: 'Item', a: 'Link', img: 'Logo', button: 'Button', article: 'Card', section: 'Panel', figure: 'Figure', tr: 'Row', option: 'Option', span: 'Chip', p: 'Line' }
  const accepted = []
  for (const g of seg.repeatGroups) {
    if (claimed.has(g.containerId) || g.memberIds.some(m => claimed.has(m))) continue
    const compName = uniq(TAGNAME[g.tag] || 'Card', compNames)
    const dataName = uniq(compName.toUpperCase() + '_DATA', dataNames)
    accepted.push({ ...g, compName, dataName, typeName: compName + 'Data' })
    for (const m of g.memberIds) for (const id of subtreeIds(m)) claimed.add(id)
  }
  const groupsByContainer = new Map()
  for (const g of accepted) {
    if (!groupsByContainer.has(g.containerId)) groupsByContainer.set(g.containerId, [])
    groupsByContainer.get(g.containerId).push(g)
    // contiguous = the group's members occupy consecutive child positions (nothing interleaved).
    // Only then can one .map() stand in for them without reordering siblings; otherwise (e.g. two
    // logo shapes interleaved in a marquee) we emit indexed instances in document order instead.
    const posOf = new Map(childrenOf(g.containerId).map((c, i) => [c.i, i]))
    const pos = g.memberIds.map(m => posOf.get(m)).filter(x => x != null).sort((a, b) => a - b)
    g.contiguous = pos.length === g.memberIds.length && pos.every((v, i) => i === 0 || v === pos[i - 1] + 1)
  }

  /* -- section components -- */
  const sectionIds = new Set(seg.sections.map(s => s.id))
  const sectionMeta = new Map()
  const pascal = s => (String(s).split(/[^a-zA-Z0-9]+/).filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join('') || 'Section')
  let heroDone = false
  for (const s of seg.sections) {
    let base = pascal(s.name)
    if (!heroDone && /^section/i.test(s.name)) { base = 'Hero'; heroDone = true }
    sectionMeta.set(s.id, { compName: uniq(base, compNames) })
  }

  /* -- repeat-group content model: per-slot atoms → props for what varies -- */
  // atom = one piece of content at a (path,kind); path is the DFS position inside the subtree,
  // so template and member subtrees align by key regardless of order or minor structural drift.
  function atomsOf(rootId) {
    const out = []
    const walk = (id, p) => {
      const n = byId.get(id); if (!n) return
      if (n.pre != null && n.pre !== '') out.push({ key: `${p}|pre`, kind: 'pre', value: n.pre })
      if (n.svgHTML) out.push({ key: `${p}|svg`, kind: 'svg', value: n.svgHTML })
      if (n.tag === 'img') { out.push({ key: `${p}|src`, kind: 'src', value: n.src || '' }); if (n.alt != null) out.push({ key: `${p}|alt`, kind: 'alt', value: n.alt || '' }) }
      if (n.href != null) out.push({ key: `${p}|href`, kind: 'href', value: n.href || '' })
      if (n.video) out.push({ key: `${p}|video`, kind: 'video', value: n.video })
      const ch = childrenOf(id)
      if (ch.length) { ch.forEach((c, idx) => walk(c.i, `${p}/${idx}`)); if (n.post != null && n.post !== '') out.push({ key: `${p}|post`, kind: 'post', value: n.post }) }
      else if (n.text != null) out.push({ key: `${p}|text`, kind: 'text', value: n.text })
    }
    walk(rootId, '')
    return out
  }
  for (const g of accepted) {
    const tmpl = atomsOf(g.repId)
    const memberMaps = g.memberIds.map(m => { const mm = new Map(); for (const at of atomsOf(m)) mm.set(at.key, at.value); return mm })
    const propMap = new Map()
    const data = g.memberIds.map(() => ({}))
    const counters = {}
    const PREFIX = { text: 't', pre: 't', post: 't', src: 'src', alt: 'alt', href: 'href', svg: 'svg', video: 'vid' }
    const nameFor = kind => { const p = PREFIX[kind] || 'p'; counters[p] = counters[p] || 0; return p + counters[p]++ }
    for (const at of tmpl) {
      const values = memberMaps.map(mm => (mm.has(at.key) ? mm.get(at.key) : at.value))
      if (values.every(v => v === at.value)) continue          // invariant → inlined literal
      const nm = nameFor(at.kind)
      propMap.set(at.key, nm)
      values.forEach((v, idx) => { data[idx][nm] = v })
    }
    g.propMap = propMap
    g.data = data
    g.propNames = [...propMap.values()]
  }

  /* -- the emitter -- */
  // ctx.mode: 'app' (sections short-circuit to <Comp/>) | 'tree' (section body) | 'repeat'
  // (template body — content that varies across instances becomes {d.<prop>}).
  const mapExpr = (g, ctx) => { ctx.imports.comps.add(g.compName); ctx.imports.data.add(g.dataName); return `{${g.dataName}.map((d, i) => <${g.compName} key={i} {...d} />)}` }
  function classAndStyle(n) {
    const { classes, leftover } = tw(n.style || {}, theme)
    const cls = []
    if (classes) cls.push(classes)
    if (n.w) cls.push(`w-[${n.w}px]`)
    cls.push('box-border')
    // responsive: mobile (max-sm:) overrides captured by --responsive as node.mq.sm
    if (n.mq && n.mq.sm) {
      if (n.mq.sm.hidden) cls.push('max-sm:hidden')
      else { const r = tw(n.mq.sm, theme).classes; if (r) cls.push(r.split(/\s+/).filter(Boolean).map(c => `max-sm:${c}`).join(' ')) }
    }
    if (n.hover || n.focus || n.active) cls.push(`uif-${n.i}`)
    const decls = inlineDecls(leftover)
    if (n.motion) { decls.push(`animation: ${q(animShorthand(n))}`); if (n.motion.scroll) decls.push(`animationTimeline: ${q(n.motion.scroll + '()')}`) }
    return { className: cls.filter(Boolean).join(' '), style: decls.length ? `{{ ${decls.join(', ')} }}` : '' }
  }
  const propAt = (ctx, p, kind) => (ctx.mode === 'repeat' ? ctx.propAt(`${p}|${kind}`) : null)

  function emitChildren(n, ctx, p) {
    const ch = childrenOf(n.i)
    if (!ch.length) {
      if (n.text == null) return ''
      const pr = propAt(ctx, p, 'text'); return pr ? `{d.${pr}}` : jsxText(n.text)
    }
    const here = ctx.mode !== 'repeat' ? (groupsByContainer.get(n.i) || []) : []
    const mem = new Map(); for (const g of here) g.memberIds.forEach((m, k) => mem.set(m, { g, k }))
    const parts = []
    ch.forEach((c, idx) => {
      const info = mem.get(c.i)
      if (info) {
        const { g, k } = info
        if (g.contiguous) { if (k === 0) parts.push(mapExpr(g, ctx)) }                     // one .map() at the run start; skip the rest
        else { ctx.imports.comps.add(g.compName); ctx.imports.data.add(g.dataName); parts.push(`<${g.compName} {...${g.dataName}[${k}]} />`) }  // interleaved → indexed, order preserved
        return
      }
      const cp = `${p}/${idx}`
      const prePr = propAt(ctx, cp, 'pre')
      parts.push(prePr ? `{d.${prePr}}` : frag(c.pre))
      parts.push(emitNode(c, { ...ctx, depth: (ctx.depth || 0) + 1 }, cp))
    })
    const postPr = propAt(ctx, p, 'post')
    parts.push(postPr ? `{d.${postPr}}` : frag(n.post))
    return '\n' + parts.filter(Boolean).join('\n') + '\n'
  }

  function emitNode(n, ctx, p) {
    if ((ctx.depth || 0) > 60) return ''
    if (ctx.mode === 'app' && sectionIds.has(n.i)) { const { compName } = sectionMeta.get(n.i); ctx.imports.comps.add(compName); return `<${compName} />` }
    const rep = ctx.mode === 'repeat'
    if (n.video) {
      const { className, style } = classAndStyle(n)
      const vp = propAt(ctx, p, 'video'); const src = vp ? `{"/" + d.${vp}}` : q('/' + n.video)
      return `<video src=${src} autoPlay loop muted playsInline${className ? ` className=${q(className)}` : ''}${style ? ` style=${style}` : ''} />`
    }
    if (n.videoSrc) {
      const { className, style } = classAndStyle(n), v = n.vattr || {}
      const a = [v.autoplay && 'autoPlay', v.loop && 'loop', (v.muted || v.autoplay) && 'muted', v.controls && 'controls', 'playsInline'].filter(Boolean).join(' ')
      return `<video src=${q(n.videoSrc)}${n.poster ? ` poster=${q(n.poster)}` : ''} ${a}${className ? ` className=${q(className)}` : ''}${style ? ` style=${style}` : ''} />`
    }
    if (n.svgHTML) {
      const { className, style } = classAndStyle(n)
      const sp = propAt(ctx, p, 'svg'); const html = sp ? `{{ __html: d.${sp} }}` : `{{ __html: ${q(n.svgHTML)} }}`
      return `<div${className ? ` className=${q(className)}` : ''}${style ? ` style=${style}` : ''} dangerouslySetInnerHTML=${html} />`
    }
    const tag = /^[a-z][a-z0-9]*$/.test(n.tag) && !SVGTAG.test(n.tag) ? n.tag : 'div'
    const { className, style } = classAndStyle(n)
    let a = `<${tag}`
    if (className) a += ` className=${q(className)}`
    if (style) a += ` style=${style}`
    if (!rep && n.toggleTarget != null) a += ` data-uif-tog=${q(String(n.toggleTarget))}`   // ids are per-node; dropped inside repeats to avoid duplicates
    if (!rep && n.open) a += ` id=${q(PFX + 'uif-t-' + n.i)}`
    if (n.href != null) { const hp = propAt(ctx, p, 'href'); a += ` href=${hp ? `{d.${hp}}` : q(n.href)}` }
    if (tag === 'img') {
      const sp = propAt(ctx, p, 'src'), ap = propAt(ctx, p, 'alt')
      a += ` src=${sp ? `{d.${sp}}` : q(n.src || '')} alt=${ap ? `{d.${ap}}` : q(n.alt || '')} width={${n.w || 0}} height={${n.h || 0}}`
    }
    if (VOID.has(tag)) return a + ' />'
    return a + '>' + emitChildren(n, ctx, p) + `</${tag}>`
  }

  /* -- import lines (component paths depend on the emitting file's location) -- */
  function importLines(imports, where) {
    const compDir = where === 'app' ? './components/' : './'
    const contentMod = where === 'app' ? './content' : '../content'
    const lines = []
    for (const c of [...imports.comps].sort()) lines.push(`import ${c} from '${compDir}${c}'`)
    if (imports.data.size) lines.push(`import { ${[...imports.data].sort().join(', ')} } from '${contentMod}'`)
    return lines.length ? lines.join('\n') + '\n\n' : ''
  }

  /* -- generate files -- */
  const files = {}

  // repeat components
  for (const g of accepted) {
    const imports = { comps: new Set(), data: new Set() }
    const body = emitNode(byId.get(g.repId), { mode: 'repeat', depth: 0, imports, propAt: k => g.propMap.get(k) || null }, '')
    const src = `import type { ${g.typeName} } from '../content'\n${importLines(imports, 'comp')}export default function ${g.compName}(d: ${g.typeName}) {\n  return (\n${indent(body, '    ')}\n  )\n}\n`
    files[`src/components/${g.compName}.tsx`] = src
  }

  // section components
  const sectionOrder = seg.sections.map(s => sectionMeta.get(s.id).compName)
  for (const s of seg.sections) {
    const { compName } = sectionMeta.get(s.id)
    const imports = { comps: new Set(), data: new Set() }
    const body = emitNode(byId.get(s.id), { mode: 'tree', depth: 0, imports }, '')
    files[`src/components/${compName}.tsx`] = `${importLines(imports, 'comp')}export default function ${compName}() {\n  return (\n${indent(body, '    ')}\n  )\n}\n`
  }

  // App — compose the tree, section subtrees swapped for <Comp/>
  const appImports = { comps: new Set(), data: new Set() }
  const roots = childrenOf(-1)
  const appBody = roots.map(r => emitNode(r, { mode: 'app', depth: 0, imports: appImports }, '')).join('\n')
  const { hasToggles, effect } = discloseRuntime()
  const appSrc = `${hasToggles ? "import { useEffect } from 'react'\n" : ''}${importLines(appImports, 'app')}export default function App() {\n${effect}  return (\n    <div className="min-h-screen bg-white">\n${indent(appBody, '      ')}\n    </div>\n  )\n}\n`
  files['src/App.tsx'] = appSrc

  // content.ts — typed data arrays for every repeat group
  const contentParts = ['// Editable content for the repeated components. Each array item is one instance.', '']
  for (const g of accepted) {
    const fields = g.propNames.length ? g.propNames.map(nm => `${nm}: string`).join('; ') : ''
    contentParts.push(`export type ${g.typeName} = { ${fields} }`)
    contentParts.push(`export const ${g.dataName}: ${g.typeName}[] = ${JSON.stringify(g.data, null, 2)}`)
    contentParts.push('')
  }
  if (!accepted.length) contentParts.push('export {}')
  files['src/content.ts'] = contentParts.join('\n') + '\n'

  // index.css + scaffolding
  Object.assign(files, commonFiles(themeCss + motionInteractionCss()))
  files['README.md'] = `# UIForge clone\n\nReconstructed from \`${cap.source || ''}\` — componentized.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n- \`src/App.tsx\` composes the page from section components in order.\n- \`src/components/*.tsx\` — one file per section (${sectionOrder.join(', ')}) and per repeated block (${accepted.map(g => g.compName).join(', ') || 'none'}). Repeated blocks are a single component mapped over data.\n- \`src/content.ts\` — the editable content of the repeated blocks (text, image src, href) as typed arrays.\n- \`src/index.css\` — the extracted Tailwind \`@theme\` plus the reference's fonts, keyframes, and hover/focus rules.\n\nStyles are Tailwind utility classes (from the extracted theme); only what can't be a utility — gradients, transforms, transitions, filters — stays as an inline \`style\`.\n`

  return { files, appSrc, sectionCount: seg.sections.length, repeatCount: accepted.length, accepted, sectionOrder, seg }
}

/* ================================== run ================================== */
const result = isFlat ? buildFlat() : buildComponentized()
writeProject(result.files)

// --assets: download every external asset into public/ and rewrite the generated files to
// point at /assets/… so the built clone is self-contained. Post-process (rewrites files on
// disk) so we don't have to thread the URL map through every JSX/CSS generator.
let assetStats = null
if (withAssets) {
  const { map, stats } = await downloadAssets(cap, path.join(outDir, 'public'))
  assetStats = stats
  if (map.size) {
    const pairs = [...map.entries()].sort((a, b) => b[0].length - a[0].length)  // longest URL first
    const walk = dir => { for (const e of readdirSync(dir)) { const p = path.join(dir, e); if (statSync(p).isDirectory()) { if (e !== 'assets' && e !== 'node_modules') walk(p) } else if (/\.(tsx?|css|html|json)$/.test(e)) {
      let s = readFileSync(p, 'utf8'), changed = false
      for (const [url, rel] of pairs) if (s.includes(url)) { s = s.split(url).join('/' + rel); changed = true }
      if (changed) writeFileSync(p, s)
    } } }
    walk(path.join(outDir, 'src'))
  }
}

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', X = '\x1b[0m'
const appLines = result.appSrc.split('\n').length
if (isFlat) {
  console.log(`\n  ${B}UIForge export ${D}(--flat)${X} ${D}(${nodes.length} nodes → one App.tsx)${X}`)
  console.log(`    ${G}${outDir}/${X}  ${D}App.tsx (${(result.appSrc.length / 1024).toFixed(0)} KB, ${appLines} lines) · index.css${X}`)
} else {
  const compFiles = Object.keys(result.files).filter(f => f.startsWith('src/components/')).length
  console.log(`\n  ${B}UIForge export${X} ${D}(${nodes.length} nodes → componentized React + Tailwind)${X}`)
  console.log(`    ${C}sections${X} ${result.sectionCount} · ${C}repeat groups${X} ${result.repeatCount} → ${compFiles} component files`)
  console.log(`    ${C}App.tsx${X} ${appLines} lines ${D}(composes ${result.sectionOrder.length} sections)${X}`)
  if (result.accepted.length) console.log(`    ${C}repeats${X}  ${result.accepted.slice(0, 8).map(g => `${g.compName}×${g.count}`).join('  ')}${result.accepted.length > 8 ? ` ${D}(+${result.accepted.length - 8})${X}` : ''}`)
  console.log(`    ${G}${outDir}/${X}  ${D}src/App.tsx · src/components/*.tsx · src/content.ts · src/index.css${X}`)
}
if (assetStats) console.log(`    ${C}assets${X}   ${G}${assetStats.downloaded}${X} localized → public/assets ${D}(${(assetStats.bytes / 1024 / 1024).toFixed(1)} MB${assetStats.failed ? `, ${assetStats.failed} skipped` : ''}) — self-contained${X}`)
console.log(`\n    ${D}cd ${outDir} && npm install && npx vite build${X}\n`)
