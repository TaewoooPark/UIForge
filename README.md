<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>Clone any website's design into clean, editable React + Tailwind — with your content.</strong><br>
  <em>Point it at a site. UIForge captures its full design (every color, gradient, shadow, font, and box), replays it into a faithful reconstruction, loops a visual diff against the original until it matches, then hands you an editable Vite + React + Tailwind project — populated with <b>your</b> content, and accessible where the original isn't.</em>
</p>

<p align="center">
  <a href="./README.ko.md"><img height="28" src="https://img.shields.io/badge/README-한국어-333333?style=for-the-badge&labelColor=000000" alt="한국어 README"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=1800" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=1800" alt="Release">
  <img src="https://img.shields.io/github/stars/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=1800" alt="Stars">
  <img src="https://img.shields.io/github/last-commit/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=1800" alt="Last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000" alt="Claude Code">
  <img src="https://img.shields.io/badge/React%20·%20Tailwind%20v4%20·%20Vite-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React · Tailwind · Vite">
  <img src="https://img.shields.io/badge/Zero--dep%20capture%20·%20diff-000000?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=000000" alt="Zero-dep capture + diff">
</p>

<p align="center">
  <img src="./docs/clone-linear.png?v=3230" alt="UIForge clone of linear.app, reproduced from the capture alone: the live site and the reconstruction side by side at the same scroll position — the same nav, the same headline in Linear's own Inter Variable webfont, the same copy." width="100%">
</p>
<p align="center"><sub><em><b>linear.app, reproduced from the capture alone</b> — no hand-authoring, both panels at the same scroll. <code>capture → reconstruct</code> replays every element's exact styles, geometry, text, and SVGs, and re-declares the site's own <code>@font-face</code> so the headline renders in <b>Linear's real Inter Variable</b> — not a fallback. Then swap in your content and export to an editable React + Tailwind project.</em></sub></p>

---

## Install

**Prerequisites:** [Claude Code](https://claude.com/claude-code), **Node**, and
**Playwright** for the rendering tiers (`npm i -D playwright && npx playwright install chromium`).

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

Or locally: `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.

---

# Clone a site

## The command

```
/uiforge:clone <url│file.html> [--content path.md] [--react]
```

or just say it:

```
Clone the design of linear.app using the content in landing.md.
Make a site with the same design as stripe.com, but for my product (see product.md).
```

You give a **reference** (the design) and, optionally, **your content** (a markdown
file). UIForge produces a clean, editable build whose design is the reference's and
whose content is yours.

## The pipeline

```
reference URL
   │  uiforge-capture       render it, extract EVERY element's exact styles,
   ▼                        geometry, text, SVGs, and a deduped token set
capture.json  ──────────────────────────────────────────────────────────────
   │  uiforge-theme         infer roles (bg/fg/accent/…) → a Tailwind v4 @theme
   ▼
theme.css / theme.json
   │  uiforge-reconstruct   replay the capture into a faithful standalone page
   ▼
index.html (a high-fidelity baseline, no hand-authoring)
   │  uiforge-diff          render both, pixel-compare, report the worst regions
   ▼  ───── loop: fix those regions until similarity ≥ 90% ─────
   │  content swap          replace the reference's copy with YOUR content,
   ▼                        keeping the components, tokens, and layout
   │  uiforge-export        → a Vite + React + Tailwind v4 project you can edit
   ▼
clone/  (npm install && npm run dev)
```

Every value in the reconstruction is produced by the tools, not guessed — the
signature by `uiforge-theme`, the layout and styles by `uiforge-reconstruct`, the
match verified by `uiforge-diff`. And the clone is **QA'd for accessibility**
(`uiforge-render-audit`): the same look, but it passes the WCAG contrast the original
may not.

## How faithful is it, honestly

Measured (deterministic reconstruction, no hand-authoring), full-page pixel overlay of
reference vs reconstruction:

| site | nodes | similarity |
|---|---|---|
| a simple static page | 14 | **93%** |
| **vercel.com** | 425 | **95.8%** |
| **linear.app** | 1023 | **92.8%** |
| tailwindcss.com | 1122 | 71% |

**Clean and medium sites reproduce at 93–96%, and even a dense marketing homepage like
linear.app now lands at 92.8%** — nav, color, copy, and the headline in Linear's own
**Inter Variable** (recovered by re-declaring its `@font-face`) are effectively identical,
as the hero above shows. The number falls on the *longest, most layered* pages
(tailwindcss.com, ~11,000px) for one honest reason: the score is a **full-page pixel
overlay**, so it's dominated by **cumulative vertical drift** — flow layout can't perfectly
reproduce a section whose height came from absolutely-positioned art, and a few pixels per
section compound over a very long page. That metric actually *penalizes* a structurally
complete reconstruction versus a broken-but-shorter one, so read it as a floor, not a
ceiling: the visible design matches more closely than the tail number suggests. What
genuinely can't be reproduced from computed styles is a running **canvas/WebGL** hero
(Vercel's spinning triangle, Linear's animation) and **lazy/cross-origin media**. Fonts
used to be on that list; they aren't anymore — see below. Reproduce any of this:
`node tools/uiforge-capture.mjs <url>` then
`node tools/uiforge-reconstruct.mjs capture.json` then `node tools/uiforge-diff.mjs <url> index.html`.

## Ethics — a redesign scaffold, not a passing-off clone

This makes a **design reproduction**: structure and styling, with **your** content and
substituted brand assets (logo, photos). Do not deploy it under the original's brand
(passing off), do not lift the original's copyrighted images or copy into a shipped
product, and never build a credential/login clone. Fonts follow their license.

---

# The tools

Ten command-line tools; every one prints `--help`. The capture/diff tiers are zero
external-dependency Node; rendering uses Playwright.

### Clone pipeline

```bash
node tools/uiforge-capture.mjs   <url│file> [--out capture.json] [--viewport WxH]
      # render + extract every element's exact computed styles, geometry, text, SVGs,
      # assets, hierarchy + a deduped token set (palette, type, spacing, radii, shadows, fonts)
      # + recovers the real @font-face rules server-side (past the browser's CORS wall)

node tools/uiforge-theme.mjs     capture.json [--out-css theme.css] [--out-json theme.json]
      # infer semantic roles by usage → a Tailwind v4 @theme (bg/fg/muted/surface/border/accent)

node tools/uiforge-reconstruct.mjs capture.json [--out index.html] [--mode flow│absolute]
      # deterministically replay the capture into a faithful standalone page

node tools/uiforge-diff.mjs      <ref> <out> [--viewport WxH] [--heatmap diff.png]
      # render both, compare in a canvas: similarity % + the grid regions that differ most

node tools/uiforge-export.mjs    capture.json --out-dir ./clone [--theme theme.css]
      # emit a runnable Vite + React + Tailwind v4 project (JSX + the extracted @theme)
```

### Accessibility & craft QA (so the clone is better than a scrape)

```bash
node tools/uiforge-render-audit.mjs <url│file> [--spec sig.json] [--json]
      # per-node WCAG contrast, accent surface-area, spacing rhythm, type coherence, layout tells
node tools/uiforge-attention.mjs    <url│file> [--overlay out.png]
      # predict the gaze order + flag a flat hierarchy
node tools/uiforge-lint.mjs         <dir> [--strict]
      # the fast source gate: default fonts, AI purple, gradient headlines, hype copy…
```

---

# How it works

Ask any LLM to "build a site like Stripe" and it approximates from memory — the
result rhymes with Stripe but isn't Stripe. UIForge doesn't approximate. It **renders
the real page and measures it**: `getComputedStyle` on every element gives the exact
color, gradient, shadow, border, font, and box; `getBoundingClientRect` gives the
exact geometry; SVGs are captured whole. `uiforge-reconstruct` replays that verbatim,
so the baseline is faithful *by construction* — the styling is the site's own values,
not a guess. `uiforge-diff` then renders the reconstruction next to the original and
reports, region by region, where it still differs, and the loop closes those gaps.

The result is the opposite of "vibes": a copy you can measure (95.9% on vercel.com),
delivered as an editable React + Tailwind project with your content and the design
system extracted into an `@theme`.

## The design system, extracted

`uiforge-theme` doesn't just dump colors — it **infers roles by how they're used**:
the background is the color painting the most area, the foreground the most-used text
color that clears contrast, the accent the most-used saturated color. On linear.app it
recovered `bg #08090a`, `accent #6366f1` (their indigo), and the exact fonts (Inter
Variable + Berkeley Mono) — the real design system, as a Tailwind v4 `@theme` you own.

