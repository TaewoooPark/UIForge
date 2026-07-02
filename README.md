<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>Forge masterpiece UI, not AI slop — a design compiler for Claude Code.</strong><br>
  <em>Not a skill that <b>tells</b> the model to be tasteful. A system that <b>rejects</b> the median — it emits a design signature as tokens, sources a real typeface, loops build → lint → fix until slop is a build error, and won't ship until an adversary handed the pixels can't prove a machine made it.</em>
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
  <img src="https://img.shields.io/badge/Plugin-000000?style=flat-square&labelColor=000000&color=000000" alt="Plugin">
  <img src="https://img.shields.io/badge/4%20Skills%20·%205%20Commands-000000?style=flat-square&labelColor=000000&color=000000" alt="4 Skills · 5 Commands">
  <img src="https://img.shields.io/badge/Zero--dep%20Node%20linter-000000?style=flat-square&logo=nodedotjs&logoColor=white&labelColor=000000" alt="Zero-dependency Node linter">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000" alt="shadcn MCP">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=000000" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-000000?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=000000" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Motion-000000?style=flat-square&logo=framer&logoColor=white&labelColor=000000" alt="Motion">
  <img src="https://img.shields.io/badge/Motion--Primitives-000000?style=flat-square&labelColor=000000&color=000000" alt="Motion-Primitives">
</p>

<p align="center">
  <img src="./docs/proof-render-audit.png" alt="UIForge deep tier: the LLM default renders at F (17/100) with 5 WCAG contrast failures, 57% accent surface, three identical cards; a committed direction renders at A (94/100)" width="100%">
</p>
<p align="center"><sub><em>The <b>deep tier</b> grades the <b>rendered pixels</b>, not the source — real WCAG contrast, accent surface-area, spacing rhythm, layout tells. Left: the page an LLM emits by default, <b>F (17/100)</b> — 5 contrast failures (the gradient headline is literally 1:1), accent on 57% of the surface, three identical cards. Right: a committed direction, <b>A (94/100)</b>. Graded by the shipped <code>uiforge-render-audit</code> — reproduce: <code>node tools/uiforge-render-audit.mjs docs/examples/slop.html</code>. <a href="#proof-not-vibes">Details ↓</a></em></sub></p>

---

## What UIForge means

A **forge** doesn't *generate* metal. It takes raw material, applies heat and
force against a mold, and hammers out everything that isn't the shape — then
tempers it so it holds. That is exactly the posture this plugin takes toward UI.

The raw material is the model's default instinct. Ask any LLM to "make a nice
landing page" and it produces the same page every time: **Inter** on a white
background, a **purple→blue gradient** hero, a **centered** headline, **three
identical rounded cards**. This isn't a bug you fix with a better prompt — it's
**distributional convergence**: on every open choice (font, color, layout,
motion, copy) the model emits the highest-probability token, and the
highest-probability answer *is* the training-data median. The median is slop, and
slop is recognizable on sight.

UIForge's whole job is to **replace defaults with decisions, and then enforce
them**. It commits to one point of view, emits a design signature *as tokens
before any component*, sources a real typeface and vetted components, and then —
this is the part no skill-that-only-advises can do — it **runs a linter that
fails the build on slop and loops until the linter passes.** Advice competes with
the model's prior and loses. A gate does not compete. It rejects.

> **In one line:** UIForge is a design *compiler* — you bring the taste (a
> reference or a committed direction), it compiles that into an enforceable spec,
> sources components that fit it, and loops the build until it *is* that taste,
> with contrast held as an absolute a11y floor.

## Bring a reference: the taste compiler

Generic rules ("accent < 10%, one type ratio") are what make a design tool read as
a *junior linter* — a senior breaks those rules on purpose. So the rules don't
come from UIForge. They come from **a reference you choose.**

