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
  <img src="./docs/proof-v3-f-to-a.png" alt="UIForge before/after: no plugin (lint F, 3 blockers) vs UIForge /forge (lint A+, 0 blockers)" width="100%">
</p>
<p align="center"><sub><em>Same brief, model, and starter — the only variable is the plugin. Left: plain Claude, <b>lint grade F</b>. Right: UIForge via <code>/forge</code>, <b>lint grade A+</b>. Graded by the shipped linter. <a href="#proof-not-vibes">Details ↓</a></em></sub></p>

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

> **In one line:** UIForge is a design *compiler* — intent in, a tempered,
> slop-free interface out, with a build that goes red if the median leaks through.

## What generic AI-UI tools can't do

| Axis | UIForge | Plain Claude / v0 / Lovable / bolt |
|---|---|---|
| How taste is applied | **Enforced** — a linter exits non-zero on slop; `/forge` loops until it's 0 | Suggested in a system prompt, or nothing; the model may ignore it under pressure |
| The defaults (Inter, purple, centered, slate) | **Banned by a real check** + replaced by an installed kit | Frequently emitted; that's the tell |
| Where the signature lives | An emitted `tokens.css` + `motion.ts`; every value derives from them | Scattered inline literals |
| Components | Installed from a **taste-graded** registry allowlist (provenance), never invented | Hand-authored variants, or an effect-maximalist dump |
| The bar for "done" | Linter = 0 **and** an adversary given the pixels can't prove it's AI | "Looks fine to me" (self-graded, skews positive) |
| Reviewing *someone else's* UI | `uiforge score <dir│PR>` → an A–F grade with the tells | — |
| Runs where | Locally, in your Claude Code session; zero-dependency Node | A hosted product / a web app |
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

## The load-bearing principle: slop is a build error

Everything here descends from one move — **turn taste into a gate.**

- A markdown skill is *advice*: it sits in context next to the model's prior and,
  under token/time pressure, loses. (Measured: v2's prose left 3 blockers.)
- A **linter** is *not advice*. `tools/uiforge-lint.mjs` scans `src`/`app`, names
  the slop, and **exits non-zero.** Wire it as a pre-commit hook / CI step and
  slop literally cannot land.
- `/uiforge:forge` makes the model **iterate against that gate** — build → lint →
  fix the exact violations → repeat until exit 0 — then run an adversarial
  detector on the rendered pixels.

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
| **6. Enforce (loop)** | `uiforge-lint --strict` → fix → repeat until **0**; then the adversarial detector | `/forge`, `/critique`, `slop-detector.md` | a build that passes the gate |
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
└── tools/                # executable, zero-dependency Node
    ├── uiforge-lint.mjs      # the Gate — fails the build on slop
    ├── uiforge-score.mjs     # A–F grade wrapper (a review tool)
    ├── create-uiforge.mjs    # scaffold a wired project
    ├── tokens.template.css   # the token vocabulary
    └── kits/{editorial,precise,brutalist,warm,maximalist}.css
```

## Commands

| Command | What it does |
|---|---|
| `/uiforge:forge <brief>` | Run the whole pipeline: thesis → direction → tokens → source → compose → **loop to linter=0** → detector → subtract |
| `/uiforge:setup [component]` | Prepare a project's registries (shadcn + @motion-primitives) + `motion`/`lucide-react`/`cn` |
| `/uiforge:critique` | Judge the current view **blind**: render + screenshot, run the linter, the adversarial detector, and the forced-subtraction pass |
| `/uiforge:reskin <image│url>` | Extract a signature (palette, type, rhythm) from a reference into tokens — *steal the vibe, not the pixels* |
| `/uiforge:score <dir│PR│url>` | Grade any UI **A–F** with the tells — a standalone reviewer / PR bot |

## Under the hood

### The Gate — `uiforge-lint.mjs`

Zero-dependency Node. Scans `src`/`app`/`index.html` and **exits non-zero** on any
**BLOCKER**: a default/system font (even hidden in a `const`), AI purple/indigo, a
gradient headline, emoji-as-UI, hype copy, or motion without a reduced-motion
path. It **warns** (scored, advisory) on raw hex at point of use, Tailwind
arbitrary values, off-8px-grid spacing, maxed radius+shadow, gradient overuse,
slate/zinc defaults, infinite loops, and a missing token layer. `--strict` fails
on accumulated warnings too; `--json` for machines. It is **dogfooded**: it
grades its own A/B runs, and a fresh gap it found (a font hidden in a `const`)
was fixed the same day.

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

**Does it replace my design system?** No. It layers *decisions* on top of good
fundamentals and real content; it won't rescue a page with nothing to say.

**Is it a component library?** No — it's a *director*. Components come from the
registry; UIForge decides what gets made, sources it, and rejects slop.

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
