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
# Design Style: High-Fidelity Claymorphism — for Plates

## Philosophy

Digital clay. Every element is a soft, matte, volumetric object lit from the top-left: convex elements bulge toward the viewer with a 4-layer shadow stack; concave elements — inputs, pressed buttons, open panels — sink in with inset shadows. Corners are aggressively rounded (20px minimum), colors are candy-bright, motion is buoyant, and buttons visibly squish. The fixed plate becomes the one hard-edged object on a soft board — deliberately: it is the thing you are playing with, and its `--plate-shadow` is the one place the clay lighting touches it.

Keywords: playful, tactile, premium-toy, safe.

## Fonts

- `nunito.css` — display: headings, stat numbers, buttons, labels (800/900).
- `dm-sans.css` — body: modal paragraphs, `.msg`, `.byline`, the word list (DM Sans 600 at 17px uppercase) and input (Nunito 800 22px in the input is fine too; pick one and use it for both input and rows).

```
--font-display:'Nunito', system-ui, sans-serif;
--font:'DM Sans', system-ui, sans-serif;          /* default */
```

## Tokens (`:root`)

```
--bg:#F4F1FA;  --card:rgba(255,255,255,.72);  --ink:#332F3A;  --muted:#635F69;
--violet:#7C3AED;  --violet-hi:#A78BFA;  --pink:#DB2777;  --sky:#0EA5E9;  --emerald:#10B981;  --amber:#F59E0B;
--accent:var(--violet);  --accent-ink:#FFFFFF;
--good:#10B981;  --bad:#E11D48;  --gold:#D97706;  --extra:#0EA5E9;
--chip:#EFEBF5;  --bar:#E4DEF0;  --hair:transparent;
--radius:20px;  --r-card:32px;  --r-hero:48px;
--clay-card:16px 16px 32px rgba(160,150,180,.2), -10px -10px 24px rgba(255,255,255,.9), inset 6px 6px 12px rgba(139,92,246,.03), inset -6px -6px 12px #fff;
--clay-btn:12px 12px 24px rgba(139,92,246,.3), -8px -8px 16px rgba(255,255,255,.4), inset 4px 4px 8px rgba(255,255,255,.4), inset -4px -4px 8px rgba(0,0,0,.1);
--clay-pressed:inset 10px 10px 20px #d9d4e3, inset -10px -10px 20px #ffffff;
--shadow:var(--clay-card);
--plate-shadow:20px 20px 40px rgba(160,150,180,.28), -12px -12px 28px rgba(255,255,255,.9);
```

Note: `--plate-shadow` is an *outer* stack only — no inset layers, because inset shadows would paint over the plate face and its stickers.

Body texture: none. `body` is `--bg` with floating blobs via `body::before` and `body::after` (60vh circles, `filter:blur(64px)`, violet and sky at 10%, fixed, off-canvas, `animation:clay-float 8s/10s ease-in-out infinite`). Cards are glass-clay (`backdrop-filter:blur(24px)`) so blobs show through.

## Element by element

**Slab.** `.page`: `--bg`, `border-radius:var(--r-hero)`, `box-shadow:30px 30px 60px #cdc6d9, -30px -30px 60px #fff`, `margin:32px auto`. Mobile: no radius, no shadow.

**Header.** `h1 { background:rgba(255,255,255,.7); backdrop-filter:blur(24px); border-radius:9999px; padding:10px 24px; box-shadow:var(--clay-card) }`, logo 60px `filter:none`. `.byline` DM Sans 500. `.titlelinks` buttons: Nunito 800 14px in small white clay pills (`--clay-btn` at half strength); hover `translateY(-2px)`; active `scale(.92)` + `--clay-pressed`. `.titlebar { display:none }`.

**Cards.** `.card`: `rgba(255,255,255,.72)`, `backdrop-filter:blur(24px)`, `border:none`, `border-radius:var(--r-card)`, `--clay-card`; hover `translateY(-2px)`, 500ms. `.cardhead` Nunito 900 24px; `.count` DM Sans 700 in a pressed pill (`--chip`, `box-shadow:inset 3px 3px 6px #d9d4e3, inset -3px -3px 6px #fff`). `.rule { display:none }`.

**Word list.** Rows 17px, `border-radius:14px`, hover `--chip` with a faint inset (the row sinks). `.row.vp`: amber clay pill (`background:linear-gradient(135deg,#FDE68A,#F59E0B)`, `--ink` text, `box-shadow:6px 6px 12px rgba(245,158,11,.3), -4px -4px 8px rgba(255,255,255,.6)`). `.tag.vp`/`.tag.snug`: tiny convex pills (gradient fill, white text). `.row.extra` sky. `.cl.buried` violet. `pop` → `scale(.85)→1` in 350ms with an overshoot curve.

**Around the plate.** `--plate-shadow` as above — the only clay applied to the plate. The play card is glass-clay; on `.plate:hover` do nothing extra (its blur/cover is in the block). No wrapper.

