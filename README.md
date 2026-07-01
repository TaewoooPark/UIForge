<h1 align="center">UIForge</h1>

<p align="center">
  <strong>Forge masterpiece UI, not AI slop — a design art-director for Claude Code.</strong><br>
  <em>A plugin that forces a deliberate choice on every design axis (type, color, space, motion, copy), sources components from vetted registries, and removes anything that doesn't earn its place — so output reads as hand-crafted, not generated.</em>
</p>

<p align="center">
  <a href="./README.ko.md">한국어 README</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/SKILL.md">Design Director (brain)</a>
  &nbsp;·&nbsp;
  <a href="./skills/design-director/references/anti-slop.md">Anti-slop</a>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/TaewoooPark/UIForge?style=flat-square&labelColor=000000&color=333333&cacheSeconds=3600" alt="License">
  <img src="https://img.shields.io/github/v/release/TaewoooPark/UIForge?style=flat-square&logo=github&logoColor=white&labelColor=000000&color=333333&cacheSeconds=3600" alt="Latest release">
  <img src="https://img.shields.io/badge/Claude%20Code-000000?style=flat-square&logo=anthropic&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="Claude Code">
  <img src="https://img.shields.io/badge/Plugin-000000?style=flat-square&labelColor=000000&color=000000&cacheSeconds=3600" alt="Plugin">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000&cacheSeconds=3600" alt="shadcn MCP">
</p>

---

> **One idea:** AI UI is slop because of *distributional convergence* — asked to
> "make it nice," a model defaults to the training-data median (Inter, purple
> gradient, centered hero, three cards). UIForge's whole job is to **replace
> defaults with decisions**: a thesis, one committed direction, a design
> signature emitted as tokens *first*, components sourced from vetted registries,
> and a forced-subtraction pass before shipping.

## The forge

1. **Intent thesis** — one sentence (who · what feeling · the one thing remembered).
2. **Commit to one direction** — a real point of view, not "modern and clean."
3. **Emit the signature first** — `tokens.css` + `motion.ts`; every value derives from them.
4. **Source components from the registry** — vetted, accessible, provenance over invention.
5. **Compose to a budget** — one signature moment; everything else quiet.
6. **Critique, blind** — judge the rendered result; render + screenshot if you can.
7. **Forced subtraction** — remove the one least-justified thing. Not optional.

## Install

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

Or load locally: `git clone https://github.com/TaewoooPark/UIForge.git && claude --plugin-dir ./UIForge`.
The bundled `.mcp.json` starts the official **shadcn MCP** (`npx shadcn@latest mcp`) — no custom MCP.

## What's inside (v2.0.0)

```
UIForge/
├── .claude-plugin/{plugin.json, marketplace.json}
├── .mcp.json                       # official shadcn MCP (component provenance)
├── commands/motion-setup.md        # ensure the @motion-primitives registry + deps
└── skills/
    ├── design-director/            # the always-on brain: theory, forge pipeline, budget, slop-blocklist
    │   └── references/anti-slop.md  # named tells + grep lint patterns + banned copy + calibration
    └── motion/                     # the motion layer (Motion-Primitives, one signature, reduced-motion)
```

## Roadmap (shipping per release)

- **v2.1.0** — design-director references: directions (aesthetic POVs), critique, registry taste-map.
- **v2.2.0** — `design-tokens` skill: emit + enforce color roles, type scale, 8px space, radius/shadow, `motion.ts`.
- **v2.3.0** — `motion` deepened with the easing/spring canon.
- **v2.4.0** — `content` skill: outcome-labels, error/empty states, hype blocklist, specificity test.
- **v2.5.0** — commands: `/uiforge:forge`, `/uiforge:setup`, `/uiforge:critique` (+ render→screenshot loop).
- **v2.6.0** — full README (EN + KO) + repository polish.

_UIForge is the successor to `motion-director` (the motion layer is now one part of a full design director)._

## License

[MIT](./LICENSE). Covers the plugin, skills, and commands — not the third-party libraries it installs.
