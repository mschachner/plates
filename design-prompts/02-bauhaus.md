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
# Design Style: Bauhaus — for Plates

## Philosophy

Form follows function, composed from circles, squares, and triangles in primary colors on off-white, grounded by black. The page is a constructed poster: thick black borders define every major element, shadows are hard and offset, sections are color-blocked, type is heavy and uppercase. The fixed plate — a rectangle of stencil type inside a colored rim — is already a Bauhaus object; the stylesheet builds the poster around it.

Keywords: constructivist, geometric, architectural, direct.

## Fonts

- `outfit.css` — one family for everything: 900 for headings and labels, 700 for buttons and tags, 500 for body and the word list (Outfit 500 at 17–18px uppercase with `.06em` tracking reads well; the round geometry suits license-plate letters).

```
--font:'Outfit', system-ui, sans-serif;
```

## Tokens (`:root`)

```
--bg:#F0F0F0;  --card:#FFFFFF;  --ink:#121212;  --muted:#121212;   /* secondary text = black at smaller size/weight, never grey */
--red:#D02020;  --blue:#1040C0;  --yellow:#F0C020;
--accent:#D02020;  --accent-ink:#FFFFFF;
--good:#108040;  --bad:#D02020;  --gold:#9A7A00;  --extra:#1040C0;
--chip:#E0E0E0;  --bar:#121212;  --hair:#121212;
--radius:0px;  --shadow:none;
--hard-s:4px 4px 0 0 #121212;  --hard-m:6px 6px 0 0 #121212;  --hard-l:8px 8px 0 0 #121212;
--plate-shadow:var(--hard-l);
```

`--bad` and `--accent` are both red; the difference is carried by context (a message versus a button). If that reads badly, make `.msg.err` black on a yellow block.

Body texture: none on `body` (flat `#F0F0F0`); optional 20px dot grid at 8% on `.page::before`.

## Element by element

**Slab.** `.page`: `#F0F0F0`, `border-left/right:4px solid #121212`, no drop shadow. Mobile: no border.

**Header.** `.logo`: wrap effect via the `h1` — `h1 { border:4px solid #121212; background:#fff; padding:8px 14px; box-shadow:var(--hard-m); display:inline-flex }`, logo `filter:none`. Geometric mark: `h1::after` draws a 14px red circle; add a blue square and yellow triangle only if Mark approves a decorative element (proposal). `.titlelinks` buttons: uppercase 900 14px `letter-spacing:.06em`; hover = yellow background block. `.titlebar` → `height:4px; background:#121212; opacity:1`.

**Layout.** Keep the grid. Every major container carries `border:4px solid #121212` (2px below 980px).

**Cards.** `.card`: white, `border:4px solid #121212`, `border-radius:0`, `box-shadow:var(--hard-l)`. Corner ornament via `.card::after`: 12px square, red on `.wordcard`, blue circle (`border-radius:50%`) on `.playcard`, top-right, `aria-hidden` implied (pseudo-elements are not read). `.cardhead` uppercase 900 22px `letter-spacing:-.02em`; `.count` 700. `.rule` → 4px black.

**Word list.** Rows 500 weight 18px with `border-bottom:2px solid #121212`. `.row.vp`: **yellow color field** (`background:var(--yellow); color:#121212`). `.tag.vp`/`.tag.snug`: 900 uppercase 10px in a 2px-bordered chip. `.row.extra` blue. `.cl.buried` red.

**Around the plate.** `--plate-shadow:var(--hard-l)` — the one plate token, and it turns the plate's soft shadow into a hard black offset. The play card behind it is white with the 4px border. Nothing else touches the plate.

**Rail.** `--bar:#121212` makes the road black; override `#tripsvg polyline:first-child { stroke-dasharray:8 8; stroke-linecap:butt; opacity:.35 }` for the road ahead, and `#tripprog { stroke:var(--rankc) }` so progress is in the current rank color. `.tripdot { stroke:#121212; stroke-width:3 }`; `game.js` fills reached dots with `--accent` (red) — acceptable, red stops. Labels uppercase 700 11px; `.sname.current` 13px black on a yellow block (`background:var(--yellow); padding:1px 6px`).

**Entry.** `input`: white, `border:4px solid #121212`, no radius, 900 weight; focus = yellow background. Enter button: red, white uppercase 900, 4px black border, `--hard-s`; `:active { transform:translate(2px,2px); box-shadow:none }`. `.msg.ok` green 700; `.msg.gold` black on yellow; `.msg.err` red 700. Rescue button: 2px solid black, no dash.

**Actions.** White, 2px black border, `box-shadow:3px 3px 0 0 #121212`, press effect. `#hintbtn`: blue fill, white text, black border. `.gated` 40%, no shadow.

**Disclosures.** `.dischead` uppercase 900 22px; `.chev::before` a black triangle (`clip-path:polygon(0 0,100% 50%,0 100%)`) rotating 90°. `.discpad` left border 4px black. `.tile b` 900 44px, tiles colored in rotation via `:nth-child` (red, blue, black). `.distrow .dbar i` black, `border-radius:0`; today red.

**Modals.** `.overlay` black 60%. `.modal` white, no radius, 4px black border, `box-shadow:12px 12px 0 0 #121212`; `modalin` → 180ms slide, `ease-out`. `h2` uppercase 900 28px black on a colored block (`display:inline-block; padding:4px 10px`): red for rules and finish (`#rulesmodal h2`, `#finishmodal h2`), blue for welcome, yellow for Liftoff (`.liftoffm h2 { color:#121212 }`). `.close` a 36px bordered square. `#plateimg`: `border-radius:0; border:4px solid #121212; box-shadow:var(--hard-m)`; hover `translate(-2px,-2px)` with `--hard-l`.

**Designer.** `.dsgntabs`/`.seg`: 2px black borders, no radius; active = red (tabs) / blue (segs) with white text. `.rankchip`: `border-radius:0`, 2px black border; active keeps `background:var(--rc)`. `.bgswatch` 2px black border, active 4px. `.bswatch` 2px border. `.swatch` circles 3px black border. Footer `button.primary` red with press effect.

**Mobile.** `#form`: white, `border-top:4px solid #121212`, no radius, `box-shadow:0 -6px 0 0 #121212`. `.floatplate .plate { box-shadow:var(--hard-m) }`. Toast: white, 3px black border, hard shadow.

## Motion

Mechanical: 150–200ms `ease-out`. Buttons press; cards lift 2px on hover with the shadow growing 2px. Modal slide, no scale.

## Bold choices (required)

1. 4px black borders on slab edges, cards, input, modals.
2. Hard offset shadows only; the plate's shadow becomes one via `--plate-shadow`.
3. Vanity Plate row as a yellow color field; yellow blocks behind modal titles and the current rank label.
4. Uppercase 900 display type; no light weights.
5. Black road, rank-colored progress, red stops on the rail.

## Do not

- Use grey for secondary text.
- Use a radius other than 0 or a full circle.
- Soften a shadow.
- Write any caption or label.

## Proposals needing markup

- A three-shape geometric mark (circle, square, triangle) beside the logo.
</design-system>
