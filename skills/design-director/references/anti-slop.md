# Anti-slop — name the tells, grep them, cut them

Every tell below is downstream of one failure: **not making a choice.** With an
open prompt the model emits the training-data median, and the median is
recognizable on sight. This file makes the median *checkable* — so you can catch
yourself defaulting and replace the default with a decision.

Use it two ways: (1) keep the headline list in view while composing; (2) after
building, run the **grep patterns** over your output and self-audit against the
checklist. A hit is not automatically fatal — but each hit must be a *choice you
can defend*, not an accident.

## The tells, by axis (tell → fix)

**Typography**
- Body/display set in **Inter, Roboto, Arial, Open Sans, Lato, `system-ui`** (or the reflex second-choice Space Grotesk) → pick one distinctive face and commit; pair at most one display + one text (+ optional mono).
- Hierarchy built from **size alone**, adjacent steps ~1.1–1.2× apart, weight 400-vs-600 → hierarchy from **weight + color**; weight extremes (≤200 vs ≥700), size jumps **≥1.33×** (≥3× display-to-body) from one modular ratio.
- **Centered running paragraphs**, full-viewport-width text → left-align; measure **45–75ch**; center only short callouts.
- Straight quotes `"` `'`, hyphen used as dash → curly quotes `“” ‘’`, real dashes `– —`.

**Color**
- **Purple/indigo→violet gradient hero** on white (the single most-cited tell); gradient headline text → one committed accent on **<10%** of surface; solid headline.
- **Grey text on a colored background** → text = a darker/lighter shade of the *same hue*.
- Rainbow of evenly-weighted colors → a dominant near-neutral base + one sharp accent. Meet **WCAG ≥4.5:1** (body) / ≥3:1 (large, UI, focus ring).
- **Unmodified shadcn slate/zinc + default `--radius` + default font** (data-mined as the #1 predictor of "AI-built") → change the neutral, the radius, and the font from stock; add one token the default kit doesn't ship and apply it as a fingerprint.

**Layout**
- The **centered hero → subhead → two buttons → three identical icon-top cards** template → break it: asymmetric/editorial grid, one dominant type moment, redesign the hero around the subject's most characteristic artifact.
- **Bento grid** / cards-inside-cards for their own sake; everything centered, no asymmetry → commit to a grid and align to it; let structure be felt, not decorative.
- **01/02/03** numbered markers or a badge above the H1 when the content isn't actually sequential/meaningful → only use truthful structural devices.

**Surface & effects**
- `rounded-2xl shadow-lg p-6` card with a **colored top/left border stripe** ("as reliable a tell as em-dashes in text") → borders + contrast over drop shadows; one radius vocabulary.
- **Unprompted glow / neon / colored box-shadow**, glassmorphism everywhere, over-rounded everything → one elevation ladder, **shadows share one light source** (small vertical offset, tight blur), radii deliberate not maxed.
- **Emoji as icons, bullets, or section headers** → a real icon set; every icon gets a text label.

**Motion** (full system in the `motion` skill)
- **Fade-up on every scroll section**, **tilt on every card**, hover animation on everything, **infinite logo marquee**, typewriter/scramble text for no reason, **confetti** → one orchestrated page-load with staggered reveals **>** scattered micro-interactions; each animation must answer "why does this move?" or be cut. Durations <300ms, ease-out, `transform`/`opacity` only, interruptible, `prefers-reduced-motion` respected.

## Grep-able lint patterns

Scan generated code; investigate every hit and justify or fix it.

```
# "AI purple" and gradient-hero tells
bg-(indigo|violet|purple|fuchsia)-(500|600|700)
from-(purple|violet|indigo|fuchsia)-\d+\s+to-(blue|pink|indigo|violet)-\d+
(bg|text)-clip-text            # gradient headline text
# default card signature / over-rounding
rounded-(2xl|3xl|full)\b       # is maxed radius actually a choice?
shadow-(lg|xl|2xl)\b           # colored/oversized shadow?
drop-shadow-\[.*(rgb|#).*\]    # colored glow
backdrop-blur                  # glassmorphism — deliberate?
# default fonts / stock kit
font-(sans|Inter|Roboto)\b|font-family:\s*(Inter|Roboto|system-ui)
# motion slop
repeat:\s*Infinity             # infinite loop — encodes a real ongoing state?
whileHover                     # hover anim on how many elements?
# emoji in JSX/markup (icons/bullets)
[\x{1F300}-\x{1FAFF}\x{2600}-\x{27BF}]
```

## Banned copy → human replacement

Marketese measurably *lowers* usability (NN/g: objective, concise, scannable
copy tested **+124%**). Ban the hype; make every claim checkable.

| Slop | Fix |
|---|---|
| "Unlock the power of…", "Supercharge / Elevate / Revolutionize your…" | the literal outcome + a number: "Cut monthly close from 5 days to 1." |
| "Seamlessly integrate" | "Connects to Slack, GitHub, Jira in two clicks." |
| "In today's fast-paced world…" | delete; open on the user's actual problem. |
| "Trusted by thousands", "world-class", "enterprise-grade", "game-changing" | "Trusted by 4,200 engineering teams." |
| Button "Submit" | the outcome, verb + object, ≤3 words, sentence case: "Send invoice." Destructive = Verb + Noun ("Delete project"). |

**Specificity test:** every headline needs ≥1 checkable element (number, name,
timeframe, mechanism). If it could be pasted onto a competitor's site unchanged,
it's a slogan — rewrite it. (More in the `content` skill.)

## Calibration targets

- **Toward:** Linear (precise restraint, "structure felt not seen"), Vercel
  (minimal; one confident move; chrome recedes), Stripe (motion as care &
  comprehension), Rauno Freiberg & Emil Kowalski (interaction craft), editorial/
  Swiss discipline. Study how *little* they use and how *exact* it is.
- **Away:** the effect-maximalist registry look (aurora + beams + glow + 3D tilt
  on one page), the pastel Stripe-clone template, award-site maximalism as
  cliché.

## The self-audit (condensed)

Before shipping, confirm: ≤2 typefaces (not Inter) · one accent <10% · measure
≤75ch · no purple-gradient hero · shadcn defaults overridden · 8px-grid spacing ·
one light source for shadows · one signature element · one motion signature +
2–3 micro · every state designed (loading/empty/error) · every claim checkable ·
**and you removed one thing.**
