# Motion Directions

Four opinionated motion personalities. **Pick exactly one per project and commit
to it.** The direction decides your `motion.ts` values, which primitives are in
play, and — just as importantly — which are banned. Mixing directions is the
fastest way to look like three people fought over the file.

Choosing:

- **Developer tools, dashboards, B2B SaaS, anything that must feel trustworthy
  and fast** → `precise/mechanical`.
- **Consumer apps, warm/human brands, touch-first product** → `soft/organic`.
- **Content, portfolios, launch pages, "make it feel premium and quiet"** →
  `editorial/restrained`.
- **Playful brands, creative tools, campaign microsites** → `kinetic/expressive`.

Every direction below still obeys the budget: **one signature motion per view.**
Direction changes the *character* of motion, never the *quantity*.

---

## 1. `precise / mechanical` — the Linear feel

**Personality.** Short, snappy, no bounce. Motion confirms a state change and
gets out of the way. Nothing lingers, nothing overshoots. The interface feels
like a well-oiled instrument, not a toy.

**Signature values:**

```ts
// motion.ts
export const ease = {
  out:   [0.2, 0, 0, 1],    // the Linear-ish snap: fast start, hard settle
  inOut: [0.4, 0, 0.2, 1],
} as const
export const duration = { fast: 0.12, base: 0.18, slow: 0.24 } as const
export const stagger = 0.03 // 30ms
// Springs are the exception, not the rule. Only for drag/physical follow:
export const spring = { default: { type: 'spring', stiffness: 450, damping: 45, mass: 1 } } as const
```

- Durations **120–240ms**. Stagger **20–40ms**. Overshoot ≈ 0.
- Use eases, not springs, for entrances. Reserve springs for things the user
  physically drags.

**Fits:** Transition Panel (tab/step swaps), Animated Background (sliding active
highlight), Scroll Progress (its default `stiffness: 200, damping: 50` already
lives here), Sliding Number and Animated Number (metrics ticking), Dock, Border
Trail *as a genuine loading/processing signal*, and a restrained Text Effect
(`per: 'word'`, `preset: 'fade'`, no blur).

**Avoid:** heavy Tilt, Spinning Text, large Morph moments, Glow Effect's
rainbow/`colorShift`, Text Shimmer Wave, Magnetic's loose wobble, springy
overshoot presets on Animated Group (`bounce`, `swing`).

**Calibration target:** Linear, the Vercel dashboard, Raycast.

---

## 2. `soft / organic` — spring-led warmth

**Personality.** Gentle, physical, a touch of overshoot — like objects with
real mass. Things settle rather than stop. Warmth without wobble; the spring
should feel *considered*, not slack.

**Signature values:**

```ts
// motion.ts
export const spring = {
  default: { type: 'spring', stiffness: 220, damping: 26, mass: 1 }, // ~300ms felt, small overshoot
  gentle:  { type: 'spring', bounce: 0.2, duration: 0.45 },
} as const
export const ease = { out: [0.16, 1, 0.3, 1] } as const // for the few non-spring bits
export const duration = { fast: 0.18, base: 0.3, slow: 0.45 } as const
export const stagger = 0.05 // 50ms
```

- Felt duration **300–450ms**. Small, deliberate overshoot (bounce ≈ 0.15–0.25).
- Springs are the primary language here.

**Fits:** Morphing Dialog / Morphing Popover (Popover's default
`{ type: 'spring', bounce: 0.1, duration: 0.4 }` is exactly this family),
Carousel (its soft `stiffness: 90, damping: 18` default belongs here), Magnetic
and Tilt *on a single hero element* (tune Magnetic off its very loose
`stiffness: 26.7, damping: 4.1` default toward ~`stiffness: 200, damping: 20`),
a spring-smoothed Cursor, Animated Background.

**Avoid:** mechanical linear timing, Text Scramble (too digital for this world),
Text Roll's hard `easeIn` snap, anything that reads as clicky rather than soft.

