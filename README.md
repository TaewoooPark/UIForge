<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>Clone any website — design, <em>motion</em>, and <em>interaction</em> — two ways: a pixel-faithful <em>freeze</em> and a clean, componentized React + Tailwind <em>rebuild</em>.</strong><br>
  <em>Point it at a site. UIForge <b>freezes</b> it into a self-contained, pixel-faithful replica (its real CSS, fonts, and assets kept) — the offline oracle — and <b>rebuilds</b> it into an editable Vite + React + Tailwind project: sections and repeated blocks as real components, styles as Tailwind classes, content externalized, verified against the freeze. It captures the webfonts, CSS animations, hover states, and dropdowns, records canvas/WebGL heroes to video, samples JS motion, and reaches sites behind Cloudflare — then populates it with <b>your</b> content.</em>
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

## Three outputs from one site

*Look*, *edit*, and *behave* are different copies, so UIForge makes all three:

| | what it is | for |
|---|---|---|
| **Freeze** (`uiforge-freeze`) | a self-contained, **pixel-faithful** replica — real CSS/fonts/assets kept, scripts stripped, time frozen | an exact, offline still — and the **oracle** the rebuild is measured against |
| **Rebuild** (`uiforge-export`) | a **clean, componentized** Vite + React + Tailwind project — components, Tailwind classes, content externalized | building on the design, editing, shipping with **your** content |
| **Archive** (`uiforge-archive`) | the **complete behavior** — the site's own code + every recorded response, replayed offline | a copy that *works*: tabs, filters, lists, client-side transitions, motion, scroll |

The freeze renders identical to the live site (it *is* its CSS); the rebuild is diffed against that freeze — offline, deterministic — so componentization can't silently break fidelity; and the archive **runs the real JavaScript** against cached data, so every interaction behaves exactly as the original (a clicked tab swaps content, a filtered list updates — no reconstruction, because it *is* the behavior).

## Copied, five ways

Five real sites, frozen from the capture alone — original (left) vs freeze (right):

<p align="center">
  <img src="./docs/copy-stripe.png?v=3460" alt="stripe.com original vs freeze, near pixel-identical" width="100%">
</p>
<p align="center"><sub><em><b>stripe.com</b> — the gradient hero, the logo row, the cookie banner: the freeze keeps the real CSS, so it renders identically (the lossy reconstruction collapsed this page to 40% height).</em></sub></p>

<table>
<tr>
<td width="50%" align="center"><img src="./docs/copy-anthropic.png?v=3460" alt="anthropic.com original vs freeze" width="100%"></td>
<td width="50%" align="center"><img src="./docs/copy-vercel.png?v=3460" alt="vercel.com original vs freeze, including the canvas triangle" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>anthropic.com</b> — headline, nav, body, and the orange band, all faithful.</sub></td>
<td align="center"><sub><b>vercel.com</b> — even the <b>canvas triangle</b> hero renders (the freeze keeps the live page, so canvas comes free).</sub></td>
</tr>
<tr>
<td align="center"><img src="./docs/copy-linear.png?v=3460" alt="linear.app original vs freeze" width="100%"></td>
<td align="center"><img src="./docs/copy-openai.png?v=3460" alt="openai.com reached past Cloudflare with --headed, frozen with its real CSS" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>linear.app</b> — the dark hero in its own Inter Variable.</sub></td>
<td align="center"><sub><b>openai.com</b> — reached <b>past Cloudflare</b> with <code>--headed</code>. openai is a JS-personalized SPA: the freeze keeps its real CSS, but its JS-mounted hero shows a different static slide than a re-fetch — the honest SPA limit, not a fidelity gap.</sub></td>
</tr>
</table>

---

## It clones motion and interaction too — not just a static snapshot

