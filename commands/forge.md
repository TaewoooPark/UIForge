---
description: Run the full UIForge pipeline on a brief — thesis, one direction, tokens first, sourced components, budgeted composition, blind critique, forced subtraction.
argument-hint: "[what to build, e.g. 'pricing section for a dev-tools startup, restrained']"
---

Forge the UI described in **$ARGUMENTS** (if empty, ask for the brief and the
surface). Run the UIForge pipeline in order — do not skip to components. Use the
`uiforge:design-director` skill as the brain and pull in the other skills at
their step.

1. **Thesis** — write one sentence: who it's for, the feeling on load, where the
   eye lands, and the single thing it's remembered by. Confirm it before building.
2. **Direction** — commit to ONE point of view from the design-director's
   `directions.md` (Editorial / Precise / Brutalist / Warm / Maximalist). State it.
3. **Tokens first** — invoke **`uiforge:design-tokens`**: emit `tokens.css`
   (color roles, one type scale, 8px spacing, one radius/shadow) + `motion.ts`,
   derived from the direction. Override the shadcn/Tailwind defaults. Nothing
   downstream uses a value that isn't a token.
4. **Source components** — install from the registry (shadcn MCP / CLI; run
   `/uiforge:setup` first if the project isn't wired). Bias to the restrained
   cluster in `registry-map.md`; at most one effect-maximalist piece, only as the
   signature. Verify props. Never hand-author component source.
5. **Compose to the budget** — one signature moment; everything else quiet. Direct
   motion with **`uiforge:motion`** (one signature, reduced-motion) and copy with
   **`uiforge:content`** (outcome labels, real states, no hype). Design every
   reachable state (loading / empty / error), not just the happy path.
6. **Enforce — loop until the Gate passes (this is not one pass):**
   a. Run `node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-lint.mjs . --strict`.
   b. If it exits non-zero, **fix the exact violations it names** — promote raw
      hex to tokens, swap a default/system font for a kit face
      (`${CLAUDE_PLUGIN_ROOT}/tools/kits/`), drop the purple/gradient, add the
      reduced-motion path, snap off-grid spacing — then **go back to (a).** Loop
      until it exits 0 (cap ~5 rounds; if still stuck, report exactly what and why).
   c. **Adversarial slop detector** — run the design-director's
      `references/slop-detector.md`: render + screenshot the view (normal **and**
      `prefers-reduced-motion`), then use an *implementation-blind* judge (a
      subagent given only the screenshots) to try to prove a machine made it.
      Fix every tell it cites; re-render; re-judge until **CLEAN**.
   d. **Forced subtraction** — remove the single least-justified element, then
      confirm the linter still exits 0.

Do not report "done" until the linter exits 0 **and** the detector returns CLEAN.
Then report: the thesis, the chosen direction + kit, the emitted signature
(palette / face / type ratio / spacing / motion), what you installed and from
where, the one signature moment, the final linter score, and what you subtracted.