```
reference / keyword
   │  uiforge-extract      render the reference, measure it
   ▼
signature.json            type ramp · accent + its budget · grid unit · radii · layout
   │  compile
   ▼
uiforge.config.json       the project-local ruleset the gate reads
   │  uiforge-source       rank the 294-component catalog by fit to THIS signature
   ▼
install the top picks     semantic × style(radii) × taste(a11y · radix · variants)
   │  loop
   ▼
render-audit --spec       grade reference-relative until it MATCHES — contrast stays absolute
```

<p align="center"><img src="./docs/pipeline.png" alt="The UIForge pipeline on a real run: reference → extracted signature → catalog-ranked component picks → reference-relative gate (grade A+, eye lands on the headline #1, 0 contrast fails)" width="100%"></p>
<p align="center"><sub><em>The stages on a real run (<code>docs/examples/good.html</code>): every value is produced by the tools — the signature by <code>uiforge-extract</code>, the picks by <code>uiforge-source</code>, the grade by <code>render-audit --spec</code>, the focal point by <code>uiforge-attention</code>.</em></sub></p>

**Taste is relative; accessibility is not.** The same `slop.html`, three reference frames:

| graded against… | render-audit |
|---|---|
| generic defaults | **F** — accent-overexposed · jittery rhythm · 3 identical cards · centered hero · + contrast |
| an *editorial* reference | **F** — off the reference on every axis · + contrast |
| **its own purple/maximalist reference** | **D** — every taste tell is gone (that *is* the aesthetic now); **only the WCAG contrast failures remain** |

A purple, centered, maximalist page is not "slop" when the reference *is* purple
maximalism — those are decisions. But 5 text nodes below WCAG AA are broken no
matter whose taste you bring. That is the line the compiler draws, and it is why it
isn't just a loop. Reproduce: `node tools/uiforge-extract.mjs <ref> --out sig.json`
then `node tools/uiforge-render-audit.mjs <target> --spec sig.json`.

## What generic AI-UI tools can't do

| Axis | UIForge | Plain Claude / v0 / Lovable / bolt |
|---|---|---|
| How taste is applied | **Enforced** — a linter exits non-zero on slop; `/forge` loops until it's 0 | Suggested in a system prompt, or nothing; the model may ignore it under pressure |
| The defaults (Inter, purple, centered, slate) | **Banned by a real check** + replaced by an installed kit | Frequently emitted; that's the tell |
| Where the signature lives | An emitted `tokens.css` + `motion.ts`; every value derives from them | Scattered inline literals |
| Components | Installed from a **taste-graded** registry allowlist (provenance), never invented | Hand-authored variants, or an effect-maximalist dump |
| The bar for "done" | Linter = 0 **and** an adversary given the pixels can't prove it's AI | "Looks fine to me" (self-graded, skews positive) |
| Reviewing *someone else's* UI | `uiforge score <dir│PR>` → an A–F grade with the tells | — |
| Grading the *rendered result* | `uiforge-render-audit <url>` measures real WCAG contrast, accent surface-area, spacing rhythm, layout tells — on the pixels | Self-graded from source if at all; misses contrast / coverage / rhythm entirely |
| Where the rules come from | **A reference you choose** — `uiforge-extract` measures it into a spec; the gate grades against *that*, not generic heuristics | Fixed generic rules, or none |
| Sourcing components | Ranked by fit to your signature over a **294-component catalog** (semantic × style × a11y/provenance) | A grab-bag, or hand-authored variants |
| Runs where | Locally, in your Claude Code session; grep tier zero-dep, catalog on built-in `node:sqlite` | A hosted product / a web app |
| Your design decisions | Plain text you own — kits, tokens, rules — editable and `git diff`-able | A remote model's opaque behavior |

## Proof, not vibes

Two **isolated** headless Claude Code runs (`--setting-sources project`, so no
other skill can help either side), same brief, model, and starter. The *before*
is a plain prompt with no plugin; the *after* uses UIForge via `/uiforge:forge`
(its enforcement loop). Both graded by the shipped linter, `tools/uiforge-lint.mjs`:

| run | lint grade | score | blockers |
|---|---|---|---|
| **before** — no plugin | **F** | 206 | **3** (AI-purple · gradient headline · no reduced-motion) |
| **after** — UIForge `/forge` | **A+** | 0 | **0** |

