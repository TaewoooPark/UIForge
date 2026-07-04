#!/usr/bin/env node
// uiforge-restore — Tier B: turn an ARCHIVE into an editable React project that renders
// PIXEL-IDENTICAL to the original, by PRESERVATION not reconstruction. It loads the archive's
// real rendered DOM (via Playwright against the replay server, or a freeze.html), converts that
// DOM to JSX keeping every class string byte-exact, ships the site's real compiled CSS and real
// assets, and splits the page into editable section components. Because we keep the real DOM +
// real CSS, fidelity is the DEFAULT — the transform never touches the style channel.
//
// Usage:
//   node uiforge-restore.mjs <archiveDir│freeze.html│url> --out-dir ./restore [--port 8899] [--headed]
//   then:  cd ./restore && npm i && npm run dev

import process from 'node:process'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync, cpSync, readFileSync } from 'node:fs'
import { loadChromium, launchFor, challengeGoto } from './uiforge-capture.mjs'

const argv = process.argv.slice(2)
if (!argv.length || argv.includes('-h') || argv.includes('--help')) {
  console.log(`\n  uiforge-restore — archive → editable, pixel-identical React project (preserve, don't re-draw).\n\n  node uiforge-restore.mjs <archiveDir│freeze.html│url> --out-dir ./restore [--port 8899] [--headed]\n  then  cd ./restore && npm i && npm run dev\n`)
  process.exit(argv.length ? 0 : 1)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const outDir = valAt('--out-dir') || './restore'
const port = +(valAt('--port') || 8899)
const capOpts = { headed: argv.includes('--headed'), profile: valAt('--profile'), storageState: valAt('--storage-state') }
const valueIdx = new Set(); for (const nm of ['--out-dir', '--port', '--profile', '--storage-state', '--viewport']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const input = argv.find((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))
if (!input) { console.error('  no input'); process.exit(1) }
const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)

const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', C = '\x1b[36m', Y = '\x1b[33m', X = '\x1b[0m'

/* ---------- in-page DOM serializer (runs in the browser, so it's a perfect parser) ---------- */
const SERIALIZE = `(() => {
  const SKIP = new Set(['SCRIPT','NOSCRIPT','TEMPLATE','LINK','META']);
  function ser(el){
    if (el.nodeType === 3){ const t = el.textContent; return /\\S/.test(t) ? { x: t.replace(/\\s+/g,' ') } : null }
    if (el.nodeType !== 1) return null;
    const tag = el.tagName;
    if (SKIP.has(tag)) return null;
    if (tag === 'STYLE') return null;
    if (tag === 'SVG' || tag === 'svg') return { t:'svg', raw: el.outerHTML };
    const a = {}; for (const at of el.attributes){ a[at.name] = at.value }
    const c = []; for (const ch of el.childNodes){ const s = ser(ch); if (s) c.push(s) }
    return { t: tag.toLowerCase(), a, c };
  }
  const body = document.body;
  const bodyAttrs = {}; for (const at of body.attributes){ bodyAttrs[at.name] = at.value }
  const htmlAttrs = {}; for (const at of document.documentElement.attributes){ htmlAttrs[at.name] = at.value }
  const tree = []; for (const ch of body.childNodes){ const s = ser(ch); if (s) tree.push(s) }
  // collect ALL css (same-origin replay → every sheet is accessible), preserving @font-face/@media/@keyframes.
  // absolutize every url() against its stylesheet's href so relative ../media/x.woff2 resolves correctly.
  function absCss(text, base){ return text.replace(/url\\(\\s*(['"]?)([^'")]+)\\1\\s*\\)/g, function(m,q,u){ if(/^(data:|#)/.test(u)) return m; try { return 'url(' + q + new URL(u, base).href + q + ')' } catch(e){ return m } }); }
  let css = '';
  for (const sh of document.styleSheets){ try { const base = sh.href || document.baseURI; for (const r of sh.cssRules){ css += absCss(r.cssText, base) + '\\n' } } catch(e){} }
  // head essentials
  const metas = [...document.querySelectorAll('meta[name],meta[property]')].slice(0,40).map(m=>({ k:m.getAttribute('name')||m.getAttribute('property'), v:m.getAttribute('content')||'' }));
  return { title: document.title, lang: document.documentElement.getAttribute('lang')||'', htmlAttrs, bodyAttrs, tree, css, metas };
})()`

async function extractFromPage(page) { return await page.evaluate(SERIALIZE) }

/* ---------- get the rendered DOM: from an archive replay server, a freeze file, or a url ---------- */
async function getModel() {
  const chromium = await loadChromium()
  if (!chromium) { console.error('  Playwright not found — npm i -D playwright && npx playwright install chromium'); process.exit(3) }
  let srv = null, origin = '', archiveDir = null
  const isDir = existsSync(input) && !input.endsWith('.html') && existsSync(path.join(input, 'index.json'))
  try {
    const { page, close } = await launchFor(chromium, { width: vw, height: vh }, capOpts)
    try {
      if (isDir) {
        archiveDir = input
        const idx = JSON.parse(readFileSync(path.join(input, 'index.json'), 'utf8'))
        origin = idx.origin || ''
        srv = spawn(process.execPath, [path.join(input, 'serve.mjs')], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' })
        await new Promise(r => setTimeout(r, 1600))
        console.log(`    ${C}replay${X}   ${D}archive → http://localhost:${port}${X}`)
        await page.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
      } else if (existsSync(input) && input.endsWith('.html')) {
        origin = ''
        await page.goto(pathToFileURL(path.resolve(input)).href, { waitUntil: 'load', timeout: 30000 }).catch(() => {})
      } else {
        origin = (() => { try { return new URL(input).origin } catch { return '' } })()
        await challengeGoto(page, input)
      }
      await page.waitForTimeout(1400)
      const model = await extractFromPage(page)
      model.origin = origin; model.archiveDir = archiveDir; model.replayHost = isDir ? `localhost:${port}` : ''
      return model
    } finally { await close() }
  } finally { if (srv) try { srv.kill() } catch {} }
}

/* ---------- JSX emission ---------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])
const camel = s => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
// attributes that stay lowercase / hyphenated in JSX
const keepHyphen = n => /^(data-|aria-)/.test(n)
// HTML boolean attributes — in React these must be a real boolean, not "" (which is falsy)
const BOOL = new Set(['hidden', 'disabled', 'checked', 'selected', 'readonly', 'multiple', 'autofocus', 'required', 'open', 'novalidate', 'formnovalidate', 'allowfullscreen', 'inert', 'ismap', 'loop', 'muted', 'controls', 'autoplay', 'playsinline', 'reversed', 'async', 'defer', 'nomodule', 'itemscope', 'default'])
const RENAME = { readonly: 'readOnly', ismap: 'isMap', novalidate: 'noValidate', formnovalidate: 'formNoValidate', allowfullscreen: 'allowFullScreen', autofocus: 'autoFocus', playsinline: 'playsInline', itemscope: 'itemScope', crossorigin: 'crossOrigin', autocomplete: 'autoComplete', tabindex: 'tabIndex', maxlength: 'maxLength', colspan: 'colSpan', rowspan: 'rowSpan', usemap: 'useMap', contenteditable: 'contentEditable', spellcheck: 'spellCheck', enterkeyhint: 'enterKeyHint', inputmode: 'inputMode' }
function styleToObj(str) {
  const o = {}
  for (const decl of str.split(';')) {
    const i = decl.indexOf(':'); if (i < 0) continue
    let k = decl.slice(0, i).trim(), v = decl.slice(i + 1).trim()
    if (!k) continue
    const key = k.startsWith('--') ? k : camel(k)
    o[key] = v
  }
  return o
}
function jsxAttrs(a, rewrite, svg) {
  const out = []
  for (let [k, v] of Object.entries(a)) {
    if (k === 'style') { out.push(`style={${JSON.stringify(styleToObj(v))}}`); continue }
    // rewrite url-bearing attribute values while the name is still original
    if (k === 'srcset' || k === 'imagesrcset') v = rewriteSrcset(v, rewrite)
    else if (['src', 'href', 'poster', 'data'].includes(k)) v = rewrite(v)
    // name mapping
    if (k === 'class') k = 'className'
    else if (k === 'for') k = 'htmlFor'
    else if (svg && k.includes(':')) k = k === 'xlink:href' ? 'xlinkHref' : camel(k.replace(':', '-'))
    else if (svg && k.includes('-') && !keepHyphen(k)) k = camel(k)
    else if (RENAME[k]) k = RENAME[k]
    // boolean attributes → real boolean (React treats "" as false)
    const lk = k.toLowerCase()
    if (BOOL.has(lk) && (v === '' || v === lk || v === k || v === 'true')) { out.push(`${k}={true}`); continue }
    // JSX-invalid attribute name guard
    if (/[^a-zA-Z0-9:_-]/.test(k)) continue
    out.push(`${k}={${JSON.stringify(v)}}`)
  }
  return out.length ? ' ' + out.join(' ') : ''
}
function rewriteSrcset(v, rewrite) {
  return v.split(',').map(part => {
    const seg = part.trim().split(/\s+/)
    seg[0] = rewrite(seg[0])
    return seg.join(' ')
  }).join(', ')
}
function escapeText(t) { return t.replace(/([{}<>])/g, m => ({ '{': '&#123;', '}': '&#125;', '<': '&lt;', '>': '&gt;' }[m])) }

// Convert an svg's raw outerHTML into REAL inline JSX (no wrapper element) so child-combinator
// CSS that sizes/colours the icon keeps matching. The browser gives well-formed markup with SVG
// attribute casing (viewBox etc.) preserved; we only fix the JSX-specific bits.
function svgToJsx(raw) {
  return raw
    .replace(/<!--[\s\S]*?-->/g, '')                         // JSX has no HTML comments
    .replace(/\sclass=/g, ' className=')
    .replace(/\sstyle="([^"]*)"/g, (m, s) => ' style={' + JSON.stringify(styleToObj(s)) + '}')
    .replace(/\sxlink:href=/g, ' xlinkHref=')
    .replace(/\sxmlns:xlink=/g, ' xmlnsXlink=')
    // hyphenated presentation attrs → camelCase (stroke-width→strokeWidth), skip data-/aria-
    .replace(/\s([a-zA-Z]+)-([a-zA-Z])([a-zA-Z-]*)=/g, (m, a, b, c) => {
      if (/^(data|aria)$/i.test(a)) return m
      return ` ${a}${b.toUpperCase()}${c.replace(/-([a-zA-Z])/g, (_, d) => d.toUpperCase())}=`
    })
}

function emit(node, rewrite, ind = '', secMap = null) {
  // substitute an extracted section node with its component (keeps the surrounding wrappers intact)
  if (secMap && node.t && secMap.has(node)) return ind + `<${secMap.get(node)} />\n`
  if (node.x !== undefined) return ind + escapeText(node.x.trim()) + '\n'
  if (node.t === 'svg') {
    // inline the SVG as real JSX (NO wrapper) — a wrapper would break `a > svg` / [&>svg] CSS
    return ind + svgToJsx(node.raw) + '\n'
  }
  const attrs = jsxAttrs(node.a || {}, rewrite, false)
  if (VOID.has(node.t)) return ind + `<${node.t}${attrs} />\n`
  const kids = (node.c || [])
  if (!kids.length) return ind + `<${node.t}${attrs}></${node.t}>\n`
  let s = ind + `<${node.t}${attrs}>\n`
  for (const k of kids) s += emit(k, rewrite, ind + '  ', secMap)
  s += ind + `</${node.t}>\n`
  return s
}

/* ---------- find the section split point + componentize ---------- */
function firstEl(nodes) { return nodes.find(n => n.t) }
function elChildren(node) { return (node.c || []).filter(n => n.t) }
// descend through single-element-child wrappers to the real content container
function splitContainer(tree) {
  let cur = { c: tree.filter(n => n.t) }
  let path = []
  while (true) {
    const els = elChildren(cur)
    if (els.length === 1 && (els[0].c || []).some(n => n.t)) { path.push(els[0]); cur = els[0] }
    else break
  }
  return { container: cur, wrappers: path, sections: elChildren(cur) }
}

/* ---------- url rewriting for offline assets ---------- */
function makeRewriter(realOrigin, replayHost) {
  let mainHost = ''
  try { mainHost = new URL(realOrigin).host } catch {}
  const base = mainHost || replayHost || 'site'
  // the DOM/CSS was captured from the replay server (localhost:PORT); map that host back to the
  // site's real host so URLs line up with the copied assets under /_archive/<realHost>/…
  const norm = h => (replayHost && h === replayHost) ? base : h
  return (u) => {
    if (!u || /^(data:|#|blob:|mailto:|tel:|javascript:)/.test(u)) return u
    if (u.startsWith('/_archive/')) return u
    try {
      if (/^https?:\/\//.test(u)) { const x = new URL(u); return `/_archive/${norm(x.host)}${x.pathname}${x.search || ''}` }
      if (u.startsWith('//')) { const x = new URL('https:' + u); return `/_archive/${norm(x.host)}${x.pathname}` }
      if (u.startsWith('/')) return `/_archive/${base}${u}`
      return `/_archive/${base}/${u}`   // relative (approx)
    } catch { return u }
  }
}
function rewriteCss(css, rewrite) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (m, q, u) => `url(${q}${rewrite(u.trim())}${q})`)
}

// Archives can miss assets the browser never fetched during capture (Next.js lazy-loads font
// subsets, so most @font-face files are referenced but absent). Fetch any referenced-but-missing
// asset from the real origin so the restore is self-contained + pixel-faithful. Bounded + safe.
async function fetchTO(url, ms) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms)
  try { return await fetch(url, { signal: c.signal, headers: { 'user-agent': 'Mozilla/5.0' } }) } catch { return null } finally { clearTimeout(t) }
}
async function completeAssets(outDir, texts) {
  const pub = path.join(outDir, 'public', '_archive')
  const refs = new Set()
  for (const text of texts) for (const m of text.matchAll(/\/_archive\/([A-Za-z0-9._:-]+\/[^)"'\s?]+)/g)) refs.add(m[1])
  let fetched = 0, missing = 0, checked = 0
  for (const ref of refs) {
    if (checked++ > 400) break
    const local = path.join(pub, ref)
    if (existsSync(local)) continue
    const slash = ref.indexOf('/'); const host = ref.slice(0, slash), p = ref.slice(slash)
    const r = await fetchTO(`https://${host}${p}`, 8000)
    if (r && r.ok) { try { mkdirSync(path.dirname(local), { recursive: true }); writeFileSync(local, Buffer.from(await r.arrayBuffer())); fetched++ } catch { missing++ } }
    else missing++
  }
  return { fetched, missing }
}

/* ---------- scaffold the project ---------- */
function scaffold(dir, { title, lang, model, componentFiles, pageBody, css }) {
  const w = (p, c) => { const abs = path.join(dir, p); mkdirSync(path.dirname(abs), { recursive: true }); writeFileSync(abs, c) }
  w('package.json', JSON.stringify({
    name: 'uiforge-restore', private: true, version: '0.0.0', type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1' },
    devDependencies: { '@vitejs/plugin-react': '^4.3.1', vite: '^5.4.0' },
  }, null, 2))
  w('vite.config.js', `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\nexport default defineConfig({ plugins: [react()] })\n`)
  w('index.html', `<!doctype html>\n<html lang="${lang || 'en'}">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${title || 'Restored'}</title>\n    <!-- #root is layout-transparent so the page's real top-level nodes behave as direct <body>\n         children (preserves margin-collapse + body>* selectors → no phantom offset) -->\n    <style>#root{display:contents}</style>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>\n`)
  w('src/restored.css', css)
  w('src/main.jsx', `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './restored.css'\nimport Page from './Page.jsx'\n// apply the site's real <html>/<body> attributes so html/body/:root CSS and font-variable\n// classes cascade to the page (fonts, base colors, smoothing all come from here)\nconst H = ${JSON.stringify(model.htmlAttrs || {})}, B = ${JSON.stringify(model.bodyAttrs || {})}\nfor (const [k, v] of Object.entries(H)) try { document.documentElement.setAttribute(k, v) } catch {}\nfor (const [k, v] of Object.entries(B)) try { document.body.setAttribute(k, v) } catch {}\ncreateRoot(document.getElementById('root')).render(<Page />)\n`)
  for (const [name, body] of Object.entries(componentFiles)) {
    w(`src/components/${name}.jsx`, `export default function ${name}() {\n  return (\n<>\n${body}</>\n  )\n}\n`)
  }
  const imports = Object.keys(componentFiles).map(n => `import ${n} from './components/${n}.jsx'`).join('\n')
  w('src/Page.jsx', `${imports}\n\nexport default function Page() {\n  return (\n<>\n${pageBody}</>\n  )\n}\n`)
  w('README.md', `# UIForge restore — editable, pixel-faithful\n\nGenerated from an archive by preservation (real DOM + real compiled CSS + real assets), so it renders identical to the original.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n- \`src/Page.jsx\` — the page, split into \`src/components/*\` sections you can edit.\n- \`src/restored.css\` — the site's **real** compiled stylesheet (kept as-is → pixel fidelity).\n- \`public/_archive/\` — the site's real fonts/images.\n- Class strings are kept **verbatim** (Tailwind/whatever the site shipped). Edit structure & content freely; the styling layer is faithful but raw (machine-generated classes).\n`)
}

async function run() {
  console.log(`\n  ${B}UIForge restore${X} ${D}← ${input}${X}`)
  const model = await getModel()
  if (!model || !model.tree || !model.tree.length) { console.error('  could not extract a DOM from the input'); process.exit(4) }
  const rewrite = makeRewriter(model.origin, model.replayHost)
  mkdirSync(outDir, { recursive: true })

  // copy the archive's real assets so every offline URL resolves under /_archive/<host>/...
  let assetsCopied = false
  if (model.archiveDir) {
    const filesDir = existsSync(path.join(model.archiveDir, 'files')) ? path.join(model.archiveDir, 'files') : path.join(model.archiveDir, 'data')
    if (existsSync(filesDir)) { cpSync(filesDir, path.join(outDir, 'public', '_archive'), { recursive: true }); assetsCopied = true }
  }

  // componentize: extract the real content container's children as section components, but keep
  // the FULL tree (every wrapper's padding/max-width/margins) — sections are substituted in place.
  const { sections } = splitContainer(model.tree)
  const componentFiles = {}
  const secMap = new Map()
  if (sections.length >= 2 && sections.length <= 40) {
    sections.forEach((sec, i) => { const name = 'Section' + (i + 1); secMap.set(sec, name); componentFiles[name] = emit(sec, rewrite, '') })
  }
  const pageBody = model.tree.filter(n => n.t).map(n => emit(n, rewrite, '', secMap)).join('')

  const css = rewriteCss(model.css || '', rewrite)
  scaffold(outDir, { title: model.title, lang: model.lang, model, componentFiles, pageBody, css })

  // self-complete: fetch any asset the CSS/JSX references but the archive never captured
  let completed = { fetched: 0, missing: 0 }
  if (!argv.includes('--no-fetch') && model.origin) {
    completed = await completeAssets(outDir, [css, pageBody, ...Object.values(componentFiles)])
  }

  const nSections = Object.keys(componentFiles).length
  console.log(`    ${C}stack${X}    ${D}origin ${model.origin || '(file)'}${X}`)
  console.log(`    ${C}dom${X}      ${G}${countNodes(model.tree)}${X} nodes → ${G}${nSections || 1}${X} section component(s), classes kept ${B}verbatim${X}`)
  console.log(`    ${C}css${X}      ${G}${Math.round((css.length) / 1024)}KB${X} real compiled stylesheet ${D}(pixel fidelity)${X}`)
  console.log(`    ${C}assets${X}   ${assetsCopied ? G + 'copied → public/_archive/' + X : Y + 'none (freeze/url input)' + X}${completed.fetched ? D + ' + ' + X + G + completed.fetched + X + D + ' fetched (archive gaps)' + X : ''}${completed.missing ? D + ' (' + completed.missing + ' unresolved)' + X : ''}`)
  console.log(`\n    ${G}${outDir}/${X}  ${D}→ cd ${outDir} && npm install && npm run dev${X}\n`)
}
function countNodes(nodes) { let n = 0; for (const x of nodes) { if (x.t) { n++; n += countNodes(x.c || []) } } return n }

run()
