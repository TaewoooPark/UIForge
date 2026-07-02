<h1 align="center">🔨 UIForge</h1>

<p align="center">
  <strong>Forge masterpiece UI, not AI slop — a taste compiler for Claude Code.</strong><br>
  <em>Bring a reference (a site, an image, or a committed direction). UIForge measures it into a signature, sources components that fit it, and loops the build against a real gate — one that renders the page and fails on genuine WCAG failures, a flat hierarchy, or the median slop — until it <b>is</b> that taste.</em>
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
  <img src="https://img.shields.io/badge/4%20Skills%20·%205%20Commands%20·%2010%20Tools-000000?style=flat-square&labelColor=000000&color=000000" alt="4 Skills · 5 Commands · 10 Tools">
  <img src="https://img.shields.io/badge/shadcn%20MCP-000000?style=flat-square&logo=shadcnui&logoColor=white&labelColor=000000" alt="shadcn MCP">
  <img src="https://img.shields.io/badge/React%20·%20Next.js%20·%20Tailwind%20·%20Motion-000000?style=flat-square&logo=react&logoColor=white&labelColor=000000" alt="React · Next.js · Tailwind · Motion">
</p>

<p align="center">
  <img src="./docs/proof-render-audit.png?v=3150" alt="Same brief run for real — a dev-tools pricing section. Left: the LLM default, render audit F (46/100), 12 WCAG contrast failures, three identical cards, flat hierarchy. Right: forged through UIForge, A (94/100), 0 contrast failures, the recommended plan emphasized, the headline leads." width="100%">
</p>
<p align="center"><sub><em>Same brief — <b>a pricing section for a dev-tools startup</b> — run for real. Left: the default an LLM emits (purple gradient headline, three identical cards, muted low-contrast copy), <b>render audit F (46/100)</b>. Right: forged through the pipeline, gated until it passed, <b>A (94/100)</b>. Reproduce: <code>node tools/uiforge-render-audit.mjs docs/examples/pricing-forged.html</code>.</em></sub></p>

---

## Install

**Prerequisites:** [Claude Code](https://claude.com/claude-code) (the plugin runs
inside a session), **Node** (for the tools), and — for components to actually run —
a **React / Next.js + Tailwind CSS + [Motion](https://motion.dev)** project (Tailwind
v4 recommended). Live rendering in the deep tier needs **Playwright**
(`npm i -D playwright && npx playwright install chromium`); the source linter needs
nothing but Node.

```
/plugin marketplace add TaewoooPark/UIForge
/plugin install uiforge@uiforge
```

Or run it locally without installing:

```bash
git clone https://github.com/TaewoooPark/UIForge.git
claude --plugin-dir ./UIForge
```

The bundled `.mcp.json` starts the official **shadcn MCP** (`npx shadcn@latest mcp`);
no custom MCP server is added.

---

# Using UIForge

Everything below is what you actually type. Five slash commands drive the pipeline
from a Claude Code session; ten command-line tools do the measuring and can be run
on their own or wired into CI.

## The five commands

| Command | What you use it for |
|---|---|
| `/uiforge:forge <brief>` | Build a UI end to end: pick a direction, emit tokens first, source components, compose, then loop the gate until it passes. |
| `/uiforge:reskin <image│url>` | Turn a reference into a `signature.json` (the design guidance, measured), then build to it. The front door for "make it feel like this." |
| `/uiforge:setup [component]` | Wire the target project: register the shadcn and Motion-Primitives registries, install `motion` / `lucide-react` / the `cn` helper. Run once per project. |
| `/uiforge:critique` | Review the current view without mercy: render it, run all gate tiers, predict the gaze order, then hand back a directed critique (not a score). |
| `/uiforge:score <dir│PR│url>` | Grade any UI A–F. A directory or a pull request goes through the source linter; a live URL goes through the render audit. A standalone reviewer. |

## Prompts, by situation

The commands take natural language. You do not need special syntax — you steer with
plain design language. Here is how each common situation looks.

**Just a brief.** Name the surface and the audience; the pipeline picks a direction
and commits.

```
/uiforge:forge a pricing section for a dev-tools startup
```

**A brief with design guidance.** Add the feeling, the direction, the one accent,
the restraint. Adjectives are instructions here — the more committed, the better.

```
/uiforge:forge a landing hero for a focus/writing app.
  editorial and warm, one rust accent, big serif display, calm and asymmetric —
  no gradient, the headline does all the work.
```