<table>
<tr>
<td width="50%" align="center"><img src="./docs/motion-canvas.gif?v=3310" alt="Vercel's canvas/WebGL triangle hero, recorded to a looping video and replayed in the clone" width="100%"></td>
<td width="50%" align="center"><img src="./docs/interaction-menu.gif?v=3310" alt="A GitHub dropdown menu opening on click inside the reconstruction" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>Canvas / WebGL → video.</b> vercel.com's spinning-triangle hero can't be rebuilt from styles, so UIForge <b>records</b> it and replays it as a looping <code>&lt;video&gt;</code>.</sub></td>
<td align="center"><sub><b>Dropdowns / menus / accordions.</b> UIForge clicks the real toggle during capture, records the panel's open state, and replays it — the clone's menu <b>opens on click</b>.</sub></td>
</tr>
<tr>
<td align="center"><img src="./docs/motion-waapi.gif?v=3460" alt="linear.app's staggered entrance animation replayed exactly in the clone with the real easing curve and stagger" width="100%"></td>
<td align="center"><img src="./docs/interaction-hover.gif?v=3310" alt="Hover states replayed in the reconstruction as the cursor moves over interactive elements" width="100%"></td>
</tr>
<tr>
<td align="center"><sub><b>Exact JS motion.</b> Framer / Motion animate through <code>Element.animate()</code> — UIForge hooks it and replays the <b>real</b> keyframes, curve, and stagger (linear.app's entrance, above), not a sampled guess.</sub></td>
<td align="center"><sub><b>Hover / focus / active.</b> The <code>:hover</code> rules are recovered from the stylesheets and replayed, so the clone <b>reacts to the pointer</b>.</sub></td>
</tr>
</table>

<p align="center"><sub><em>All four are produced by the tools from the capture alone — no hand-authoring. CSS animations and scroll-reveal states come across automatically; canvas video and JS-motion sampling are opt-in flags.</em></sub></p>

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
reference URL  (--headed to clear a Cloudflare / bot wall)
   │
   ├─ uiforge-freeze ──────────► freeze.html   the PIXEL-FAITHFUL replica: real CSS/fonts/
   │                                            assets kept, scripts stripped — the ORACLE
   │
   ▼  uiforge-capture       extract EVERY element's exact styles, geometry, text, SVGs +
capture.json                real @font-face, @keyframes, :hover/:focus, dropdown open-states,
   │                        (opt-in) canvas video, JS motion, and a --responsive mobile pass
   │  uiforge-theme         infer roles (bg/fg/accent/…) → a Tailwind v4 @theme
   │  uiforge-segment       find semantic sections + repeated components (structural hashing)
   │  uiforge-tailwindify   map every computed style → Tailwind utility classes
   ▼
   │  uiforge-export        → a CLEAN, componentized Vite + React + Tailwind project:
   ▼                          components/*.tsx, content.ts, hover CSS, motion, toggle runtime
   │  uiforge-assets        --assets downloads images/fonts → /public (self-contained)
   │  uiforge-diff          score the rebuild against freeze.html — PER SECTION (SSIM +
   ▼                        structure + element-presence), offline & deterministic
clone/  (npm install && npm run dev)  ·  content swap: your copy, same components & tokens
```

### What comes across

| | captured | how |
|---|---|---|
| Structure · layout · geometry | ✓ | `getBoundingClientRect` per element |
| Color · gradient · shadow · border · radius | ✓ | `getComputedStyle` per element |
| Typography — the **real webfont** | ✓ | `@font-face` fetched server-side (past CORS) |
| Text — incl. **mixed inline** (links in a sentence) | ✓ | ordered `pre`/`text`/`post` per node |
| SVG icons & logos | ✓ | captured whole |
| **CSS animations** (spinners, entrances) | ✓ | `@keyframes` fetched server-side |
| **Hover / focus / active** states | ✓ | `:hover` rules → `.uif-<i>:hover` companion CSS |
| **Dropdowns / menus / accordions** | ✓ | clicked during capture → open-state + click runtime |
| **Scroll-reveal** states & lazy media | ✓ | full scroll-through before snapshot |
| **Canvas / WebGL** heroes | ✓ *(opt-in)* | `captureStream()` → a looping `<video>` |
| **JS motion** (Framer / GSAP) | ~ *(opt-in)* | sampled over time → approximating `@keyframes` |
| A **pixel-faithful** offline replica | ✓ | `uiforge-freeze` keeps the real CSS/fonts/assets |
| A **clean componentized** rebuild | ✓ | segment + tailwindify → `components/*.tsx`, Tailwind classes |
| **Self-contained** assets (offline) | ✓ *(opt-in)* | `export --assets`, or `freeze --inline` → one data-URI file |
| **Responsive** (mobile) variants | ✓ *(opt-in)* | `--responsive` mobile pass → `max-sm:` classes |
| **Exact** JS animation (Framer / Motion) | ✓ | `Element.animate()` hook → real `@keyframes` + curve/stagger/fill |
| **Scroll-linked** animation | ✓ | native `ScrollTimeline`/`ViewTimeline` → `animation-timeline` |
| **Deterministic** on carousels / rotators | ✓ | time-frozen at the snapshot instant (Playwright clock) |
| Real **`<video>`** (hero / background) | ✓ | source + poster + loop/muted captured |
| Sites behind **Cloudflare / bot walls** | ✓ *(opt-in)* | `--headed --profile` (persistent `cf_clearance` + challenge wait) |
| Content behind a **login** | ✓ *(opt-in)* | `--profile` / `--storage-state` (saved session) |
| A **whole site** (many pages) | ✓ | `uiforge-site` crawls → one React-Router project |

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
ceiling: the visible design matches more closely than the tail number suggests. A running
**canvas/WebGL** hero (Vercel's spinning triangle) can't be *reproduced* from computed
styles — but it is now **recorded to a looping video** (`--record-canvas`), so it's in the
clone too; fonts and CSS motion, once on the "can't" list, aren't anymore. Reproduce any of this:
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
node tools/uiforge-freeze.mjs    <url│file> [--out freeze.html] [--inline] [--headed] [--profile dir] [--shot ref.png]
      # the PIXEL-FAITHFUL oracle: inline the real stylesheets (server-side), strip scripts, freeze
      # time at the snapshot instant. --inline embeds every asset as data: URIs (one offline file);
      # --shot saves the live screenshot at that frozen instant (the aligned proof pair).

node tools/uiforge-capture.mjs   <url│file> [--record-canvas] [--sample-motion] [--responsive] [--headed] [--profile dir]
      # extract every element's exact computed styles, geometry, text, SVGs, real videos + a token set.
      # Recovers real @font-face, @keyframes, :hover/:focus rules + EXACT WAAPI keyframes (curve, stagger,
      # scroll-linked), explores dropdowns, freezes time; emits a coverage manifest (found→captured→why).
      #   --record-canvas  <canvas> → looping .webm     --sample-motion  rAF motion → @keyframes (fallback)
      #   --responsive  mobile → max-sm: + stability     --headed/--profile  clear a bot wall / a login session

node tools/uiforge-theme.mjs     capture.json [--out-css theme.css] [--out-json theme.json]
      # infer semantic roles by usage → a Tailwind v4 @theme (bg/fg/muted/surface/border/accent)

node tools/uiforge-segment.mjs   capture.json [--out segment.json]
      # detect semantic sections + repeated components (structural hashing) — the componentization map
node tools/uiforge-tailwindify.mjs capture.json theme.json [--sample N]
      # map computed styles → Tailwind utility classes against the @theme (arbitrary [values] otherwise)

node tools/uiforge-export.mjs    capture.json --out-dir ./clone [--assets] [--flat]
      # DEFAULT: a componentized React + Tailwind project (components/*.tsx, content.ts, Tailwind classes)
      #   --assets  download images/fonts → /public, rewrite refs (self-contained)   --flat  the old single-file dump

node tools/uiforge-assets.mjs    capture.json --dest ./clone/public
      # download every external image/font/bg a capture references (bounded, self-contained)

node tools/uiforge-diff.mjs      <ref> <out> [--segments segment.json] [--json]
      # localized fidelity: per-section similarity + SSIM + structure (height/node) + element-presence

node tools/uiforge-site.mjs      <start-url> --out-dir ./site [--max 6] [--assets] [--headed] [--profile dir]
      # clone a WHOLE site: crawl same-origin pages, capture each, stitch into ONE React-Router
      # project (a route per page, namespaced components, one shared @theme). The "one page" limit, gone.

node tools/uiforge-archive.mjs   <url> --out-dir ./archive [--explore] [--headed] [--profile dir]
      # the COMPLETE behavior clone: record the real code + every network response (incl. XHR/API),
      # warmed by clicking in-page controls + scrolling → a folder + zero-dep replay server. Open it
      # and the site's own JS runs offline against cached data: tabs, filters, lists, transitions WORK.
      #   node ./archive/serve.mjs   → open the printed http://localhost URL
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

Most of what used to be here is now handled (see the grid): exact JS animation, native
scroll-linked motion, determinism on carousels, real videos, webfonts (even CORS-locked, via
`--inline`), auth, Cloudflare, and whole-site crawl. The **honest residuals** that remain:

- **Behavior lives in the *archive*, not the freeze/rebuild.** JS-mounted heroes (openai's
  ChatGPT prompt), JS-driven scroll scrub, physics/particle motion, and any click-swaps-content
  interaction are only fully reproduced by **`uiforge-archive`**, which runs the real code. The
  freeze (scripts stripped) and the still rebuild capture the *state*, not the running logic.
- **The archive's own residual**: a *server*-dependent action (a search that hits an API, a
  "load more" that fetches) only works if that response was **recorded** — run `--explore` and
  interact more to widen coverage; a request never made during capture has nothing to replay.
- **"Idiomatic" is the last mile** (rebuild): it's genuinely componentized and Tailwind-classed,
  but mapping every arbitrary `[value]` to a design-token utility and naming components
  semantically is the `/clone` agent's polish step, not fully automatic.

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
