# The easing & spring canon — concrete values

The single biggest amateur tell in motion is an inconsistent, arbitrary curve.
This is the vocabulary the craft actually uses. Pick a small set that matches
your direction, put them in `motion.ts`, and derive everything from them.

## Easing curves (named cubic-beziers)

**Default to ease-out for entering / user-initiated motion** (fast start = feels
responsive, gentle settle). Use ease-in-out only for A→B moves that start and end
on-screen. **Ease-in almost never** (feels sluggish). **Linear** only for
marquees, tickers, and progress.

Ease-out family (weak → strong snap):
```
quad   cubic-bezier(0.25, 0.46, 0.45, 0.94)
cubic  cubic-bezier(0.215, 0.61, 0.355, 1)
quart  cubic-bezier(0.165, 0.84, 0.44, 1)
quint  cubic-bezier(0.23, 1, 0.32, 1)
expo   cubic-bezier(0.19, 1, 0.22, 1)
circ   cubic-bezier(0.075, 0.82, 0.165, 1)
```
Ease-in-out family:
```
quad   cubic-bezier(0.455, 0.03, 0.515, 0.955)
cubic  cubic-bezier(0.645, 0.045, 0.355, 1)
quart  cubic-bezier(0.77, 0, 0.175, 1)
quint  cubic-bezier(0.86, 0, 0.07, 1)
```
Material 3 "emphasized" (great snappy-mechanical default): enter/standard
`cubic-bezier(0.2, 0, 0, 1)`, decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`,
accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`. Material standard
`cubic-bezier(0.4, 0, 0.2, 1)`.

## Durations (converging numbers)

- **Keep UI motion < 300ms.** Micro-interactions **100–150ms**; standard UI
  (tooltip/dropdown/popover) **150–250ms**; modal/drawer/sheet **200–300ms**.
- **Exit ~15–20% faster than enter** (Material tokens: enter 225ms / exit 195ms).
- **Duration scales with distance/size** — a small toggle is short; a full-screen
  panel is longer. Never one global duration for everything.
- The one exception: a **single signature entrance** may run 400–700ms.

## Springs (velocity-aware, interruptible — for anything spatial/gestural)

Use springs for movement and gestures; use eased tweens for enter/exit fades and
color. Reference presets (a de-facto vocabulary):
```
React Spring:  default {tension:170, friction:26}   gentle {120,14}
               wobbly {180,12}   stiff {210,20}   slow {280,60}
Motion legacy: {stiffness:100, damping:10, mass:1}
Motion (time-based, current default): {visualDuration:0.3–0.5, bounce:0.25}
```
- *stiffness/tension* → speed & snappiness; *damping/friction* → settle & bounce
  (low = bouncy, high = smooth); *mass* → heaviness.
- **Keep bounce subtle: 0.1–0.3.** Bounce ≥ 0.4 reads as a toy. Precise/mechanical
  and editorial use ~no overshoot; warm/organic uses a small one.

## Non-negotiables

- **Animate only `transform` and `opacity`** (also `filter`, `clip-path`). These
  composite off the main thread and hold 60fps. Never animate
  `width/height/top/left/margin/padding` — layout + paint = jank.
- **Interruptible + origin-aware:** a re-triggered animation redirects from its
  current velocity, and elements animate *from* their trigger (a popover grows
  from its button; a detail morphs from its thumbnail via `layoutId` /
  `view-transition-name`).
- **Frequency governs whether to animate at all:** 100+×/day (command menu,
  keyboard actions) → no entrance/exit animation; **never animate
  keyboard-initiated actions.**
- **Reduced-motion is total.** Wrap the app in `<MotionConfig reducedMotion="user">`
  or branch on `prefers-reduced-motion`; **replace** motion with an instant/faded
  state — never remove information, never leave content at `opacity: 0`.

## Which tool for which motion

- Ephemeral UI transitions → CSS / WAAPI / Motion.
- Scroll storytelling / sequencing → GSAP + ScrollTrigger.
- Layout reflow (add/remove/move) → FLIP / AutoAnimate / Motion `layout`.
- Illustrative / branded playback → Lottie. *Interactive* character/state → Rive.
- Cross-page / shared-element morph → the View Transitions API.

Don't reach for a heavy engine when a native primitive does the job.
