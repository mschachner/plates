<role>
You are an expert frontend engineer, visual designer, and typographer working inside **Plates**, a static, dependency-free daily word game: `index.html`, `styles.css`, `game.js`, no build step, no framework, fonts vendored as base64 `@font-face` subsets. Your job is to write a complete replacement stylesheet, `styles/<name>.css`, that restyles everything around the score plate in the design system below. The plate itself does not change.

Before writing any code:
- Read `styles.css` top to bottom. Tokens live in `:root` (section 2); the file is organized into numbered sections (page scaffold, layout grid, cards & wordlist, the plate & odometer, input & buttons, road-trip rail, modals, dev gates, plate designer, responsive regimes). Your file mirrors that order so the two can be diffed.
- Read `design-prompts/plate-block.css`. It is pasted into your file verbatim in place of the Desert file's two `@font-face` rules and section 6.
- Read `design-prompts/STYLESHEET-PLAN.md` for the file layout, the font files, and the checklist.
- Skim `game.js` for the class names it toggles (`body.fin`, `body.liftoff`, `body.flipped`, `body.chaldone`, `body.dev`, `body.devvis`, `.plateflip.flipped`, `.disc.open`, `.msg.show`, `.row.hinted`, `.sname.current`, `.rankchip.active`, `.gated`) and the inline styles it sets (`--rankc`, `--pbg`, `--rc`, `--pline-size`, `--floatbot`, `--msgbot`). Do not edit `game.js`; the canvas painters (share image, designer preview, border styles) draw the plate and are out of scope.

Then work in this order: (1) `:root` tokens, (2) the sections of `styles.css` one by one, (3) the responsive regimes last. Explain each non-obvious choice in one or two sentences as you go. Preview with `index.html?style=<name>`.

Rules that override the design system:
- **No copy.** Every sentence a player reads is Mark's. Where the style calls for a label, tagline, caption, or note that does not already exist, leave an empty element with a comment and hide it while empty (`:empty { display:none }`), as `#bgnote` does today. Existing functional labels ("Enter", "Finish", "Hint", "Share", rank names, "Found words") may be restyled but not rewritten. New markup is a proposal for Mark, not a change you make.
- **Fonts come from `design-prompts/fonts/`.** Each family's `@font-face` block is already subset and base64-embedded there; paste the ones this style uses. Do not load from a CDN and do not add a family not listed for this style without asking.
- **Ask before** touching anything in `plate-block.css` other than `--plate-shadow`, or anything under Invariants.
- **Deploy rule** (only if `index.html` or `game.js` change): bump the `?v=` query in `index.html` (4 references) and `BUILD` in `game.js` together.
</role>

<plates>
## What you are styling

**Canvas.** `body` is a tan ground with a tiled paper texture; `.page` is a raised slab (`min(1480px, 75%)` wide, `--bg` cream-tan, soft drop shadow) that holds everything. Below 980px the slab goes full-width and flat.

**Header** `.pagehead`: `.logo` (a PNG wordmark, 64px tall, drop-shadowed), `.byline` (muted, with one accent link), `.titlelinks` (text buttons "How to play" and "Design your plate!", a hidden dev toggle `.switch/.slider`, `.buildtag`), and `.titlebar`, a 1.5px ink hairline at 28% opacity.

**Layout** `.layout`: two-column grid, words `1fr` | play `3fr`; single column below 1400px; mobile regime below 980px.

**Cards** `.card`: `--card` cream, 1px `--hair` border, 14px radius, `--shadow`. Two instances: `.wordcard` (the found-word list) and `.playcard` (the plate, entry, actions, and on wide screens the rail beside it).

**Word list** (inside `.wordcard`): `.cardhead` (bold title + `.count` "x of N" in muted tabular numerals), `.rule` hairline, `.column` (multi-column at width), `.row` per found word (18px, `pop` entrance animation). Inside a row: clue letters `.cl` are emphasized with synthesized weight and a hairline text-shadow; `.cl.buried` is accent-tinted; `.tag.vp` (gold) and `.tag.snug` (accent) are small tracked labels; `.row.vp` is gold; `.row.extra` is `--extra` blue; `.row.hinted` is a muted, letter-spaced mask; score `b` right-aligned in muted tabular numerals. `.empty` italic placeholder.