## Honest limits

- **Webfonts** *(mostly solved)*: the browser can't read cross-origin `@font-face` rules
  (CORS on `cssRules`), so capture now **fetches the reference's stylesheets server-side**
  — where CORS doesn't apply — extracts the `@font-face` rules, and re-declares them with
  absolute URLs. The font files themselves are almost always public (`Access-Control-Allow-Origin: *`),
  so they load into the reconstruction and text renders in the **real face**. The residual:
  a font served *without* permissive CORS, or one behind auth, still falls back.
- **Canvas / WebGL / video**: not reproducible from computed styles. A screenshot
  fallback for those regions is future work.
- **One snapshot**: JS-driven state, hover, and content behind auth aren't captured;
  responsive needs a mobile capture too.
- **"Clean" is staged**: the export's styling is inline from the capture (faithful,
  editable, theme extracted); lifting it to idiomatic Tailwind utilities and components
  is the `/clone` agent step, not yet fully automatic.

## Repository layout

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── docs/                            # proof images + reproducible fixtures
├── .claude-plugin/ · .mcp.json      # plugin manifest + self-install marketplace + shadcn MCP
├── commands/                        # clone · forge · reskin · setup · critique · score
├── skills/                          # design-director · design-tokens · motion · content
└── tools/                           # the clone pipeline + QA tools
    ├── uiforge-capture.mjs          # extract a reference's full design
    ├── uiforge-theme.mjs            # → a Tailwind v4 @theme (roles inferred)
    ├── uiforge-reconstruct.mjs      # replay the capture into a faithful page
    ├── uiforge-diff.mjs             # visual fidelity gate (similarity % + worst regions)
    ├── uiforge-export.mjs           # → a Vite + React + Tailwind project
    ├── uiforge-render-audit.mjs     # WCAG/craft QA on the clone
    ├── uiforge-attention.mjs        # gaze order + hierarchy
    ├── uiforge-lint.mjs             # the fast source gate
    ├── uiforge-catalog.mjs · uiforge-source.mjs · …   # component catalog (294 items)
    └── catalog/ · kits/             # the asset DB + five ready design kits
```

## Attribution & license

Rendering by **[Playwright](https://playwright.dev)**; output targets
**[React](https://react.dev)** + **[Tailwind CSS v4](https://tailwindcss.com)** +
**[Vite](https://vite.dev)**. The craft/QA layer draws on **Refactoring UI**,
**Practical Typography**, **Material / Radix / Tailwind** tokens, and **Anthropic's**
frontend-design guidance. [MIT](./LICENSE) for the plugin, skills, commands, and
tools — not the sites it captures, the assets it downloads, or the fonts it references.
