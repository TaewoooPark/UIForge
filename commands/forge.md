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
   **If the brief names a reference** (a site/image to feel like), run
   `/uiforge:reskin <ref>` (or `uiforge-extract.mjs`) first to emit `signature.json`
   — the measured reference then drives tokens, sourcing, and the gate below, so the
   rules come from the reference instead of generic defaults.
3. **Tokens first** — invoke **`uiforge:design-tokens`**: emit `tokens.css`
   (color roles, one type scale, 8px spacing, one radius/shadow) + `motion.ts`,
   derived from the direction. Override the shadcn/Tailwind defaults. Nothing
   downstream uses a value that isn't a token.
4. **Source components** — never hand-author; pull the ones that FIT. Rank the
   catalog against the need (and the signature, if you extracted one):
   `node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-source.mjs "<need>" --spec signature.json --type ui`
   — it scores by semantic fit × style fit (radii vs your signature) × taste (a11y +
   radix provenance + variants) and prints the `npx shadcn add …` for the top picks.
   Install those (shadcn MCP / CLI; run `/uiforge:setup` first if unwired); at most
   one effect-maximalist piece, only as the signature. Verify props.
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
   c. **Render audit (deep tier)** — the grep gate is source-only; now grade the
      *rendered* result, which is where contrast, accent coverage, rhythm, and
      layout tells actually live. Render the view and run
      `node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-render-audit.mjs <url|file.html> --viewport 1440x900`.
      **If you extracted a `signature.json`, add `--spec signature.json`** — grading
      becomes reference-relative (match the reference's accent budget, grid, type
      ramp, and layout), while WCAG contrast stays an absolute a11y floor. Fix every
      **contrast** failure; bring accent/rhythm/type/layout into line with the
      signature (or, with no reference, under the generic defaults). Re-run until the
      grade is **A/A+ with 0 contrast fails.** (Needs a browser; if none, say so and skip.)
   d. **Attention & hierarchy** — a clean render can still lead the eye nowhere.
      `node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-attention.mjs <url|file.html> --expect "<your intended #1>"`.
      If it reports `hierarchy: flat` or the headline/CTA is buried (the eye lands on
      a competing block, not your focus), widen the size/contrast/whitespace gap
      around the focal element and re-run until there is one clear #1 and it is yours.
   e. **Adversarial slop detector** — run the design-director's
      `references/slop-detector.md`: render + screenshot the view (normal **and**
      `prefers-reduced-motion`), then use an *implementation-blind* judge (a
      subagent given only the screenshots) to try to prove a machine made it.
      Fix every tell it cites; re-render; re-judge until **CLEAN**.
   f. **Forced subtraction** — remove the single least-justified element, then
      confirm the linter still exits 0.

Do not report "done" until **every gate tier passes** (grep linter exits 0 · render
grade A/A+ with 0 contrast fails · hierarchy not flat, your focus leads) **and** the
detector returns CLEAN. Report it as a **directed critique** (see `/uiforge:critique`),
citing the measurements — then: the thesis, the chosen direction + kit, the emitted
signature (palette / face / type ratio / spacing / motion), what you installed and
from where, the one signature moment, the final grades, and what you subtracted.
