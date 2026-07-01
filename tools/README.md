# UIForge tools — the Gate

Slop is a build failure here, not a suggestion. Two tiers:

- **Fast tier (zero-dependency)** — `uiforge-lint` / `uiforge-score` grep the
  **source** for slop tells. Node standard library only; wire into pre-commit / CI.
- **Deep tier (Playwright)** — `uiforge-render-audit` renders the page and measures
  the craft dimensions a professional critiques on the **result**: real WCAG
  contrast, accent surface-area, spacing rhythm, type-scale coherence, AI layout
  patterns. Non-gameable — you can't fake a 2.9:1 contrast ratio away with a
  keyword. Needs a browser, so it runs in `/critique` / CI, not on every commit.

## `uiforge-lint.mjs` — the failing linter

Scans a project's `src`/`app`/`components`/`pages`/`ui`/`styles`/`index.html` for the named slop tells **and** token
violations, prints a report + score, and **exits non-zero** on any BLOCKER.

```bash
node <plugin>/tools/uiforge-lint.mjs [dir] [--strict] [--json] [--quiet]
# from within a Claude Code plugin, <plugin> is ${CLAUDE_PLUGIN_ROOT}
```

- **BLOCKERs (always fail):** default font (Inter/system-ui/…), AI purple/indigo,
  gradient headline text, emoji-as-UI, hype copy, motion without a reduced-motion path.
- **Warnings (reported + scored, advisory):** raw hex at point of use, Tailwind
  arbitrary values, off-8px-grid spacing, maxed radius + shadow, gradient overuse,
  unmodified slate/zinc, infinite loops, no design-token layer.
- `--strict` also fails on accumulated warnings (`--max-score 0`).

`/uiforge:critique` runs this automatically; wire it into your project so slop can't land:

**pre-commit** (`.husky/pre-commit` or `.git/hooks/pre-commit`):
```bash
node "$UIFORGE"/tools/uiforge-lint.mjs . --strict || exit 1
```

**CI** (GitHub Actions step):
```yaml
- run: node path/to/uiforge/tools/uiforge-lint.mjs . --strict
```

## `tokens.template.css` — the on-scale vocabulary

Copy to the project and fill from the chosen direction (via the `design-tokens`
skill). Defining tokens first is what lets the build **pass** the linter: every
value derives from a token, on the 8px grid, with a real (non-default) font and one
accent. Emit it **before** any component.

The two tools are a pair: the template gives the model a constrained vocabulary,
the linter rejects anything that steps outside it. Or skip the blank page and
start from a ready **kit** (`kits/`).

## `create-uiforge.mjs` — wire a project so slop can't land

```bash
node <plugin>/tools/create-uiforge.mjs <editorial|precise|brutalist|warm|maximalist> [dir]
```

Into an existing project it drops the direction's **token kit** → `src/index.css`,
copies the **linter** → `scripts/`, adds a `lint:ui` npm script, installs a
**pre-commit hook**, and writes a **CI workflow** (`.github/workflows/uiforge.yml`).
A freshly-wired project (kit, no components yet) scores **A+**. Then install the
kit's fonts and build on the tokens.

## `uiforge-score.mjs` — grade any UI A–F (a review tool)

```bash
node <plugin>/tools/uiforge-score.mjs [dir]
```

Wraps the linter into a letter grade on **one coherent 0–100 scale** (the letter
is derived from the number, so they can't disagree). A BLOCKER — a visible AI
tell — is heavy (−22), so a single blocker caps a UI at **C**; warning tells are
light (−2). 0 tells → **A+**. An empty/non-standard scan grades **N/A**, never a
fake A+. For reviewing a project or a PR, not just your own output. Drives
`/uiforge:score`. Example: the A/B *before* app (3 blockers) grades **F**; a
kit-wired project grades **A+**.

## `uiforge-render-audit.mjs` — the deep tier (measures the render)

```bash
node <plugin>/tools/uiforge-render-audit.mjs <url|file.html> [--json] [--viewport WxH]
node <plugin>/tools/uiforge-render-audit.mjs --self-test   # pure-logic regression, no browser
# live render needs Playwright:  npm i -D playwright && npx playwright install chromium
```

Where the grep linter sees **source**, this renders the page (Playwright) and
grades what's actually painted — the dimensions a senior designer critiques:

- **WCAG contrast** — computed per text node against its true composited
  background; flags every AA failure with the real ratio (e.g. a `transparent`
  gradient headline resolves to **1:1**). Not a keyword — a measurement.
- **Accent surface-area** — a non-overlapping sample grid measures what % of the
  visible surface one accent hue covers, enforcing the *"<10%"* signature rule
  the skills preach but grep can't check. Tinted near-white/near-black neutrals
  (warm paper, ink) are treated as neutral.
- **Spacing rhythm** — distinct vertical gaps between siblings, from real
  geometry (not a hardcoded px denylist); % off the 4px grid.
- **Type-scale coherence** — distinct font sizes and whether they follow **one**
  modular ratio.
- **AI layout patterns** — *N* equal-width sibling cards in a row; a dead-centered
  mega-hero.

Grade is on the same coherent 0–100 → A–F scale as `uiforge-score`. The
`analyze()` core is pure and browser-free (hence `--self-test`), so it's
unit-testable and dogfoodable. This is the tier that reaches design professionals:
a real a11y + craft report on the rendered artifact, not a lint of the JSX.