```
/uiforge:forge a settings page for a database console.
  Swiss/precise: neutral, exact, one electric-blue accent, a tight 8px grid,
  mono for anything numeric. dense but never cramped.
```

**A brief with a reference.** This is the taste-compiler path. Point at a site or an
image whose feel you want; UIForge measures it into a signature and builds to *that*,
not to generic rules.

```
/uiforge:reskin https://linear.app
# → extracts a signature.json (accent, grid, radii, type ramp, layout posture)

/uiforge:forge a changelog page, using the signature from the reskin above.
  same restraint and accent, our own copy and layout — steal the vibe, not the pixels.
```

```
/uiforge:reskin ./moodboard.png
# an image reference: UIForge writes a signature skeleton for the model to fill by
# looking at the image, then validates it — same schema as a URL reference.
```

**Design comments while iterating.** Talk to it the way you would talk to a
designer. Comments are honored against the render, so they are checkable.

```
/uiforge:critique
# then, based on what it reports:
"the accent is overexposed — pull it under 10% of the surface."
"the eye lands on the cards, not the headline. make the headline lead."
"the muted text fails contrast. darken it until it passes AA."
"one radius vocabulary — you're mixing sharp and pill."
```

**Reviewing someone else's UI.** No source needed for a URL; the render audit works
on the pixels.

```
/uiforge:score ./apps/web        # a local directory (source linter)
/uiforge:score 128               # a GitHub pull request number
/uiforge:score https://acme.com  # a live URL (render audit + gaze order)
```

**Wiring a fresh project.** Once, before you build.

```
/uiforge:setup                   # registries + motion/lucide-react/cn
```

## Give it a reference — three ways

1. **A live site.** `/uiforge:reskin https://…` renders it and measures its
   signature. Best when you can point at something on the web.
2. **An image or moodboard.** `/uiforge:reskin ./ref.png` — the tool cannot render
   an image, so it writes a schema **skeleton** and the model fills it by *looking*
   (type ramp, the one accent and roughly its surface share, spacing base, corner
   radius, layout posture), then validates it. Same schema as a site, so everything
   downstream behaves identically.
3. **A direction, in words.** No file at all — name one of the five directions and a
   few adjectives in the `/forge` prompt. UIForge ships a ready kit per direction.

However you give it, the result is one `signature.json` — the quantified design
guidance the gate then enforces with `--spec`.

## The command-line tools

Every tool prints `--help`. Run them standalone, in `/critique` and `/score`, or in
CI. The source tier is pure Node; the render and catalog tiers use Playwright and the
built-in `node:sqlite`.

### `uiforge-lint.mjs` — the fast gate (source)

Greps `src` / `app` / `components` / `pages` / `ui` / `styles` / `index.html` for the
crude tells and **exits non-zero** on any blocker. Zero dependencies.

```bash
node tools/uiforge-lint.mjs [dir] [--strict] [--json] [--max-score N] [--quiet]
```

- **Blockers** (always fail): a default or system font (Inter, system-ui, Roboto…),
  even hidden in a `const`; AI purple/indigo; a gradient headline; emoji used as UI;
  hype copy; motion with no reduced-motion path.
- **Warnings** (scored, advisory): raw hex at point of use, Tailwind arbitrary
  values, off-8px-grid spacing, maxed radius + shadow, gradient overuse, slate/zinc
  defaults, infinite loops, a missing token layer.
- `--strict` fails on accumulated warnings too; `--max-score N` sets the threshold;
  `--json` for machines. An empty scan reports *nothing scanned*, never a fake pass.

Wire it as a pre-commit hook or a CI step and slop cannot land:
`node tools/uiforge-lint.mjs . --strict`.

### `uiforge-render-audit.mjs` — the deep gate (render)

Renders the page and measures the craft a senior designer critiques on the *result*:
real WCAG contrast per text node, accent surface-area, spacing rhythm, type-scale
coherence, and AI layout patterns.

```bash
node tools/uiforge-render-audit.mjs <url│file.html> [--spec signature.json]
     [--signature] [--viewport 1440x900] [--no-harden] [--json] [--self-test]
```

- `--spec signature.json` — grade **reference-relative** (against a signature)
  instead of against absolute rules. Contrast stays an absolute WCAG floor either way.
- `--signature` — emit the page's own derived signature as JSON (used by `extract`).
- `--no-harden` — turn off the default hardening (reduced-motion emulation, cookie
  and consent overlay dismissal, settle wait) used for live sites.
