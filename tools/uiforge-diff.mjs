#!/usr/bin/env node
// uiforge-diff — the fidelity gate (stage 5 of the clone pipeline).
//
// Render the reference and the reconstruction, and compute a visual diff: an
// overall similarity %, and a ranked list of the grid regions that differ most —
// so the reconstruction loop knows WHERE it's off. This is UIForge's loop-against-a-
// gate engine, re-pointed from "is it slop" to "does it match the original".
//
// Use it to prove the reconstruction is faithful (render it with the reference's OWN
// content, diff against the original) before swapping in the user's content.
//
// Usage:
//   node uiforge-diff.mjs <ref: url│file.html│png> <out: url│file.html│png>
//        [--viewport 1440x900] [--heatmap diff.png] [--json]

import process from 'node:process'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { readFileSync } from 'node:fs'
import { loadChromium } from './uiforge-capture.mjs'

const isImg = s => /\.(png|jpe?g|webp)$/i.test(s)
async function toDataURL(browser, target, viewport) {
  if (isImg(target)) {
    const ext = target.split('.').pop().toLowerCase().replace('jpg', 'jpeg')
    return `data:image/${ext};base64,${readFileSync(target).toString('base64')}`
  }
  const url = /^https?:|^file:/.test(target) ? target : pathToFileURL(path.resolve(target)).href
  const page = await browser.newPage({ viewport })
  await page.emulateMedia({ reducedMotion: 'reduce' }).catch(() => {})
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => page.goto(url, { timeout: 30000 }).catch(() => {}))
  await page.waitForTimeout(500)
  await page.evaluate(() => { for (const el of document.querySelectorAll('body *')) { const cs = getComputedStyle(el); if ((cs.position === 'fixed' || cs.position === 'sticky') && el.getBoundingClientRect().height > 140) el.remove() } document.documentElement.style.overflow = 'auto' }).catch(() => {})
  await page.waitForTimeout(200)
  const buf = await page.screenshot({ fullPage: true })
  await page.close()
  return `data:image/png;base64,${buf.toString('base64')}`
}

// runs in the page: load both images, scale to a common width, per-pixel + per-cell diff
function COMPARE(aURL, bURL, cols, rows, thresh, wantHeat) {
  const load = src => new Promise(r => { const im = new Image(); im.onload = () => r(im); im.onerror = () => r(null); im.src = src })
  return Promise.all([load(aURL), load(bURL)]).then(([a, b]) => {
    if (!a || !b) return { error: 'image load failed' }
    const W = Math.min(a.naturalWidth, b.naturalWidth)
    const draw = im => { const s = W / im.naturalWidth, h = Math.round(im.naturalHeight * s); const cv = document.createElement('canvas'); cv.width = W; cv.height = h; cv.getContext('2d').drawImage(im, 0, 0, W, h); return { h, cx: cv.getContext('2d') } }
    const A = draw(a), B = draw(b), H = Math.min(A.h, B.h)
    const da = A.cx.getImageData(0, 0, W, H).data, db = B.cx.getImageData(0, 0, W, H).data
    let mismatch = 0; const total = W * H
    const cell = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0)), cn = Array.from({ length: rows }, () => Array(cols).fill(0))
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4
      const d = Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2])
      if (d > thresh) mismatch++
      const rr = Math.min(rows - 1, Math.floor(y / H * rows)), cc = Math.min(cols - 1, Math.floor(x / W * cols))
      cell[rr][cc] += d; cn[rr][cc]++
    }
    const cells = []
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) cells.push({ r, c, delta: +(cell[r][c] / cn[r][c] / 765).toFixed(3) })
    cells.sort((x, y) => y.delta - x.delta)
    let heat = null
    if (wantHeat) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const cx = cv.getContext('2d')
      cx.drawImage(B.cx.canvas, 0, 0)
      for (const cd of cells) { const cw = W / cols, ch = H / rows; cx.fillStyle = `rgba(255,0,64,${Math.min(0.72, cd.delta * 2.2)})`; cx.fillRect(cd.c * cw, cd.r * ch, cw, ch) }
      heat = cv.toDataURL('image/png')
    }
    return { W, H, hA: A.h, hB: B.h, mismatchPct: +(100 * mismatch / total).toFixed(1), worst: cells.slice(0, 8), heat }
  })
}

const argv = process.argv.slice(2)
if (argv.length < 2 || argv.includes('-h') || argv.includes('--help')) {
  console.log(`
  uiforge-diff — visual fidelity gate: how close is the reconstruction to the original?

  node uiforge-diff.mjs <ref: url│file.html│png> <out: url│file.html│png> [--viewport 1440x900] [--heatmap diff.png] [--json]

  Prints a similarity % and the grid regions that differ most (row,col + delta).
`)
  process.exit(0)
}
const valAt = n => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] ? argv[i + 1] : null }
const [vw, vh] = (valAt('--viewport') || '1440x900').split('x').map(Number)
const heatPath = valAt('--heatmap')
const valueIdx = new Set(); for (const nm of ['--viewport', '--heatmap']) { const i = argv.indexOf(nm); if (i >= 0) valueIdx.add(i + 1) }
const [ref, out] = argv.filter((a, idx) => !a.startsWith('--') && !valueIdx.has(idx))

const chromium = await loadChromium()
if (!chromium) { console.error('Playwright not found: npm i -D playwright && npx playwright install chromium'); process.exit(3) }
const browser = await chromium.launch()
const [aURL, bURL] = [await toDataURL(browser, ref, { width: vw, height: vh }), await toDataURL(browser, out, { width: vw, height: vh })]
const page = await browser.newPage({ viewport: { width: vw, height: vh } })
const res = await page.evaluate(`(${COMPARE.toString()})(${JSON.stringify(aURL)}, ${JSON.stringify(bURL)}, 8, 14, 60, ${!!heatPath})`)
if (heatPath && res.heat) { const b64 = res.heat.split(',')[1]; (await import('node:fs')).writeFileSync(heatPath, Buffer.from(b64, 'base64')) ; delete res.heat }
await browser.close()
if (res.error) { console.error(res.error); process.exit(2) }
const similarity = +(100 - res.mismatchPct).toFixed(1)

if (argv.includes('--json')) { console.log(JSON.stringify({ ref, out, similarity, ...res }, null, 2)); process.exit(0) }
const B = '\x1b[1m', D = '\x1b[2m', G = '\x1b[32m', Y = '\x1b[33m', R = '\x1b[31m', C = '\x1b[36m', X = '\x1b[0m'
const col = similarity >= 92 ? G : similarity >= 78 ? Y : R
console.log(`\n  ${B}UIForge diff${X}  ${col}${B}${similarity}% similar${X} ${D}(${res.mismatchPct}% of pixels differ · ${res.W}×${res.H})${X}`)
console.log(`  ${D}reference height ${res.hA}px · reconstruction ${res.hB}px${X}`)
console.log(`\n  ${C}regions that differ most${X} ${D}(row,col of an 8-col × 14-row grid → delta 0–1)${X}`)
for (const w of res.worst) console.log(`    r${w.r} c${w.c}  ${w.delta >= 0.15 ? R : Y}${'█'.repeat(Math.max(1, Math.round(w.delta * 20)))}${X} ${D}${w.delta}${X}`)
console.log()
