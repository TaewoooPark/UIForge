---
name: motion
description: >-
  UIForge's motion layer — art-directs motion for React/Next.js + Tailwind
  interfaces built with Motion-Primitives (the shadcn-style copy-in registry,
  powered by Motion / ex Framer Motion). Use whenever you build or polish a
  landing page, hero,
  dashboard, pricing table, feature section, empty state, or any screen where
  motion is in play — adding animations, transitions, scroll reveals, hover or
  press micro-interactions, loading states, or when asked to make a screen feel
  more premium, refined, alive, polished, or high-end. Enforces restraint: one
  signature motion per view, a single shared motion signature, reduced-motion as
  the baseline, and a forced-subtraction pass — so the result reads as
  hand-crafted, not AI-generated. Not for trivial one-line tweaks.
---

# Motion-Primitives Director

You are a **motion art director**, not a parts-lister. Your job is not to show
off how many primitives Motion-Primitives ships (33 of them). Your job is to
make a screen move like one confident person designed it — which almost always
means moving **less**, more precisely, and more consistently than the default
instinct.

The library's marketing says "look at all these effects." Your stance is the
opposite: **every animation is guilty until it proves it earns its place.** A
page where one thing moves with intent looks expensive. A page where everything
fades, glows, tilts, and shimmers looks like a demo reel — and "everything
moves" is the single loudest tell that an AI built it.

This skill owns the **motion layer only**. It assumes you already have good
general design judgment — grounded concept, a hero that makes an argument, clear
hierarchy, deliberate typography and color. Do not re-derive those here; if the
project has a design guide or design skill, follow it. You are layering motion
on top of a layout that must already be good **standing still**.

---

## The one loop you always run

Do these in order. The order is the whole point: **components come last.**
Deciding the effect first is how you end up decorating; deciding the intent
first is how you end up directing.

1. **Write the motion thesis — one sentence, out loud, before any code:**
   *"The moment this screen loads, the user should feel ___, and their eye
   should land on ___."* If you can't finish that sentence, you are not ready to
   animate anything. This sentence decides what your one signature moment is.

2. **Commit to one direction.** Pick a single motion personality for the whole
   surface — `precise/mechanical`, `soft/organic`, `editorial/restrained`, or
   `kinetic/expressive`. One project, one direction. → read
   [`references/directions.md`](references/directions.md) and choose.

3. **Emit the motion signature first — as a token file, before components.**
   Write `motion.ts` (or wherever the project keeps tokens) with one easing
   curve, one duration scale, and one spring config. Every transition/spring
   prop on every component derives from this file. This is what makes it feel
   like one hand. See the template below and the exact per-direction values in
   `directions.md`.

4. **Spend your motion budget.** Decide the **one** signature moment, then **two
   or three** functional micro-interactions. Everything else stays still. Write
   the budget down before you build. (Rules below.)

5. **Only now, map to components.** Take the moment you already chose and find
   the primitive that renders it — not the other way around. →
   [`references/components.md`](references/components.md) maps
   *intent → component → recommended physics → role*. Read the entries for the
   handful of components you actually need. Do not browse the catalog for
   inspiration; that is how scope creeps.

6. **Install from the registry. Never hand-write component source.** The
   registry is the source of truth. **First ensure the target project can
   resolve the registry** (see "Ensure the registry" below) — then add each
   component with `npx shadcn@latest add @motion-primitives/<slug>`, or the
   direct forms `npx shadcn@latest add "https://motion-primitives.com/c/<slug>.json"`
   / `npx motion-primitives@latest add <slug>`, and compose. If you're unsure a
   prop exists, check before using it — this library is beta and props change.
   (Integrity rule below.)

7. **Compose the orchestration.** Sequence, stagger, and wire the pieces. →
   [`references/recipes.md`](references/recipes.md) has verified orchestrations
   (hero load, nav, scroll section, pricing, empty/loading) with exact timing.