- `--self-test` — a pure-logic regression that runs without a browser.

### `uiforge-attention.mjs` — gaze order + hierarchy

Predicts where the eye lands, then checks for one clear focal point and whether the
headline or primary action leads. Turns "the hierarchy is weak" into a testable claim.

```bash
node tools/uiforge-attention.mjs <url│file.html> [--expect "your headline"]
     [--overlay out.png] [--viewport 1440x900] [--json] [--self-test]
```

- `--expect "text"` — check that a specific element is in the top 3.
- `--overlay out.png` — draw the gaze order (`#1`…`#6`) onto the page and save it as
  an annotated punch list you can look at.

### `uiforge-extract.mjs` — a reference → a signature

```bash
node tools/uiforge-extract.mjs <url│file.html> [--out signature.json]
     [--config uiforge.config.json] [--print] [--viewport WxH]
node tools/uiforge-extract.mjs <image>            # vision path: writes a schema skeleton
node tools/uiforge-extract.mjs --validate signature.json   # check one against the schema
node tools/uiforge-extract.mjs --schema           # print the signature contract
```

A URL or HTML file is rendered and measured. An image emits a skeleton the model
fills by vision, then `--validate` checks it — the same schema either way, so an
image-derived signature is interchangeable with a rendered one. `--config` also
writes `uiforge.config.json`, the project-local ruleset the gate reads.

### `uiforge-source.mjs` — rank the catalog to your signature

```bash
node tools/uiforge-source.mjs "<what you need>" [--spec signature.json]
     [--type ui] [--limit N] [--json]
```

Scores the 294-component catalog by semantic fit (your need against name/tags/type) ×
style fit (each component's radii against your signature) × taste (a11y signals,
Radix provenance, variants, minus raw color), and prints the `npx shadcn add …` for
the top picks — so you install pieces that fit the signature you committed to.

### `uiforge-catalog.mjs` — query the component catalog

```bash
node tools/uiforge-catalog.mjs stats                 # counts, a11y coverage, top radii
node tools/uiforge-catalog.mjs search "dialog" [--type ui] [--limit N]
node tools/uiforge-catalog.mjs show @shadcn/button   # one component's static signature
node tools/uiforge-catalog.mjs near signature.json   # nearest components to a signature
```

### `uiforge-harvest.mjs` — (re)build the catalog

```bash
node tools/uiforge-harvest.mjs
```

Fetches shadcn-compatible registries, parses a static signature per component, and
writes `tools/catalog/catalog.db` (SQLite via built-in `node:sqlite`, zero external
dependencies). Re-runnable; adding a registry is a small config change.

### `uiforge-corpus.mjs` — empirical validation

```bash
node tools/uiforge-corpus.mjs [corpus.json] [--out results.json] [--viewport WxH] [--json]
```

Runs the render audit over a labeled corpus (designed vs template) and reports
whether the grades separate the classes. Failures are recorded, not dropped.

### `uiforge-score.mjs` — an A–F grade

```bash
node tools/uiforge-score.mjs [dir] [--json]
```

Wraps the linter into one coherent 0–100 → A–F scale (a blocker is heavy and caps a
single-blocker page at C; zero tells is A+; an empty scan is N/A, never a fake A+).
The `/uiforge:score` command adds the pull-request and live-URL paths around it.

### `create-uiforge.mjs` — scaffold a wired project

```bash
node tools/create-uiforge.mjs <editorial│precise│brutalist│warm│maximalist> [dir] [--force]
npm run lint:ui
```

Drops the direction's token kit into `src/index.css` (or a side file if one exists),
copies the linter, adds a `lint:ui` npm script, installs a pre-commit hook, and
writes a CI workflow — an existing app wired so slop cannot land, in one command.

## The five directions

Pick one per project. It fixes your tokens, your font, your motion, and which
registries you draw from. Each ships as a ready kit (`tools/kits/`) with a real,
non-default typeface, and each kit passes the linter by construction.

| Direction | Character | Display / mono font | Accent |
|---|---|---|---|
| **Editorial** | magazine, asymmetric, big type | Fraunces / — | rust `#B4472E` |
| **Precise** | Swiss grid meets Linear; calm, exact | Hanken Grotesk / JetBrains Mono | electric blue `#4C8DFF` |
| **Brutalist** | raw, high-contrast, hard shadows | Archivo / Space Mono | flat yellow `#FFE500` |
| **Warm** | soft, human, spring-led | Bricolage Grotesque / JetBrains Mono | terracotta `#E07A5F` |
| **Maximalist** | bold, layered, kinetic, still one signature | Unbounded / — | magenta `#FF2E88` |

