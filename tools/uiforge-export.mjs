#!/usr/bin/env node
// uiforge-export — stage 6 of the clone pipeline: emit a runnable, editable
// Vite + React + Tailwind v4 project from a capture (+ its theme).
//
// The node tree becomes JSX (style objects from the captured styles), the extracted
// @theme becomes src/index.css, and content stays as editable JSX text. This is the
// deliverable a user npm-installs and edits; the agent's /clone step then lifts
// repeated blocks into components and maps styles to Tailwind utilities.
//
// Usage:
//   node uiforge-export.mjs capture.json --out-dir ./clone [--theme theme.css]

import process from 'node:process'
import path from 'node:path'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs'

const CSS = { dsp: 'display', pos: 'position', top: 'top', rgt: 'right', bot: 'bottom', lft: 'left', z: 'zIndex', ov: 'overflow', fd: 'flexDirection', fw: 'flexWrap', jc: 'justifyContent', ai: 'alignItems', gap: 'gap', gtc: 'gridTemplateColumns', gtr: 'gridTemplateRows', gcol: 'gridColumn', grow_: 'gridRow', fg: 'flexGrow', fsh: 'flexShrink', fb: 'flexBasis', mt: 'marginTop', mr: 'marginRight', mb: 'marginBottom', ml: 'marginLeft', pt: 'paddingTop', pr: 'paddingRight', pb: 'paddingBottom', pl: 'paddingLeft', ff: 'fontFamily', fs: 'fontSize', fwt: 'fontWeight', fst: 'fontStyle', lh: 'lineHeight', ls: 'letterSpacing', ta: 'textAlign', tt: 'textTransform', td: 'textDecoration', col: 'color', ws: 'whiteSpace', bc: 'backgroundColor', bi: 'backgroundImage', bsz: 'backgroundSize', bp: 'backgroundPosition', br: 'backgroundRepeat', bwt: 'borderTopWidth', bwr: 'borderRightWidth', bwb: 'borderBottomWidth', bwl: 'borderLeftWidth', bct: 'borderTopColor', bcr: 'borderRightColor', bcb: 'borderBottomColor', bcl: 'borderLeftColor', rtl: 'borderTopLeftRadius', rtr: 'borderTopRightRadius', rbr: 'borderBottomRightRadius', rbl: 'borderBottomLeftRadius', sh: 'boxShadow', op: 'opacity', flt: 'filter', bdf: 'backdropFilter', tf: 'transform', tr: 'transition', mbm: 'mixBlendMode' }
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
const jsxText = s => String(s).replace(/([{}<>])/g, '{"$1"}').replace(/&/g, '&amp;')
const VOID = new Set(['img', 'input', 'br', 'hr', 'source'])
const SVGTAG = /svg|path|g|circle|rect|line|polyline|polygon|defs|clipPath|mask|use|stop|linearGradient|radialGradient|ellipse|text|tspan/

