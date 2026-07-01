<h1 align="center">motion-director</h1>

<p align="center">
  <strong>A motion art-director for Claude Code.</strong><br>
  <em>A plugin + skill that makes Claude use Motion-Primitives with restraint — one signature moment per view, a single shared motion signature, reduced-motion first — so the result reads as hand-crafted, not AI-generated.</em>
</p>

<p align="center">
  <a href="./README.ko.md">한국어 README</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/SKILL.md">SKILL.md</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/references/directions.md">Directions</a>
  &nbsp;·&nbsp;
  <a href="./skills/motion-primitives-director/references/recipes.md">Recipes</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/motion-director?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/motion-director?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Latest release">
  <img src="https://img.shields.io/github/stars/TaewoooPark/motion-director?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="GitHub stars">
  <img src="https://img.shields.io/github/last-commit/TaewoooPark/motion-director?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="Last commit">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Claude Code">
  <img src="https://img.shields.io/badge/Plugin-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Plugin">
  <img src="https://img.shields.io/badge/Skill-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Skill">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="shadcn MCP">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Motion--Primitives-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Motion-Primitives">
  <img src="https://img.shields.io/badge/Motion-000000?style=flat-square&logo=framer&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Motion">
  <img src="https://img.shields.io/badge/React-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="React">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Next.js">
  <img src="https://img.shields.io/badge/Tailwind%20CSS-000000?style=flat-square&logo=tailwindcss&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Tailwind CSS">
</p>

---

> **One sentence:** it directs motion like an art director — first decide the one
> thing that should move and *why*, emit a single motion signature, install only
> what that needs from the Motion-Primitives registry, then cut the weakest
> animation before shipping.

- 🎬 **Direction, not decoration** — the skill is an art director, not a component catalog. It teaches *when to move what, with what restraint* — not how to fit 33 effects on a page.
- ➖ **Subtraction by default** — every animation is guilty until it proves it earns its place. Budget per view: **one** signature motion + **2–3** functional micro-interactions, everything else static.
- 🎛️ **One motion signature** — a single `motion.ts` (easing curve + duration scale + spring) that every component derives from, so the whole surface feels like one hand designed it.
- ♿ **Reduced-motion is the design** — the static version has to be good first; motion is only an enhancement layer, and `prefers-reduced-motion` is the starting point, not a late checkbox.
- 🧩 **Registry is the source of truth** — components install from the official **shadcn MCP** (or the Motion-Primitives CLI); the skill never hand-writes or invents component source or props.
- 🚫 **Names the slop** — fade-up on every section, purple glow on every card, gratuitous typing/scramble, infinite marquees, tilt-on-everything — called out by name and cut on sight.
- 🧭 **Four committed directions** — `precise/mechanical`, `soft/organic`, `editorial/restrained`, `kinetic/expressive`, each with concrete signature values and a calibration target.

## Why It Exists

Baseline AI motion is slop. Ask a generic model to "make this landing page feel
premium" and you get fade-up on every scroll section, a violet gradient glow on
every card, text that types itself for no reason, and a tilt on every hover.
Everything moves — and "everything moves" is the loudest tell that a machine,
not a designer, built it.

`motion-director` inverts that instinct. It owns the **motion layer only** (it
assumes you already have good layout, hierarchy, and typography) and applies a
single discipline: decide the one moment that should move and why, commit to one
motion signature, install only what that moment needs, and delete the weakest
animation before you ship. The point isn't more motion — it's *less, more
precise, more consistent* motion, so the output looks like Linear or Vercel, not
a demo reel.

## How It Works

Two layers. The **taste layer** (this skill) decides intent, budget, and
signature; the **component layer** (Motion-Primitives, installed via the shadcn
MCP) supplies the verified parts. The skill runs one loop, and components come
**last** — deciding the effect first is how you end up decorating.

```
1  Motion thesis     "on load the user feels ___, the eye lands on ___."  (one sentence)
2  Pick a direction  precise · soft · editorial · kinetic         → references/directions.md
3  Emit motion.ts    one easing + duration scale + spring (the signature)
4  Spend the budget  1 signature moment + 2–3 micro, rest static
5  Map components    only now, the moment → a primitive           → references/components.md
6  Install           shadcn MCP / registry — never hand-write source
7  Compose           exact sequence, stagger, timing              → references/recipes.md
8  Critique + subtract  run the rubric, remove the weakest motion → references/critique.md
```

### The motion budget

Per **view** (a hero is a view; a pricing section is a view): at most **one**
signature motion, **2–3** sub-200ms micro-interactions, everything else static.
Chrome — nav, footer, toolbars — does not move. Scarcity is the taste.

### The single motion signature

Before touching a component, the skill emits a `motion.ts` token file — one
easing curve, one duration scale, one spring — and every `transition`/spring
prop derives from it. Hard numbers: entrances 200–400ms, **exits faster**
(150–250ms), stagger 20–60ms (not 200ms), nothing important behind a >600ms
delay. One language across the whole surface.

### Reduced-motion is the design

