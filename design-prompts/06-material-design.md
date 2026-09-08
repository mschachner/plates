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
# Design Style: Material You (Material Design 3) — for Plates

## Philosophy

Personal, adaptive, tonal. Surfaces are tinted, not white; depth comes from tonal layering plus subtle elevation; buttons are pills; corners are generous (16–28px); interaction uses state layers (opacity overlays) and the emphasized-decelerate easing `cubic-bezier(0.2, 0, 0, 1)`. Material You derives its palette from a seed; in Plates **the current rank is the seed**. The fixed plate shows the rank; the tonal surfaces around it follow.

Keywords: friendly, soft, responsive, coherent.

## Fonts

- `roboto.css` — one family: 500 headings (Title/Headline), 400 body and modal paragraphs, 500 labels and buttons (`letter-spacing:.01em`), 500 for the word list (Roboto 500 at 17px uppercase).

```
--font:'Roboto', system-ui, sans-serif;
```

## Tokens (`:root`)

```
--seed:var(--rankc, #6750A4);   /* game.js sets --rankc on :root */
--surface:#FFFBFE;  --on-surface:#1C1B1F;  --on-surface-variant:#49454F;  --outline:#79747E;
--surface-container:color-mix(in srgb, var(--seed) 8%, #FFFBFE);
--surface-container-low:color-mix(in srgb, var(--seed) 14%, #FFFBFE);
--secondary-container:color-mix(in srgb, var(--seed) 24%, #FFFBFE);
--primary:var(--seed);  --on-primary:#FFFFFF;
--bg:var(--surface);  --card:var(--surface-container);  --ink:var(--on-surface);  --muted:var(--on-surface-variant);
--accent:var(--primary);  --accent-ink:var(--on-primary);
--good:#146C2E;  --bad:#B3261E;  --gold:#7A5B00;  --extra:#0B57D0;
--chip:var(--secondary-container);  --bar:var(--surface-container-low);  --hair:transparent;
--radius:9999px;  --r-card:24px;  --r-sheet:28px;  --r-hero:32px;
--shadow-1:0 1px 2px rgba(0,0,0,.08), 0 1px 3px 1px rgba(0,0,0,.05);
--shadow-2:0 2px 6px 2px rgba(0,0,0,.08), 0 1px 2px rgba(0,0,0,.10);
--ease:cubic-bezier(.2,0,0,1);
--plate-shadow:var(--shadow-2);
```

At Pedestrian the seed is grey and the page is neutral; at Licensed it warms green; at Liftoff the tints go gold. Add `transition:background-color .6s var(--ease)` to `.card`, `.discpad`, `.page` so the shift matches the plate's own 0.6s. Note `--primary` at Pedestrian is `#8a8781` — check the Enter button's white-on-grey contrast (≈3.2:1); if too low, use `--primary:color-mix(in srgb, var(--seed) 85%, #000)` for filled buttons only.

Body texture: none. `body` is `--surface` with two blur shapes via `body::before`/`body::after`: 60vh circles, `filter:blur(64px)`, `background:var(--seed)` at 18% and `var(--secondary-container)`, fixed, off-canvas, `pointer-events:none`, `z-index:-1`.

## Element by element

**Slab.** `.page`: `background:var(--surface); box-shadow:none; width:100%`; `.layout` becomes the hero container: `background:var(--surface-container); border-radius:var(--r-hero); padding:calc(28px*var(--sp))`.

**Header.** Top app bar: `.pagehead { position:sticky; top:0; z-index:5; backdrop-filter:blur(12px); background:color-mix(in srgb, var(--surface) 85%, transparent); border-bottom:1px solid color-mix(in srgb, var(--outline) 30%, transparent) }`. `.logo` 48px, `filter:none`. `.titlelinks` text buttons in `--primary` 500 14px with a pill state layer on hover (`background:color-mix(in srgb, var(--primary) 10%, transparent); border-radius:9999px; padding:6px 12px`). `#designbtn`: tonal button (`--secondary-container`, 16px radius, `--shadow-1`). `.titlebar { display:none }`.

**Cards.** `.card`: `--surface-container`, `border:none`, `border-radius:var(--r-card)`, `--shadow-1`; hover `--shadow-2`. `.cardhead` 500 22px; `.count` 500 14px. `.rule { display:none }`.

**Word list.** Rows 500 17px, `border-radius:16px`, hover state layer `color-mix(in srgb, var(--primary) 8%, transparent)`. `.row.vp`: `--secondary-container` fill, `--gold` text. `.tag.vp`/`.tag.snug`: assist chips (`border:1px solid var(--outline); border-radius:8px; padding:0 6px`, 12px 500). `.row.extra` `--extra`. `.cl.buried` `--primary`.

