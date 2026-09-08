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
# Design Style: Minimalist Monochrome — for Plates

## Philosophy

Reduction to essence: black, white, and typography. No accent hue, no gradients, no shadows, no radius. Hierarchy comes from scale, line weight, inversion, and negative space. In Plates this produces one deliberate exception: the score plate keeps its rank colors and cream face, so it is **the only colored object on the page** — a colored plate set on a black-and-white catalog page. Everything else earns attention with lines.

Keywords: austere, editorial, precise, still.

## Fonts (paste from `design-prompts/fonts/`)

- `playfair-display.css` (roman + italic) — display: card heads, modal titles, disclosure heads, byline, the cover of nothing (the plate's cover keeps Atkinson).
- `source-serif-4.css` — body: modal paragraphs, `.msg`, list rows, `.yword`, the input.
- `jetbrains-mono.css` — labels and numerals: `.count`, scores, `.tile span`, `.sname`, `.tag`, `.buildtag`, `.devlabel`.

```
--font-display:'Playfair Display', Georgia, serif;
--font:'Source Serif 4', Georgia, serif;          /* body default */
--font-mono:'JetBrains Mono', ui-monospace, monospace;
```

## Tokens (`:root`)

```
--bg:#FFFFFF;  --card:#FFFFFF;  --ink:#000000;  --muted:#525252;
--accent:#000000;  --accent-ink:#FFFFFF;
--hair:#000000;  --hairlight:#E5E5E5;  --chip:#F5F5F5;  --bar:#E5E5E5;
--good:#000000;  --bad:#000000;  --gold:#000000;  --extra:#000000;   /* carried typographically, below */
--radius:0px;  --shadow:none;
--plate-shadow:none;
```

Body texture: remove the tan tile. `body` gets a 1px horizontal-rule pattern at ~1.5% (`repeating-linear-gradient(0deg, transparent 0 1px, #000 1px 2px)`, `background-size:100% 4px`) plus an SVG fractal-noise overlay at ~2% on `.page::before` (fixed, `pointer-events:none`). Required — without texture the page reads as flat.

## Semantic colors without color

Invariant 3 requires good / bad / gold / extra to stay distinguishable; Monochrome forbids hue outside the plate. Encode them typographically:

- **good** (`.msg.ok`): black, preceded by a 6px filled square (`::before`).
- **bad** (`.msg.err`): black italic; the rejected word (already in the message) reads as strikethrough via `text-decoration` on the message's `b` if present, otherwise italic alone.
- **gold / Vanity Plate** (`.row.vp`, `.yword.vp`, `.msg.gold`): **inverted** — black background, white text, square. Inversion is this style's only emphasis, and the VP is the one word per day that earns it. `.tag.vp` white on black.
- **extra** (`.row.extra`, `.yword.extra`, `.msg.extra`): 1px underline, `text-underline-offset:3px`.
- `.cl` keeps its synthesized weight; `.cl.buried` gets a 1px bottom border instead of a tint.

## Element by element

**Canvas and slab.** `.page`: no shadow, no distinct background; 1px black rules on left and right edges (a ruled column). Mobile: no rules.

**Header.** `.logo` `filter:grayscale(1) contrast(1.2)`, no drop shadow. `.titlebar` becomes a 4px solid black rule with a second 1px rule 6px below (`border-top` + `border-bottom` on a 6px-tall element). `.byline` Playfair italic. `.titlelinks` buttons: mono, uppercase 11px `letter-spacing:.12em`; hover = underline only.

**Layout.** Keep the grid; make it visible with a 1px black rule between the columns (`.half.left { border-right:1px solid #000 }` at ≥1401px, `padding-right` to match the gap). Increase `--sp` slightly (0.4 → 0.48) for more negative space.

**Cards.** `.card`: no radius, no shadow, `border:1px solid #000`. `.cardhead` Playfair 700 28px; `.count` mono 12px `letter-spacing:.1em`. `.rule` black 1px.

**Word list.** Rows Source Serif 18px, separated by 1px `--hairlight` bottom borders (a ledger). Scores mono 13px. `pop` removed (`animation:none`) — motion here is instant. Column rule: `column-rule:1px solid #000`.

**Around the plate.** `--plate-shadow:none`. The play card is a bordered white field; nothing else around the plate — the colored plate on white is the composition. Do not add wrappers.

**Rail.** `--bar:#E5E5E5` gives a light dotted road; override `#tripprog { stroke:#000 }` (the progress line is black, not accent) and `.tripdot { stroke:#000 }`; reached dots get `fill:#000` (`game.js` sets `fill` to `var(--accent)` = black, so this follows). Current dot: `.tripdot` can't be selected by state, so leave the size change to `game.js`. Labels `.sname` mono uppercase 10px `letter-spacing:.14em`; `.sname.current` black, 12px, not enlarged beyond that.

**Entry.** `input`: Source Serif 20px, white, no radius, `border:none; border-bottom:2px solid #000`; focus = `border-bottom-width:4px`. Enter button: black fill, white mono uppercase 12px `letter-spacing:.14em`, no radius; hover inverts (white fill, black text, `box-shadow:inset 0 0 0 2px #000`); `transition:none`. `.msg` Source Serif 15px per the semantics above. Rescue button: 1px solid black, not dashed.

**Actions.** Outline buttons 1px black, mono uppercase 11px, invert on hover. `#hintbtn`: black fill white text (the row's primary). `.gated` 35% opacity.

**Disclosures.** `.dischead` Playfair 700 24px; `.chev` rendered as "+" via `font-size:0` on the glyph and `::before { content:'+' }`, rotating 45° when open. `.discpad` left border 1px black. `.tile b` Playfair 44px; `.tile span` mono uppercase 10px. `.distrow .dbar i` black at 25%; `.distrow.today .dbar i` black; today's count inverted (black chip, white text).

**Modals.** `.overlay` black 70%. `.modal` white, no radius, `border:1px solid #000`, no shadow; `modalin` → 120ms fade, no transform. `h2` Playfair 700 32px black. `.close` "×" 28px. Paragraphs Source Serif 17px. `#plateimg`: no radius, `border:1px solid #000`, hover = `border-width:3px` instead of scale. `.plateflash` white 85%. Liftoff `h2` black (the gold lives on the plate).

**Designer.** `.dsgntabs`, `.seg`: no radius, 1px black borders, active = black fill white text. `.rankchip`: square (`border-radius:0`), 1px black border, mono 11px; active = `background:var(--rc); color:#fff` stays (the chips preview rank colors, which are the plate's). `.bgswatch`: 1px black border, active = 3px black, no colored ring. `.bswatch` 1px border. `.swatch` (draw colors): keep the circles; chrome black; active = 3px black ring. Range `accent-color:#000`. Footer buttons as Actions.

**Mobile.** `#form` bar: white, `border-top:2px solid #000`, no radius, no shadow. `.floatplate .plate { box-shadow:none; outline:1px solid #000; outline-offset:2px }`. Toast: white, 1px black border, square.

## Motion

Instant or 100ms, linear. Keep: odometer (in the block), disclosure open at 200ms, rank-color transitions (in the block). Remove: `pop`, `#plateimg` scale, modal spring.

## Bold choices (required)

1. 4px + 1px double rule under the header.
2. Visible 1px column rule between words and play.
3. Vanity Plate rows inverted (black bar, white text).
4. Zero radius, zero shadow everywhere outside the plate.
5. Playfair display, Source Serif body, JetBrains Mono labels — three faces, strict roles.
6. The plate as the only color on the page.

## Do not

- Introduce any hue outside the plate, including in swatch chrome.
- Round any corner outside the plate.
- Add shadows to compensate for removed color — use rules and inversion.
- Write the edition line under the header or a caption under the share image. Slots stay empty and hidden.

## Proposals needing markup (for Mark, not done here)

- An empty mono "edition line" element under the header rules.
- An empty caption element under `#plateimg`.
</design-system>
