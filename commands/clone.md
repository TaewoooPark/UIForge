---
description: Clone a reference site's design into a clean, editable Tailwind (and React) build populated with the user's content. Pipeline: capture → theme → reconstruct → visual diff-loop → content swap → export. Makes a design reproduction / redesign scaffold, not a redistributable content clone.
argument-hint: "<url│file.html> [--content path.md] [--react]"
---

Clone the design of the reference in **$ARGUMENTS** into a clean, editable build. If
`--content <md>` is given, populate it with the user's content instead of the
reference's. Drive the visual diff-loop until the reconstruction is faithful.

Let `ROOT` = `${CLAUDE_PLUGIN_ROOT}`. Work in a fresh output directory (e.g. `./clone/`).

## 1. Capture the full design

```bash
node $ROOT/tools/uiforge-capture.mjs <ref> --out clone/capture.json --viewport 1440x900
```

This is ground truth: every element's exact computed styles (colors, gradients,
shadows, borders, fonts, spacing, flex/grid), geometry, text, and hierarchy, plus a
deduped token set. Also screenshot the reference for your eyes (`--viewport 1440x900`).
For a responsive clone, capture a mobile viewport too (e.g. `390x844`).

## 2. Extract the design system (theme)

```bash
node $ROOT/tools/uiforge-theme.mjs clone/capture.json --out-css clone/theme.css --out-json clone/theme.json
```

`theme.css` is a Tailwind v4 `@theme` with the inferred roles (bg/fg/muted/surface/
border/accent), the exact fonts, palette, type scale, radii, shadows, and signature
gradients. Everything downstream styles **from these tokens** — never invent values.

## 3. Reconstruct (fidelity phase — the reference's OWN content)

Write `clone/index.html`: a self-contained page that loads Tailwind v4 and the theme
```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">@import url("./theme.css");</style>
```
and rebuilds the reference's structure as **semantic sections** (nav, hero, feature
grid, pricing, footer…), using `capture.json` as the source of truth for structure,
geometry, and per-element styles, and the screenshot for your eyes. Use the theme
tokens (`bg-bg`, `text-fg`, `text-accent`, `rounded-r3`, `shadow-e2`, the gradient
vars) so the styling traces to the extracted system. Reproduce gradients, shadows,
and exact spacing — they are in the capture. Fill it with the reference's real text
(from the capture) for now, so the diff is valid.

## 4. Diff-loop until faithful (the gate)

```bash
node $ROOT/tools/uiforge-diff.mjs <ref> clone/index.html --heatmap clone/diff.png
```

Read the **similarity %** and the **worst regions** (row,col + delta). Open the
heatmap. Fix those exact regions in `index.html` — a wrong color, a missing gradient,
off spacing, wrong type size — then re-run. **Loop until similarity ≥ 90%** (cap ~6
rounds; if stuck, report exactly which regions and why). This proves the design was
captured and rebuilt faithfully.

## 5. Swap in the user's content (if `--content`)

Parse the markdown and replace the reference's copy, headings, lists, and images with
the user's, **keeping the components, tokens, and layout intact**. Adapt counts (five
features → five cards in the same style; a section with no matching content is
dropped, extra content reuses the nearest component). Substitute brand assets (logo,
photos) with the user's or clean placeholders. Re-run the diff only for *layout/style*
drift, not pixel identity (content now differs by design).

## 6. Export to React (if `--react`)

Componentize the validated `index.html` into a Vite + React + Tailwind v4 project:
`clone/app/` with `App.tsx`, `components/{Nav,Hero,FeatureGrid,…}.tsx`, `index.css`
holding the `@theme`, and `package.json` + `vite.config.ts`. The markup is already
Tailwind-classed, so HTML → JSX is mechanical; lift repeated blocks into components
with content props. Content stays data (props / a `content.ts`), so it's editable.

## 7. QA the clone

```bash
node $ROOT/tools/uiforge-render-audit.mjs clone/index.html
```

The copy should also **pass WCAG** — if the original shipped sub-AA contrast, fix it
in the clone (same look, better accessibility). Report: the final similarity %, what
content you swapped, the a11y result, and any fidelity gaps you could not close.

## Ethics (default behavior)

This produces a **design reproduction / redesign scaffold** — structure and styling,
with the user's content and substituted brand assets. Do not deploy it under the
original's brand (passing off), do not lift the original's copyrighted images/copy
into a shipped product, and never build a credential/login clone. Fonts follow their
license (substitute if proprietary).
