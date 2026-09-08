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
# Design Style: Flat Design — for Plates

## Philosophy

Zero artificial depth. No shadows, bevels, textures, or realistic gradients; hierarchy through size, color, and typography. Color is structure — solid blocks define sections and grouping instead of lines. Corners are consistently and moderately rounded (6–8px). Hover feedback is a color shift or a scale, never a lift. The fixed plate keeps its soft cream face and rank rim; the stylesheet removes every other shadow and hairline and replaces them with color blocks, one of which follows the current rank.

Keywords: crisp, graphic, digital-native, functional.

## Fonts

- `outfit.css` — one family: 800 headings (`letter-spacing:-.02em`), 600 buttons and labels (uppercase, `letter-spacing:.06em`), 500 body and word list (Outfit 500 at 17px uppercase), 400 modal paragraphs.

```
--font:'Outfit', system-ui, sans-serif;
```

## Tokens (`:root`)

```
--bg:#FFFFFF;  --card:#FFFFFF;  --band:#F3F4F6;  --ink:#111827;  --muted:#6B7280;
--accent:#3B82F6;  --accent-ink:#FFFFFF;  --secondary:#10B981;  --amber:#F59E0B;
--good:#10B981;  --bad:#EF4444;  --gold:#D97706;  --extra:#7C3AED;   /* violet: blue is now the accent */
--chip:#E5E7EB;  --bar:#E5E7EB;  --hair:transparent;
--radius:8px;  --shadow:none;
--plate-shadow:none;
```

Body texture: none. `body` white, no tile.

## Element by element

**Slab → bands.** `.page` becomes a full-width white page: `width:100%; box-shadow:none; background:#fff`. Content width is kept by giving `.pagehead`, `.layout`, and `.discs` `max-width:1480px; margin-inline:auto`. The `.layout` region sits on a **grey band**: since `.layout` is a direct child of `.page` and bands must run edge to edge, use `.layout { background:var(--band); padding:… ; box-shadow:0 0 0 100vmax var(--band); clip-path:inset(0 -100vmax) }` — the classic full-bleed trick without new markup. Header and disclosures stay white.

**Header.** `.logo` 56px, `filter:none`. `.titlelinks` 600 `--ink`; hover accent; `#designbtn` becomes a solid accent 8px-radius button (white text, `padding:8px 14px`). `.titlebar` removed (`display:none`).

**Cards.** `.card`: white blocks on the grey band — `border:none; border-radius:8px; box-shadow:none`. `.cardhead` 800 22px; `.count` 500 `--muted`. `.rule` → `height:4px; background:#E5E7EB`.

**Word list.** Rows 500 17px, `border-radius:6px`, hover `background:var(--band)`. `.row.vp`: amber-50 block (`#FFFBEB`) with `--gold` text. `.row.extra` violet. `.cl.buried` accent blue. `.tag.vp`/`.tag.snug`: solid badges (amber / blue fill, white text, 4px radius, 600).

**Around the plate.** `--plate-shadow:none`. `.playmain` gets a **rank-tinted color block** behind the plate: `background:color-mix(in srgb, var(--rankc) 10%, #fff); border-radius:8px; padding:calc(24px*var(--sp))`, with `transition:background-color .6s ease` to match the plate. The game state becomes a color field; the plate itself is untouched. (`--rankc` is set on `:root` by `game.js`, so it resolves here.)

**Rail.** `--bar:#E5E7EB`; `#tripsvg polyline:first-child { stroke-dasharray:none; stroke-width:4 }` (solid track — Flat has no dotted lines); `#tripprog { stroke:var(--rankc); stroke-width:4 }`; `.tripdot { stroke-width:0 }` so dots are filled discs (`game.js` fills reached dots with `--accent`; ahead dots with `--card` white — set `.tripdot { stroke:#E5E7EB; stroke-width:4 }` instead so unreached discs show as grey rings). Labels 600 12px `--muted`; `.sname.current` in `var(--rankc)`, 14px.

**Entry.** `input`: `background:var(--band); border:none; border-radius:8px`; focus = white + `border:2px solid var(--accent)` (add the border at rest as `2px solid transparent` to avoid layout shift). Enter button: solid accent, 600 white, 8px radius, `min-height:52px`; hover `#2563EB` + `transform:scale(1.03)`; `transition:all 200ms`. `.msg.ok` emerald 600; `.msg.err` red; `.msg.gold` amber-600; `.msg.extra` violet. Rescue: `border:2px solid var(--good)` solid, 6px radius.

**Actions.** `background:var(--band); border:none; border-radius:8px; color:var(--ink)` 600; hover `#E5E7EB` + `scale(1.03)`. `#hintbtn` solid accent. `.gated` 40%, no scale.

**Disclosures.** `.discpad`: `border-left:none; background:var(--band); border-radius:8px; padding:16px 20px`. `.dischead` 800 20px; `.chev::before` a solid triangle. `.tile b` 800 40px; tiles colored via `:nth-child` (blue, emerald, amber). `.distrow .dbar i` `#E5E7EB`, 4px radius; today solid accent. `.seg.ytabs`: `background:var(--band); border:none`, active solid accent.

**Modals.** `.overlay` `#111827` 60%. `.modal` white, 12px radius, no border, no shadow. `h2` 800 26px `--ink` with `::before` a 48×4px accent bar (`display:block; margin-bottom:10px`). Paragraphs 400 16px. `#plateimg`: 8px radius, hover `scale(1.02)` stays. Liftoff `h2` amber-600 on an amber-50 block.

**Designer.** `.dsgntabs`, `.seg`: `background:var(--band); border:none; border-radius:8px`, active solid accent. `.rankchip`: `border-radius:6px; background:var(--band); border:none`; active keeps `var(--rc)`. `.bgswatch`: `border:none; border-radius:6px`; active = `outline:2px solid var(--ink); transform:scale(1.1)`. `.swatch`: no border; active = `outline:3px solid var(--ink)`. Range `accent-color:var(--accent)`.

**Mobile.** `#form`: white, `border-radius:0`, no shadow, `border-top:4px solid #E5E7EB`. `.floatplate .plate { box-shadow:none; outline:4px solid #fff }`. Toast: `#EFF6FF` block, ink text; `.msg.err` on `#FEF2F2`.

## Motion

200ms `ease-out` for color and scale, 300ms for larger transforms. Hover = `scale(1.03)` on buttons, `scale(1.02)` on `#plateimg`. No translate-lift. The rank tint behind the plate transitions at 600ms.

## Bold choices (required)

1. Full-bleed alternating bands instead of a floating slab.
2. The plate's surroundings tinted by the current rank at 10%.
3. No borders anywhere except the plate rim and focused inputs.
4. Multi-color stat numbers and solid badge tags.
5. Solid 4px rail with filled discs.
6. Scale-on-hover feedback; zero shadows.

## Do not

- Add a shadow, texture, or gradient.
- Use pill buttons — 8px only; pills are reserved for tags.
- Reintroduce hairline borders.
- Write copy for any block.

## Proposals needing markup

- None required; the full-bleed band uses `clip-path`/`box-shadow` on `.layout`.
</design-system>
