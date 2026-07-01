<h1 align="center">UIForge</h1>

<p align="center">
  <strong>Forge masterpiece UI, not AI slop — a design art-director for Claude Code.</strong><br>
  <em>A plugin that forces a deliberate choice on every design axis (type, color, space, motion, copy), emits the signature as tokens, sources components from vetted registries, and removes anything that doesn't earn its place — so output reads as hand-crafted, not generated.</em>
</p>

<p align="center">
  <a href="./README.ko.md">한국어 README</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/SKILL.md">Design Director</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/references/anti-slop.md">Anti-slop</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/references/directions.md">Directions</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Latest release">
  <img src="https://img.shields.io/github/stars/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Stars">
  <img src="https://img.shields.io/github/last-commit/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="Last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Claude Code">
  <img src="https://img.shields.io/badge/Plugin-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Plugin">
  <img src="https://img.shields.io/badge/4%20Skills%20%2B%203%20Commands-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="4 Skills + 3 Commands">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="shadcn MCP">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-000000?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/Motion-000000?style=flat-square&logo=framer&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Motion">
</p>

---

> **One idea:** AI UI is slop because of *distributional convergence* — asked to
> "make it nice," a model emits the highest-probability answer, and that answer
> *is* the training-data median: Inter, a purple gradient, a centered hero, three
> identical cards. The cure isn't a cleverer prompt; it's **process + constraint.**
> UIForge's whole job is to **replace defaults with decisions** on every axis,
> then enforce them.

- ✍️ **Emitted, enforced signature** — tokens (`tokens.css` + `motion.ts`) are written *first*; the build scans for off-token magic numbers and snaps them back. One coherent source, verifiable — the trick behind v0/Lovable's premium output.
- 🚫 **A named slop-blocklist** — the AI tells (purple-gradient hero, default fonts, glow, emoji-icons, centered-3-cards, infinite marquee…) as a first-class artifact with **grep-able lint patterns**.
- ➖ **A forced-subtraction gate** — every build removes its single least-justified element. The "take one accessory off" ritual, made mandatory — the step every other tool skips.
- 🧩 **Registry provenance** — components are installed from vetted registries via the bundled **shadcn MCP**, never hand-authored; props verified.
- 🎯 **Commit to one point of view** — five opinionated directions (Editorial · Precise · Brutalist · Warm · Maximalist), each with a concrete type/color/space/motion signature.
- ♿ **Reduced-motion & every state** — the static frame must stand on its own; loading/empty/error are designed, not forgotten.

## Proof

Same brief, same model, same starter — the only variable is the plugin. Two
isolated headless Claude Code runs (`--setting-sources project`, so no other
skill can help either side); the **before** is a plain prompt with no plugin, the
**after** uses UIForge via `/uiforge:forge` (its enforcement loop). Both graded by
the shipped linter (`tools/uiforge-lint.mjs`).

<p align="center"><img src="./docs/before-after.png" width="900" alt="Before/after: no plugin (lint grade F, 3 blockers, centered template) vs UIForge /forge (lint grade A+, 0 blockers, asymmetric editorial with a real installed typeface)"></p>
<p align="center"><em>Building the same landing top (nav + hero + features). <b>Before</b> (no plugin): the centered SaaS template — gradient headline text, a system font, an indigo accent, a big empty middle → <b>lint grade F (score 206, 3 blockers)</b>. <b>After</b> (UIForge /forge): an asymmetric editorial layout with a real <b>installed</b> typeface (Hanken Grotesk), one restrained accent, a solid headline, an emitted <code>tokens.css</code> + <code>motion.ts</code>, and a reduced-motion path → <b>lint grade A+ (score 0, 0 blockers)</b>.</em></p>

The difference is not a nicer prompt — it's the **Gate**: UIForge emits a design
signature as tokens, sources a real face from a kit, then **loops** (build → lint
→ fix) until the linter exits 0, and an adversary given only the pixels can't
prove a machine made it. Why it matters: the **aesthetic-usability effect**
(Kurosu & Kashimura, 1995) shows a beautiful interface is *perceived* as more
usable and earns more trust. Reproduce it: `node tools/uiforge-lint.mjs <dir>`.

## The forge

