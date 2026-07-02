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
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

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
  if (n.svgHTML) {
    // SVG stays as raw markup via dangerouslySetInnerHTML on a positioned wrapper
    return `<div style=${styleObj(n)} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(n.svgHTML)} }} />`
  }
  const tag = /^[a-z][a-z0-9]*$/.test(n.tag) && !SVGTAG.test(n.tag) ? n.tag : 'div'
  let a = `<${tag} style=${styleObj(n)}`
  if (n.cls) a += ` className=${JSON.stringify(n.cls)}`
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
const app = `export default function App() {\n  return (\n    <div style={{ minHeight: "100vh", background: "#fff" }}>\n${roots.map(n => toJSX(n, 0)).join('\n')}\n    </div>\n  )\n}\n`

const theme = themePath ? readFileSync(themePath, 'utf8') : `@import "tailwindcss";`
// The recovered @font-face rules (absolute, ACAO:* font URLs) render the real webfont.
const fontCSS = (cap.fontFaces || []).length ? cap.fontFaces.join('\n') + '\n\n' : ''
const files = {
  'package.json': JSON.stringify({ name: 'uiforge-clone', private: true, type: 'module', scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' }, dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' }, devDependencies: { '@tailwindcss/vite': '^4.0.0', '@vitejs/plugin-react': '^4.3.0', tailwindcss: '^4.0.0', vite: '^5.4.0' } }, null, 2) + '\n',
  'vite.config.ts': `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\n\nexport default defineConfig({ plugins: [react(), tailwindcss()] })\n`,
  'index.html': `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${(cap.title || 'clone').replace(/</g, '')}</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n`,
  'src/main.tsx': `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)\n`,
  'src/index.css': fontCSS + theme + '\n',
  'src/App.tsx': app,
  'README.md': `# UIForge clone\n\nReconstructed from \`${cap.source || ''}\`.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\nEdit \`src/App.tsx\` (content and structure) and \`src/index.css\` (the extracted \`@theme\` — palette, fonts, scale, radii, shadows). Styles are inline from the capture; lift repeated blocks into \`src/components/\` and map to Tailwind utilities as you go.\n`,
}
mkdirSync(path.join(outDir, 'src'), { recursive: true })
for (const [f, c] of Object.entries(files)) writeFileSync(path.join(outDir, f), c)

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', X = '\x1b[0m'
console.log(`\n  ${B}UIForge export${X} ${D}(${nodes.length} nodes → React + Tailwind)${X}`)
console.log(`    ${G}${outDir}/${X}  ${D}App.tsx (${(app.length / 1024).toFixed(0)} KB) · index.css · vite.config.ts · package.json${X}`)
console.log(`\n    ${D}cd ${outDir} && npm install && npm run dev${X}\n`)