In the *after* run the loop actually fired: it committed to the **Precise**
direction, **installed a real typeface** (Hanken Grotesk — not `system-ui`),
emitted `tokens.css` + `motion.ts`, ran `uiforge-lint --strict` repeatedly and
**fixed until it exited 0**, added a reduced-motion path, and broke the centered
SaaS template into an asymmetric editorial layout with checkable copy. The
honest earlier lesson: **prose-only guidance (v2) left 3 blockers — no real
change. Only the machinery (v3) flipped it F → A+.** Reproduce on any project:
`node tools/uiforge-lint.mjs <dir>`.

**Two tiers of proof.** The table above is the *source* gate (grep) flipping a
real run. The hero image up top is the *deep* tier: `uiforge-render-audit`
renders the page and grades what a keyword can't reach — every text node's real
WCAG contrast, what % of the surface one accent covers, spacing rhythm and type
coherence measured from geometry, and layout tells (equal cards, centered hero).
The LLM default renders at **F (17/100)** with 5 genuine contrast failures (the
gradient headline is `transparent` → **1:1**); a committed direction at **A
(94/100)**. You can't dodge a 2.9:1 ratio with a nicer prompt — reproduce:
`node tools/uiforge-render-audit.mjs docs/examples/slop.html`.

**Three tiers of proof — and an honest caveat.** The grade isn't just calibrated on
two pages. `uiforge-corpus` runs the render audit over a **labeled corpus** and
reports whether the grades separate the classes. On the shipped calibration set the
separation is clean — **designed 91.3 vs template 39, +52.3 pts** — and it's
reproducible (`node tools/uiforge-corpus.mjs`), not a quoted statistic:

<p align="center"><img src="./docs/corpus.png" alt="Corpus separation: designed pages cluster at ~91/100, template pages at ~39/100, a +52.3 point gap; with an honest caveat that heavy production sites need snapshot hardening" width="100%"></p>