**Calibration target:** Family (the app), Arc, iOS sheet/spring transitions.

---

## 3. `editorial / restrained` — near-static, one big entrance

**Personality.** The most disciplined direction, and the safest default when
someone says "make it feel premium and quiet." Almost nothing moves. The page
performs **one** orchestrated entrance on load, then holds perfectly still
except for the gentlest in-view reveals as you scroll.

**Signature values:**

```ts
// motion.ts
export const ease = { out: [0.22, 1, 0.36, 1] } as const // long, soft settle
export const duration = { fast: 0.2, base: 0.6, slow: 0.7 } as const
export const stagger = 0.07 // 70ms — generous, but only across a FEW blocks
```

- The one entrance runs **500–700ms** with a soft settle. This is the sanctioned
  signature-moment exception to the global 200–400ms entrance cap — it applies to
  the single load entrance only; micro-interactions stay fast (~150ms) and rare.
- Generous stagger (**up to ~80ms**, above the usual 20–60ms) is allowed here
  **only because there are so few moving elements** — three or four blocks, not
  twenty cards. This is the one direction that takes the stagger exception; the
  scarcity is what keeps it from reading as a slideshow.

**Fits:** In View (section reveals — set `once` so it fires a single time), Text
Effect (`per: 'line'`, `preset: 'fade'` or `'fade-in-blur'`, once, for the
hero), a subtle Progressive Blur for depth at a scroll edge, Image Comparison as
a deliberate interactive centerpiece.

**Avoid:** Infinite Slider / marquees, Glow Effect, Dock, Spinning Text, Text
Scramble, Tilt, Magnetic — essentially every "always-on" or "hover-toy"
primitive. If it loops forever, it does not belong in this direction.

**Calibration target:** the Vercel homepage, Apple product pages, Stripe's press
and editorial pages.

---

## 4. `kinetic / expressive` — playful, but still one signature

**Personality.** The only direction with real room to play — energetic easing,
visible overshoot, character. Reserve it for brands whose whole point is
personality (creative tools, campaigns, playful products). **Kinetic is not
chaotic.** You still get exactly one signature moment; you just get to make it
loud.

**Signature values:**

```ts
// motion.ts
export const spring = {
  default: { type: 'spring', stiffness: 300, damping: 14, mass: 1 }, // punchy, visible overshoot
  pop:     { type: 'spring', bounce: 0.4, duration: 0.5 },
} as const
export const ease = { out: [0.34, 1.56, 0.64, 1] } as const // overshooting back-ease
export const duration = { fast: 0.16, base: 0.3, slow: 0.5 } as const
export const stagger = 0.05 // 50ms
```

- Overshoot is welcome (bounce ≈ 0.3–0.4), but the budget is unchanged: one
  signature, two-to-three micro, rest static.

**Fits:** the text-\* family as *the* signature (Text Scramble, Text Morph, Text
Roll — pick **one**, never a stack), Spinning Text on a badge, a single Infinite
Slider used as a genuine design element, Glow Effect and Spotlight **with a
constrained brand palette** (never the default rainbow), Text Shimmer Wave on a
short label.

**Avoid:** stacking multiple text effects on one screen; kinetic motion on
dashboards or anything where playfulness undercuts trust; the default rainbow
`colors` on Glow Effect (`mode: 'colorShift'` is peak slop). Energy is not
permission to break the budget.

**Calibration target:** playful brand and launch microsites, Emil Kowalski's
motion demos (kinetic yet controlled), Family's launch moments.

---

## After you choose

1. Write the chosen direction's `motion.ts` values into the project **before**
   installing any component.
2. In [`components.md`](components.md), every recommended prop value assumes you
   derive it from these tokens — not from the component's shipped default.
3. When a component's library default conflicts with your direction (e.g.
   Magnetic's loose spring in `precise`, or Carousel's soft spring in
   `editorial`), **override it toward your signature** — don't inherit the
   default just because it's there.
