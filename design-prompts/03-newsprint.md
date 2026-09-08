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
# Design Style: Newsprint — for Plates

## Philosophy

Print journalism: warm off-white paper, ink black, one spot red used sparingly, massive serif headlines over small legible body text, visible column rules, high information density, zero radius. The page is a broadsheet; the daily puzzle is the front-page item. The fixed plate, with its rank colors on cream, is the one color photograph on the page — the rest is ink, paper, and a red rule or two.

Keywords: authoritative, dense, crisp, dated.

## Fonts

- `playfair-display.css` (roman + italic) — headlines: card heads, modal titles, disclosure heads, drop caps.
- `lora.css` (roman + italic) — body: modal paragraphs, `.msg`, `.byline`, `.empty`.
- `inter.css` — UI: word-list rows, input, buttons, `.sname`, tabs (Inter 500 uppercase at 16–18px for rows).
- `jetbrains-mono.css` — data: `.count`, scores, `.tile`, `.tag`, `.buildtag`, `.devlabel`, dates.

```
--font-serif:'Playfair Display', 'Times New Roman', serif;
--font-body:'Lora', Georgia, serif;
--font:'Inter', 'Helvetica Neue', sans-serif;      /* default */
--font-mono:'JetBrains Mono', 'Courier New', monospace;
```

## Tokens (`:root`)

```
--bg:#F9F9F7;  --card:#F9F9F7;  --ink:#111111;  --muted:#737373;
--accent:#CC0000;  --accent-ink:#F9F9F7;
--good:#111111;  --bad:#CC0000;  --gold:#111111;  --extra:#1B3577;   /* see semantics */
--chip:#F5F5F5;  --bar:#E5E5E0;  --hair:#111111;  --hairsoft:#E5E5E0;
--radius:0px;  --shadow:none;  --hard:4px 4px 0 0 #111111;
--plate-shadow:none;
```

Semantics: `.msg.ok` ink 700 with a 6px filled square `::before`; `.msg.err` red; `.row.vp`/`.yword.vp` **inverted** (ink bar, paper text) with `.tag.vp` red; `.row.extra`/`.yword.extra` dark spot blue `#1B3577`.

Body texture: replace the tan tile with the 4×4 dot pattern at 4% ink (the style's SVG data URI) on `body`; a 3px graph-paper overlay (`::before`, `background-size:3px 3px`, 2% lines) on `.card`.

## Element by element

**Masthead.** `.titlerow` becomes the masthead: `.logo` 72px; `.titlebar` → a **double rule** (`height:6px; border-top:4px solid #111; border-bottom:1px solid #111; background:none; opacity:1`). `.byline` Lora italic under the logo. `.titlelinks` buttons: mono uppercase 11px `letter-spacing:.15em`, ink; hover red. `.buildtag` (dev only) already reads as an edition number in mono.

**Layout.** Collapsed newspaper grid: `.half.left { border-right:1px solid #111; padding-right:… }` at ≥1401px; gap tightened. Below 1400: `border-bottom` instead.

**Cards.** `.card`: no radius, no shadow, `border:1px solid #111`, tighter padding (`--sp` 0.4 → 0.34). `.cardhead` Playfair 900 26px; `.count` mono. `.rule` → 1px ink. Ornamental divider via `.rule::after { content:'✦ ✦ ✦' }` centered, serif, `letter-spacing:1em`, 30% ink, on the word card only (`.wordcard .rule::after`) — the glyph falls back to a system font, which is fine.

**Word list.** Rows Inter 500 16px; `border-bottom:1px solid var(--hairsoft)`; `column-rule:1px solid #111`. Scores mono 13px. Justify nothing here (uppercase single words). `.cl.buried` red.

**Around the plate.** `--plate-shadow:none`. The play card is a ruled paper box; the plate sits in it like a printed photograph. On card hover, nothing. (The plate's own hover blur is in the block.) 

**Rail — the ticker.** `--bar:#E5E5E0` for the dotted road ahead; `#tripprog { stroke:#111 }`; `.tripdot { stroke:#111; stroke-width:1.5 }`. Labels mono uppercase 10px `letter-spacing:.12em`; `.sname.current` red 12px with `text-decoration:underline; text-decoration-color:#CC0000`. Horizontal rail: `.trip { border-top:1px solid #111; border-bottom:1px solid #111 }`.

**Entry.** `input`: transparent, `border:none; border-bottom:2px solid #111`, mono 20px, no radius; focus = `background:#F0F0F0`. Enter button: ink fill, paper text, mono uppercase 12px `letter-spacing:.15em`; hover inverts with `box-shadow:inset 0 0 0 1px #111`; 150ms. `.msg` Lora italic 15px. Rescue: 1px ink outline, solid.

**Actions.** 1px ink, mono uppercase 11px, invert on hover. `#hintbtn` ink fill (blue goes). `.gated` 40%.

**Disclosures.** `.dischead` Playfair 700 24px; `.chev::before { content:'+' }` mono, rotating 45°. `.discpad` left border 1px ink. `.tile b` Playfair 40px; `.tile span` mono uppercase. `.distrow .dbar i` ink 25%; today solid ink with the count inverted. `.ylist { column-rule:1px solid #111 }`. `.seg.ytabs`: no box — text tabs, active = 2px red underline.

**Modals.** `.overlay` ink 55%. `.modal` paper, no radius, `border:1px solid #111`, no shadow; `modalin` → 150ms fade. `h2` Playfair 700 30px ink with `border-bottom:1px solid #111`. Paragraphs Lora 15px `text-align:justify; hyphens:auto`; `.modal p:first-of-type::first-letter` Playfair 3.2em float drop cap (rules and welcome). `#plateimg`: no radius, `border:1px solid #111`; hover = `box-shadow:var(--hard); transform:translate(-2px,-2px)` instead of scale. `.copynote` mono. Liftoff `h2` ink (gold stays on the plate).

**Designer.** `.dsgntabs`/`.seg`: 1px ink, no radius, active = ink fill. `.rankchip`: `border-radius:0`, mono 11px, 1px ink; active keeps `var(--rc)`. `.bgswatch` 1px ink, active 3px. `.swatch` circles, 1px ink. Range `accent-color:#111`.

**Mobile.** `#form`: paper, `border-top:1px solid #111`, no radius, no shadow. `.floatplate .plate { box-shadow:none; outline:1px solid #111 }`. Toast: paper, 1px ink, mono.

## Motion

150–200ms `ease-out`. Hard shadow + translate on `#plateimg` hover. `pop` 120ms. No floating, no bounce.

## Bold choices (required)

1. Double-rule masthead.
2. Visible column rules between the panels and inside multi-column lists.
3. Justified Lora paragraphs with Playfair drop caps in the modals.
4. Inverted Vanity Plate rows.
5. Red only for error, current rank, VP tag, and the active tab underline.
6. The plate as the page's one color photograph.

## Do not

- Round a corner or blur a shadow (outside the plate block).
- Put red on black.
- Write the edition line, a figure caption, or a headline.

## Proposals needing markup

- A mono metadata strip under the masthead: today's date (data from `game.js`), an empty edition-line slot for Mark, the puzzle number.
- An empty caption slot under `#plateimg`.
</design-system>