And the part most tools would hide: full **production homepages** score lower —
Linear and Stripe grade F. But the honest diagnosis (read the findings, don't guess)
is *not* snapshot noise — I shipped snapshot hardening (reduced-motion + overlay
dismissal + settle) and it didn't move them. It's a **unit mismatch** — the metric
grades a focused *view* / hero, not a 465-node multi-section homepage of feature-card
grids and 10 type sizes — **plus genuine WCAG failures these sites actually ship**
(Linear renders a 1:1 gradient-text span and 12px muted text at 3.17:1; Stripe a
2.39:1 hero), which the a11y floor is right to flag. UIForge grades a focused view's
craft + strict accessibility — it is not a "is this site famous" detector. A
hypothesis I could **disprove and correct**, not a quoted stat — the opposite of
manufactured authority.

## The load-bearing principle: slop is a build error

Everything here descends from one move — **turn taste into a gate.**

- A markdown skill is *advice*: it sits in context next to the model's prior and,
  under token/time pressure, loses. (Measured: v2's prose left 3 blockers.)
- A **linter** is *not advice*. `tools/uiforge-lint.mjs` scans the source, names
  the slop, and **exits non-zero.** Wire it as a pre-commit hook / CI step and
  slop literally cannot land. (The fast, zero-dep tier.)
- A **render audit** goes where grep can't. `tools/uiforge-render-audit.mjs`
  renders the page and measures the craft a professional critiques on the
  *result* — every text node's real WCAG contrast, what % of the surface one
  accent covers, spacing rhythm and type coherence from geometry, and AI layout
  tells. Non-gameable: a keyword can't fake a 2.9:1 contrast ratio away. (The deep
  tier; needs a browser.)
- `/uiforge:forge` makes the model **iterate against both gates** — build → lint →
  render-audit → fix the exact violations → repeat until both pass — then run an
  adversarial detector on the rendered pixels.

The bar is therefore not "the model tried to be tasteful." It is **"an adversary
handed only the screenshots cannot prove a machine made this."** That is the
whole product.

## The forge cycle, stage by stage

Intent first; components last. Choosing the effect first is how you end up
decorating.

| Stage | What it does | Skill / command | Produces |
|---|---|---|---|
| **1. Thesis** | One sentence: who · what feeling · the one thing remembered | `design-director` | the brief you commit to |
| **2. Direction** | Commit to one point of view (not "modern & clean") | `directions.md` | Editorial · Precise · Brutalist · Warm · Maximalist |
| **3. Signature** | Emit `tokens.css` + `motion.ts` **first**, from a kit | `design-tokens` + `tools/kits/` | a real font, one accent, an 8px scale, a motion signature |
| **4. Source** | Install vetted components (provenance), never invent | `registry-map.md` + shadcn MCP | real, accessible components |
| **5. Compose** | One signature moment; everything else quiet; every state designed | `motion`, `content` | the built view |
| **6. Enforce (loop)** | `uiforge-lint --strict` (source) → `uiforge-render-audit` (render) → fix → repeat until **both pass**; then the adversarial detector | `/forge`, `/critique`, `slop-detector.md` | a build that passes both gate tiers |
| **7. Subtract** | Remove the single least-justified thing | `critique.md` | the accessory taken off |

## The five directions

Pick one per project; it fixes your tokens, your font, your motion, and which
registries you draw from. Each ships as a **ready kit** (`tools/kits/`) with a
real, non-default typeface — dropped into `src/index.css`, a kit lints clean
(score 0) by construction.

| Direction | Character | Display / mono font | Accent |
|---|---|---|---|
| **Editorial** | magazine, asymmetric, big type | Fraunces / — | rust `#B4472E` |
| **Precise** | Swiss grid × Linear; calm, exact | Hanken Grotesk / JetBrains Mono | electric blue `#4C8DFF` |
| **Brutalist** | raw, high-contrast, hard shadows | Archivo / Space Mono | flat yellow `#FFE500` |
| **Warm** | soft, human, spring-led | Bricolage Grotesque / JetBrains Mono | terracotta `#E07A5F` |
| **Maximalist** | bold, layered, kinetic — still one signature | Unbounded / — | magenta `#FF2E88` |

None is Inter/Roboto/system-ui — which alone clears the biggest blocker.

## Install

### Prerequisites

- **Claude Code** (the plugin runs inside a session).
- **Node** (for the zero-dependency linter/tools).
- A **React / Next.js + Tailwind CSS + [Motion](https://motion.dev)** project for
  the components to actually run (Tailwind v4 recommended). `shadcn` init is
  needed only for MCP/registry installs — otherwise `npx motion-primitives add`
  is the fallback.

### Install as a plugin

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

Or run locally: `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.
The bundled `.mcp.json` starts the official **shadcn MCP** (`npx shadcn@latest mcp`) — no custom MCP.

### Bootstrap a project (the fast path)

Wire an existing app so slop can't land — token kit, linter, npm script,
pre-commit hook, and CI in one command:

```bash
node <plugin>/tools/create-uiforge.mjs precise .    # editorial | precise | brutalist | warm | maximalist
npm run lint:ui                                       # the gate
```

Then in a session, drive the whole pipeline:

```
/uiforge:forge  a pricing section for a dev-tools startup, precise and premium
```

## Repository layout

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── docs/                                             # proof image + reproducible before/after fixtures
├── .claude-plugin/{plugin.json, marketplace.json}   # plugin + self-install marketplace
├── .mcp.json                                         # official shadcn MCP (component provenance)
├── commands/
│   ├── forge.md          # /uiforge:forge — the full pipeline + enforcement loop
│   ├── setup.md          # /uiforge:setup — wire registries + prerequisites
│   ├── critique.md       # /uiforge:critique — render → lint → adversarial detector → subtract
│   ├── reskin.md         # /uiforge:reskin — extract a signature from a reference image/site
│   └── score.md          # /uiforge:score — grade any project / PR A–F
├── skills/
│   ├── design-director/  # the always-on brain: theory, pipeline, budget, slop-blocklist
│   │   └── references/{anti-slop, directions, critique, registry-map, slop-detector}.md
│   ├── design-tokens/    # emit + enforce the signature (color/type/space/radius/motion)
│   │   └── references/{color, typography, space-layout}.md
│   ├── motion/           # the motion layer (Motion-Primitives, one signature, reduced-motion)
│   │   └── references/{directions, components, recipes, critique, easing-canon}.md
│   └── content/          # microcopy: outcome labels, real states, hype blocklist
└── tools/                # executable Node — grep tier zero-dep, render/catalog tiers on Playwright + node:sqlite
    ├── uiforge-lint.mjs          # the Gate (source) — fails the build on slop
    ├── uiforge-render-audit.mjs  # the deep tier (render) — WCAG contrast · accent · rhythm · layout · --spec
    ├── uiforge-attention.mjs     # gaze-order + hierarchy — does the eye reach your focus?
    ├── uiforge-extract.mjs       # a reference → signature.json (+ uiforge.config.json)
    ├── uiforge-source.mjs        # rank the catalog by fit to a signature (semantic × style × taste)
    ├── uiforge-harvest.mjs       # build the catalog: fetch registries → catalog.db
    ├── uiforge-catalog.mjs       # query the catalog — stats · search · show · near
    ├── uiforge-corpus.mjs        # empirical validation — grade a labeled corpus, report separation
    ├── uiforge-score.mjs         # A–F grade wrapper (a review tool)
    ├── create-uiforge.mjs        # scaffold a wired project
    ├── tokens.template.css       # the token vocabulary
    ├── catalog/                  # the asset DB — catalog.db (294 components) + manifest + README
    └── kits/{editorial,precise,brutalist,warm,maximalist}.css
```

## Commands

| Command | What it does |
|---|---|
| `/uiforge:forge <brief>` | Run the whole pipeline: thesis → direction → tokens → source → compose → **loop to linter=0** → detector → subtract |
| `/uiforge:setup [component]` | Prepare a project's registries (shadcn + @motion-primitives) + `motion`/`lucide-react`/`cn` |
| `/uiforge:critique` | Judge the current view **blind**: render + screenshot, run the gate tiers (source linter · render audit · **attention/hierarchy**), the adversarial detector, forced subtraction — and report it **as a directed critique in a voice, citing the numbers** |
| `/uiforge:reskin <image│url>` | The taste-compiler front door: extract a **measured `signature.json`** from a reference, source components that fit it, verify reference-relative — *steal the vibe as a spec, not the pixels* |
| `/uiforge:score <dir│PR│url>` | Grade any UI **A–F** with the tells — the source linter for a dir/PR, the **render audit** for a live URL. A standalone reviewer / PR bot |

## Under the hood

### The Gate — `uiforge-lint.mjs`

Zero-dependency Node. Scans `src`/`app`/`components`/`pages`/`ui`/`styles`/`index.html` (an empty scan reports *nothing scanned*, never a fake pass) and **exits non-zero** on any
**BLOCKER**: a default/system font (even hidden in a `const`), AI purple/indigo, a
gradient headline, emoji-as-UI, hype copy, or motion without a reduced-motion
path. It **warns** (scored, advisory) on raw hex at point of use, Tailwind
arbitrary values, off-8px-grid spacing, maxed radius+shadow, gradient overuse,
slate/zinc defaults, infinite loops, and a missing token layer. `--strict` fails
on accumulated warnings too; `--json` for machines. It is **dogfooded**: it
grades its own A/B runs, and a fresh gap it found (a font hidden in a `const`)
was fixed the same day.

### The deep tier — `uiforge-render-audit.mjs`

The linter greps source; this **renders** the page (Playwright) and grades the
*result* — the dimensions a senior designer critiques, all measured, none
gameable:

- **WCAG contrast**, computed per text node against its true composited background
  (a `transparent` gradient headline resolves to **1:1** — a real failure grep
  can't see).
- **Accent surface-area**, from a non-overlapping sample grid — the *"< 10% of the
  surface"* rule, finally enforced. Tinted near-white/near-black neutrals (warm
  paper, ink) count as neutral.
- **Spacing rhythm** — distinct vertical gaps between siblings, from real geometry,
  plus % off the 4px grid (not a hardcoded denylist).
- **Type-scale coherence** — distinct sizes and whether they follow one modular ratio.
- **AI layout patterns** — *N* equal-width cards in a row; a dead-centered mega-hero.

Same coherent 0–100 → A–F scale as the score tool. The `analyze()` core is pure
and browser-free (`--self-test` ships as a regression). This is the tier that
reaches design professionals — a real a11y + craft report on the rendered
artifact, not a lint of the JSX. Runs inside `/uiforge:critique` and
`/uiforge:score <url>`, or standalone:
`node tools/uiforge-render-audit.mjs <url│file.html>`.

### Reference-relative — `uiforge-extract` + `--spec`

`uiforge-extract` renders a reference and derives its **signature** — type ramp,
accent hue + its surface budget, grid unit, radius vocabulary, layout posture.
Feed that back as `render-audit --spec signature.json` and grading flips from
*absolute rules* to *deviation from the reference you chose*: a maximalist
reference licenses a 40%-accent hero; an editorial one demands an asymmetric
layout. **Contrast never bends** — WCAG AA is an absolute floor regardless of the
reference. The same `analyze()` engine both derives the spec (from the reference)
and measures the target (against it), so reference and target pass identical
measurement and the diff *is* the grade. A **reference image** works too: the tool
can't render an image, so `uiforge-extract <image>` emits a schema **skeleton** the
model fills by vision, and `--validate` checks it against the **same schema** as the
URL path (`--schema` prints the contract) — so an image-derived signature is
interchangeable with a rendered one everywhere downstream.

### The catalog — 294 components, spec-fit sourcing

`uiforge-harvest` fetches shadcn-compatible registries and stores each component
in **`catalog.db`** (SQLite via built-in `node:sqlite`, zero deps) with a *static
signature* parsed from source — radii, variant axes, semantic color roles, spacing
scale, a11y signals (focus-visible / aria / role), motion, radix provenance.
`uiforge-source "<need>" --spec signature.json` then ranks those 294 components by
**semantic fit** (need ↔ name/tags/type) × **style fit** (the component's radii vs
your signature's) × **taste** (a11y + radix + variants − raw color), and prints the
`npx shadcn add …` for the top picks — so you install the pieces that fit the
signature you committed to, never a grab-bag. Re-harvestable; more registries are a
small config change (`@motion-primitives` sits behind a 429 bot-checkpoint).

### Attention & hierarchy — `uiforge-attention.mjs`

A page can pass every craft check and still *lead the eye nowhere* — the most
common real critique ("the hierarchy is weak") made testable. From the render it
predicts a **gaze order** (a saliency proxy over size · contrast · position ·
accent · weight), then checks: is there **one** clear focal point, and does the eye
reach your **headline / CTA** first? On the slop fixture it reports `hierarchy: flat`
and *"the eye lands on the cards at #1–3, your headline is #4"*; on the editorial
one the 60px headline leads at #1. This is the tier that reads as an art director,
not a linter — and `/uiforge:critique` reports it **as a directed critique in a
voice, citing the numbers as evidence**, not as a score.

`--overlay out.png` draws the gaze order (`#1`…`#6`) right onto the rendered page —
an art-director's annotated punch list you can look at:

<p align="center"><img src="./docs/attention-overlay.png" alt="Attention overlay — editorial: hierarchy ok, the eye lands on the headline (#1); slop: hierarchy flat, the eye lands on the three cards (#1–3), the headline is only #4" width="100%"></p>

### Ground truth — kits, fonts, reskin

The fastest way past the median is to **not start from a blank page**. Five kits
ship a real typeface + a committed palette + an 8px scale + a reduced-motion path,
each already passing the linter. `/uiforge:reskin` derives a kit from a reference
image or site (via vision) — parameters, never assets.

### The adversarial loop

`/forge` is not one pass. It builds, runs the linter, fixes the *exact* named
violations, and **repeats until exit 0** — then renders the page and runs an
**implementation-blind** slop detector (ideally a subagent given only the
screenshots) whose only job is to *prove a machine made this*. Ship only on CLEAN.
This is the mechanism behind v0/Lovable's premium output — token-first, enforced,
critique-looped — applied to the whole surface.

### Provenance

Components come from the registry (shadcn MCP / CLI), props verified, never
hand-authored — so every part is auditable, and the model can't re-author
slightly-different snippets forever.

## Design convictions

- **Enforce, don't advise.** Taste that isn't a gate loses to the model's prior.
- **Subtraction is the craft.** One signature moment; everything else quiet;
  remove one thing before you ship.
- **Reduced-motion is the design, not a checkbox.** The static frame must be
  great on its own.
- **Provenance over invention.** Install real components; verify props.
- **Style is consistent constraint.** Commit to one direction; it collapses a
  thousand decisions into a recognizable whole.
- **The bar is adversarial.** Not "looks fine" — "you can't prove a machine made
  it."

## FAQ

**Does it work outside React/Tailwind?** The skills' *judgment* is
framework-agnostic; the kits, the shadcn MCP, and Motion-Primitives assume React
+ Tailwind + Motion. The linter greps Tailwind/CSS/JSX patterns.

**Do I need the shadcn registry / network?** No — `/uiforge:setup` wires it if you
want MCP installs, but you can compose directly, and `npx motion-primitives add`
needs no registry config. The Motion-Primitives endpoint sits behind a
bot-checkpoint, so CI fetches may `429`; interactive installs work.

**Is the linter too strict?** By default only **BLOCKERs** fail (warnings are
advisory). `--strict` is zero-tolerance; `--max-score N` tunes it. It's
opinionated on purpose — that's the point of a gate.

**How deep does the check actually go?** Two tiers. The linter greps *source* for
the crude tells (font, color, gradient, emoji, hype) — fast, zero-dep, wire it into
pre-commit. `uiforge-render-audit` renders the page and measures the *result* —
real WCAG contrast, accent surface-area, spacing rhythm, type coherence, layout
patterns — which grep structurally can't see. The source tier is necessary; the
render tier is where "designed vs generic" is actually decided. It's a strong
signal, not a full audit — it complements axe-core-grade a11y, it doesn't replace it.

**Does it replace my design system?** No. It layers *decisions* on top of good
fundamentals and real content; it won't rescue a page with nothing to say.

**Is it a component library?** No — it's a *director*. Components come from the
registry; UIForge decides what gets made, sources it, and rejects slop.

**Isn't it just a loop enforcing generic rules?** Only if you give it no reference.
Point `uiforge-extract` at a site or image you want to feel like, and the rules
become *that reference's* measured signature — its type ramp, its accent budget,
its grid, its radii. A maximalist reference passes maximalist work; an editorial
one fails it. You supply the taste (the reference); UIForge supplies tireless
measurement and scale. The one thing it will not relativize is **accessibility** —
WCAG contrast is an absolute floor no reference can license away.

## Attribution & canon

Built on and calibrated against **[Motion-Primitives](https://motion-primitives.com)**
(@ibelick), **[Motion](https://motion.dev)**, and **[shadcn](https://ui.shadcn.com)**
(registry + MCP). The taste it encodes draws on **Refactoring UI**, **Practical
Typography** (Butterick), **Laws of UX**, **Material / Radix / Tailwind** tokens,
the motion craft of **Emil Kowalski** & **Rauno Freiberg**, and **Anthropic's**
frontend-design guidance on *distributional convergence*. Fonts are free
(Fontsource / Google Fonts).

## License

[MIT](./LICENSE) — the plugin, skills, commands, and tools. Not the third-party
libraries it installs or the fonts it downloads.