None is Inter, Roboto, or system-ui, which alone clears the biggest blocker.

---

# How it works

## The taste compiler

Ask any LLM to "make a nice landing page" and it produces the same page every time:
**Inter** on white, a **purple→blue gradient** hero, a **centered** headline, **three
identical rounded cards**. This is not a prompt problem, it is **distributional
convergence** — on every open choice the model emits the highest-probability token,
and the highest-probability answer *is* the training-data median. The median is slop.

Generic rules ("accent under 10%, one type ratio") are what make a design tool read
like a *junior linter* — a senior breaks those rules on purpose. So the rules do not
come from UIForge. They come from **a reference you choose.**

```
reference / keyword
   │  uiforge-extract      render the reference, measure it
   ▼
signature.json            type ramp, accent and its budget, grid unit, radii, layout
   │  compile
   ▼
uiforge.config.json       the project-local ruleset the gate reads
   │  uiforge-source       rank the 294-component catalog by fit to THIS signature
   ▼
install the top picks     semantic × style(radii) × taste(a11y, radix, variants)
   │  loop
   ▼
render-audit --spec       grade reference-relative until it MATCHES; contrast stays absolute
```

<p align="center"><img src="./docs/pipeline.png?v=3150" alt="The UIForge pipeline on a real run: reference to extracted signature to catalog-ranked component picks to a reference-relative gate (grade A, the eye lands on the headline, 0 contrast fails)" width="100%"></p>
<p align="center"><sub><em>The stages on a real run (<code>docs/examples/good.html</code>): every value is produced by the tools — the signature by <code>uiforge-extract</code>, the picks by <code>uiforge-source</code>, the grade by <code>render-audit --spec</code>, the focal point by <code>uiforge-attention</code>.</em></sub></p>

**Taste is relative; accessibility is not.** The same `slop.html`, graded three ways:

| graded against… | render-audit |
|---|---|
| generic defaults | **F** — accent overexposed, jittery rhythm, 3 identical cards, centered hero, plus contrast |
| an *editorial* reference | **F** — off the reference on every axis, plus contrast |
| **its own purple/maximalist reference** | **D** — every taste tell is gone (that *is* the aesthetic now); only the WCAG contrast failures remain |

A purple, centered, maximalist page is not "slop" when the reference *is* purple
maximalism — those are decisions. But text below WCAG AA is broken no matter whose
taste you bring. That is the line the compiler draws, and it is why this is not just
a loop.

**With a reference, run for real.** Two more briefs, each given a reference the way a
user would. The reference is measured into a `signature.json`, then the build is
graded `--spec` against it. The default deviates (F); the forged version adopts the
reference's accent, grid, type, and posture, and matches it (A).

<p align="center"><img src="./docs/example-brutalist.png?v=3150" alt="Brief: a hero for a monospace font marketplace, guidance brutalist. Reference (brutalist.html) to the LLM default scoring F (45) against it, to the forged version scoring A (94), matching the reference." width="100%"></p>
<p align="center"><img src="./docs/example-precise.png?v=3150" alt="Brief: a status/uptime section, guidance Swiss precision. Reference (precise.html) to the LLM default scoring F (53) against it, to the forged version scoring A (94), matching the reference." width="100%"></p>

## What generic AI-UI tools can't do

| Axis | UIForge | Plain Claude / v0 / Lovable / bolt |
|---|---|---|
| Where the rules come from | **A reference you choose**, measured into a spec; the gate grades against *that* | Fixed generic rules, or none |
| How taste is applied | **Enforced** — a gate exits non-zero and the loop iterates until it passes | Suggested in a prompt, or nothing |
| Grading the *rendered result* | Real WCAG contrast, accent surface-area, rhythm, layout tells — on the pixels | Self-graded from source if at all |
| Hierarchy | A predicted gaze order flags a page that leads the eye nowhere | Not measured |
| Sourcing components | Ranked by fit to your signature over a 294-component catalog | A grab-bag, or hand-authored |
| The bar for "done" | Both gate tiers pass **and** an adversary given the pixels can't prove it's AI | "Looks fine to me" |
| Runs where | Locally, in your Claude Code session; you own the kits, tokens, and rules | A hosted product |

---

# Under the hood

## Slop is a build error

Everything descends from one move: **turn taste into a gate.**

