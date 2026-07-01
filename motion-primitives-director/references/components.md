# Components — by intent, not by catalog

This is the one reference with encyclopedic detail. **Read only the entries you
need** after you've already chosen your signature moment (step 5). Do not browse
it for ideas — that inverts the process and breeds slop.

Every entry is organized as **intent → component → verified physics → role**.
Props and defaults below were read from the component source
(`components/core/<slug>.tsx`) and docs, verified July 2026 against a beta
library — re-check `public/c/<slug>.json` if a prop looks off.

**Install any component** with:
`npx motion-primitives@latest add <slug>` — or —
`npx shadcn@latest add "https://motion-primitives.com/c/<slug>.json"`.
All 33 depend on `motion`; extra deps are noted per entry.

### Role legend

- **`signature`** — earns the one big moment per view. At most one, and only if
  it serves the thesis.
- **`micro`** — functional feedback for a state change; sub-200ms; you may have
  two or three.
- **`ambient`** — background/continuous. Almost always the first thing to cut.
  An ambient effect is justified *only* when it encodes a real, ongoing state.

### Contents

- [A. Reveal content on load / scroll](#a-reveal-content-on-load--scroll)
- [B. Announce a changing value](#b-announce-a-changing-value)
- [C. Swap between states / tabs / panels](#c-swap-between-states--tabs--panels)
- [D. Expand one element into a focused view](#d-expand-one-element-into-a-focused-view)
- [E. Pointer feedback (physical)](#e-pointer-feedback-physical)
- [F. Signal an ongoing / active / loading state](#f-signal-an-ongoing--active--loading-state)
- [G. Ambient atmosphere / depth](#g-ambient-atmosphere--depth)
- [H. Scroll feedback](#h-scroll-feedback)
- [I. Compare (before / after)](#i-compare-before--after)

---

## A. Reveal content on load / scroll

### `text-effect` — role: **signature**
Use for the hero headline or one paragraph revealing on mount. Key props:
`per: 'word' | 'char' | 'line'`, `preset: 'fade' | 'blur' | 'fade-in-blur' |
'scale' | 'slide'` (source enum uses `'blur'`, not the docs' `'blur-sm'`),
`delay`, `speedReveal` (divides stagger), `speedSegment` (divides per-segment
duration), `trigger`, and `containerTransition` / `segmentTransition` — **pass
your signature here**, because the item default is `{ duration: 0.3 }` with *no
easing*. Default staggers: char 0.03 / word 0.05 / line 0.1s.
**Misuse:** `per: 'char'` on a paragraph (one motion node per character — slow
and heavy); typing/blur effects with no reason. Prefer `per: 'line'` or
`'word'`, once.

### `text-roll` — role: **signature** (kinetic only)
Use for a playful character-by-character flip on a *short* headline. Key props:
`duration: 0.5`, `getEnterDelay: (i) => i * 0.1` (100ms/char — coarse),
`getExitDelay`, `transition: { ease: 'easeIn' }`, `variants` (rotateX 0→90).
**Misuse:** long strings — 10 characters is ~1s of stagger. `precise` and
`editorial` directions should skip this entirely.

### `animated-group` — role: **micro** (occasionally signature)
Use to stagger a small list/grid in on mount. Key props: `preset`
(`fade | slide | scale | blur | blur-slide | zoom | flip | bounce | rotate |
swing`) and `variants: { container, item }`. The container's `staggerChildren`
is **hardcoded to 0.1** — to hit the 20–60ms budget you must override
`variants.container`. Presets `bounce`, `swing`, `zoom` embed springy overshoot
— ban them in `precise`/`editorial`.
**Misuse:** expecting it to fire on scroll — it animates on **mount** unless you
nest it inside `InView`.

### `in-view` — role: **micro**
Use to fire a reveal when a section scrolls into view. Key props: `variants`
(default is **opacity only** — add your own y-offset/blur), `transition` (none
by default — pass your signature), `once` (top-level), and `viewOptions:
{ once, margin, amount }` (passed straight to Motion's `useInView`).
**`once` defaults falsy → it re-animates every single time the section
re-enters the viewport.** That repeated fade is textbook slop — **always set
`once`** (either the top-level prop or `viewOptions.once`), and use `margin` to
trigger just before fully visible.

---

## B. Announce a changing value

### `animated-number` — role: **micro**
Use for a single stat/counter settling to a new value. Key props: `value`,
`springOptions` (**no default** → generic Motion spring; pass your signature
spring so it matches everything else), `as`. Rounds to an integer.

### `sliding-number` — role: **micro**
Use for clocks, live metrics, odometer-style digits. Key props: `value`,
`padStart`, `decimalSeparator`. The spring is **hardcoded**
`{ stiffness: 280, damping: 18, mass: 0.3 }` and *not* exposed as a prop — if it
clashes with your direction, that's a fixed constraint (or edit the source).
Dep: `react-use-measure`.

### `text-loop` — role: **micro / ambient**
Use to rotate a few meaningful words in a headline. Key props: `interval: 2`
(seconds), `transition: { duration: 0.3 }` (must be shorter than the interval),
`variants` (default y-slide + fade), `trigger`. **Loops forever** while
`trigger` is true.
**Misuse:** cycling marketing adjectives forever. Keep the set short and true.

### `text-morph` — role: **micro**
Use for a label that changes in place (Copy → Copied). Key props: `transition`
(default spring `{ stiffness: 280, damping: 18, mass: 0.3 }`), `variants`.
Morphs per-character via shared `layoutId`. Great honest micro-interaction.

---

## C. Swap between states / tabs / panels

### `transition-panel` — role: **micro**
Use for tabs, onboarding steps, settings panes. Key props: `activeIndex`,
`variants: { enter, center, exit }`, `transition`. **Ships neither variants nor
transition** — with nothing passed, panels hard-cut with no animation. You
**must** supply both; derive them from your signature. `mode: 'popLayout'`.

### `animated-background` — role: **micro**
Use for a highlight sliding behind the active tab / menu item. Key props:
`defaultValue` (initial active `data-id`), `enableHover` (default false),
`transition` (none by default → the shared-layout slide falls back to Motion's
loose layout spring; pass your signature). Every child needs a unique `data-id`.

### `accordion` — role: **micro**
Use for FAQ-style single-open sections. Key props: `transition` (none by default
— **set an explicit duration/ease** or the height animation feels slow and
loose), `variants`, `expandedValue` / `onValueChange`. Animates height auto↔0 +
opacity. The trigger icon rotation is CSS (`group-data-[expanded]`), not motion.

### `disclosure` — role: **micro**
Use for one show/hide region (reveal details on a card). Key props: `open`,
`transition` (none by default), `variants`. Reads only the first two children
(trigger, content); extras are ignored.

### `carousel` — role: **micro / signature**
Use for a draggable/swipeable slider with arrows and dots. Key props:
`transition` (default soft spring `{ damping: 18, stiffness: 90, duration: 0.2 }`
— on-brand for `soft`, override for `precise`), `initialIndex` / `index` /
`onIndexChange`, `disableDrag`. Dep: `lucide-react`. Drag commits at a **10px**
threshold — very sensitive; test on touch.

---

## D. Expand one element into a focused view

### `dialog` — role: **micro**
Use for a standard modal. Key props: `variants` (default `scale 0.9→1` + fade),
`transition` (default `{ ease: 'easeOut', duration: 0.2 }` — one of the few
components that ships tasteful defaults), `open` / `defaultOpen` /
`onOpenChange`. Backdrop blur is baked in. Dep: `lucide-react` (close icon).

### `morphing-dialog` — role: **signature**
Use when a card/thumbnail should **morph** into a full detail modal (no hard
cut). Key props: `transition` (**none by default** → pass a spring/ease via its
`MotionConfig`). Trigger and content share `layoutId = dialog-${id}`, so both
must mount. Deps: `react-dom`, `lucide-react`. A strong single signature moment.

### `morphing-popover` — role: **micro / signature**
Use for an inline control expanding into a small form/menu (e.g. an "add note"
button becoming a textarea). Key props: `transition` (default
`{ type: 'spring', bounce: 0.1, duration: 0.4 }` — good, on-brand for `soft`),
`variants`, `open` / `defaultOpen` / `onOpenChange`. Shares `layoutId`.

### `toolbar-dynamic` — role: **micro**
A collapse→expand action bar that animates **width** (icons → wider with e.g. a
search field). **This is a demo, not a parameterized component** — it takes no
props; the transition `{ type: 'spring', bounce: 0.1, duration: 0.2 }` is a
literal inside the file. Copy it and edit. Deps: `lucide-react`, local
`useClickOutside` hook.

### `toolbar-expandable` — role: **micro**
An icon dock whose panel grows **vertically** to reveal the selected tool. Also
a **demo, no props**; transition literal `{ type: 'spring', bounce: 0.1,
duration: 0.25 }`. Deps: `react-use-measure`, `lucide-react`, local
`useClickOutside`.

---

## E. Pointer feedback (physical)

### `magnetic` — role: **micro**
Use on **one** hero CTA you want to feel grabby. Key props: `intensity: 0.6`,
`range: 100` (px), `actionArea: 'self' | 'parent' | 'global'`, `springOptions`
(default is very loose: `{ stiffness: 26.7, damping: 4.1, mass: 0.2 }` — tighten
toward your signature for `precise`/`soft`). `actionArea: 'global'` makes it
always-on ambient — avoid.
**Misuse:** magnetic on every button. Pick one.

### `tilt` — role: **micro / signature**
Use for depth on **one** feature card or image on hover. Key props:
`rotationFactor: 15` (dial down to 6–10 for restraint), `isRevese` (sic —
boolean), `springOptions` (**none by default** → generic Motion spring; set it).
**Misuse:** tilt on every card is a headline AI tell. One, or none.

### `dock` — role: **micro / signature**
Use for a compact macOS-style icon dock/toolbar. Key props: `spring`
`{ mass: 0.1, stiffness: 150, damping: 12 }`, `magnification: 80`,
`distance: 150`, `panelHeight: 64`. Magnifies with cursor proximity while
hovered. A fine signature for a playful nav; overkill for a plain toolbar.

### `cursor` — role: **ambient**
Use for a branded global custom cursor, or a region-scoped pointer. Key props:
`springConfig` (default `{ duration: 0 }` = instant follow; add a spring to
smooth), `transition`, `variants`, `attachToParent` (default false; true =
scoped to a region). By default it **hides the native cursor globally**. Use it
once, site-wide, or not at all — never in two places.

---

## F. Signal an ongoing / active / loading state

### `border-trail` — role: **ambient / micro**
Use to signal loading / active / processing on a card, input, or button. Key
props: `size: 60`, `transition` (default `{ repeat: Infinity, duration: 5,
ease: 'linear' }` — **loops forever**). Justified **only** when it encodes a
real ongoing state; otherwise it's decoration. Speed it up (duration ~1.5–2s)
when it means "working."

### `text-shimmer` — role: **ambient**
Use for a subtle loading/attention shimmer on **short** text. Key props:
`duration: 2`, `spread: 2` (× text length). **Loops forever**, linear.
**Misuse:** shimmering a static heading that isn't loading anything.

### `text-scramble` — role: **signature**
Use for a one-shot **decode** reveal on a short label (fires on `trigger`, then
rests). Key props: `duration: 0.8`, `speed: 0.04` (tick seconds), `characterSet`,
`trigger`. Not spring-based (JS interval).
**Misuse:** scrambling a paragraph, or re-scrambling on loop.

### `glow-effect` — role: **ambient**
Use for a *deliberate* glowing button/card background. Key props: `mode:
'rotate' | 'pulse' | 'breathe' | 'colorShift' | 'flowHorizontal' | 'static'`
(default `rotate`), `duration: 5`, `blur: 'medium'`, `scale: 1`, and `colors`
(**default is a saturated rainbow**). Loops except in `static`.
**Misuse:** the default rainbow + `colorShift` on every card is peak slop.
Prefer `mode: 'static'` or one constrained brand color.

---

## G. Ambient atmosphere / depth

### `spotlight` — role: **ambient / micro**
Use to light up one card/border following the cursor on hover. Key props:
`size: 200`, `springOptions` (default `{ bounce: 0 }`). Hover-gated (fades in on
hover). Fine on a single surface; not on a grid of them.

### `progressive-blur` — role: **ambient (static)**
Use for a directional fade-to-blur at a scroll edge or over a caption — it is a
**structural mask, not a moving animation**. Key props: `direction` (**source
default `'bottom'`**; the docs table says `'top'` — trust the source),
`blurLayers: 8`, `blurIntensity: 0.25`. No motion of its own. One of the safest,
most "designed" primitives precisely because it doesn't move.

### `infinite-slider` — role: **ambient**
Use for a genuine logo/press strip. Key props: `speed: 100` (px/s), `gap: 16`,
`speedOnHover`, `direction`, `reverse`. **Loops forever (a marquee)** and renders
its children **twice** in the DOM.
**Misuse:** a marquee nobody asked for. **Banned in `editorial`.** No
reduced-motion guard in source — you must add one.

### `spinning-text` — role: **ambient**
Use for a decorative circular/badge label. Key props: `duration: 10` (s per
turn), `reverse`, `radius: 5`, `fontSize: 1`. **Loops forever**, purely
decorative — `kinetic` direction only, and only as *the* signature.

### `text-shimmer-wave` — role: **ambient**
Use for a livelier shimmer than `text-shimmer`, on a **short** label. Key props:
`duration: 1`, `spread: 1`, `zDistance: 10`, `xDistance: 2`, `yDistance: -2`,
`scaleDistance: 1.1`, `rotateYDistance: 10`. **Loops forever**; one motion node
per character (heavy on long text).

---

## H. Scroll feedback

### `scroll-progress` — role: **micro**
Use for a top-of-page reading-progress bar. Key props: `springOptions` (default
`{ stiffness: 200, damping: 50, restDelta: 0.001 }` — tight and tasteful),
`containerRef` (scope to a scrollable container). Renders a **bare** `h-1` bar —
you supply its color and fixed positioning via `className`.

(For scroll-triggered section reveals, see [`in-view`](#in-view--role-micro);
for a fade-to-blur scroll edge, see
[`progressive-blur`](#progressive-blur--role-ambient-static).)

---

## I. Compare (before / after)

### `image-comparison` — role: **signature**
Use for a before/after reveal. Key props: `springOptions` (default
`{ bounce: 0, duration: 0 }` = **instant snap** to the pointer — pass a real
spring like your signature to smooth it), `enableHover` (default false → drag).
Slider starts at 50%. A strong, honest interactive centerpiece.
