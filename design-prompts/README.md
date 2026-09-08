# design-prompts

Restyle prompts for Plates, one per design style, adapted from
https://www.designprompts.dev/ and rewritten around Plates' actual elements.
Each prompt produces one complete replacement stylesheet, `styles/<name>.css`,
previewed with `index.html?style=<name>`.

Two constraints hold across every style:

- **The score plate is fixed.** Its colors (rank ladder, Liftoff black, cream
  and pastel faces), geometry, and fonts (License Plate on the letters,
  Atkinson Hyperlegible Next on the labels and cover) do not change, so shared
  plates look the same whichever style produced them. `plate-block.css` is the
  verbatim block every stylesheet pastes; a theme may set `--plate-shadow` and
  nothing else in it.
- **Outside the plate, the style's typefaces replace Atkinson** everywhere,
  including the word list and input. The families are pre-subset and
  base64-embedded in `fonts/`.

Files:

| File | Purpose |
|---|---|
| `STYLESHEET-PLAN.md` | Where files go, fixed vs themeable, file layout, font map, checklist, open questions |
| `plate-block.css` | The fixed plate: two fonts, plate tokens, section 6 of the Desert file, `.explate` |
| `fonts/<family>.css` | `@font-face` blocks (variable weight, Latin subset, base64) — paste as needed |
| `01-monochrome.md` … `10-botanical.md` | The prompts; paste one whole |

Each prompt has the same shape: `<role>` (how to work in this repo), `<plates>`
(element inventory + invariants), `<design-system>` (philosophy, fonts, tokens,
element-by-element pass, motion, required bold choices, do-not list, proposals
that would need markup or `game.js`).

| Prompt | Style | `?style=` | Source |
|---|---|---|---|
| 01-monochrome.md | Minimalist Monochrome | monochrome | designprompts.dev/monochrome |
| 02-bauhaus.md | Bauhaus | bauhaus | designprompts.dev/bauhaus |
| 03-newsprint.md | Newsprint | newsprint | designprompts.dev/newsprint |
| 04-swiss-minimalist.md | Swiss International | swiss | designprompts.dev/swiss-minimalist |
| 05-flat-design.md | Flat Design | flat | designprompts.dev/flat-design |
| 06-material-design.md | Material You (MD3) | material | designprompts.dev/material-design |
| 07-neo-brutalism.md | Neo-brutalism | neo-brutalism | designprompts.dev/neo-brutalism |
| 09-claymorphism.md | High-Fidelity Claymorphism | clay | designprompts.dev/claymorphism |
| 10-botanical.md | Botanical / Organic Serif | botanical | designprompts.dev/botanical |