- A markdown skill is *advice*. It sits in context next to the model's prior and,
  under token and time pressure, loses.
- A **linter** is not advice. It scans the source, names the slop, and exits
  non-zero. Wire it into pre-commit and slop cannot land. This is the fast tier.
- A **render audit** goes where grep cannot: it renders the page and measures the
  craft on the *result*. A keyword cannot fake a 2.9:1 contrast ratio away. This is
  the deep tier.
- `/uiforge:forge` makes the model iterate against both gates — build, lint, render
  audit, fix the exact violations, repeat until both pass — then runs an adversarial
  detector on the rendered pixels.

The bar is therefore not "the model tried to be tasteful." It is **"an adversary
handed only the screenshots cannot prove a machine made this."**

## The gate tiers, in detail

**`uiforge-lint` (source).** Dogfooded: it grades its own before/after runs, and a
gap it found (a font hidden in a `const`) was fixed the same day.

**`uiforge-render-audit` (render).** Measures, none of it gameable:

- **WCAG contrast**, per text node against its true composited background (a
  `transparent` gradient headline resolves to 1:1, a real failure grep can't see).
- **Accent surface-area**, from a non-overlapping sample grid — the "under 10%" rule,
  finally enforced. Tinted near-white and near-black neutrals count as neutral.
- **Spacing rhythm** — distinct vertical gaps between siblings, from real geometry.
- **Type-scale coherence** — distinct sizes and whether they follow one modular ratio.
- **AI layout patterns** — N equal-width cards in a row; a dead-centered mega-hero.

The `analyze()` core is pure and browser-free, so `--self-test` is a shipped
regression.

**`uiforge-attention` (hierarchy).** A page can pass every craft check and still lead
the eye nowhere. From the render it predicts a gaze order (a saliency proxy over size,
contrast, position, accent, weight) and checks for one clear focal point. On the slop
fixture the eye lands on the cards at #1–3 and the headline is only #4; `/critique`
reports this **as a directed critique in a voice, citing the numbers**, not as a score.

<p align="center"><img src="./docs/attention-overlay.png?v=3150" alt="Attention overlay — editorial: hierarchy ok, the eye lands on the headline; slop: hierarchy flat, the eye lands on the three cards, the headline is only fourth" width="100%"></p>

## Reference-relative grading

`uiforge-extract` renders a reference and derives its signature; feed it back as
`render-audit --spec signature.json` and grading flips from absolute rules to
deviation from the reference you chose. A maximalist reference licenses a 40%-accent
hero; an editorial one demands an asymmetric layout. **Contrast never bends.** The
same `analyze()` engine both derives the spec from the reference and measures the
target against it, so the diff *is* the grade.

## The catalog

`uiforge-harvest` stores each component in `catalog.db` with a static signature
parsed from source — radii, variant axes, semantic color roles, spacing scale, a11y
signals, motion, Radix provenance. `uiforge-source` ranks those 294 components to your
signature, so sourcing is provenance-first and fit-first rather than a grab-bag.

## Proof, and an honest caveat

`uiforge-corpus` runs the render audit over a **labeled corpus** and reports whether
the grades separate the classes. On the shipped calibration set the separation is
clean — **designed 91.3 vs template 39, a 52-point gap** — and it is reproducible
(`node tools/uiforge-corpus.mjs`), not a quoted statistic.

<p align="center"><img src="./docs/corpus.png?v=3150" alt="Corpus separation: designed pages cluster near 91 out of 100, template pages near 39, a 52-point gap, with an honest caveat about full production homepages" width="100%"></p>

The part most tools would hide: full **production homepages** score lower — Linear
and Stripe grade F. The honest diagnosis (read the findings, don't guess) is *not*
snapshot noise; I shipped snapshot hardening and it didn't move them. It is a **unit
mismatch** — the metric grades a focused view or hero, not a 465-node multi-section
homepage — **plus genuine WCAG failures these sites ship** (Linear renders a 1:1
gradient-text span and 12px muted text at 3.17:1; Stripe a 2.39:1 hero), which the
a11y floor is right to flag. UIForge grades a focused view's craft and strict
accessibility; it is not a "is this site famous" detector. A hypothesis I could
disprove and correct, which is the opposite of manufactured authority.

## The forge cycle, stage by stage

Intent first, components last. Choosing the effect first is how you end up decorating.

| Stage | What it does | Produces |
|---|---|---|
| **1. Thesis** | One sentence: who, what feeling, the one thing remembered | the brief you commit to |
| **2. Direction** | Commit to one point of view, or extract a reference's signature | Editorial, Precise, Brutalist, Warm, or Maximalist |
| **3. Signature** | Emit `tokens.css` and `motion.ts` first, from a kit | a real font, one accent, an 8px scale, a motion signature |
| **4. Source** | Rank the catalog to the signature, then install | real, accessible components with provenance |
| **5. Compose** | One signature moment; everything else quiet; every state designed | the built view |
| **6. Enforce (loop)** | Lint, then render audit, then attention; fix; repeat until all pass | a build that clears every gate tier |
| **7. Subtract** | Remove the single least-justified thing | the accessory taken off before shipping |

## Design convictions

- **Enforce, don't advise.** Taste that isn't a gate loses to the model's prior.
- **Subtraction is the craft.** One signature moment; remove one thing before you ship.
- **Reduced-motion is the design, not a checkbox.** The static frame must be great on
  its own.
- **Provenance over invention.** Install real components; verify props.
- **Style is consistent constraint.** Commit to one direction and it collapses a
  thousand decisions into a recognizable whole.
- **The bar is adversarial.** Not "looks fine," but "you can't prove a machine made it."

---

## FAQ

**Does it work outside React and Tailwind?** The skills' judgment is
framework-agnostic; the kits, the shadcn MCP, and Motion-Primitives assume React,
Tailwind, and Motion. The render audit works on any rendered page.

**Do I need the shadcn registry or a network?** No. `/uiforge:setup` wires it if you
want MCP installs, but you can compose directly. The Motion-Primitives endpoint sits
behind a bot-checkpoint, so CI fetches may return 429; interactive installs work.

**Is the linter too strict?** By default only blockers fail; warnings are advisory.
`--strict` is zero-tolerance, `--max-score N` tunes it. It is opinionated on purpose.

**Isn't it just a loop enforcing generic rules?** Only if you give it no reference.
Point `uiforge-extract` at a site or image whose feel you want, and the rules become
*that reference's* measured signature. A maximalist reference passes maximalist work;
an editorial one fails it. You supply the taste; UIForge supplies tireless measurement
and scale. The one thing it will not relativize is accessibility — WCAG contrast is an
absolute floor no reference can license away.

**Does it replace my design system?** No. It layers decisions on top of good
fundamentals and real content; it won't rescue a page with nothing to say.

## Repository layout

```
UIForge/
├── README.md · README.ko.md · LICENSE
├── docs/                            # proof images + reproducible before/after fixtures
├── .claude-plugin/                  # plugin.json + self-install marketplace.json
├── .mcp.json                        # official shadcn MCP (component provenance)
├── commands/                        # forge · reskin · setup · critique · score
├── skills/                          # design-director · design-tokens · motion · content
└── tools/                           # the 10 command-line tools + kits + the catalog
    ├── uiforge-lint.mjs             # the fast gate (source)
    ├── uiforge-render-audit.mjs     # the deep gate (render) — WCAG, accent, rhythm, layout, --spec
    ├── uiforge-attention.mjs        # gaze order + hierarchy, --overlay
    ├── uiforge-extract.mjs          # a reference → signature.json (URL, HTML, or image)
    ├── uiforge-source.mjs           # rank the catalog to a signature
    ├── uiforge-catalog.mjs          # query the catalog — stats · search · show · near
    ├── uiforge-harvest.mjs          # (re)build catalog.db
    ├── uiforge-corpus.mjs           # empirical validation on a labeled corpus
    ├── uiforge-score.mjs            # A–F grade wrapper
    ├── create-uiforge.mjs           # scaffold a wired project
    ├── tokens.template.css · kits/  # the token vocabulary + five ready kits
    └── catalog/                     # the asset DB — catalog.db (294 components) + manifest
```

## Attribution & canon

Built on and calibrated against **[Motion-Primitives](https://motion-primitives.com)**
(@ibelick), **[Motion](https://motion.dev)**, and **[shadcn](https://ui.shadcn.com)**
(registry and MCP). The taste it encodes draws on **Refactoring UI**, **Practical
Typography** (Butterick), **Laws of UX**, **Material / Radix / Tailwind** tokens, the
motion craft of **Emil Kowalski** and **Rauno Freiberg**, and **Anthropic's**
frontend-design guidance on distributional convergence. Fonts are free (Fontsource
and Google Fonts).

## License

[MIT](./LICENSE) — the plugin, skills, commands, and tools. Not the third-party
libraries it installs or the fonts it downloads.
