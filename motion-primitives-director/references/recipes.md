# Recipes — verified orchestrations

This is where components become choreography. Each recipe is a **placement**, not
a component: what moves, in what order, on what clock, and — critically — what
stays still. Every recipe demonstrates the budget: **one signature moment, two
or three micro-interactions, everything else static**, plus a reduced-motion
path that is the design's baseline, not an afterthought.

All timings reference the `motion.ts` tokens from
[`directions.md`](directions.md) (`ease.out`, `duration.*`, `spring.default`,
`stagger`). Numbers shown assume the `precise/mechanical` scale for
micro-interactions and functional entrances; the **single signature beat per
view may run longer** (up to ~700ms) — the one sanctioned exception to the
200–400ms entrance cap. Scale the *character* to your direction, but keep the
*counts and order*.

Wrap the whole app once so reduced-motion is real everywhere:

```tsx
import { MotionConfig } from 'motion/react'
// reducedMotion="user" makes every Motion transition collapse to instant when
// the OS setting is on. Your job is to make the instant state look complete.
<MotionConfig reducedMotion="user">{children}</MotionConfig>
```

### Contents

- [1. Hero load sequence](#1-hero-load-sequence)
- [2. Navigation / header](#2-navigation--header)
- [3. Scroll-in section](#3-scroll-in-section)
- [4. Pricing / feature reveal](#4-pricing--feature-reveal)
- [5. Empty state + loading → done](#5-empty-state--loading--done)

---

## 1. Hero load sequence

**Purpose.** The one orchestrated entrance the whole page gets.
**Motion thesis.** *"The moment the page loads, the user feels this product is
fast and sure of itself, and their eye lands on the headline."*
**Signature (1):** the headline reveal. **Micro (≤2):** CTA press feedback;
optional magnetic pull on the single primary CTA. **Static:** nav, everything
below the fold.

**Stack:** `text-effect` (headline) + a plain staggered container for
subhead/CTA. Do **not** reach for a second text effect.

**Sequence & timing:**

| t (ms) | element | how |
|---|---|---|
| 0 | nav, logo | present, static — no entrance |
| 0–~360 | headline | `text-effect` `per:'line'`, `preset:'fade'`, `segmentTransition={{ duration: duration.slow, ease: ease.out }}` (the signature beat — bump toward ~0.5–0.6 in `soft`/`editorial`), container `staggerChildren: 0.06`, `delay: 0` |
| ~260 | subhead | fade + `y: 8 → 0`, `duration.base`, starts as the headline's last line settles |
| ~360 | primary CTA | fade, `duration.base`; then `magnetic` becomes live |

Nothing important sits behind a delay > 600ms. The headline is first, because it
is the point.

```tsx
<TextEffect as="h1" per="line" preset="fade"
  segmentTransition={{ duration: duration.slow, ease: ease.out }}
  // container stagger set via variants override if you need <100ms
>{headline}</TextEffect>
```

**Reduced-motion.** With `MotionConfig reducedMotion="user"`, `text-effect`
renders the text at full opacity with no per-line movement, and the subhead/CTA
appear immediately. The hero is fully legible at frame one. That is the design —
verify it looks intentional, not unfinished.

**Common failures.** `per:'char'` (one node per character — slow, and it reads
as a typewriter toy); staggering the nav and footer in too; headline arriving
after a 900ms delay; a background `glow-effect` competing with the headline for
the eye.

---

## 2. Navigation / header

**Purpose.** Orientation furniture. **Chrome does not move.**
**Motion thesis.** *"Nav tells you where you are and otherwise disappears."*
**Signature (0):** none — chrome never holds the signature. **Micro (≤2):**
active-link highlight; mobile menu open/close.

**Stack:** `animated-background` (active link highlight) + `disclosure` (mobile
menu). No entrance animation on the bar itself.

**Sequence & timing:**

- Active highlight slides between links via `animated-background` with
  `transition={{ duration: duration.fast, ease: ease.out }}` (~120–180ms). Each
  link needs a unique `data-id`.
- Mobile menu: `disclosure` with `transition={{ duration: 0.2, ease: ease.out }}`
  — open ~200ms, and let it close faster (~150ms) if you split the transitions.

**Reduced-motion.** The highlight moves via shared layout; under reduced-motion
it jumps instantly to the active link (fine — position is information). The menu
appears/disappears without the height tween. Both states stay fully usable.

**Common failures.** Animating the header in on page load; a `glow-effect` or
`border-trail` on the logo; a sticky header that re-animates its height on every
scroll tick; `text-shimmer` on the brand name.

---

## 3. Scroll-in section

**Purpose.** Confirm there's more as the user scrolls, without begging.
**Motion thesis.** *"Each section settles once as it arrives, then holds
still."*
**Signature per section (1):** the single settle-in. **Static:** everything
after the first reveal.

**Stack:** `in-view` around the section; `animated-group` inside *only* if it's
a row of peers (cards/logos) that benefit from a short stagger.

**Sequence & timing:**

```tsx
<InView
  // this settle is the section's one signature beat (the entrance exception);
  // ~0.5 reads well, precise can go ~0.3, editorial up to ~0.7
  variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
  transition={{ duration: 0.5, ease: ease.out }}
  viewOptions={{ once: true, margin: '0px 0px -15% 0px' }}
>
  {/* one reveal for the whole block */}
</InView>
```

- `y: 12`, not 40 — a settle, not a slide-show entrance.
- `once: true` is mandatory. `margin: '-15%'` fires it just before the block is
  fully visible.
- For a card row: `animated-group` with a `variants.container` override to
  `staggerChildren: 0.05` (its baked-in default is a too-slow 0.1). No `bounce`
  preset.

**Reduced-motion.** Drop the `y` offset — reveal is opacity-only, or content is
simply present. Never leave a reduced-motion user staring at `opacity: 0`
content that never triggers.

**Common failures.** Forgetting `once` → every section re-fades each time it
re-enters (the #1 scroll tell); `y` of 40–80px so the whole page lurches; fading
up the section title *and* every paragraph *and* every bullet individually
instead of one block reveal.

---

## 4. Pricing / feature reveal

**Purpose.** Present tiers so the recommended one wins the eye.
**Motion thesis.** *"The recommended plan is the answer — the eye goes there
first."*
**Signature (1):** the featured card's arrival (a touch later + a `0.98 → 1`
scale). **Micro (≤2):** the monthly/annual toggle; the price value updating.
**Static:** feature bullets, card chrome.

**Stack:** `in-view` + `animated-group` for the cards; `animated-background`
(monthly/annual toggle); `animated-number` for the price **only because the
value actually changes** on toggle.

**Sequence & timing:**

- Cards reveal together via `animated-group`, `staggerChildren: 0.05`, entrance
  `opacity 0→1`, `y: 12→0`, `duration.base`. Order left-to-right.
- The featured card additionally scales `0.98 → 1` over `duration.slow` — the
  one extra beat that makes it the hero. It does **not** get a glow.
- Toggle: `animated-background` highlight, `duration.fast`. On switch, the price
  updates with `animated-number` (`springOptions: spring.default`) — a genuine
  value change, so the motion is diegetic.

**Reduced-motion.** Cards present, no stagger/scale. The toggle still swaps the
number instantly (correct value shown). No emphasis motion needed — the featured
card earns its weight from layout/color, which is how it should work anyway.

**Common failures.** A purple `glow-effect` on every card; `tilt` on hover for
each card; every feature bullet fading up; `animated-number` counting the price
up **on load** (there's no value change — it's decoration; only animate on an
actual toggle); `bounce` preset making the cards overshoot.

---

## 5. Empty state + loading → done

**Purpose.** Make "nothing here yet" feel intentional, and resolve honestly when
work finishes.
**Motion thesis.** *"Empty is an invitation; completion is a clean handoff, not
a celebration."*
**Signature (1):** the loading→content resolution. **Micro (≤2):** the primary
"create/import" affordance; the ongoing-work indicator. **Static:** the empty
illustration.

**Stack:** `border-trail` **or** `text-shimmer` (ongoing-work signal — ambient
is justified here because a real process is running) → `transition-panel` (or an
`AnimatePresence` swap) from loading to content → `animated-number` if a count
appears.

**Sequence & timing:**

1. **Empty:** illustration + copy are static. The primary CTA may carry one
   micro (e.g. `magnetic`, tuned tight). No looping decoration on the
   illustration.
2. **Loading:** show work honestly — `border-trail` with `transition={{ repeat:
   Infinity, duration: 1.5, ease: 'linear' }}` around the active region, or
   `text-shimmer` on a "Loading…" label. This loop is allowed **only while the
   process runs.**
3. **Done:** exit the loading state fast (~150ms), then reveal content with
   `transition-panel` (`duration.base`, `staggerChildren: 0.04` if it's a list).
   Any resulting count animates in with `animated-number`.

**Reduced-motion.** Replace the looping trail/shimmer with a static "Loading…"
label (or a non-animated progress indicator), then show content with no
transition. The user still gets honest state feedback — just without motion.

**Common failures.** A spinner/`border-trail` that keeps looping *after* the
data has loaded (the loop must stop when the state resolves, or it's lying);
**confetti** on success; `text-shimmer` on the empty illustration forever;
`glow-effect` pulsing on the empty state to "liven it up" — that's decorating a
weak layout instead of fixing it.

---

## The rule every recipe shares

Count the moving things after you build. If it's more than **one signature +
two-or-three micro** for the view, you have not finished — you have overshot.
Go to [`critique.md`](critique.md) and subtract.