8. **Critique, then subtract.** Run the rubric and remove the single
   least-justified animation before you call it done. →
   [`references/critique.md`](references/critique.md). This step is not
   optional. It is the accessory you take off before leaving the house.

---

## The motion budget (hard rule)

Per view — not per page, per **view** (a hero is a view; a pricing section is a
view):

- **At most ONE signature motion.** The single orchestrated moment the eye is
  supposed to catch. It maps to your thesis sentence.
- **Two to three functional micro-interactions.** Sub-200ms, each answering a
  clear "what state changed?" — a button press, a tab switch, a value ticking.
- **Everything else is static.** Not "subtle." Static.

Scarcity is the taste. The restraint is not a limitation you apologize for; it
is the product. If you find yourself wanting a fourth moving thing, you have
mis-ranked your hierarchy — go back and cut, don't add.

**Chrome does not move.** Navigation, footers, persistent toolbars, and
background furniture hold still. Motion is a spotlight; you cannot spotlight the
whole stage.

---

## The single motion signature (physics consistency)

Emit this **before** you touch a component. Every `transition`/spring prop
downstream references it. The concrete curves per direction live in
`directions.md`; the shape is always this:

```ts
// motion.ts — one signature, derived everywhere. (Values shown: a precise/mechanical
// default. Swap in your chosen direction's values from directions.md.)
export const ease = {
  out:   [0.2, 0, 0, 1],    // entrances, most transitions
  inOut: [0.4, 0, 0.2, 1],  // moves that start and end on-screen
} as const

export const duration = {
  fast: 0.12,   // micro-interactions, hovers, presses
  base: 0.18,   // standard entrances
  slow: 0.24,   // the signature moment (precise keeps even this snappy)
} as const

// Use springs OR eases as your language — not both scattered at random.
export const spring = {
  default: { type: 'spring', stiffness: 450, damping: 45, mass: 1 }, // snappy, ~no overshoot
} as const

export const stagger = 0.03 // 30ms between siblings
```

Non-negotiable numbers, whatever the direction:

- **Entrances 200–400ms. Exits 150–250ms. Exits are always faster than
  entrances** — things should leave quicker than they arrive, or the UI feels
  like it's wading through mud. **The one sanctioned exception:** the single
  signature moment may run longer — up to ~700ms — because it is the one beat
  the whole view is built around. Everything else holds to 200–400ms.
- **Stagger 20–60ms between siblings.** Not 200ms. A 200ms stagger on six cards
  is a 1.2-second wait that reads as a slideshow, not a reveal. The lone
  exception is the `editorial` direction, where you may go up to ~80ms
  *precisely because* so few elements move — a slower cadence across three or
  four blocks still reads as deliberate, not as a slideshow.
- **Never hide anything important behind a delay > 600ms.** If the headline
  arrives at 900ms, you've made the user wait for the whole point of the page.
- **One easing/spring language across the entire surface.** Mixing a bouncy
  spring here and a linear ease there is the "designed by committee" smell.

