# Critique — judge it blind, then subtract

Run this before you call anything done. Two rules make it work:

1. **Judge the *rendered* result, not your code.** "Never claim visual
   verification from code alone" (Vercel). If a browser is available
   (Playwright / the webapp-testing skill), **render the page and screenshot
   it** — once normally and once with `prefers-reduced-motion` — and critique
   the *image*. Confirm only the intended element moves and the static frame is
   already excellent.
2. **Judge it as if someone else built it.** Self-graders skew positive. Score
   against the rubric coldly; a "yes, but…" is a no.

Any fail → fix and re-run the whole thing. Go view by view.

## The rubric (each is pass/fail)

**Direction & intent**
- [ ] Can you state the one-sentence thesis and the single thing this view is remembered by? Is there **one** clear focal point (not zero, not three)?
- [ ] Does the whole surface read as **one** committed direction — not a blend?

**Typography**
- [ ] ≤ 2 type families; the display face is **not** Inter/Roboto/`system-ui`?
- [ ] Hierarchy comes from **weight + color + size jumps ≥ 1.33×**, from one scale — not 400-vs-600 at 16-vs-18px?
- [ ] Running text measure **45–75ch**; no centered paragraph over ~3 lines; curly quotes?

**Color**
- [ ] 4–6 tokens / semantic roles; **one** accent on **< 10%** of the surface?
- [ ] No grey text on colored backgrounds; **no purple/indigo gradient hero**?
- [ ] Contrast meets **WCAG ≥ 4.5:1** body / ≥ 3:1 large & UI & focus ring?
- [ ] Are the shadcn/Tailwind defaults (neutral, radius, font) actually **overridden**?

**Space & surface**
- [ ] All spacing on the **8px grid** (4px half-step); tighter within groups than between?
- [ ] One radius vocabulary; **one light source** for all shadows; no unmotivated glow/glass?

**Motion** (details in the `motion` skill)
- [ ] **One** signature moment + ≤ 3 micro-interactions; everything else static; chrome doesn't move?
- [ ] Every animation answers "why does this move?"; durations < 300ms, ease-out, transform/opacity only?
- [ ] `prefers-reduced-motion` path exists, and the **static** version is already great on its own?

**States & copy**
- [ ] Are loading / **empty** / error / disabled states designed (not just the happy path)? Empty = why + one next action; error = what happened + how to fix?
- [ ] Buttons state the outcome (verb + object, not "Submit"); every claim has a checkable element; no hype words?

**Accessibility & ergonomics**
- [ ] Targets ≥ 44×44pt; focus-visible on keyboard; icons have text labels; inputs ≥ 16px?

## Run the linter (the Gate)

This is a hard gate, not a checklist. Run the shipped linter — it exits non-zero
on the [`anti-slop.md`](anti-slop.md) tells and token violations:

```bash
node ${CLAUDE_PLUGIN_ROOT}/tools/uiforge-lint.mjs <project-dir> --strict
```

Fix every BLOCKER; resolve or justify each warning; **re-run until it exits 0.**
Do not declare the view done while the linter fails.

## The adversarial slop detector (the real bar)

The linter catches the grep-able; the pixels hide the rest. Run
[`slop-detector.md`](slop-detector.md) as an **implementation-blind** pass — a
subagent given only the rendered screenshots, told to *prove a machine made
this.* If it returns **AI-DETECTED**, fix every cited tell, re-render, re-judge
until **CLEAN**. The bar is not "0 blockers" — it's "an adversary with the pixels
cannot prove it's AI."

## The forced subtraction (mandatory — the step others skip)

> Identify the single least-justified element, color, shadow, or animation in the
> view **and remove it.**

Then re-view. It is almost always better. If removing it genuinely hurt, you
removed the wrong one — restore it and cut the next-weakest. But **something
goes**, every time. This is the accessory you take off before leaving the house,
and it is UIForge's core ritual.

- [ ] I removed the least-justified thing and re-checked.
- [ ] The view is as good or better without it.

## The gate

Ship only when every box is checked **and** the subtraction happened. A partial
pass is a fail — fix and run the whole rubric again. Restraint isn't the
constraint on the craft; it *is* the craft.