1. **Intent thesis** — one sentence (who · what feeling · the one thing remembered).
2. **Commit to one direction** — a real point of view, not "modern and clean."
3. **Emit the signature first** — `tokens.css` + `motion.ts`; every value derives from them.
4. **Source components from the registry** — vetted, accessible, provenance over invention.
5. **Compose to a budget** — one signature moment; everything else quiet; every state designed.
6. **Critique, blind** — judge the *rendered* result (render + screenshot); grep the slop patterns.
7. **Forced subtraction** — remove the one least-justified thing. Not optional.

## Install

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

Or load locally: `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.
The bundled `.mcp.json` starts the official **shadcn MCP** (`npx shadcn@latest mcp`) — no custom MCP.

## Usage

The `design-director` skill triggers on any UI-building intent — you don't have to
name it. Or drive the pipeline explicitly:

```
/uiforge:forge  pricing section for a dev-tools startup, restrained and premium
/uiforge:setup                     # wire this project's registries + prerequisites
/uiforge:critique                  # blind critique + screenshot + forced subtraction
```

## The suite

| Part | Role |
|---|---|
| **`design-director`** skill | The always-on brain: the theory, the forge pipeline, the masterpiece budget, the slop-blocklist. References: [anti-slop](./skills/design-director/references/anti-slop.md) · [directions](./skills/design-director/references/directions.md) · [critique](./skills/design-director/references/critique.md) · [registry-map](./skills/design-director/references/registry-map.md). |
| **`design-tokens`** skill | Emit + **enforce** the signature: color roles, type scale, 8px space, radius/shadow, `motion.ts`. |
| **`motion`** skill | The motion layer: one signature, the [easing/spring canon](./skills/motion/references/easing-canon.md), Motion-Primitives, reduced-motion. |
| **`content`** skill | Microcopy: outcome labels, real error/empty states, the hype blocklist, the specificity test. |
| **`/forge` · `/setup` · `/critique`** | Run the pipeline · prepare registries · blind critique with a render→screenshot loop. |

## Directions — commit to one

| Direction | Character | Fits |
|---|---|---|
| **Editorial** | big type, asymmetry, generous negative space | content, portfolios, launch pages |
| **Precise / Mechanical** | Swiss grid meets Linear; calm, exact | dev tools, dashboards, B2B |
| **Brutalist** | raw, high-contrast, chunky, hard shadows | creative brands, statements |
| **Warm / Organic** | soft, spring-led, human, warm neutrals | consumer, community, onboarding |
| **Maximalist** | bold, layered, kinetic — still one signature | campaign & brand microsites |

Full signatures in [`directions.md`](./skills/design-director/references/directions.md).

## Repository Layout

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── .claude-plugin/{plugin.json, marketplace.json}
├── .mcp.json                       # official shadcn MCP (component provenance)
├── commands/{forge, setup, critique}.md
└── skills/
    ├── design-director/            # the brain
    │   └── references/{anti-slop, directions, critique, registry-map}.md
    ├── design-tokens/              # emit + enforce
    │   └── references/{color, typography, space-layout}.md
    ├── motion/                     # the motion layer
    │   └── references/{directions, components, recipes, critique, easing-canon}.md
    └── content/                    # microcopy
```

## Notes & Limitations

- **UIForge directs; it assumes competent fundamentals.** It layers *decisions*
  on top of good judgment and real content — it won't rescue a page with nothing
  to say.
- **Components come from the registry, never invented.** Motion-Primitives is beta;
  verify props against source if one looks off.
- **The Motion-Primitives registry endpoint sits behind a bot-checkpoint** —
  automated/CI fetches may `429`; interactive `npx shadcn add` works, and
  `npx motion-primitives@latest add <name>` is the always-on fallback.

## Attribution & canon

Built on and calibrated against: **[Motion-Primitives](https://motion-primitives.com)**
(@ibelick), **[Motion](https://motion.dev)**, and **[shadcn](https://ui.shadcn.com)**
(registry + MCP). The taste it encodes draws on **Refactoring UI**, **Practical
Typography** (Butterick), **Laws of UX**, **Material / Radix / Tailwind** tokens,
the motion craft of **Emil Kowalski** & **Rauno Freiberg**, and **Anthropic's**
frontend-design guidance on *distributional convergence*.

Original work here is [MIT](./LICENSE) — the plugin, skills, and commands; not the
third-party libraries it installs.