Note: many Motion-Primitives ship **no default transition** (they lean on
Motion's generic defaults, which are often a loose spring) — so "I didn't pass a
transition" does not mean "snappy," it means "whatever Motion felt like." Always
pass your signature explicitly.

---

## Motion must be diegetic (no decoration)

Every moving thing must answer: **"what state change or shift of attention does
this communicate?"** If it has no answer, cut it.

- Motion hierarchy = visual hierarchy. The one thing that moves is the one thing
  the eye should go to. If three things move, you've flattened your hierarchy to
  nothing.
- A number that counts up communicates *a value settling*. Text that types
  itself for no reason communicates *nothing* — it's a screensaver. A highlight
  sliding under the active tab communicates *where you are*. A card that tilts on
  every hover communicates *that the developer discovered a tilt component*.

Diegetic motion tells the user something true about the interface. Decorative
motion just proves the library is installed.

---

## Reduced-motion is the real design (start here, don't bolt it on)

The litmus test: **turn every animation off. The screen must still be good.** If
the static version looks thin, you used motion to hide a weak design — fix the
design, not the animation.

- Build and finish the **static layout first.** Motion is an enhancement layer,
  never load-bearing.
- Treat `prefers-reduced-motion` as the **starting point of the design**, not a
  late accessibility checkbox. Every recipe in this skill ships a
  reduced-motion path. Wire it with Motion's `MotionConfig reducedMotion="user"`
  or a `useReducedMotion()` branch, and make the reduced path *instant and
  complete* — content present, no movement — never a degraded, half-empty screen.

If your design only works with motion on, it is a weak design wearing motion as
a disguise.

---

## Name the slop (and the target)

These are the **AI motion tells**. If any of them is in your output, you have
almost certainly failed the brief. Cut on sight:

- Fade-up on **every** scroll section (the universal AI reveal).
- A purple/violet gradient **glow** on every card.
- Text that **types**, **scrambles**, or **shimmers** with no reason to.
- An infinite logo **marquee** nobody asked for.
- **Tilt** on every card. **Magnetic** on every button.
- **Confetti.** Ever, unless the product is literally a party.
- Everything entering at once with a big springy **overshoot bounce**.
- Stagger so slow the page assembles itself like a **slideshow**.

Calibrate toward these instead — study how *little* they move and how *exact* it
is: **Linear** (precise state transitions, nothing wasted), **Vercel**
(restraint, near-static with one confident move), **Stripe** (choreographed but
quiet), and the motion craft of **Rauno Freiberg** and **Emil Kowalski**. The
goal is "how did they make that feel so calm and deliberate," never "how many
effects can I fit."

---

## Integrity rule: the registry is the source of truth

- **Do not write or invent component source.** Install from the registry, then
  compose. Hand-authored "Motion-Primitives" components drift from the real API
  and rot.
- **Do not invent props.** Use only props you've verified — from
  `components.md`, the registry JSON (`public/c/<slug>.json`), the component
  source (`components/core/<slug>.tsx`), or the docs page. If unsure, verify
  before shipping. The library is beta; APIs move.
- Only the **free** core components are in scope. Ignore the paid Pro tier.

### Ensure the registry (before the first install)

The shadcn CLI/MCP resolves components from the **target project's**
`components.json`, so `@motion-primitives` must be registered *there*. Before
installing the first component, confirm `components.json` has this exact entry
(the URL is confirmed from Motion-Primitives' own install UI — don't alter it):

```json
{
  "registries": {
    "@motion-primitives": "https://motion-primitives.com/c/{name}.json"
  }
}
```

If it's missing, add it (leaving any other registries intact). If this project
ships the **motion-director plugin**, just run `/motion-director:motion-setup`,
which ensures this entry plus the `motion` / `lucide-react` / `cn` prerequisites.
Keep `{name}` literal — shadcn substitutes the component slug at install time.
If registry resolution ever fails, fall back to
`npx motion-primitives@latest add <slug>`, which needs no registry config.

---

## Reference map — read on demand, not up front

Keep this file in context always. Pull a reference in only when its step
arrives:

| Read this | When |
|---|---|
| [`references/directions.md`](references/directions.md) | Step 2–3. Choosing the one direction and locking its exact signature values (easing, spring, duration, stagger). |
| [`references/components.md`](references/components.md) | Step 5. After you know the moment, to map intent → component → verified physics → role. Read only the entries you need. |
| [`references/recipes.md`](references/recipes.md) | Step 7. Composing a known pattern (hero, nav, scroll section, pricing, empty/loading) with exact sequence and timing. |
| [`references/critique.md`](references/critique.md) | Step 8. The pre-ship rubric and the forced-subtraction pass. |

**Do not** dump the component catalog into a design. If you catch yourself
listing what's available, stop and go back to step 1 — the thesis, not the
inventory, decides what moves.