const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`\n  uiforge-export — capture.json → a runnable Vite + React + Tailwind v4 project.\n\n  node uiforge-export.mjs capture.json --out-dir ./clone [--theme theme.css]\n`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const outDir = valAt('--out-dir') || './clone'
const themePath = valAt('--theme')
const valueIdx = new Set(); for (const nm of ['--out-dir', '--theme']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const capPath = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
const cap = JSON.parse(readFileSync(capPath, 'utf8'))
const nodes = cap.nodes || []
const byId = new Map(nodes.map(n => [n.i, n]))
const kids = new Map()
for (const n of nodes) { const p = byId.has(n.pid) ? n.pid : -1; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(n) }

function styleObj(n) {
  const s = n.style || {}, o = []
  for (const [k, v] of Object.entries(s)) { const prop = CSS[k]; if (prop && v != null && v !== '') o.push(`${JSON.stringify(camel(prop))}: ${JSON.stringify(v)}`) }
  if (n.w) o.push(`width: ${JSON.stringify(n.w + 'px')}`)
  o.push(`boxSizing: "border-box"`)
  return `{{ ${o.join(', ')} }}`
}
function toJSX(n, d) {
  if (d > 40) return ''
  if (n.video) {
    // a recorded canvas/WebGL hero → a looping muted video (asset copied into /public)
    return `<video src=${JSON.stringify('/' + n.video)} autoPlay loop muted playsInline style=${styleObj(n)} />`
  }
  if (n.svgHTML) {
    // SVG stays as raw markup via dangerouslySetInnerHTML on a positioned wrapper
    return `<div style=${styleObj(n)} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(n.svgHTML)} }} />`
  }
  const tag = /^[a-z][a-z0-9]*$/.test(n.tag) && !SVGTAG.test(n.tag) ? n.tag : 'div'
  let a = `<${tag} style=${styleObj(n)}`
  const cls = [n.cls, (n.hover || n.focus || n.active) ? `uif-${n.i}` : ''].filter(Boolean).join(' ')
  if (cls) a += ` className=${JSON.stringify(cls)}`
  if (n.toggleTarget != null) a += ` data-uif-tog=${JSON.stringify(String(n.toggleTarget))}`
  if (n.open) a += ` id=${JSON.stringify('uif-t-' + n.i)}`
  if (n.href) a += ` href=${JSON.stringify(n.href)}`
  if (tag === 'img') a += ` src=${JSON.stringify(n.src || '')} alt=${JSON.stringify(n.alt || '')} width={${n.w}} height={${n.h}}`
  if (VOID.has(tag)) return a + ' />'
  a += '>'
  const children = kids.get(n.i) || []
  const frag = t => t ? (/^ /.test(t) ? '{" "}' : '') + jsxText(t.trim()) + (/ $/.test(t) ? '{" "}' : '') : ''
  const inner = children.length ? '\n' + children.map(c => frag(c.pre) + toJSX(c, d + 1)).join('\n') + frag(n.post) + '\n' : (n.text ? jsxText(n.text) : '')
  return a + inner + `</${tag}>`
}
const roots = kids.get(-1) || []
// disclosure runtime for exported React: a delegated click applies each panel's captured
// open styles (dropdowns/menus/accordions open). Only emitted when there are toggles.
const OKEY = { dsp: 'display', op: 'opacity', vis: 'visibility', h: 'height', mh: 'maxHeight', tf: 'transform', pe: 'pointerEvents' }
const openMap = {}
for (const n of nodes) if (n.open) openMap[n.i] = Object.fromEntries(Object.entries(n.open).map(([k, v]) => [OKEY[k] || k, v]))
const hasToggles = Object.keys(openMap).length > 0
const effect = hasToggles ? `  useEffect(() => {
    const M = ${JSON.stringify(openMap)}
    const h = e => { const t = e.target.closest('[data-uif-tog]'); if (!t) return; e.preventDefault()
      const id = t.getAttribute('data-uif-tog'), p = document.getElementById('uif-t-' + id); if (!p) return
      const on = p.dataset.uifOn === '1'; p.dataset.uifOn = on ? '0' : '1'; t.setAttribute('aria-expanded', String(!on))
      const s = M[id] || {}; for (const k in s) p.style[k] = on ? '' : s[k] }
    document.addEventListener('click', h); return () => document.removeEventListener('click', h)
  }, [])\n` : ''
const app = `${hasToggles ? "import { useEffect } from 'react'\n\n" : ''}export default function App() {\n${effect}  return (\n    <div style={{ minHeight: "100vh", background: "#fff" }}>\n${roots.map(n => toJSX(n, 0)).join('\n')}\n    </div>\n  )\n}\n`

const theme = themePath ? readFileSync(themePath, 'utf8') : `@import "tailwindcss";`
// Motion + interaction, appended AFTER the theme (@import must lead the file):
// @font-face (real webfont), @keyframes (CSS motion), and .uif-<i>:hover/:focus/:active
// companion rules (!important so they beat the inline base styles).
const imp = d => d.split(';').map(x => x.trim()).filter(Boolean).map(x => x + ' !important').join(';')
let interCSS = ''
for (const n of nodes) {
  if (n.hover) interCSS += `.uif-${n.i}:hover{${imp(n.hover)}}\n`
  if (n.focus) interCSS += `.uif-${n.i}:focus-visible{${imp(n.focus)}}\n`
  if (n.active) interCSS += `.uif-${n.i}:active{${imp(n.active)}}\n`
}
const extraCSS = '\n\n' + (cap.fontFaces || []).join('\n') + '\n' + (cap.keyframes || []).join('\n') + '\n' + interCSS
const files = {
  'package.json': JSON.stringify({ name: 'uiforge-clone', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' }, devDependencies: { '@tailwindcss/vite': '^4.0.0', '@vitejs/plugin-react': '^4.3.0', tailwindcss: '^4.0.0', vite: '^5.4.0' } }, null, 2) + '\n',
  'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] })\n`,
  'index.html': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(cap.title || 'clone').replace(/</g, '')}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
  'src/main.tsx': `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)\n`,
  'src/index.css': theme + extraCSS,
  'src/App.tsx': app,
  'README.md': `# UIForge clone\n\nReconstructed from \`${cap.source || ''}\`.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nEdit \`src/App.tsx\` (content and structure) and \`src/index.css\` (the extracted \`@theme\` — palette, fonts, scale, radii, shadows). Styles are inline from the capture; lift repeated blocks into \`src/components/\` and map to Tailwind utilities as you go.\n`,
}
mkdirSync(path.join(outDir, 'src'), { recursive: true })
for (const [f, c] of Object.entries(files)) writeFileSync(path.join(outDir, f), c)

// copy any recorded canvas videos (referenced by node.video) into /public
const vids = [...new Set(nodes.filter(n => n.video).map(n => n.video))]
if (vids.length) {
  mkdirSync(path.join(outDir, 'public'), { recursive: true })
  const srcDir = path.dirname(path.resolve(capPath))
  for (const v of vids) { const from = path.join(srcDir, v); if (existsSync(from)) copyFileSync(from, path.join(outDir, 'public', v)) }
}

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge export${X} ${D}(${nodes.length} nodes → React + Tailwind)${X}`)
console.log(`    ${G}${outDir}/${X}  ${D}App.tsx (${(app.length / 1024).toFixed(0)} KB) · index.css · vite.config.ts · package.json${X}`)
console.log(`\n    ${D}cd ${outDir} && npm install && npm run dev${X}\n`)