Litmus test: turn every animation off — the screen must still be good. If the
static version looks thin, motion was hiding a weak design. Every recipe ships a
`prefers-reduced-motion` path that is instant and complete, never a half-empty
screen.

## Install

Inside Claude Code, add this repo as a plugin marketplace and install:

```
/plugin marketplace add TaewoooPark/motion-director
/plugin install motion-director@motion-director
```

Or load it locally for development, or drop just the skill into your skills dir:

```bash
git clone https://github.com/TaewoooPark/motion-director.git

# option A — run Claude Code with the plugin loaded
claude --plugin-dir ./motion-director

# option B — skill only (no plugin/MCP), auto-loads next session
cp -r ./motion-director/skills/motion-primitives-director ~/.claude/skills/
```

**Requirements**

| | |
|---|---|
| Claude Code | the plugin/skill runs inside a session |
| Target project | React / Next.js + Tailwind CSS + [Motion](https://motion.dev) — so components actually run |
| shadcn | an initialized project (`components.json`) for MCP/registry installs — or use the `npx motion-primitives@latest add` fallback |
| Node / npx | for the shadcn MCP server and component installs |

The bundled `.mcp.json` starts the **official** shadcn MCP (`npx shadcn@latest
mcp`) — no custom MCP. Run `/motion-director:motion-setup` in a target project to
ensure the `@motion-primitives` registry and the `motion` / `lucide-react` / `cn`
prerequisites.

## Usage

Trigger the skill in natural language — you don't have to name the library:

```
build a dev-tools startup landing hero, refined and restrained
이 가격표에 인터랙션 넣어서 살아있게 만들어줘 (과하지 않게)
our dashboard empty state is flat — bring it to life with motion
```

Prepare a project's registry + prerequisites with the slash command (optionally
name a component to install after):

```
/motion-director:motion-setup
/motion-director:motion-setup text-effect
```

The skill then runs the loop above — thesis → direction → signature → budget →
components → install → compose → critique — and hands back a design where exactly
one thing carries the motion.

## Directions

Pick one per project and commit; it fixes your `motion.ts` and which primitives
are in play (and which are banned).

| Direction | Character | Signature (starting values) | Calibration |
|---|---|---|---|
| **precise / mechanical** | snappy, no bounce | ease `cubic-bezier(0.2,0,0,1)`, 120–240ms, stagger 20–40ms | Linear, Vercel dashboard |
| **soft / organic** | spring-led warmth | spring `stiffness 220, damping 26`, ~300–450ms | Family, Arc, iOS sheets |
| **editorial / restrained** | near-static + one entrance | one 500–700ms settle, the rest still | Vercel/Apple/Stripe pages |
| **kinetic / expressive** | playful, still one signature | spring `stiffness 300, damping 14`, overshoot ok | playful brand microsites |

Full values, fitting/banned primitives, and targets are in
[`references/directions.md`](./skills/motion-primitives-director/references/directions.md).

## Repository Layout

```
motion-director/
├── README.md · README.ko.md · LICENSE
├── .claude-plugin/
│   ├── plugin.json           # plugin manifest
│   └── marketplace.json      # self-install marketplace
├── .mcp.json                 # official shadcn MCP server (npx shadcn@latest mcp)
├── commands/
│   └── motion-setup.md       # /motion-director:motion-setup
└── skills/
    └── motion-primitives-director/
        ├── SKILL.md          # always-loaded director core (< 500 lines)
        └── references/
            ├── directions.md # 4 motion directions + signature values
            ├── components.md # all 33 primitives: intent → physics → role
            ├── recipes.md    # verified orchestrations (hero, nav, pricing, …)
            └── critique.md   # pre-ship rubric + forced-subtraction pass
```

This repository is original MIT-licensed work. No component source is vendored —
Motion-Primitives components are installed from their registry at build time.

## Notes & Limitations

- **The skill directs motion; it doesn't restyle your app.** It assumes good
  general design (layout, color, type) and layers only the motion decisions on
  top. Pair it with a general design guide if you need one.
- **Components come from the registry, never invented.** Props and defaults in
  `components.md` were read from the component source (Motion-Primitives is beta —
  verify against `components.json` / the source if a prop looks off).
- **The registry endpoint sits behind a bot-checkpoint.** Automated/CI fetches
  of `motion-primitives.com` may `429`; interactive `npx shadcn add` works, and
  `npx motion-primitives@latest add <name>` is the always-on fallback.
- **Pro (paid) components are out of scope** — only the free core set.

## Attribution

- **[Motion-Primitives](https://motion-primitives.com)** by
  [@ibelick](https://github.com/ibelick) — the component registry this skill
  directs (MIT). Components install from it; none are vendored here.
- **[Motion](https://motion.dev)** (ex Framer Motion) — the animation engine the
  primitives are built on.
- **[shadcn](https://ui.shadcn.com)** — the registry spec and the official MCP
  server this plugin reuses.

Original work in this repository is released under the [MIT License](./LICENSE) —
this covers the skill, plugin, and command only, not the third-party libraries it
installs or the data they return.
