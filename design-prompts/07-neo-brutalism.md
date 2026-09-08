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
# Design Style: Neo-brutalism — for Plates

## Philosophy

Loud, tactile, unpolished on purpose. Every element has a thick black border and a hard offset shadow; type is heavy (700 only, at this family's top weight) and often uppercase; the palette is highlighter-bright on cream; elements are rotated a degree or two like stickers on a laptop lid; buttons press down mechanically. The fixed plate — a bordered rectangle of stencil type that players cover with stickers — is the most neo-brutalist thing on the page already. The stylesheet makes the board it sits on match.

Keywords: energetic, DIY, arcade, confident.

## Fonts

- `space-grotesk.css` — one family, **weights 300–700 only** (no 900 exists): 700 for everything visible, 500 for the rare secondary line. Word list at 700, 17px uppercase.

```
--font:'Space Grotesk', system-ui, sans-serif;
```

## Tokens (`:root`)

```
--bg:#FFFDF5;  --card:#FFFFFF;  --ink:#000000;  --muted:#000000;
--accent:#FF6B6B;  --accent-ink:#000000;   /* black on hot red */
--yellow:#FFD93D;  --violet:#C4B5FD;
--good:#2FBF71;  --bad:#FF6B6B;  --gold:#000000;  --extra:#3B6CF6;   /* gold = black on yellow, see semantics */
--chip:#C4B5FD;  --bar:#000000;  --hair:#000000;
--radius:0px;  --shadow:none;
--hs-s:4px 4px 0 0 #000;  --hs-m:8px 8px 0 0 #000;  --hs-l:12px 12px 0 0 #000;
--plate-shadow:var(--hs-l);
```

Semantics: `.msg.ok` green 700 uppercase; `.msg.err` red 700 uppercase with `::before { content:'✕ ' }`; `.row.vp`/`.yword.vp`: **yellow sticker** (`background:var(--yellow); border:3px solid #000; box-shadow:var(--hs-s); transform:rotate(-1deg)`); `.row.extra` blue 700.

Body texture: replace the tan tile with graph paper on `body` (40px grid, `rgba(0,0,0,.08)` lines) and a halftone (`radial-gradient(#000 1.5px, transparent 1.5px)`, 20px, 10%) on `.page::before`. Never flat.

## Element by element

**Slab.** `.page`: cream, `border:4px solid #000`, `box-shadow:var(--hs-l)`, `margin:24px auto` so the shadow shows. Mobile: 3px border, no shadow.

**Header.** `h1 { display:inline-flex; background:#fff; border:4px solid #000; box-shadow:var(--hs-m); padding:6px 12px; transform:rotate(-2deg) }`, logo `filter:none`. `.byline` 700 in a violet chip (`border:3px solid #000; padding:2px 8px; transform:rotate(1deg)`). `.titlelinks` buttons: 700 uppercase 14px; hover = yellow block + `outline:3px solid #000` + `--hs-s`, 100ms. `.titlebar { height:4px; background:#000; opacity:1 }`.

**Layout.** At ≥1401px, `.wordcard { transform:rotate(-.4deg) }` and `.playcard { transform:rotate(.3deg) }`. **Never rotate `.plate`, `.designlayer`, `.floatplate`, or `#plateimg`'s wrapper** — the design canvases and the share image must stay axis-aligned. A rotated `.playcard` rotates the plate inside it, so instead rotate only `.wordcard`, and leave `.playcard` square.

**Cards.** `.card`: white, `border:4px solid #000`, `border-radius:0`, `box-shadow:var(--hs-l)`. `.cardhead`: 700 uppercase 24px on a colored band — `.wordcard .cardhead { background:var(--violet) }`, `.playcard .cardhead { background:var(--yellow) }` — with `margin:-padding` to bleed to the card edges and `border-bottom:4px solid #000`. `.count` 700 in a 2px-bordered pill. `.rule { display:none }`.

**Word list.** Rows 700 17px, `border-bottom:2px solid #000`. `.tag.vp`/`.tag.snug`: badges — 700 uppercase 10px `letter-spacing:.15em`, `border:2px solid #000`, `--hs-s`, `transform:rotate(2deg)`, yellow for VP, red for snug. `.cl.buried` accent. `pop` → `scale(.9)→1` in 120ms `ease-out`.

**Around the plate.** `--plate-shadow:var(--hs-l)` — the plate's soft shadow becomes a hard black block. The play card is white with a 4px border and yellow head band. Nothing else on the plate.

**Rail.** `--bar:#000`; `#tripsvg polyline:first-child { stroke-dasharray:12 8; stroke-linecap:butt; stroke-width:4 }`; `#tripprog { stroke:var(--rankc); stroke-width:5 }`; `.tripdot { stroke:#000; stroke-width:3; filter:drop-shadow(3px 3px 0 #000) }` (a hard drop shadow on each stop). Labels 700 uppercase 11px; `.sname.current` 13px black on a yellow sticker (`background:var(--yellow); border:2px solid #000; padding:1px 6px; transform:rotate(-3deg)`; on the vertical rail keep the `translateY(-50%)` from `game.js` by composing: `transform:translateY(-50%) rotate(-3deg)`).

**Entry.** `input`: white, `border:4px solid #000`, no radius, 700 20px, `--hs-s`; focus = yellow background + `--hs-m`. Enter button: hot red, black 700 uppercase, 4px border, `--hs-s`; `:active { transform:translate(4px,4px); box-shadow:none }` 100ms linear. `.msg` a sticker badge: `border:2px solid #000; box-shadow:var(--hs-s); padding:6px 12px; transform:rotate(-2deg)`, background by semantics (green / red / yellow / blue), black text. Rescue: white, 3px solid black, press effect.

**Actions.** White, 3px black border, `--hs-s`, 700 uppercase 13px, press effect. `#hintbtn` violet fill, black text. `.gated`: 3px **dashed** border, no shadow ("not yet stuck on").

**Disclosures.** `.dischead` 700 uppercase 20px on a violet strip with 3px border and `--hs-s`; `.chev::before` black triangle rotating 90°. `.discpad`: white, 3px border, `--hs-s`, `border-left-width:3px`. `.tile b`: 700 48px, `-webkit-text-stroke:2px #000; color:var(--yellow)` (hollow display type). `.distrow .dbar i` black, `border-radius:0`; today red. `.seg.ytabs` 3px borders, active yellow.

**Modals.** `.overlay` black 55% + halftone. `.modal` white, `border:4px solid #000`, `box-shadow:16px 16px 0 0 #000`, no radius, `transform:rotate(-.5deg)` — except `#finishmodal` and `#designmodal`, which hold canvases and stay square. `h2` 700 uppercase 30px on a strip (red for rules/finish, yellow for Liftoff with black text, violet for welcome). `.close` 40px bordered square with `--hs-s`, press effect. `#plateimg`: `border-radius:0; border:4px solid #000; box-shadow:var(--hs-m)`; hover `translate(-4px,-4px)` + `--hs-l`. Liftoff `h2 { text-shadow:4px 4px 0 var(--accent) }`.

**Designer.** `.dsgntabs` 3px borders, active red; `.seg` same in violet. `.rankchip`: 2px border, `--hs-s`, `:nth-child(odd) { transform:rotate(1.5deg) }`, `:nth-child(even) { transform:rotate(-1.5deg) }`; active keeps `var(--rc)` (black text except on the black rank — leave `game.js`'s white). `.bgswatch` 3px black border, active 4px + `--hs-s`. `.swatch` 3px black, active `--hs-s`. Range `accent-color:#000`. Footer: primary red, others white, all press.

**Mobile.** `#form`: white, `border:4px solid #000`, `box-shadow:0 -6px 0 0 #000`, no radius. `.floatplate .plate { box-shadow:var(--hs-m) }`. Toast: rotated sticker badge.

## Motion

Arcade-fast: 100ms presses, 200ms lifts, `ease-linear`/`ease-out`. Badges rotate further on hover (`rotate(6deg)`). Modal entrance 180ms from `translateY(16px)`. Respect `prefers-reduced-motion`.

## Bold choices (required)

1. 4px black borders and hard offset shadows on slab, cards, input, buttons, modals; hard shadow on the plate via `--plate-shadow`.
2. Rotated sticker treatments on logo, byline, VP rows, tags, rank chips, messages — never on the plate or any canvas.
3. Hollow-outlined stat numbers.
4. Dashed "not yet stuck" gated buttons.
5. Only 700 weight on the page.

## Do not

- Use grey text.
- Use a mid-range radius.
- Blur a shadow or fade a gradient.
- Rotate `.plate`, `.playcard`, `.floatplate`, `#finishmodal`, `#designmodal`, or `#plateimg`.
- Write badge or sticker text.

## Proposals needing markup

- A decorative spinning star in the header (SVG, `aria-hidden`).
</design-system>