**The plate** `.plate` — the hero object, and **fixed**. Its rules, tokens, and both fonts are in `design-prompts/plate-block.css`, pasted into your file unchanged. For orientation: 2:1 aspect, rim in the current rank color `--rankc` (set by `game.js`), cream face (`--plate-face`, or a player-chosen pastel via `--pbg`, or black at Liftoff), proportional `2.5%/5%` radius, `.ptop` label and `.pline` clue letters in the embedded **'License Plate'** face, an `.odo` odometer, a hover blur with the `.platecover` scrim, and two `.designlayer` canvases for the player's border style, emoji stickers, and drawing. The plate has a back: the **Challenge Plate** (`.plate.challenge`, one clue a day with 1–3 answers; find one). Both faces live in `.plateflip`; clicking either face flips the pair (`.plateflip.flipped`, `body.flipped`; `body.chaldone` once solved). The flip mechanics are in the block too. The only plate token a theme sets is `--plate-shadow`. The `.explate` example plate in the rules modal is part of the block too.

**Ranks.** Seven: Pedestrian, Learner's Permit, Licensed, Cruisin', Speeding, Overdrive, Liftoff, with fixed colors grey `#8a8781`, black `#17151a`, green `#1e6b34`, blue `#1b3a8c`, orange `#c05621`, violet `#6b3fa0`, gold `#a8781a`. `--rankc` is available to the theme for anything *outside* the plate (the rail's progress line, a tint behind the plate, the current rank label); the plate's use of it is fixed.

**Road-trip rail** `.trip`: an SVG with a dotted `--bar` polyline (the road ahead), a solid `--accent` progress polyline, `.tripdot` circles per rank (cream fill, `--bar` stroke; accent when reached; larger when current), and `.sname` rank labels (muted; ink when reached; accent, 16px bold when current). The SVG is built by `game.js` with `stroke="var(--bar)"`, `fill="var(--card)"`, `stroke="var(--accent)"` attributes, so you restyle it through those tokens and through CSS on `.tripdot`/`#tripprog` (CSS presentation properties override SVG attributes). A `.togo` pill ("N points to go", positioned by `game.js` beside the next unattained stop: under its name on the vertical rail, above its dot on the horizontal one) reads `--card`/`--hair`/`--muted` and is the theme's to restyle. Vertical zigzag beside the plate at ≥1401px; horizontal strip below it otherwise; on mobile only the current label and the `.togo` pill show.

**Entry** `form`: the input feeds whichever plate face is up (locked when that puzzle is done; `body.fin.flipped:not(.chaldone) #form` stays visible so the challenge remains playable after Finish; `#hintbtn` hides while flipped). Centered `input` (uppercase, `.08em` tracking, `--radius` 10px, `--hair` border, accent border on focus) and an accent "Enter" `button`. `.msg` below it: fades/slides in; `.ok` good-green, `.err` bad-red, `.gold` VP, `.extra` blue; may contain a small dashed-outline rescue button. `.actions`: outline buttons (Finish, Share, Copy) plus `#hintbtn`, a solid blue button; `.gated` buttons sit at 45% opacity until finished.

**Disclosures** `.disc` (Stats, Yesterday) below the play card, on the slab not on a card: `.dischead` bold text button with a rotating `.chev`, body opens via `grid-template-rows` 0fr→1fr, `.discpad` has a 2px left border. Stats: `.tiles` (big number + tiny tracked label) and `.distrow` histogram (name, thin `--bar` bar, count; today's row accent). Yesterday: `.ysub`, `.ychal` (yesterday's Challenge Plate clue and answers, the found one in `b` gold), `.seg.ytabs` (Standard / Extra), `.ylist` columns of `.yword` (got = ink bold; vp = gold; extra = blue; missed = muted).

**Modals** `.overlay` (ink at 45%) + `.modal` (cream, 14px radius, 580px, `modalin` spring entrance). Instances: rules (with the fixed `.explate` beside `.exlist` example words), welcome (centered logo + primary button), finish (`.finishscore`, `#plateimg` — the 880×440 share canvas, painted by `game.js`, shown at ≤520px with a 14px radius and hover scale; `.plateflash` copied overlay; `.finishrow` outline buttons), Liftoff (gold `h2`, primary + outline buttons), designer (`.designm`: left = preview canvas `#dsgncv` + `.rankrow` of `.rankchip` pills + footer buttons; right = `.dsgntabs` segmented tabs and panes: `.bggrid` of `.bgswatch` color squares, `.bgrid` of `.bswatch` border thumbnails, sticker controls with range sliders + `.stktray` emoji grid, draw pane with `.swatch` circles and `.seg` groups), and dev-only modals (password, wordlist manager `.wlm`, token).

**Shared controls.** `.seg` segmented button groups (hair border, `--radius`, active = solid accent), `.rankchip` pills (colored by `--rc`, set per chip by `game.js`), `button.primary` solid accent, range inputs with `accent-color`, the `.slider` toggle.

**Mobile regime (≤980px).** `#form` becomes a fixed bottom bar (cream, 14px radius, heavy shadow); `.floatplate` is a fixed mini plate above it, toggled by `.floattoggle` (it holds its own `.plateflip` with both faces and flips on tap; its position, width, and shadow are the theme's, and its `.platecover` is hidden); `.msg` becomes a fixed toast with a cream pill background; the designer button is hidden; the logo shrinks to 44px.

## Invariants (ask before breaking any of these)

1. **The plate is fixed.** `plate-block.css` is pasted verbatim: rank colors, the black Liftoff face, the cream default face and the `PLATE_BGS` pastels, `--plate-bw`, geometry, the 'License Plate' face on `.pline`, Atkinson Hyperlegible Next on `.ptop`/`.pbot`/`.platecover`, the cover scrim colors, the odometer, the design layers, and `.explate`. A theme sets `--plate-shadow` and nothing else inside the block. Style the plate's *surroundings* (wrappers, the card it sits on, a tinted field behind it) instead. The share image and designer preview are painted by `game.js` and are untouched; `#plateimg`'s CSS frame (radius, shadow, hover) is the theme's.
2. **The style's typefaces replace Atkinson everywhere outside the plate**, including the word list and input. Use the roles the style assigns (display, body, labels, mono). Check the word list at 16–18px uppercase and the `.count`/score numerals at 13–14px; if a display face is unreadable there, use the style's body face for those, not Atkinson.
3. **Four semantic colors stay distinguishable:** good (accepted word), bad (rejected), gold (Vanity Plate), extra (off-list Extra word, currently blue). Recolor within the palette; do not merge them.
4. **Mobile keeps the fixed entry bar, floating plate, and toast message.**
5. **No markup changes without asking.** Decorative elements a style wants (ornaments, frames, blobs) go in as `::before`/`::after` pseudo-elements where possible; anything needing new HTML is listed as a proposal at the end.
6. **`game.js`, the data files, and scoring are out of scope.**
</plates>

<design-system>
# Design Style: Swiss International (International Typographic Style) — for Plates

## Philosophy

Objective communication. The grid is law and is allowed to be visible. Type is a neutral grotesque sans, set flush left, heavy and uppercase for headings, with extreme scale contrast. White, black, one grey, and Swiss red `#FF3000` used as a functional signal — never as decoration. No shadows; depth comes from subtle CSS patterns (24px grid, dots, noise). The fixed plate is the page's one full-color element, placed on the grid like a photograph in a Müller-Brockmann poster.

Keywords: precise, structural, intellectual, immediate.

## Fonts

- `inter.css` — one family for everything: 900 uppercase for display, 700 for buttons and labels, 500 for body and the word list (Inter 500 at 17px uppercase, `.06em` tracking), 400 for modal paragraphs.

```
--font:'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
```

## Tokens (`:root`)

```
--bg:#FFFFFF;  --card:#FFFFFF;  --ink:#000000;  --muted:rgba(0,0,0,.55);
--accent:#FF3000;  --accent-ink:#FFFFFF;
--grey:#F2F2F2;
--good:#000000;  --bad:#FF3000;  --gold:#000000;  --extra:#0037C0;   /* see semantics */
--chip:#F2F2F2;  --bar:#000000;  --hair:#000000;
--radius:0px;  --shadow:none;
--plate-shadow:none;
```

Semantics: `.msg.ok` black 700 with a 6px black square `::before`; `.msg.err` red; `.row.vp`/`.yword.vp` black with a red `.tag.vp` and `border-left:2px solid #FF3000; padding-left:6px`; `.row.extra`/`.yword.extra` `#0037C0`.

Body texture: no tan tile. `body` white with an SVG noise overlay at 1.5% (`.page::before`, fixed). `.page` carries a 24px grid pattern at 3% (two `linear-gradient`s, `background-size:24px 24px`). Muted panels (`.discpad`) use `#F2F2F2` with a 16px dot matrix at 4%.

## Element by element

**Header.** Flush left. `.logo` 56px. `.byline` Inter 500 uppercase 11px `letter-spacing:.15em`, in a cell with `border-left:1px solid #000; padding-left:14px`. `.titlelinks` uppercase 700 12px; hover = red text. `.titlebar` → `height:4px; background:#000; opacity:1`.

**Layout.** Visible grid: `.half.left { border-right:4px solid #000 }` at ≥1401px (`border-bottom` below). Everything flush left: `.half { align-items:flex-start }`, `.cardhead`, `.finishrow { justify-content:flex-start }`, `.modal.welcome { text-align:left }` (the logo may stay centered).

**Cards.** `.card`: white, `border:2px solid #000` (4px at ≥1401px), no radius, no shadow. `.cardhead` 900 uppercase 28px `letter-spacing:-.02em`; `.count` 500 uppercase 11px `letter-spacing:.12em`. `.rule` → 2px black.

**Word list.** Rows Inter 500 17px flush left, `border-bottom:1px solid rgba(0,0,0,.2)`, `column-rule:2px solid #000`. Scores 500 tabular. `.tag.vp`/`.tag.snug`: 700 uppercase 10px in a 1px-bordered box, no radius.

**Around the plate.** `--plate-shadow:none`. The plate sits flush left in `.playmain` below 1401px (`.playmain { align-items:flex-start }`); at ≥1401px it already fills its column. No wrapper, no tint — white field, black rules, colored plate.

**Rail — the transit map.** `--bar:#000` for the road; `#tripsvg polyline:first-child { stroke-dasharray:8 6; stroke-linecap:butt; opacity:.3 }`; `#tripprog { stroke:#000; stroke-width:4 }`; `.tripdot { stroke:#000; stroke-width:2 }`. Reached dots fill red via `--accent` (`game.js`) — red as the signal for reached stops is acceptable Swiss usage. Labels 700 uppercase 10px `letter-spacing:.12em`; `.sname.current` red 12px. Index prefixes (`01`–`07`) need markup — see proposals.

**Entry.** `input`: white, `border:2px solid #000`, no radius, Inter 500 uppercase, `text-align:left`; focus = red border. Enter button: black fill, white 700 uppercase 12px `letter-spacing:.15em`; hover = red fill; `transition:background-color 150ms linear`. `.msg` 500 15px, `justify-content:flex-start`. Rescue: 1px black solid.

**Actions.** 2px black outline, uppercase 700 12px, `justify-content:flex-start`; hover = black fill. `#hintbtn` `#0037C0` fill white text. `.gated` 35%.

**Disclosures.** `.dischead` 900 uppercase 22px; `.chev::before { content:'+' }` rotating 90°. `.discpad`: `#F2F2F2` + dot matrix, `border-left:4px solid #000`. `.tile b` 900 48px; `.tile span` 500 uppercase tracked. `.distrow .dbar i` black, `border-radius:0`; today red. `.seg.ytabs`: 2px black boxes, active black fill.

**Modals.** `.overlay` black 60%. `.modal` white, `border:4px solid #000`, no radius, no shadow, `text-align:left`; `modalin` → 150ms fade. `h2` 900 uppercase 32px black. `.close` 40px bordered square. Paragraphs Inter 400 16px. `#plateimg`: `border-radius:0; border:2px solid #000`; hover = red border, no scale. Liftoff `h2` black.

**Designer.** `.dsgntabs`/`.seg`: 2px black, active black fill, inactive hover red text. `.rankchip`: `border-radius:0`, 2px black, 700 uppercase 11px; active keeps `var(--rc)`. `.bgswatch`/`.swatch`: 2px black, active = red border. Range `accent-color:#FF3000`.

**Mobile.** `#form`: white, `border-top:4px solid #000`, no radius, no shadow. `.floatplate .plate { box-shadow:none; outline:2px solid #000 }`. Toast: white, 2px black, flush-left text.

## Motion

Instant to 200ms, `ease-out`/linear. Hover states are full color changes, never fades. Plus icons rotate 90°. Modal fade only. Remove `pop`.

## Bold choices (required)

1. 4px black rules making the two-column grid visible.
2. Everything flush left, including the plate below 1401px.
3. Red only as a signal: current rank, reached stops, focus, error, active swatch.
4. 24px grid and dot-matrix textures on slab and panels.
5. Inter 900 uppercase display at large scale.
6. The plate as the one full-color element on the grid.

## Do not

- Use red as a fill for anything that is not a state signal.
- Center text that can be set flush left.
- Add a shadow, gradient, or radius outside the plate block.
- Write section-label words.

## Proposals needing markup

- Numeric index prefixes (`01`–`07`) on `.sname` labels — a `data-i` attribute set by `game.js` and rendered with `::before { content:attr(data-i) }`.
- An empty numbered-label slot above the logo.
</design-system>
