---
description: Clone a website — a working behavior ARCHIVE (real code + data replayed offline; tabs, filters, transitions work), a pixel-identical editable RESTORE (real source recovered from source maps when shipped, else the real DOM componentized into React with classes kept byte-exact — verified by pixel-diff), or a pixel-faithful FREEZE. All from the archive, offline.
argument-hint: "<url│file.html> [--archive] [--restore] [--content path.md] [--explore] [--headed] [--profile dir]"
---

Clone the reference in **$ARGUMENTS**. Pick the mode from the flags and the user's words:

- **`--archive`**, or the user asks for a copy that **works / behaves / is interactive** (tabs, filters, lists, click-to-swap, "동작까지", "실제로 작동") → **Archive** (§A, the flagship).
- **`--restore`** / **`--react`**, or the user wants **editable / componentized source / their content** → **Restore** (§B) — pixel-identical editable source *from the archive*.
- otherwise, or **`--freeze`** → **Freeze** (§C).

Archive first (§A) whenever a Restore is wanted — the Restore consumes the archive, it never re-visits the live site.

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

- **It's a browsable, editable mirror, not a blob dump.** Every response lands under `files/` at a real path mirroring its URL, with a real extension (`.html`/`.js`/`.css`/`.json`/fonts/images) — open it, read it, and **edit any text response**; the server reads files fresh per request, so changes show up on reload. `index.json` maps each request → its file. (To *develop* a clean copy — React + Tailwind with **your** content — use **Rebuild** `--react` (§B); the Archive is for **behavior**, the Rebuild for **editing**.)
- **Verify it behaves** (don't just claim it): open the replayed URL, confirm the framework boots with no page errors, then exercise one real interaction (click a tab / nav item / "load more") and confirm the content changes without a full reload. Report what worked.
- **Honest limit to state**: a *server*-dependent action (search hitting an API, a fetch triggered by input you didn't type) only replays if its response was recorded — widen coverage by interacting more under `--explore`. A request never made during capture has nothing to replay.

---

## §B · Restore — archive → editable source, pixel-identical (tiered)  ⭐

Turn the **archive** (never the live site) into editable source that renders **pixel-identical to the original** — by *preservation*, not reconstruction. Best-fidelity tier first, always proven by a pixel gate. (This replaces the old lossy "re-derive styles from computed values" rebuild, which drifted.)

```bash
# 0 · detect the stack from the archive (drives output idiom + which tier applies)
node $ROOT/tools/uiforge-detect.mjs    ./clone-archive

# TIER A · real ORIGINAL source — when the site shipped or leaked source maps (highest fidelity)
node $ROOT/tools/uiforge-sourcemap.mjs ./clone-archive --out-dir ./restore/src-recovered

# TIER B · always works — pixel-identical editable React from the real rendered DOM
node $ROOT/tools/uiforge-restore.mjs   ./clone-archive --out-dir ./restore

# GATE · prove it, don't hope it
node $ROOT/tools/uiforge-visualgate.mjs --a ./restore --b ./clone/ref.png
```

- **Try Tier A first.** If `uiforge-sourcemap` recovers app files, you have the site's **real components** — original names, comments, types, `src/` paths (it even recovers the exact `MobileMenu.tsx` a static render can't reproduce). Many sites strip maps; it says so and you fall back to Tier B. ⚠ recovered proprietary source is for study/redesign, not wholesale re-publishing.
- **Tier B always yields a buildable, pixel-identical project**: `cd ./restore && npm install && npm run dev`. It loads the archive's real DOM, keeps every class **byte-exact**, and ships the site's **real compiled CSS + real assets** — so fidelity is the *default*, not a target chased with an LLM. It self-completes assets the archive lazily skipped; `--no-fetch` stays fully offline.
- **Always gate.** Read the mismatch %: static / marketing / docs sites (e.g. shadcn) hit **~0% — pixel-identical**; a WebGL canvas hero or JS-state-driven UI has honest limits — and those are exactly the components Tier A recovers as source. The worst-region bbox tells you where to look.
- **`--content <md>`**: after Tier B, swap the reference's copy/images for the user's, keeping structure, classes, and assets.
- **Tier C — reference only** (no maps, but you need to read the site's logic): `node $ROOT/tools/uiforge-debundle.mjs ./clone-archive --out-dir ./reference` → readable, **not** faithful (names/types erased). Real source is Tier A; behavior is the Archive.

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