**Rail — the clay tube.** `--bar:#E4DEF0`; `#tripsvg polyline:first-child { stroke-dasharray:none; stroke-width:10; stroke-linecap:round }` (a pressed tube); `#tripprog { stroke:var(--rankc); stroke-width:6; stroke-linecap:round }`; `.tripdot { stroke:#fff; stroke-width:3; filter:drop-shadow(3px 3px 4px rgba(0,0,0,.18)) }` — orbs with a hard-ish drop. Labels Nunito 800 12px `--muted`; `.sname.current` 14px in `var(--rankc)`.

**Entry.** `input` recessed: `background:#EFEBF5; border:none; border-radius:20px; box-shadow:var(--clay-pressed); height:60px`, Nunito 800 22px; focus = white + `0 0 0 4px rgba(124,58,237,.2)`, 200ms. Enter button: `background:linear-gradient(135deg, var(--violet-hi), var(--violet)); border:none; color:#fff`, Nunito 800, 20px radius, 60px tall, `--clay-btn`; hover `translateY(-3px)`; active `scale(.92)` + `--clay-pressed`. `.msg`: floating clay pill (white 80%, `--clay-card`, 9999px, 600 weight), text colored by semantics. Rescue: small white clay pill, `--good` text, no dash.

**Actions.** White clay pills (`--clay-btn` with a grey-violet drop), Nunito 800 14px `--ink`; hover lift, active squish. `#hintbtn`: sky gradient (`#38BDF8→#0EA5E9`), white text. `.gated`: flat `--chip` pill, no shadow, 60%.

**Disclosures.** `.dischead` Nunito 900 20px in a white clay pill; `.chev` a filled circle (`background:var(--violet); color:#fff; border-radius:50%; width:22px; height:22px; font-size:14px; display:inline-grid; place-items:center`). `.discpad`: `--bg`, `border-radius:24px`, `--clay-pressed`, `border-left:none`. `.tile`: **stat orbs** — `width:96px; height:96px; border-radius:50%; display:grid; place-items:center`, gradient fills via `:nth-child` (violet, pink, sky), `--clay-btn`, `b` Nunito 900 30px white, `span` outside the orb below (`position` the label with `margin-top`). `.distrow .dbar i` 9999px radius, gradient fill; today violet. `.seg.ytabs`: pressed track (`--clay-pressed`, 9999px), active segment a convex violet pill.

**Modals.** `.overlay` `rgba(51,47,58,.35)` + `backdrop-filter:blur(6px)`. `.modal` `rgba(255,255,255,.88)`, `backdrop-filter:blur(24px)`, `border-radius:var(--r-hero)`, `--clay-card`; `modalin` → 400ms from `scale(.9) translateY(24px)` with `cubic-bezier(.34,1.56,.64,1)`. `h2` Nunito 900 28px `--ink`. `.close`: 44px white clay orb, squish. `#plateimg`: 24px radius, `--clay-card`, hover `translateY(-3px)`. Liftoff `h2` amber; `.liftoffm::before` a floating amber clay orb behind the title, `animation:clay-float-slow 12s`.

**Designer.** `.dsgntabs`: pressed track (`--clay-pressed`, 9999px, `border:none`), active tab a convex violet pill (`--clay-btn`, 9999px). `.seg`: same, smaller. `.rankchip`: white clay pills; active keeps `var(--rc)` + `--clay-btn`. `.bgswatch`: 12px radius, `--clay-btn` at half strength, active violet ring. `.bswatch` 16px-radius white clay tiles. `.swatch`: radial highlight (`background-image:radial-gradient(circle at 30% 30%, rgba(255,255,255,.6), transparent 60%)`), active lifted + ring. Range `accent-color:var(--violet)`. Footer: primary violet clay, others white clay, all squish.

**Mobile.** `#form`: white 85%, `backdrop-filter:blur(24px)`, `border-radius:32px`, `--clay-card`. `.floatplate .plate { box-shadow:var(--plate-shadow) }`. Toast: clay pill.

## Motion

Buoyant: 200ms squish, 300ms slides, 500ms lifts, 6s breathe on `.dischead` orbs (optional), 8–12s blob float. Overshoot on entrances, `ease-out` on hovers. Respect `prefers-reduced-motion` (kill floats and breathes).

## Bold choices (required)

1. Four-layer stacks on cards and buttons; inset stacks on input, panels, tracks.
2. Floating blobs behind glass-clay cards.
3. Squish on every press; lift on every hover.
4. Rail as a pressed tube with orb stops; stats as orbs.
5. Minimum 20px radius on every container outside the plate.
6. The plate lit by the same top-left light via `--plate-shadow`, otherwise untouched.

## Do not

- Use a container radius under 20px.
- Use grey text lighter than `#635F69`.
- Leave any surface flat.
- Use gradient text below 40px.
- Add inset shadows to `--plate-shadow`.

## Proposals needing markup

- None required; blobs and orbs use pseudo-elements.
</design-system>
