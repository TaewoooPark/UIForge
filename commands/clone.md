---
description: Clone a website three ways — a working behavior ARCHIVE (its real code + data replayed offline; tabs, filters, lists, transitions all work), an editable React REBUILD (clean components + your content), or a pixel-faithful FREEZE. Archive is the flagship: it reproduces how the site actually behaves, not just how it looks.
argument-hint: "<url│file.html> [--archive] [--react] [--content path.md] [--explore] [--headed] [--profile dir]"
---

Clone the reference in **$ARGUMENTS**. Pick the mode from the flags and the user's words:

- **`--archive`**, or the user asks for a copy that **works / behaves / is interactive** (tabs, filters, lists, click-to-swap, "동작까지", "실제로 작동") → **Archive** (§A, the flagship).
- **`--react`**, or the user wants **editable / componentized / their content** → **Rebuild** (§B).
- otherwise, or **`--freeze`** → **Freeze** (§C).

Let `ROOT` = `${CLAUDE_PLUGIN_ROOT}`. Before any `node` command, set `export NODE_PATH="$(npm root -g)"` so Playwright resolves. Work in a fresh output dir. `--headed`/`--profile <dir>` pass through to reach a site behind Cloudflare or a login (a persistent `--profile` reuses the clearance/session). `file://` inputs work too.

---

## §A · Archive — the complete BEHAVIOR clone  ⭐ (the flagship)

This is the only mode that reproduces **behavior**, because it keeps the site's **own code** and replays the **data it actually fetched**. Click a tab and content swaps; filter a list and it updates; scroll and it lazy-loads — the real JavaScript runs against cached responses. Use this whenever the user wants the clone to *work*, not just look right.

```bash
node $ROOT/tools/uiforge-archive.mjs <ref> --out-dir ./clone-archive --explore
```

- **Always pass `--explore`** unless told not to — it clicks in-page controls (tabs, `[aria-controls]`, "load/show/more/next", pagination) and scrolls during capture, so the data those interactions fetch gets recorded. Without it, only what loaded on first paint is cached.
- It writes a folder + a zero-dependency **replay server**. Start it and open the printed URL:

```bash
node ./clone-archive/serve.mjs      # → http://localhost:8787
```

- **Verify it behaves** (don't just claim it): open the replayed URL, confirm the framework boots with no page errors, then exercise one real interaction (click a tab / nav item / "load more") and confirm the content changes without a full reload. Report what worked.
- **Honest limit to state**: a *server*-dependent action (search hitting an API, a fetch triggered by input you didn't type) only replays if its response was recorded — widen coverage by interacting more under `--explore`. A request never made during capture has nothing to replay.

---

## §B · Rebuild — clean, editable React + Tailwind (with your content)

A componentized Vite + React + Tailwind v4 project you can edit and ship — **new** code generated from the *rendered* result, not the site's minified bundles.

```bash
node $ROOT/tools/uiforge-freeze.mjs   <ref> --out ./clone/freeze.html          # the fidelity oracle
node $ROOT/tools/uiforge-capture.mjs  <ref> --out ./clone/capture.json [--sample-motion] [--responsive]
node $ROOT/tools/uiforge-theme.mjs    ./clone/capture.json --out-css ./clone/theme.css --out-json ./clone/theme.json
node $ROOT/tools/uiforge-export.mjs   ./clone/capture.json --out-dir ./clone/app --theme-json ./clone/theme.json --assets
```

- The export is componentized by default (sections + repeated blocks → components, styles → Tailwind classes, content → `content.ts`); `--assets` makes it self-contained.
- **Gate on the freeze, not the live site**: `node $ROOT/tools/uiforge-diff.mjs ./clone/freeze.html <the built clone> --segments ./clone/segment.json` — read the **per-section** scores and fix the worst sections. Offline + deterministic.
- If `--content <md>` is given, replace the reference's copy/images with the user's, keeping components, tokens, and layout. Drop sections with no matching content; reuse the nearest component for extra content.
- For a **whole site** (many pages), use `node $ROOT/tools/uiforge-site.mjs <start-url> --out-dir ./clone-site --max 6 --assets` → one React-Router project.

---

## §C · Freeze — a pixel-faithful still (and the oracle)

```bash
node $ROOT/tools/uiforge-freeze.mjs <ref> --out ./clone/freeze.html --inline --shot ./clone/ref.png
```

- Keeps the site's **real CSS/fonts/assets**, strips scripts, freezes time at the snapshot instant → renders identical to the live site, deterministically. `--inline` embeds every asset as a data URI (one offline file); `--shot` saves the live screenshot at that same frozen instant (the aligned proof pair).
- This is the exact, offline still, and the baseline the Rebuild is diffed against.

---

## QA & ethics (all modes)

- Rebuild only: `node $ROOT/tools/uiforge-render-audit.mjs <the clone>` — the copy should **pass WCAG** even where the original didn't (same look, better contrast). Report the final per-section similarity, what content you swapped, and any fidelity gaps.
- This produces a **design reproduction / behavior archive** for study, redesign, or building on — with the user's content and substituted brand assets. Do not deploy it under the original's brand (passing off), do not lift its copyrighted images/copy into a shipped product, and never build a credential/login clone. Fonts follow their license.
