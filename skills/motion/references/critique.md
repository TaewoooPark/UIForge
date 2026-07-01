# Critique — run this before you call it done

Not optional. Before you present any motion work, run every check below **on your
own output**. Each is pass/fail. A single fail means you go back and fix it, then
re-run — you do not ship around a fail. The last section is a **mandatory
removal**: you finish by taking something out, not by adding a final flourish.

Go view-by-view. A "view" is a self-contained surface (hero, pricing section, an
empty state), not the whole page.

---

## 1. Budget

- [ ] **Exactly one signature motion in this view?** Not zero (nothing to anchor
  the eye), not two (competing focal points). If two things claim the signature,
  demote one to static or micro.
- [ ] **Two or three micro-interactions, max?** Count them. Four means you've
  mis-ranked the hierarchy — cut, don't reclassify.
- [ ] **Is the chrome static?** Nav, footer, persistent toolbars must not move
  on load or on scroll.

**How to fail gracefully:** if you can't decide which of two moments is the
signature, your thesis sentence is weak. Rewrite the thesis, then the answer is
obvious.

## 2. Diegetic — every motion earns it

- [ ] **Does each moving element answer "what state change / attention shift does
  this communicate"?** Say the answer out loud for each one. If any answer is
  "it looks nice" or "to add life," cut that element.
- [ ] **Does the thing that moves match the thing the eye should go to?** Motion
  hierarchy must equal visual hierarchy.
- [ ] **Any looping/ambient effect (glow, shimmer, border-trail, marquee,
  spinning-text) — is it encoding a genuinely ongoing state?** If it loops just
  to loop, cut it. A `border-trail` after loading has finished is a lie.

## 3. One motion signature — physics consistency

- [ ] **Does every `transition`/spring derive from the project `motion.ts`?** No
  stray `duration: 0.55` on a hover, or a random bouncy spring that doesn't match
  the rest.
- [ ] **Are exits faster than entrances?** (Exit 150–250ms vs enter 200–400ms.)
  The single signature moment is the only thing allowed past 400ms (up to
  ~700ms); every other entrance stays within 200–400ms.
- [ ] **Stagger between 20–60ms?** Not 100–200ms. (Remember: `animated-group`
  defaults to 0.1 and `text-effect`'s per-line default is 0.1 — override them.)
  Up to ~80ms is allowed **only** in the `editorial` direction, where so few
  elements move that a slower cadence still reads as deliberate.
- [ ] **Nothing important behind a delay > 600ms?**
- [ ] **Did you pass explicit transitions where the component ships none?**
  (`in-view`, `transition-panel`, `accordion`, `animated-background`, `tilt`,
  `morphing-dialog`, `animated-number` all default to Motion's generic
  behavior — "no transition passed" is not "snappy.")

## 4. Reduced-motion is a real design, not a fallback

- [ ] **Turn every animation off (imagine `prefers-reduced-motion`). Is the view
  still good?** If it looks thin or unfinished, motion was hiding a weak layout —
  fix the layout.
- [ ] **Is there an actual reduced-motion path?** `MotionConfig
  reducedMotion="user"` wrapping the app, and the reduced state shows content
  **complete and instant** — never stuck at `opacity: 0`, never a half-empty
  screen.
- [ ] **Did you add a guard for primitives with none in source?**
  (`infinite-slider` in particular has no reduced-motion handling.)

## 5. Slop scan — name it and kill it

Scan for each. Any present is an automatic fail:

- [ ] Fade-up on **every** scroll section (especially `in-view` without `once`).
- [ ] A purple/violet **glow** on cards, or `glow-effect`'s default rainbow
  `colors` / `mode: 'colorShift'`.
- [ ] Text that **types / scrambles / shimmers** with no reason.
- [ ] An **infinite marquee** nobody asked for.
- [ ] **Tilt on every card. Magnetic on every button.**
- [ ] **Confetti.**
- [ ] A springy **overshoot bounce** on everything entering at once.
- [ ] Stagger so slow the page assembles like a **slideshow**.

## 6. Integrity — source of truth

- [ ] **Did every component come from the registry** (`npx motion-primitives add`
  / `npx shadcn add`), not hand-written or invented?
- [ ] **Is every prop you used real?** Verified against `components.md`, the
  registry JSON, or the component source — no invented prop names.

---

## 7. The forced subtraction (mandatory final act)

You are not done adding until you have done one subtracting.

> **Identify the single least-justified animation in the view and remove it.**

This is the motion version of taking off one accessory before you leave the
house. Even a good composition is almost always improved by removing its weakest
moving part. Ask: *if I could keep only N−1 of these motions, which one goes?*
Then actually delete it and look again.

- [ ] **I removed the least-justified animation and re-viewed the result.**
- [ ] **The view is as good or better without it.** (It almost always is. If
  removing it genuinely hurt, you removed the wrong one — restore it and cut the
  next-weakest instead. But something goes.)

---

## The gate

You may present the work only when **every box above is checked** and **the
forced subtraction has happened**. If any check failed, fix and re-run this whole
rubric — partial passes don't count. Restraint is not the constraint on the
craft; it *is* the craft.