**Around the plate.** `--plate-shadow:var(--shadow-2)`. The plate sits on the `--surface-container` play card, which is itself tinted by the seed — the surroundings shift with rank while the plate stays fixed. No wrapper.

**Rail.** `--bar:var(--surface-container-low)`; `#tripsvg polyline:first-child { stroke-dasharray:none; stroke-width:4; stroke-linecap:round }`; `#tripprog { stroke:var(--primary); stroke-width:4 }`; `.tripdot { stroke:var(--surface-container-low); stroke-width:4 }`. Labels 500 12px `--on-surface-variant`; `.sname.current` `--primary` 14px 700.

**Entry.** `input` as an MD3 **filled text field**: `background:var(--surface-container-low); border:none; border-bottom:2px solid var(--outline); border-radius:12px 12px 0 0; height:56px`, Roboto 400 18px; focus = `border-bottom-color:var(--primary)`, 200ms. Enter button: **filled pill** (`background:var(--primary); color:var(--on-primary); border:none; border-radius:9999px; height:44px; padding:0 24px`, 500 14px); hover = `filter:brightness(.92)` + `--shadow-1`; `:active { transform:scale(.95) }`. `.msg`: text on a `--surface-container` pill (`padding:6px 14px; border-radius:9999px`). Rescue: outlined pill (`1px solid var(--outline)`, `--primary` text).

**Actions.** Outlined pills (`border:1px solid var(--outline); border-radius:9999px; color:var(--primary); background:none`), state layer on hover. `#hintbtn`: tonal pill (`--secondary-container`, `--on-surface`) — blue goes. `.gated` 38%, no hover.

**Disclosures.** `.dischead` 500 16px with `.chev` as a trailing expand icon (`order:2; margin-left:auto`), `border-radius:9999px`, hover state layer. `.discpad`: `--surface-container` card, 16px radius, `border-left:none`, padding. `.tile b` 400 36px; `.tile span` 500 11px. `.distrow .dbar i { border-radius:9999px; background:var(--secondary-container) }`; today `--primary`. `.seg.ytabs` → segmented buttons: `border:1px solid var(--outline); border-radius:9999px; overflow:hidden`; active `--secondary-container` with `::before { content:'✓ ' }`.

**Modals.** `.overlay` `rgba(28,27,31,.32)`. `.modal` `--surface-container`, `border-radius:var(--r-sheet)`, `--shadow-2`, no border; `modalin` 300ms `--ease`. `h2` 400 24px `--on-surface`. `.close` 40px circle with a state layer. `#plateimg`: 16px radius, `--shadow-1`, hover `scale(1.02)` + `--shadow-2`. `.finishrow button.primary` filled pill; others outlined pills.

**Designer.** `.dsgntabs` → MD3 tabs: `border:none; border-radius:0; border-bottom:1px solid color-mix(in srgb, var(--outline) 30%, transparent)`; active tab `background:none; color:var(--primary); box-shadow:inset 0 -3px 0 var(--primary)`. `.seg` → segmented pills as above. `.rankchip` → filter chips: `--surface`, `1px solid var(--outline)`; active keeps `var(--rc)` fill with white text. `.bgswatch`: 12px radius, no border; active = `outline:2px solid var(--primary); outline-offset:2px`. `.swatch`: active = ring. Range `accent-color:var(--primary)`. Footer: primary filled pill, others outlined.

**Mobile.** `#form` → bottom app bar: `--surface-container`, `border-radius:28px 28px 0 0`, `--shadow-2`, `left:0; right:0; bottom:0; padding:14px 16px 18px`. `.floatplate .plate { box-shadow:var(--shadow-2) }`. Toast: `--surface-container` pill.

## Motion

`--ease` everywhere: 200ms state layers, 300ms surfaces, 600ms seed tints. `:active { transform:scale(.95) }` on pills and chips. Blur shapes drift on a 10–12s loop; respect `prefers-reduced-motion`.

## Bold choices (required)

1. The current rank is the seed: containers, chips, blur shapes, and the hint button tint with `--rankc`.
2. Every button is a pill; the input is a filled text field with a square bottom.
3. Tonal surfaces instead of borders.
4. Sticky top app bar with backdrop blur.
5. Segmented buttons with checkmarks.
6. Bottom app bar on mobile.

## Do not

- Use pure white for any surface.
- Change a button's color on hover — overlay a state layer.
- Use a border where a tonal surface separates.
- Make a container corner smaller than 12px.
- Write snackbar or tooltip copy.

## Proposals needing markup

- None required.
</design-system>
