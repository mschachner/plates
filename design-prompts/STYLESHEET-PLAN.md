# Candidate stylesheets — plan

Nine full replacement stylesheets, one per design prompt, each a drop-in for
`styles.css`. The score plate is identical in all of them.

## Where things go

```
styles/<name>.css          candidate stylesheets (served by GitHub Pages)
styles/desert.css          verbatim copy of today's styles.css — the baseline
index.html?style=<name>    loads styles/<name>.css instead of styles.css
design-prompts/            the prompts, this plan, the plate block, the fonts
```

Names: `monochrome`, `bauhaus`, `newsprint`, `swiss`, `flat`, `material`,

The `?style=` switcher is an inline script in `<head>` that rewrites the
stylesheet `href` before first paint; no param means `styles.css`. An unknown
name loads a missing file and the page renders unstyled — a visible failure,
which is fine for a dev switch. `game.js` preserves `location.search` when it
rewrites the URL, so the choice sticks through play. The `?v=` query is now
referenced four times in `index.html` (the fourth is inside the script).

## Fixed vs themeable

**Fixed — pasted from `design-prompts/plate-block.css`, never edited:**
the two `@font-face` rules (License Plate, Atkinson Hyperlegible Next), the
plate tokens, section 6 of the Desert file (`.plate`, `.ptop`, `.pbot`,
`.pline`, `.platecover`, `.designlayer`, `.odo`/`.digit`/`.reel`, the flip
mechanics `.plateflip`/`.plate.challenge`, and the `body.liftoff`/`body.fin`/
`body.flipped` gates), and `.explate`. The block reads only its own
`--plate-*` tokens plus `--rankc`/`--pbg`/`--pline-size` from `game.js`, so it
is immune to whatever the theme does to `--card`, `--ink`, `--accent`,
`--shadow`, or `--font`.

**One themeable plate token:** `--plate-shadow` (the Desert default is
`0 8px 18px rgba(120,72,32,.14)`). Outer shadows only — inset layers would
paint over the face and stickers.

**Themeable — everything else:** all other tokens, the slab and texture, header,
layout, cards, word list, rail (via `--bar`/`--card`/`--accent` and CSS on
`#tripprog`/`.tripdot`/`.sname`/`.togo`), entry, actions, disclosures, modals, the
designer's chrome, the mobile regime, and the CSS *frames* around the two
canvases (`#plateimg`, `#dsgncv`: radius, shadow, hover). The canvases' pixels
are painted by `game.js` and do not change.

**Not touched at all:** `game.js`, `RANK_COLORS`, `LIFTOFF_BG`, `PLATE_BGS`,
`BORDER_STYLES`, the confetti palettes, the share image. Where a prompt wants
something only `game.js` could do (Roman numerals on the rail, a curved vine
path, index prefixes), it is listed under "Proposals" for Mark, not done.

## File layout for each `styles/<name>.css`

Mirror the Desert file's section order so any two can be diffed:

```
/* styles/<name>.css — Plates, <Style> candidate (from design-prompts/NN-<name>.md) */
1. @font-face — paste the style's families from design-prompts/fonts/<family>.css
   ▸ then paste plate-block.css in full (its own two @font-face rules, plate tokens, section 6, .explate)
2. Design tokens — :root (theme tokens; may set --plate-shadow here)
3. Page scaffold — body texture, .page, header
9. Modals (the Desert file has modals here, before the grid — keep that quirk or move them; diffs are easier if kept)
4. Layout grid
5. Cards & wordlist
7. Input & buttons
8. Road-trip rail
10. Dev & finished gates (copy verbatim — functional)
12. Plate designer
11. Responsive regimes (≥1401, ≤1400, ≤980) — last
```

Copy the dev-only rules (section 10, the `.wlm` modal, `.devpanel`, `.clueform`,
`#upcoming`) from the Desert file and recolor them with the theme's tokens; they
need to work but nobody is judging them.

## Fonts

`design-prompts/fonts/<family>.css` — one `@font-face` per file (two where an
italic exists), variable weight, subset to Basic Latin, Latin-1, curly quotes,
dashes, bullet, ellipsis, arrows, ✓ ✕ × (the ✶ ✧ ornaments are not in these
fonts and fall back to the system font — fine for a 12px glyph). Sizes 22–60 KB
each, comparable to the 43 KB Atkinson subset. Source: github.com/google/fonts
(all SIL OFL), subset with fontTools, pinned `opsz`/`wdth` axes, `wght` kept.

| Style | Files | Roles |
|---|---|---|
| monochrome | playfair-display, source-serif-4, jetbrains-mono | display / body / labels+numerals |
| bauhaus | outfit | everything (900 / 700 / 500) |
| newsprint | playfair-display, lora, inter, jetbrains-mono | headlines / paragraphs / UI+rows / data |
| swiss | inter | everything (900 / 700 / 500 / 400) |
| flat | outfit | everything (800 / 600 / 500 / 400) |
| material | roboto | everything (500 / 400) |
| neo-brutalism | space-grotesk | everything at 700 (**max weight is 700**, not 900) |
| clay | nunito, dm-sans | display+buttons / body+rows |
| botanical | playfair-display, source-sans-3 | headings+italic labels / everything else |

Atkinson Hyperlegible Next remains embedded via the plate block for `.ptop`,
`.pbot`, and `.platecover`; the theme does not reference it.

## Checklist per stylesheet

- [ ] `plate-block.css` pasted verbatim; `--plate-shadow` is the only plate token set by the theme.
- [ ] `grep -c "Atkinson"` = 2 (both inside the plate block).
- [ ] No `--card`/`--ink`/`--accent`/`--shadow`/`--font` references inside the pasted block (it has none; make sure edits don't add any).
- [ ] `?style=<name>` renders: header, both cards, plate, rail, entry, actions, disclosures.
- [ ] Rank progression visible on the plate; type a few words and cross a rank (dev: `#dev` unlock, "one word from Liftoff") — the plate recolors, the rail follows, Liftoff goes black/gold.
- [ ] Four semantic colors distinct: an accepted word, a rejected word, the Vanity Plate row, an Extra word.
- [ ] Rail: the `.togo` pill reads at both layouts and on mobile; flip the plate (click) and confirm both faces render and the input follows.
- [ ] Modals: rules (`.explate` unchanged), welcome, finish (`#plateimg` framed), Liftoff, designer (all four panes), and the dev password modal.
- [ ] Mobile ≤980px: fixed entry bar, floating plate, toast message, designer button hidden.
- [ ] ≥1401px: vertical rail beside the plate fits in its column with the longest label enlarged ("Learner's Permit" as current).
- [ ] `prefers-reduced-motion` respected for any looping animation.
- [ ] No player-facing copy added. Empty slots are `:empty`-hidden.

## Open questions for Mark (answer before or during the next turn)

1. The `.floatplate` mini plate on mobile keeps the fixed plate; its shadow is
   the theme's. Should it also read `--plate-shadow`? (Recommended yes — one
   line in the theme.)
2. Modals sit *before* the layout grid in the Desert file (section 9 is out of
   order). Keep that order in the candidates for diffability, or fix it in all
   eleven files at once?
3. `--sp` (global spacing scale) is a theme token. Botanical wants 0.52, Newsprint
   0.34; the ≥1401 rail column width (214px) was tuned at 0.4. Acceptable to
   retune per theme, or hold 0.4 everywhere?
