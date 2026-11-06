# Design rules: avoiding the generated look

Collected from write-ups of what gives AI-built interfaces away (see sources), and the choice this project makes instead. Check every new page against this list.

| Common tell | What we do instead |
|---|---|
| Inter, Manrope, Geist, Space Grotesk, Instrument Serif; serif italic on one headline word | **B612**, the typeface Airbus designed for cockpit displays, for headings, UI and numbers; **Source Serif 4** for reading text and maths. No highlighted words in headings. |
| Indigo/purple accent or indigo-to-purple gradients (Tailwind indigo-500) | No purple anywhere. Colours carry one meaning each (below). |
| Tinted near-black backgrounds, one neon accent, coloured glows | Neutral greys for dark mode (#141414), no glows, no gradient washes. |
| Identical rounded cards, same radius and soft grey shadow, cards inside cards, glassmorphism | No shadows. Small 3–4 px corners. Panels are framed like a drawing sheet; content sits on the page, not in floating cards. |
| Stat-tile rows (big number, small label) | Live values sit in one title-block table attached to the plots, like the title block of an engineering drawing. |
| Coloured left/top-border cards, status dots without real status, pills everywhere | Status is written in words ("not met") and colour together. Rectangular buttons. |
| All-caps tracked labels, monospace small labels, middle-dot meta lines, "→" on links | Sentence case everywhere, proportional type, plain links. |
| 01/02/03 markers on content that is not a sequence | Only real sequences are numbered, using textbook section numbers (1.1, 1.2) and equation numbers (1.1). |
| Chart-library look: gradient fill under lines, glowing curves, pill annotations | Engineering figures: framed axes with inward ticks, units in brackets (t [s]), dimension lines with arrowheads for overshoot and settling time, black response line. |
| Fade-in on every section, hover lift on every card | Motion only in response to the student's input. |
| Weightless copy ("Learn smarter") | Copy says what the student does and sees. |

## Colour meanings

| Colour | Means |
|---|---|
| International orange #FF4F00 | Something you can grab (pole handles, dial needles) |
| Ink (black / white in dark mode) | What the system does (the response) |
| Drafting blue #0057B8 | The specification: target zone, reference, ±2 % band |
| Red #C42B1C, with hatching | Unstable region, requirement not met |
| Green #1B7F3B | Requirement met |
| Grey | Your previous attempt |

## Sources

- [AI Design Slop: 16 Patterns That Mark a Site as Vibe-Coded](https://www.developersdigest.tech/blog/ai-design-slop-and-how-to-spot-it)
- [How to spot an AI-built website: the tells of Claude Code and ChatGPT Codex](https://falia.co/en/insights/web-design/spot-ai-built-website/)
- [AI Slop Fonts and Gradients: The Tells That Give Away AI Design](https://www.925studios.co/blog/ai-slop-design-tells)
- [Why Every AI-Built Website Looks the Same (Blame Tailwind's Indigo-500)](https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p)
