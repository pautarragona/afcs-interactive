# Interactive AFCS (working title)

An open, interactive companion to TU Delft's AE4301 Automatic Flight Control System Design.
It complements the lectures and doesn't replace them. Every concept is something you move, break and explain.

---

## 1. What we're building first (MVP)

**One lesson: "Poles → response".**

1. **Play.** Drag a pair of poles on the s-plane and watch the step response update live.
2. **Read.** See damping ratio, natural frequency, overshoot and settling time update as you drag.
3. **Understand.** A short explanation with the key equations, shown *after* the student has seen the effect.
4. **Observe and explain.** The student types what they noticed and gets a check against verified key points.
5. **Challenge.** "Place the poles so overshoot is under 10% and settling time under 2 s."

Next lesson after the MVP: the pitch-rate damper on the short-period mode.

**Out of scope for the MVP:** user accounts, live AI feedback (rubric checks first), full course coverage.

---

## 2. Stack

| Layer | Tool | Why |
|---|---|---|
| Site | **Astro** | Static site with lessons written in Markdown/MDX. Ships almost no JavaScript except on interactive parts, so pages stay fast. |
| Interactive parts | **Svelte** components | Small and reactive, which suits sliders and draggable plots. Each one can also run standalone, so it can later be embedded in TeachBooks. |
| Maths | **KaTeX** | Fast, good-looking equations. |
| Plots | **Custom SVG** (s-plane, root locus) + **uPlot** (time responses) | Full control over the look; uPlot is tiny and fast. |
| Simulation | Small **TypeScript** LTI library | Step responses, poles, damping and margins computed in the browser, with no server. |
| Verification | **Python + python-control** | Generates reference results; automated tests check the TypeScript numbers against them. |
| Content | **MDX** lessons + **YAML** rubrics | Content stays separate from UI, so moving to TeachBooks later is easy. |
| Hosting | **GitHub Pages** | Free and public. |
| Licence | MIT (code), CC BY 4.0 (content) | Ready for TU Delft to adopt. |

**What Claude can do:** write all the code, run builds and tests, do the Python verification, and produce preview links for each widget.
**What you do:** create the GitHub repo (and give access), check the physics, and make the final calls on design and wording.

---

## 3. Folder structure

```
afcs-interactive/
├── src/
│   ├── lessons/            # MDX lessons (text + equations + widget slots)
│   │   └── 01-poles-response.mdx
│   ├── rubrics/            # YAML key observations per plot
│   ├── components/         # Svelte widgets (SPlane, StepPlot, ObserveBox, Challenge)
│   ├── sim/                # TypeScript LTI maths
│   └── styles/tokens.css   # design system tokens
├── verify/                 # Python reference scripts + golden results
├── tests/                  # checks TypeScript sim against golden results
└── README.md
```

---

## 4. Design: attractive, not AI-looking

**Process**

1. **Design system first.** Colours, type, spacing and the four core components (slider, plot card, observe box, challenge card), built as a browsable Design System artifact.
2. **Mock one lesson page** on a Design canvas in 2–3 different directions. Pick one and refine it.
3. **Build only after the design is approved**, then screenshot and critique each widget against the mock.

**Rules**

- **One memorable element:** the live plot. Everything around it stays quiet.
- **Colour carries meaning:** e.g. stable poles, unstable poles, reference and response each get one fixed colour, everywhere.
- **Motion only answers the student:** no fade-ins on every section.
- **Copy in plain, sentence-case English,** with aircraft examples and units. No filler, no emoji.

**Avoid the common "generated" look**

- Cream background with a serif headline and terracotta accent
- Near-black background with one neon accent
- Identical rounded cards with soft shadows and gradient washes
- ALL-CAPS labels above every heading, "01 / 02 / 03" markers, arrows on every link

**Inspiration (hand-made explainers):** Bartosz Ciechanowski's interactive articles, Red Blob Games, Distill.pub.

---

## 5. Tools and skills we'll use

| Tool | Used for |
|---|---|
| Frontend design guidance | Choosing a distinctive direction and checking the plan against generic defaults |
| Design System artifact | One shared reference for tokens and components |
| Design canvas | Comparing lesson-page mockups before coding |
| Artifact previews | A shareable link for each widget while it's being built |
| Screenshots | Critiquing every build against the mock |
| Python verification | Proving the physics is right |

---

## 6. Steps

1. Agree on the design direction (2–3 mockups)
2. Build the design system
3. Build the simulation library + Python verification
4. Build the widgets for lesson 1
5. Write the lesson text and rubric
6. Test with 5 classmates and fix what confused them
7. Publish on GitHub Pages and show it to staff
