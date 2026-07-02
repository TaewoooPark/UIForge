---
description: Extract a measured design signature (type ramp, accent + its budget, grid unit, radius, layout) from a reference image or site, write it to signature.json, and drive the build to match it — "steal this vibe" as a spec, not pixels.
argument-hint: "[path to a reference image, or a URL to screenshot]"
---

Turn the reference in **$ARGUMENTS** into a UIForge **signature** — the concrete
spec the gate then enforces. The point is to escape the model's median prior by
pinning the build to a target you chose. Extract *parameters*, not assets.

## 1. Extract the signature

- **URL or `.html`** — measure it directly (Playwright renders it, the render-audit
  engine derives the signature):
  ```bash
  node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-extract.mjs <url│file.html> \
    --out signature.json --config uiforge.config.json
  ```
  This writes `signature.json` — `typeRamp`, `accent {hue, budgetPct}`, `gridUnit`,
  `radii`, `layout.posture`, `contrastMin` — the quantified reference.
- **Image path** — the extractor can't see the image, so it hands you a **schema
  skeleton** to fill by vision:
  ```bash
  node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-extract.mjs <image> --out signature.json
  ```
  Then LOOK at the image and fill the fields — the type ramp (px), the ONE dominant
  accent (`hue` 0–360 + roughly its surface `budgetPct`), the `gridUnit`, the `radii`
  bucket (`none/sm/md/lg/xl/full`), and `layout.posture` (`asymmetric`/`centered`) —
  and check it:
  ```bash
  node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-extract.mjs --validate signature.json
  ```
  It's the **same schema** as the URL path (`--schema` prints it), so tokens, sourcing,
  and the gate are identical whether the reference was a site or an image. One accent only.
- If nothing is given, ask for a reference (image, URL, or a site whose feel they want).

## 2. Compile the signature into tokens

Start from the nearest kit in `${CLAUDE_PLUGIN_ROOT}/tools/kits/` and overwrite its
roles with the signature's values — a `tokens.css` whose accent, radius, scale, and
rhythm match the reference. Map the type feel to a real, non-default face
(`tools/kits/README.md` — never Inter/system-ui). Hand off to `uiforge:design-tokens`
to finish dark mode + reduced-motion.

## 3. Source components that FIT the signature

Don't hand-author, and don't grab any tasteful component — pull the ones closest to
the signature you committed to:
```bash
node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-source.mjs "<what you need>" \
  --spec signature.json --type ui
```
It ranks the catalog by semantic fit (the need) × style fit (its radii vs your
signature's) × taste (a11y + radix provenance + variants), and prints the
`npx shadcn add …` for the top picks. Install those, verify props.

## 4. Verify — reference-relative

Grade the build **against the reference**, not against generic rules:
```bash
node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-render-audit.mjs <target> --spec signature.json
node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-lint.mjs . --strict
```
The render audit should report it **matches the reference** on accent budget, grid,
type ramp, and layout — while WCAG contrast stays an absolute floor (a11y never
bends to the reference). Report the signature you extracted, the kit you based it
on, and what you installed. Adaptation, not pixel-copying — never lift the
reference's actual assets or copy.
