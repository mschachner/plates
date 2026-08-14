/* game.js — Plates: all behavior.
 *
 * Loads after data.js, which defines DICT (dictionary), ELIG (eligible clues
 * with difficulty), and SCHED (the baked daily schedule).
 *
 * Sections:
 *   0.  Migration to platesgame.com
 *   1.  Configuration
 *   2.  Small utilities (DOM, dates, storage)
 *   3.  Core game logic (validity, scoring, answer lists, schedule)
 *   4.  Game state
 *   5.  Persistence (today's progress, lifetime stats, dictionary decisions)
 *   6.  Wordlist rendering (the alphabetical column)
 *   7.  The plate (odometer + rank color)
 *   8.  The road-trip rank rail
 *   9.  Stats
 *   10. Messages & label flashes
 *   11. Play actions (submit, hint, rescue)
 *   12. Finish & sharing (confetti, plate image, copy paths)
 *   13. Modals
 *   14. Dev tools
 *   15. Event wiring & boot
 *
 * Conventions: state lives in module-level variables; every mutation ends by
 * calling render(), which repaints the plate, rail, and counters and persists
 * the day. Rendering reads state, never mutates it (except persistence).
 */

'use strict';

/* ================================================================
 * 0. Migration
 * ================================================================ */

(function () {
  var PREFIX = 'plates-';

  var m = location.hash.match(/[#&]migrate=([A-Za-z0-9_-]+)/);
  if (!m) return;

  // Scrub the payload from the address bar regardless of what happens next.
  history.replaceState(null, '', location.pathname + location.search);

  var data;
  try {
    var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    data = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return; }

  // Import only onto a fresh origin: if this browser already has Plates data
  // on platesgame.com (they played here first), keep the existing data.
  for (var j = 0; j < localStorage.length; j++) {
    if (localStorage.key(j).indexOf(PREFIX) === 0) return;
  }

  Object.keys(data).forEach(function (k) {
    if (k.indexOf(PREFIX) !== 0) return;      // defense in depth
    if (k === 'plates-gh-token') return;      // never accept a token this way
    try { localStorage.setItem(k, data[k]); } catch (e) { /* ignore */ }
  });
})();


/* ================================================================
 * 1. Configuration
 * ================================================================ */

/** Scrabble-style letter values. */
const SCRABBLE = { a:1, b:3, c:3, d:2, e:1, f:4, g:2, h:4, i:1, j:8, k:5, l:1, m:3,
              n:1, o:1, p:3, q:10, r:1, s:1, t:1, u:1, v:4, w:4, x:8, y:4, z:10 };

/** 9 August 2026 (local time) is day 0 = Plates #1. */
const EPOCH = [2026, 7, 9];

/** Burial bonuses by tier: flat, half-buried, buried. See RULES.md. */
const TIER_BONUS = [0, 10, 25];

/** Points per letter beyond the clue's length. */
const LENGTH_POINTS = 5;

/** Snug (contiguous clue) and Vanity Plate bonuses. */
const SNUG_BONUS = 15;
const VP_BONUS = 250;

/** Rank ladder: name + fraction of the day's perfect score. */
const RANKS = [
  ['Pedestrian',       0],
  ["Learner's Permit", 0.02],
  ['Licensed',         0.095],
  ["Cruisin'",         0.24],
  ['Speeding',         0.38],
  ['Overdrive',        0.52],
  ['Liftoff',          2 / 3],
];

/** One color per rank; the plate (and share image) wear the current one. */
const RANK_COLORS = ['#8a8781', '#17151a', '#1e6b34', '#1b3a8c',
                     '#c05621', '#6b3fa0', '#a8781a'];

/** Liftoff is the show-off plate: gold lettering on this black face. */
const LIFTOFF_BG = '#17151a';

/** Deploy build number — keep in step with the ?v= query in index.html. */
const BUILD = 30;

/** Touch devices get "Tap" wording. */
const TAP = matchMedia('(pointer: coarse)').matches;
const GATE_TIP = (TAP ? 'Tap' : 'Click') + " Finish to share once you're done!";

/* ================================================================
 * 2. Small utilities
 * ================================================================ */

/** Shorthand for document.getElementById. */
function $(id) { return document.getElementById(id); }

/** Midnight-local Date for "today". */
function todayDate() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** YYYY-MM-DD key for a Date (local time). */
function dkey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
         '-' + String(d.getDate()).padStart(2, '0');
}

function todayKey() { return dkey(todayDate()); }

/** Days since the epoch; 0 on launch day. */
function dayIndex() {
  return Math.round((todayDate() - new Date(...EPOCH)) / 86400000);
}

/** "10 August" for the current local date. */
function dateStr() {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
  const d = new Date();
  return d.getDate() + ' ' + months[d.getMonth()];
}

/** localStorage helpers — best-effort: storage failures never break play. */
function store(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
}
function unstore(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch (e) { return fallback; }
}

/* ================================================================
 * 3. Core game logic
 * ================================================================ */

/** Is `clue` an ordered (not necessarily contiguous) subsequence of `w`? */
function isValid(w, clue) {
  let i = 0;
  for (const ch of w) if (ch === clue[i] && ++i === clue.length) return true;
  return false;
}

/**
 * Score a valid word: length + burial tier + snug bonus (VP added separately).
 * Returns { p: points, s: 1 if snug }.
 */
function scoreWord(w, clue) {
  const tier = (w[0] !== clue[0] ? 1 : 0) +
               (w[w.length - 1] !== clue[clue.length - 1] ? 1 : 0);
  const snug = w.includes(clue);
  return {
    p: LENGTH_POINTS * (w.length - clue.length) + TIER_BONUS[tier] + (snug ? SNUG_BONUS : 0),
    s: snug ? 1 : 0,
  };
}

/** Mean Scrabble value per letter (for VP calculation) */
function density(w) {
  let s = 0;
  for (const ch of w) s += SCRABBLE[ch];
  return s / w.length;
}

/**
 * Full answer list for a clue: { answers: {word: {p, s, vp?}}, vp: word }.
 * The VP is the answer with the greatest Scrabble score density (ties: shorter, then
 * alphabetical).
 */
function computeAnswers(clue) {
  const ans = {};
  let best = null;                       // [negDensity, length, word, word]
  for (const w of DICT) {
    if (!isValid(w, clue)) continue;
    ans[w] = scoreWord(w, clue);
    const key = [-density(w), w.length, w];
    if (!best || key[0] < best[0] ||
        (key[0] === best[0] && (key[1] < best[1] ||
        (key[1] === best[1] && key[2] < best[2])))) {
      best = key.concat([w]);
    }
  }
  if (best) ans[best[3]].vp = 1;
  return { answers: ans, vp: best ? best[3] : null };
}

/** Today's scheduled clue (wraps if we ever outlive the schedule). */
function dailyClue() {
  const n = SCHED.length;
  return SCHED[((dayIndex() % n) + n) % n];
}

/** Yesterday's clue/date/number, or null on day one. */
function yesterdayInfo() {
  const yIdx = dayIndex() - 1;
  if (yIdx < 0) return null;
  const n = SCHED.length;
  const d = todayDate();
  d.setDate(d.getDate() - 1);
  return { clue: SCHED[((yIdx % n) + n) % n], key: dkey(d), no: yIdx + 1 };
}

/* ================================================================
 * 4. Game state
 * ================================================================ */

let CLUE;                 // current clue, lowercase ("img")
let UP;                   // display form ("I-M-G")
let answers;              // word -> {p, s, vp?} for the current plate
let vpWord;               // the Vanity Plate word
let perfect;              // sum of all answer points + VP bonus
let ranks;                // RANKS resolved to point thresholds for this plate
let total = 0;            // player's score
let found = [];           // words found, in find order
let hinted = new Set();   // words revealed as hint masks
let hintsUsed = 0;
let finished = false;     // player pressed Finish (locks the day)
let isDaily = false;      // current plate is today's scheduled plate
let diff = 'easy';        // dev roll difficulty band
let rollLen = 'any';      // dev roll clue length: '3' | '4' | 'any'
let tripPts = null;       // rail geometry, rebuilt on resize

/** Pending dictionary edits (dev): word -> 'add' | 'remove'. */
const decisions = new Map();

/* ================================================================
 * 5. Persistence
 * ================================================================ */

const DAY_KEY = 'plates-day';
const STATS_KEY = 'plates-stats';
const DECISIONS_KEY = 'plates-decisions';

/** Lifetime record: date -> {r: rank, s: score, w: words, h: hints, f: found[]}. */
let statsDays = unstore(STATS_KEY, {});

/* Today's saved progress is read ONCE before the first render can overwrite
 * it (the render/persist cycle writes plates-day continuously). */
const bootDay = unstore(DAY_KEY, null);
let bootUsed = false;

/** Persist today's progress; record stats only once the day is finished. */
function saveDay() {
  if (!isDaily) return;
  store(DAY_KEY, { date: todayKey(), clue: CLUE, found,
                   hinted: [...hinted], hintsUsed, finished });
  if (finished) {
    statsDays[todayKey()] = { r: rank(), s: total, w: found.length,
                              h: hintsUsed, f: found.slice() };
    store(STATS_KEY, statsDays);
  }
}

/** Rebuild found words, hint masks, and finished state from a day snapshot. */
function restoreDay(snap) {
  if (!snap || snap.date !== todayKey() || snap.clue !== CLUE) return;
  for (const w of snap.found) {
    const a = answers[w];
    const pts = a ? a.p + (a.vp ? VP_BONUS : 0) : scoreWord(w, CLUE).p;
    found.push(w);
    total += pts;
    addFoundRow(w, pts, a || { s: scoreWord(w, CLUE).s }, a ? '' : ' rescued');
  }
  hintsUsed = snap.hintsUsed || 0;
  if (snap.finished) { finished = true; applyFinished(); }
  for (const w of snap.hinted || []) {
    hinted.add(w);
    if (!found.includes(w)) insertRow(w, makeHintRow(w));
  }
  render();
}

function persistDecisions() {
  store(DECISIONS_KEY, [...decisions]);
}

/* ================================================================
 * 6. Wordlist rendering
 * ================================================================ */

/** Insert a row into the alphabetical column, keeping sort order. */
function insertRow(w, node) {
  const col = $('column');
  let placed = false;
  for (const child of col.children) {
    if (child.dataset.w > w) { col.insertBefore(node, child); placed = true; break; }
  }
  if (!placed) col.appendChild(node);
  updateColumns();
}

/** One column normally; two when the list would overflow the viewport AND
 *  there's enough width for two readable columns. */
function updateColumns() {
  const col = $('column');
  $('empty').style.display = col.childElementCount ? 'none' : 'block';
  col.classList.remove('two');
  const avail = window.innerHeight - col.getBoundingClientRect().top - 70;
  if (col.scrollHeight > avail && col.clientWidth >= 430) col.classList.add('two');
}

/**
 * Positions of the clue letters within a valid word (greedy leftmost
 * embedding, except the last clue letter snaps to the word's final letter
 * when it matches — mirroring how burial is scored).
 */
function clueEmbedding(w) {
  const pos = [];
  let j = 0;
  for (let i = 0; i < w.length && j < CLUE.length; i++) {
    if (w[i] === CLUE[j]) { pos.push(i); j++; }
  }
  if (w[w.length - 1] === CLUE[CLUE.length - 1]) pos[pos.length - 1] = w.length - 1;
  return pos;
}

function makeRow(w, pts, cls, tags) {
  const row = document.createElement('div');
  row.className = 'row' + cls;
  row.dataset.w = w;
  // Clue letters render bold; the first/last clue letter is tinted when it
  // is buried (not sitting at the word's edge), explaining the burial bonus.
  const pos = clueEmbedding(w);
  const set = new Set(pos);
  const first = pos[0], last = pos[pos.length - 1];
  const word = [...w].map((ch, i) => {
    if (!set.has(i)) return ch.toUpperCase();
    const buried = (i === first && i !== 0) ||
                   (i === last && i !== w.length - 1);
    return '<span class="cl' + (buried ? ' buried' : '') + '">' +
           ch.toUpperCase() + '</span>';
  }).join('');
  row.innerHTML = '<span class="wtxt">' + word + '</span>' + (tags || '') +
                  ' <b>+' + pts + '</b>';
  return row;
}

/** Hint mask: first letter plus the plate letters where they sit. */
function makeHintRow(w) {
  const emb = new Set();
  let j = 0;
  for (let i = 0; i < w.length && j < CLUE.length; i++) {
    if (w[i] === CLUE[j]) { emb.add(i); j++; }
  }
  const row = document.createElement('div');
  row.className = 'row hinted';
  row.dataset.w = w;
  row.textContent = [...w]
    .map((ch, i) => (i === 0 || emb.has(i)) ? ch.toUpperCase() : '_')
    .join(' ');
  return row;
}

/** Add a found word (replacing its hint mask if present). Rescued words are
 *  dev-mode dictionary additions; clicking one un-rescues it. */
function addFoundRow(w, pts, a, rescuedCls) {
  const old = document.querySelector('#column .row.hinted[data-w="' + w + '"]');
  if (old) old.remove();
  let tags = '';
  if (a && a.vp) tags += ' <span class="tag vp">VP</span>';
  if (a && a.s) tags += ' <span class="tag snug">SNUG</span>';
  const cls = rescuedCls || (a && a.vp ? ' vp' : '');
  const row = makeRow(w, pts, cls, tags);
  if (rescuedCls) {
    row.onclick = () => {
      if (!isDev()) return;
      unrescue(w);
    };
  }
  insertRow(w, row);
}

/* ================================================================
 * 7. The plate
 * ================================================================ */

/** Current rank name for the player's total. */
function rank() {
  let r = RANKS[0][0];
  for (const [name, pts] of ranks) if (total >= pts) r = name;
  return r;
}

/** Roll the odometer reels to the (zero-padded, clamped) score. */
function setOdo(n) {
  const s = String(Math.max(0, Math.min(9999, n))).padStart(4, '0');
  document.querySelectorAll('.odo').forEach(o => {
    o.querySelectorAll('.reel').forEach((r, i) => {
      r.style.transform = 'translateY(-' + (+s[i]) + 'em)';
    });
  });
}

/** "PLATES #2 • 10 AUGUST" — the plate's top field. */
function plateTopText() {
  return 'PLATES #' + (dayIndex() + 1) + ' • ' + dateStr().toUpperCase();
}

/** localStorage key for the mobile floating-plate preference. */
const FLOAT_KEY = 'plates-showplate';

/**
 * Build the floating copy of the score plate (mobile). Cloning the hero
 * plate's odometer keeps the two reels structurally identical; setOdo drives
 * every .odo on the page, so both always agree.
 */
function buildFloatPlate() {
  const p = document.createElement('div');
  p.className = 'plate';
  p.innerHTML = '<div class="ptop" id="fptop"></div>' +
                '<div class="pline"><span id="fclue"></span><span>-</span></div>';
  p.querySelector('.pline').appendChild(
    document.querySelector('.plate .odo').cloneNode(true));
  $('floatplate').appendChild(p);
}

/** Show or hide the floating plate, sync the button label, remember. */
function setFloatPlate(show) {
  $('floatplate').hidden = !show;
  $('floattoggle').textContent = (show ? 'Hide' : 'Show') + ' score plate';
  store(FLOAT_KEY, show);
  layoutMobileChrome();
  repaintPlates();
}

/**
 * Position the mobile floating chrome: the plate rides just above the fixed
 * input bar, and the message pill rides above whichever of the two is taller.
 * The CSS variables are only consumed inside the <=980px regime.
 */
function layoutMobileChrome() {
  const fh = $('form').offsetHeight;
  document.documentElement.style.setProperty('--floatbot', (fh + 26) + 'px');
  const extra = $('floatplate').hidden ? 0 : $('floatplate').offsetHeight + 14;
  document.documentElement.style.setProperty('--msgbot', (fh + 24 + extra) + 'px');
}

/* ================================================================
 * 7.5 The plate designer (borders, stickers, freehand drawing)
 *
 * A saved design decorates every appearance of the score plate: the
 * hero plate, the mobile floating plate, and the share image. It is
 * stored in localStorage as three independent parts:
 *
 *   { border:   one of BORDER_STYLES (default 'plain'),
 *     stickers: [{e, x, y, s, r, f}] - emoji, center (fractions of the
 *               plate box), size (fraction of plate width), rotation,
 *               f: 0 renders behind the plate text, otherwise in front,
 *     draw:     PNG data URL of the behind-the-text freehand layer,
 *     drawF:    PNG data URL of the in-front freehand layer (each null
 *               when empty),
 *     bg:       plate face color (one of PLATE_BGS), or null for the
 *               default cream. Liftoff overrides any choice with its
 *               black face - every Liftoff plate looks the same. }
 *
 * All three render in one shared "design space" of DW x DH (the share
 * canvas's dimensions), scaled onto whatever surface is being painted.
 * The design always sits UNDER the plate's text; when a design exists
 * the text gets a face-colored halo so it stays readable over it.
 * Border styles draw in the current rank color, so the rank color
 * progression survives any design. The designer UI is desktop-only
 * (the button hides in the <=980px regime), but a saved design still
 * displays on mobile plates.
 * ================================================================ */

const DESIGN_KEY = 'plates-design';
const DW = 880, DH = 440;              // design space = share canvas size
const PLATE_FACE = '#fffaf0';
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

function normalizeDesign(d) {
  if (!d || typeof d !== 'object') d = {};
  return { border: d.border || 'plain',
           stickers: Array.isArray(d.stickers) ? d.stickers : [],
           draw: d.draw || null, drawF: d.drawF || null, bg: d.bg || null };
}

let design = normalizeDesign(unstore(DESIGN_KEY, null));
let drawImg = null;                    // decoded Image of design.draw (behind)
let drawImgF = null;                   // decoded Image of design.drawF (front)

function hasDesign(d) {
  return d.border !== 'plain' || d.stickers.length > 0 ||
         !!d.draw || !!d.drawF || !!d.bg;
}

/** Decode the saved freehand layers, then repaint everywhere they show. */
function loadDrawImg() {
  drawImg = drawImgF = null;
  const load = (url, set) => {
    if (!url) return;
    const img = new Image();
    img.onload = () => { set(img); repaintPlates(); };
    img.src = url;
  };
  load(design.draw, i => { drawImg = i; });
  load(design.drawF, i => { drawImgF = i; });
  repaintPlates();
}

/** Current rank color (used by plates, borders, and the share image). */
function rankColor() {
  return RANK_COLORS[Math.max(0, ranks.findIndex(([n]) => n === rank()))];
}

/** Plate face color for a rank + design. Liftoff always wins: the black
 *  face is the trophy, no matter what color the player picked. */
function faceColor(rankName, d) {
  if (rankName === 'Liftoff') return LIFTOFF_BG;
  return (d && d.bg) || PLATE_FACE;
}

/** Pastel plate faces. Generated at hsl(h, 90%, ~90%) and lightened until
 *  every swatch keeps >=2.76:1 contrast against the lightest rank color
 *  (Pedestrian grey; the default cream sits at 3.44:1), so the plate text
 *  stays readable on all of them. First four are soft neutrals. */
const PLATE_BGS = [
  '#ebe6db', '#e0e2e6', '#eae1e4', '#e3e7df', '#fddbdb', '#fddcd1', '#fce6cf',
  '#fcf1cf', '#fcfccf', '#f1fccf', '#e6fccf', '#dafccf', '#cffccf', '#cffcda',
  '#cffce6', '#cffcf1', '#cffcfc', '#cff1fc', '#cfe5fc', '#dbe3fd', '#e0e0fd',
  '#e7e0fd', '#edddfd', '#f4dbfd', '#fdd6fd', '#fdd8f4', '#fdd8eb', '#fddbe3',
];

/* ---- border styles ----
 * Each style draws along the plate's rounded-rect rim in the rank color.
 * Geometry comes from the caller: `bw` rim thickness, `inset` path inset,
 * `r` path corner radius - so one function serves the share image, the
 * page overlays, and the swatch thumbnails at their native scales. */

const BORDER_STYLES = [
  ['plain',   'Classic'],
  ['dashed',  'Dashed'],
  ['dotted',  'Dotted'],
  ['double',  'Pinstripe'],
  ['highway', 'Highway'],
  ['rope',    'Rope'],
  ['tread',   'Tire tracks'],
  ['stars',   'Stars'],
  ['zigzag',  'Rickrack'],
];

/** Walk the rounded-rect perimeter clockwise from the top-left straight,
 *  calling fn(x, y, tangentAngle) roughly every `step` px. */
function walkBorder(W, H, inset, r, step, fn) {
  const w = Math.max(0, W - 2 * inset - 2 * r);
  const h = Math.max(0, H - 2 * inset - 2 * r);
  const arc = Math.PI * r / 2, L = 2 * w + 2 * h + 4 * arc;
  const segs = [
    [w,   t => [inset + r + t, inset, 0]],
    [arc, t => { const a = -Math.PI / 2 + t / r;
      return [W - inset - r + Math.cos(a) * r, inset + r + Math.sin(a) * r, a + Math.PI / 2]; }],
    [h,   t => [W - inset, inset + r + t, Math.PI / 2]],
    [arc, t => { const a = t / r;
      return [W - inset - r + Math.cos(a) * r, H - inset - r + Math.sin(a) * r, a + Math.PI / 2]; }],
    [w,   t => [W - inset - r - t, H - inset, Math.PI]],
    [arc, t => { const a = Math.PI / 2 + t / r;
      return [inset + r + Math.cos(a) * r, H - inset - r + Math.sin(a) * r, a + Math.PI / 2]; }],
    [h,   t => [inset, H - inset - r - t, -Math.PI / 2]],
    [arc, t => { const a = Math.PI + t / r;
      return [inset + r + Math.cos(a) * r, inset + r + Math.sin(a) * r, a + Math.PI / 2]; }],
  ];
  const n = Math.max(8, Math.round(L / step));
  for (let i = 0; i < n; i++) {
    let t = L * i / n;
    for (const [len, at] of segs) {
      if (t <= len) { fn(...at(t)); break; }
      t -= len;
    }
  }
}

function drawBorder(ctx, style, W, H, bw, r, inset, color, face) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = (pad, pr) => {
    pad = pad || 0;
    ctx.beginPath();
    ctx.roundRect(inset + pad, inset + pad,
                  W - 2 * (inset + pad), H - 2 * (inset + pad),
                  Math.max(4, pr !== undefined ? pr : r - pad));
  };
  if (style === 'dashed') {
    ctx.lineWidth = bw;
    ctx.setLineDash([bw * 2.1, bw * 1.5]);
    path(); ctx.stroke();
  } else if (style === 'dotted') {
    ctx.lineWidth = bw;
    ctx.setLineDash([0, bw * 2.1]);       // round caps turn dashes into dots
    path(); ctx.stroke();
  } else if (style === 'double') {
    ctx.lineWidth = bw * 0.36;
    path(); ctx.stroke();
    path(bw * 0.95); ctx.stroke();
  } else if (style === 'highway') {
    ctx.lineWidth = bw * 0.5;
    path(); ctx.stroke();
    ctx.lineWidth = bw * 0.44;
    ctx.setLineDash([bw * 1.9, bw * 1.4]);
    path(bw * 1.1); ctx.stroke();
  } else if (style === 'rope' || style === 'tread') {
    ctx.lineWidth = bw;
    path(); ctx.stroke();
    // Face-colored ticks across the band: diagonal reads as rope strands,
    // perpendicular as tire tread.
    ctx.strokeStyle = face;
    ctx.lineWidth = bw * 0.32;
    const tilt = style === 'rope' ? Math.PI / 4 : Math.PI / 2;
    walkBorder(W, H, inset, r, bw * 0.95, (x, y, a) => {
      const d = bw * 0.6;
      ctx.beginPath();
      ctx.moveTo(x - Math.cos(a + tilt) * d, y - Math.sin(a + tilt) * d);
      ctx.lineTo(x + Math.cos(a + tilt) * d, y + Math.sin(a + tilt) * d);
      ctx.stroke();
    });
  } else if (style === 'stars') {
    ctx.font = Math.round(bw * 2.2) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    walkBorder(W, H, inset, r, bw * 3.4, (x, y, a) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.fillText('★︎', 0, bw * 0.08);  // VS15: text star, not emoji
      ctx.restore();
    });
  } else if (style === 'zigzag') {
    ctx.lineWidth = bw * 0.4;
    const pts = [];
    let k = 0;
    walkBorder(W, H, inset + bw * 0.1, r, bw * 1.2, (x, y, a) => {
      const off = (k++ % 2 ? 1 : -1) * bw * 0.55;
      pts.push([x + Math.cos(a + Math.PI / 2) * off,
                y + Math.sin(a + Math.PI / 2) * off]);
    });
    if (pts.length % 2) pts.pop();       // even count keeps the seam zigzagging
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

/** Does this sticker render in front of the text? (missing f = front) */
function inFront(st) { return st.f !== 0; }

/* ---- design compositor ----
 * Paints ONE layer of a design onto a W x H surface. m = {layer: 'behind'
 * or 'front', img: that layer's freehand source (Image or canvas, may be
 * null), bw, r, inset, clip:{x,y,w,h,r}, color, face, d?: design (default
 * saved)}. The behind pass carries its freehand layer and behind-stickers;
 * the front pass carries its freehand layer, front-stickers, and the
 * border style. */
function paintDesign(ctx, W, H, m) {
  const d = m.d || design;
  const front = m.layer === 'front';
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(m.clip.x, m.clip.y, m.clip.w, m.clip.h, m.clip.r);
  ctx.clip();
  if (m.img) ctx.drawImage(m.img, 0, 0, W, H);
  for (const st of d.stickers) {
    if (inFront(st) !== front) continue;
    ctx.save();
    ctx.translate(st.x * W, st.y * H);
    ctx.rotate(st.r || 0);
    ctx.font = Math.round(st.s * W) + 'px ' + EMOJI_FONT;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(st.e, 0, 0);
    ctx.restore();
  }
  if (front && d.border !== 'plain') {
    drawBorder(ctx, d.border, W, H, m.bw, m.r, m.inset, m.color, m.face);
  }
  ctx.restore();
}

/* ---- page-plate overlays ----
 * Each on-page .plate gets a canvas layer under its text. A custom border
 * replaces the plain CSS rim (border-color goes transparent; the layer
 * draws the styled rim in its place, still in rank color). */
function repaintPlates() {
  if (!ranks) return;                    // pre-boot call
  const on = hasDesign(design);
  // Chosen face color rides a CSS var; the body.liftoff rule outranks it.
  if (design.bg) {
    document.documentElement.style.setProperty('--pbg', design.bg);
  } else {
    document.documentElement.style.removeProperty('--pbg');
  }
  document.querySelectorAll('.plate').forEach(p => {
    p.classList.toggle('customborder', on && design.border !== 'plain');
    for (const layer of ['behind', 'front']) {
      let cv = p.querySelector(':scope > .designlayer.' + layer);
      if (!on) { if (cv) cv.remove(); continue; }
      if (!cv) {
        cv = document.createElement('canvas');
        cv.className = 'designlayer ' + layer;
        p.prepend(cv);
      }
      const rect = p.getBoundingClientRect();
      if (!rect.width) continue;         // hidden (e.g. floating plate)
      const dpr = window.devicePixelRatio || 1;
      const W = Math.round(rect.width * dpr), H = Math.round(rect.height * dpr);
      if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
      cv.style.width = rect.width + 'px';
      cv.style.height = rect.height + 'px';
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      const bw = Math.max(6, W * 14 / DW);
      const R = W * 0.025;               // matches the plate's CSS radius
      paintDesign(ctx, W, H, {
        layer, img: layer === 'front' ? drawImgF : drawImg,
        bw, r: Math.max(4, R - bw / 2 - 1), inset: bw / 2 + 1,
        color: rankColor(), face: faceColor(rank(), design),
        clip: { x: 0, y: 0, w: W, h: H, r: R },
      });
    }
  });
}

/* ---- designer state ---- */

let wd = null;                 // working copy of the design while modal open
let wdCanvas = null, wdCtx = null;     // behind-the-text freehand layer
let wdCanvasF = null, wdCtxF = null;   // in-front freehand layer
let dsgnTool = 'border';
let penColor = '#17151a', penSize = 11, penErase = false;
let penLayer = 'behind';       // which freehand layer the pen touches
let selSticker = -1;
let previewRank = null;        // rank previewed in the designer
let penLast = null;            // last freehand point while stroking
let dragOff = null;            // pointer offset while dragging a sticker
let trayBuilt = false, libBuilt = false;

const PEN_COLORS = ['#17151a', '#fffaf0', '#a33327', '#c05621', '#c9971f',
                    '#5f7d2a', '#1a57c2', '#6b3fa0', '#c2185b', '#6d4c2f'];

/** Curated sticker suggestions, pinned above the full library. */
const SUGGESTED = ['🚗','🚙','🛻','🚐','🏎️','🏍️','🛵','🚲','🚌','🚚','🚜','🚓',
  '🚒','⛽','🛞','🚦','🚧','🧭','🗺️','🏁','🌵','🌴','🌲','⛰️','🌋','🌅','🌄',
  '☀️','🌙','⭐','✨','⚡','🌈','☁️','❄️','🔥','🌊','🦅','🐍','🦂','🐢','🐎',
  '🦌','🐺','🦉','🦋','🍔','🍟','🌭','🍕','🌮','🍩','🍦','☕','🥤','🍒','🎲',
  '🎵','🎸','🎉','🎊','🏆','👑','💎','😎','🤠','🥳','💀','👽','❤️','💙','💚',
  '💛','💜','🖤','💥','💫','👍','✌️','🍀','🎯'];

/** Full emoji library (stickers.js) loads only when the designer opens. */
let stickersLoaded = null;
function loadStickers() {
  if (!stickersLoaded) {
    stickersLoaded = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'stickers.js?v=' + BUILD;
      s.onload = resolve;
      s.onerror = () => {
        stickersLoaded = null;
        reject(new Error('could not load the sticker library'));
      };
      document.head.appendChild(s);
    });
  }
  return stickersLoaded;
}

/** Share-image painter, parameterized by design so the designer preview and
 *  the real share canvas render identically. Fonts are preloaded by callers. */
function paintShareCanvas(ctx, d, imgs, rankName) {
  const cv = ctx.canvas, W = cv.width, H = cv.height;
  const rn = rankName || rank();
  const ri = Math.max(0, RANKS.findIndex(([n]) => n === rn));
  const color = RANK_COLORS[ri];
  const face = faceColor(rn, d);
  // The designer's freehand strokes live in the passed-in canvases, not in
  // d itself - count them, or an otherwise-untouched design skips painting.
  const designed = hasDesign(d) || !!(imgs && (imgs.b || imgs.f));
  // Geometry mirrors the page plate so designs line up exactly: corner
  // radius is 2.5% of width (the CSS plate radius), the rim stroke spans
  // insets 3..17 (the page's 4px border at this scale, with breathing room).
  const R = Math.round(W * 0.025);       // outer corner radius
  const PR = Math.max(6, R - 7);         // radius at the stroke path (inset 10)
  const pass = (layer, img) => paintDesign(ctx, W, H, {
    layer, img, bw: 14, r: PR, inset: 10, color, face, d,
    clip: { x: 3, y: 3, w: W - 6, h: H - 6, r: R },
  });
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = face;
  ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H - 20, PR); ctx.fill();
  if (designed) pass('behind', imgs && imgs.b);
  if (d.border === 'plain') {
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.roundRect(10, 10, W - 20, H - 20, PR); ctx.stroke();
  }
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '600 30px "Atkinson Hyperlegible Next", "Avenir Next", "Segoe UI", sans-serif';
  try { ctx.letterSpacing = '5px'; } catch (e) { /* older engines */ }
  // Share image carries the site URL; shrink if the longer line runs tight.
  const topLine = plateTopText() + ' • PLATESGAME.COM';
  if (ctx.measureText(topLine).width > W - 90) {
    ctx.font = '600 26px "Atkinson Hyperlegible Next", "Avenir Next", "Segoe UI", sans-serif';
    try { ctx.letterSpacing = '4px'; } catch (e) { /* older engines */ }
  }
  ctx.fillText(topLine, W / 2, Math.round(H * 0.117));
  ctx.save();
  ctx.translate(W / 2, H * 0.559);
  ctx.scale(1, 1.2);                     // same die-stretch as the page plate
  const line = CLUE.toUpperCase() + '-' +
               String(Math.min(9999, total)).padStart(4, '0');
  // Same size rule as the page plate's --pline-size (percent of the plate's
  // content width), so the line lands where the designer placed things.
  let size = Math.round((W - 13) * (21.5 * 8 / (CLUE.length + 5)) / 100);
  const setFont = () => {
    ctx.font = size + 'px "License Plate", "Avenir Next", sans-serif';
    try { ctx.letterSpacing = Math.round(size * 0.1) + 'px'; }
    catch (e) { /* older engines */ }
  };
  setFont();
  const maxW = W - 20;                   // safety only; never triggers on 3-4
  const tw = ctx.measureText(line).width;
  if (tw > maxW) { size = Math.floor(size * maxW / tw); setFont(); }
  ctx.fillText(line, 0, 0);
  ctx.restore();
  ctx.font = '600 30px "Atkinson Hyperlegible Next", "Avenir Next", "Segoe UI", sans-serif';
  try { ctx.letterSpacing = '5px'; } catch (e) { /* older engines */ }
  // A rankName override marks a designer preview: brand it "(sample)" so a
  // screenshot of the preview can't pass for a real shared plate.
  ctx.fillText((rn + (rankName ? ' (sample)' : '') + ' • hints used: ' +
                hintsUsed).toUpperCase(), W / 2, Math.round(H * 0.879));
  try { ctx.letterSpacing = '0px'; } catch (e) { /* older engines */ }
  // Front elements paint last: they may cover the text, and that's the fun.
  if (designed) pass('front', imgs && imgs.f);
}

/* ---- designer UI ---- */

function dsgnCanvas() { return $('dsgncv'); }

/** Repaint the live preview (the share image plus a selection box). */
function renderPreview() {
  if (!wd) return;
  const ctx = dsgnCanvas().getContext('2d');
  paintShareCanvas(ctx, wd, { b: wdCanvas, f: wdCanvasF }, previewRank);
  const st = wd.stickers[selSticker];
  if (st) {
    ctx.save();
    ctx.translate(st.x * DW, st.y * DH);
    ctx.rotate(st.r || 0);
    const h = st.s * DW * 0.62;
    ctx.strokeStyle = '#1a57c2';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([7, 5]);
    ctx.strokeRect(-h, -h, 2 * h, 2 * h);
    ctx.restore();
  }
}

function setDsgnTool(t) {
  dsgnTool = t;
  document.querySelectorAll('#dsgntabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.tool === t));
  document.querySelectorAll('.dsgnpane').forEach(p =>
    p.classList.toggle('open', p.id === 'pane-' + t));
  dsgnCanvas().style.cursor = t === 'draw' ? 'crosshair' : 'default';
  if (t !== 'stickers' && selSticker >= 0) {
    selSticker = -1;
    syncStickerCtl();
    renderPreview();
  }
}

function syncStickerCtl() {
  const st = wd && wd.stickers[selSticker];
  $('stksize').disabled = $('stkrot').disabled = $('stkdel').disabled = !st;
  document.querySelectorAll('#stklayer button').forEach(b => {
    b.disabled = !st;
    b.classList.toggle('active',
      !!st && (b.dataset.l === 'front') === inFront(st));
  });
  if (st) {
    $('stksize').value = Math.round(st.s * 100);
    $('stkrot').value = Math.round((st.r || 0) * 180 / Math.PI);
  }
}

function addSticker(e) {
  const jx = (Math.random() - 0.5) * 0.12, jy = (Math.random() - 0.5) * 0.2;
  wd.stickers.push({ e, x: 0.5 + jx, y: 0.5 + jy, s: 0.12, r: 0, f: 1 });
  selSticker = wd.stickers.length - 1;
  syncStickerCtl();
  renderPreview();
}

function deleteSticker() {
  if (selSticker < 0) return;
  wd.stickers.splice(selSticker, 1);
  selSticker = -1;
  syncStickerCtl();
  renderPreview();
}

/** Face-color swatch grid; the first swatch is the default cream. */
function buildBgSwatches() {
  const grid = $('bggrid');
  grid.innerHTML = '';
  for (const c of [null].concat(PLATE_BGS)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bgswatch' + ((wd.bg || null) === c ? ' active' : '');
    b.style.background = c || PLATE_FACE;
    if (!c) b.title = 'Classic cream';
    b.onclick = () => {
      wd.bg = c;
      grid.querySelectorAll('.bgswatch').forEach(s =>
        s.classList.toggle('active', s === b));
      buildBorderSwatches();             // border thumbnails wear the face
      renderPreview();
    };
    grid.appendChild(b);
  }
}

/** Border swatch grid, painted in the CURRENT rank color each open. */
function buildBorderSwatches() {
  const grid = $('bgrid');
  grid.innerHTML = '';
  const rn = previewRank || rank();
  const ri = Math.max(0, RANKS.findIndex(([n]) => n === rn));
  const color = RANK_COLORS[ri];
  const face = faceColor(rn, wd);
  for (const [style, label] of BORDER_STYLES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'bswatch' + (wd.border === style ? ' active' : '');
    const c = document.createElement('canvas');
    c.width = 220; c.height = 110;
    const x = c.getContext('2d');
    x.fillStyle = face;
    x.beginPath(); x.roundRect(2, 2, 216, 106, 6); x.fill();
    if (style === 'plain') {
      x.lineWidth = 6; x.strokeStyle = color;
      x.beginPath(); x.roundRect(5, 5, 210, 100, 4); x.stroke();
    } else {
      drawBorder(x, style, 220, 110, 6.5, 4, 5, color, face);
    }
    b.title = label;
    b.appendChild(c);
    b.onclick = () => {
      wd.border = style;
      grid.querySelectorAll('.bswatch').forEach(s =>
        s.classList.toggle('active', s === b));
      renderPreview();
    };
    grid.appendChild(b);
  }
}

/** Sticker tray: curated suggestions immediately, full library once loaded. */
function buildTray() {
  if (trayBuilt) return;
  trayBuilt = true;
  const tray = $('stktray');
  const addGroup = (name, items) => {
    const head = document.createElement('div');
    head.className = 'stkgroup';
    head.textContent = name;
    const grid = document.createElement('div');
    grid.className = 'stkgrid';
    for (const it of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'stk';
      btn.textContent = typeof it === 'string' ? it : it[0];
      if (typeof it !== 'string') btn.dataset.n = it[1];
      grid.appendChild(btn);
    }
    tray.append(head, grid);
    return head;
  };
  const sugHead = addGroup('Suggestions', SUGGESTED);
  sugHead.classList.add('sug');
  sugHead.nextElementSibling.classList.add('sug');
  tray.addEventListener('click', e => {
    const b = e.target.closest('.stk');
    if (b) addSticker(b.textContent);
  });
  loadStickers().then(() => {
    if (libBuilt) return;
    libBuilt = true;
    for (const [name, items] of STICKER_LIB) addGroup(name, items);
    filterTray();
  }).catch(err => {
    const note = document.createElement('div');
    note.className = 'stkgroup';
    note.textContent = err.message;
    tray.appendChild(note);
  });
}

/** Search filters the full library; the suggestions row hides meanwhile. */
function filterTray() {
  const q = $('stksearch').value.trim().toLowerCase();
  const tray = $('stktray');
  tray.querySelectorAll('.sug').forEach(el =>
    el.classList.toggle('hide', !!q));
  tray.querySelectorAll('.stkgrid:not(.sug)').forEach(grid => {
    let any = false;
    grid.querySelectorAll('.stk').forEach(b => {
      const hit = !q || (b.dataset.n || '').includes(q);
      b.classList.toggle('hide', !hit);
      any = any || hit;
    });
    grid.classList.toggle('hide', !any);
    grid.previousElementSibling.classList.toggle('hide', !any);
  });
}

function buildSwatches() {
  const box = $('swatches');
  if (box.childElementCount) return;
  for (const c of PEN_COLORS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch' + (c === penColor ? ' active' : '');
    b.style.background = c;
    b.onclick = () => {
      penColor = c;
      penErase = false;
      box.querySelectorAll('.swatch').forEach(s =>
        s.classList.toggle('active', s === b));
      document.querySelectorAll('#penseg button').forEach(s =>
        s.classList.toggle('active', s.dataset.p === 'pen'));
    };
    box.appendChild(b);
  }
}

/** Rank chips under the preview: see the design at every rank's colors. */
function buildRankRow() {
  const row = $('rankrow');
  row.innerHTML = '';
  RANKS.forEach(([name], i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'rankchip' + (name === previewRank ? ' active' : '');
    b.textContent = name;
    b.style.setProperty('--rc', RANK_COLORS[i]);
    b.onclick = () => {
      previewRank = name;
      buildRankRow();
      buildBorderSwatches();
      renderPreview();
    };
    row.appendChild(b);
  });
}

async function openDesigner() {
  wd = { border: design.border,
         stickers: design.stickers.map(s => Object.assign({}, s)),
         bg: design.bg };
  previewRank = rank();
  wdCanvas = document.createElement('canvas');
  wdCanvas.width = DW; wdCanvas.height = DH;
  wdCtx = wdCanvas.getContext('2d');
  if (drawImg) wdCtx.drawImage(drawImg, 0, 0, DW, DH);
  wdCanvasF = document.createElement('canvas');
  wdCanvasF.width = DW; wdCanvasF.height = DH;
  wdCtxF = wdCanvasF.getContext('2d');
  if (drawImgF) wdCtxF.drawImage(drawImgF, 0, 0, DW, DH);
  penLayer = 'behind';
  document.querySelectorAll('#layerseg button').forEach(b =>
    b.classList.toggle('active', b.dataset.l === 'behind'));
  selSticker = -1;
  buildTray();
  buildSwatches();
  buildBgSwatches();
  buildBorderSwatches();
  buildRankRow();
  syncStickerCtl();
  setDsgnTool('color');
  $('stksearch').value = '';
  filterTray();
  try { await document.fonts.load('150px "License Plate"'); } catch (e) { /* ok */ }
  renderPreview();
  openModal('designmodal');
}

/** Does the working freehand layer hold any ink at all? */
function layerHasInk(cv) {
  const data = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
  for (let i = 3; i < data.length; i += 4) if (data[i]) return true;
  return false;
}

function saveDesign() {
  design = { border: wd.border, stickers: wd.stickers, bg: wd.bg || null,
             draw: layerHasInk(wdCanvas) ? wdCanvas.toDataURL('image/png') : null,
             drawF: layerHasInk(wdCanvasF) ? wdCanvasF.toDataURL('image/png') : null };
  store(DESIGN_KEY, design);
  closeModal('designmodal');
  loadDrawImg();                          // repaints plates once decoded
}

/* ---- designer pointer interactions ---- */

function dsgnPos(ev) {
  const r = dsgnCanvas().getBoundingClientRect();
  return { x: (ev.clientX - r.left) * DW / r.width,
           y: (ev.clientY - r.top) * DH / r.height };
}

/** Hit-test stickers under a design-space point, topmost first (front
 *  layer beats behind layer, later additions beat earlier ones). */
function stickerAt(p) {
  const hit = i => {
    const st = wd.stickers[i];
    const dx = p.x - st.x * DW, dy = p.y - st.y * DH;
    const cos = Math.cos(-(st.r || 0)), sin = Math.sin(-(st.r || 0));
    const lx = dx * cos - dy * sin, ly = dx * sin + dy * cos;
    const h = st.s * DW * 0.58;
    return Math.abs(lx) <= h && Math.abs(ly) <= h;
  };
  for (const front of [true, false]) {
    for (let i = wd.stickers.length - 1; i >= 0; i--) {
      if (inFront(wd.stickers[i]) === front && hit(i)) return i;
    }
  }
  return -1;
}

function penStroke(p) {
  const c = penLayer === 'front' ? wdCtxF : wdCtx;
  c.save();
  c.lineCap = c.lineJoin = 'round';
  c.strokeStyle = penColor;
  c.lineWidth = penErase ? penSize * 2 : penSize;
  c.globalCompositeOperation = penErase ? 'destination-out' : 'source-over';
  c.beginPath();
  c.moveTo(penLast.x, penLast.y);
  c.lineTo(p.x, p.y);
  c.stroke();
  c.restore();
  penLast = p;
}

function wireDesigner() {
  $('designbtn').addEventListener('click', openDesigner);
  document.querySelectorAll('#dsgntabs button').forEach(b =>
    b.addEventListener('click', () => setDsgnTool(b.dataset.tool)));
  $('dsgnsave').addEventListener('click', saveDesign);
  $('dsgncancel').addEventListener('click', () => closeModal('designmodal'));
  $('dsgnclearall').addEventListener('click', () => {
    wd.border = 'plain';
    wd.stickers = [];
    wd.bg = null;
    wdCtx.clearRect(0, 0, DW, DH);
    wdCtxF.clearRect(0, 0, DW, DH);
    selSticker = -1;
    syncStickerCtl();
    buildBgSwatches();
    buildBorderSwatches();
    renderPreview();
  });
  $('drawclear').addEventListener('click', () => {
    wdCtx.clearRect(0, 0, DW, DH);
    wdCtxF.clearRect(0, 0, DW, DH);
    renderPreview();
  });
  document.querySelectorAll('#layerseg button').forEach(b =>
    b.addEventListener('click', () => {
      penLayer = b.dataset.l;
      document.querySelectorAll('#layerseg button').forEach(s =>
        s.classList.toggle('active', s === b));
    }));
  document.querySelectorAll('#stklayer button').forEach(b =>
    b.addEventListener('click', () => {
      const st = wd.stickers[selSticker];
      if (!st) return;
      st.f = b.dataset.l === 'front' ? 1 : 0;
      syncStickerCtl();
      renderPreview();
    }));
  document.querySelectorAll('#brushseg button').forEach(b =>
    b.addEventListener('click', () => {
      penSize = +b.dataset.b;
      document.querySelectorAll('#brushseg button').forEach(s =>
        s.classList.toggle('active', s === b));
    }));
  document.querySelectorAll('#penseg button').forEach(b =>
    b.addEventListener('click', () => {
      penErase = b.dataset.p === 'erase';
      document.querySelectorAll('#penseg button').forEach(s =>
        s.classList.toggle('active', s === b));
    }));
  $('stksize').addEventListener('input', () => {
    const st = wd.stickers[selSticker];
    if (st) { st.s = $('stksize').value / 100; renderPreview(); }
  });
  $('stkrot').addEventListener('input', () => {
    const st = wd.stickers[selSticker];
    if (st) { st.r = $('stkrot').value * Math.PI / 180; renderPreview(); }
  });
  $('stkdel').addEventListener('click', deleteSticker);
  let searchTimer = null;
  $('stksearch').addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(filterTray, 120);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Delete' || e.key === 'Backspace') &&
        $('designmodal').classList.contains('open') &&
        selSticker >= 0 && !/INPUT|TEXTAREA/.test(e.target.tagName)) {
      e.preventDefault();
      deleteSticker();
    }
  });

  const cv = dsgnCanvas();
  cv.addEventListener('pointerdown', ev => {
    if (!wd) return;
    ev.preventDefault();
    const p = dsgnPos(ev);
    if (dsgnTool === 'draw') {
      penLast = p;
      penStroke(p);                       // a click leaves a dot
      cv.setPointerCapture(ev.pointerId);
      renderPreview();
    } else if (dsgnTool === 'stickers') {
      selSticker = stickerAt(p);
      const st = wd.stickers[selSticker];
      if (st) {
        dragOff = { x: p.x - st.x * DW, y: p.y - st.y * DH };
        cv.setPointerCapture(ev.pointerId);
      }
      syncStickerCtl();
      renderPreview();
    }
  });
  cv.addEventListener('pointermove', ev => {
    if (!wd) return;
    if (dsgnTool === 'draw' && penLast) {
      penStroke(dsgnPos(ev));
      renderPreview();
    } else if (dsgnTool === 'stickers' && dragOff && selSticker >= 0) {
      const p = dsgnPos(ev), st = wd.stickers[selSticker];
      st.x = Math.min(0.98, Math.max(0.02, (p.x - dragOff.x) / DW));
      st.y = Math.min(0.96, Math.max(0.04, (p.y - dragOff.y) / DH));
      renderPreview();
    }
  });
  const up = () => { penLast = null; dragOff = null; };
  cv.addEventListener('pointerup', up);
  cv.addEventListener('pointercancel', up);
}

/* ================================================================
 * 8. The road-trip rank rail
 * ================================================================ */

/** Wide screens put the rail beside the plate, vertically. */
function isVerticalTrip() { return matchMedia('(min-width: 1401px)').matches; }

/** (Re)build the zigzag route SVG and position the stop labels. */
function buildTrip() {
  const trip = document.querySelector('.trip');
  const W = trip.clientWidth, H = trip.clientHeight, n = ranks.length;
  tripPts = [];
  const vert = isVerticalTrip();
  if (vert) {
    const y0 = H - 16, y1 = 16, xA = 14, xB = 46;
    for (let i = 0; i < n; i++) {
      tripPts.push([i % 2 ? xB : xA, y0 + (y1 - y0) * i / (n - 1)]);
    }
  } else {
    const x0 = 22, x1 = W - 22, yA = 18, yB = 40;
    for (let i = 0; i < n; i++) {
      tripPts.push([x0 + (x1 - x0) * i / (n - 1), i % 2 ? yA : yB]);
    }
  }
  const svg = $('tripsvg');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
  svg.innerHTML =
    '<polyline points="' + tripPts.map(p => p.join(',')).join(' ') + '" fill="none"' +
    ' stroke="var(--bar)" stroke-width="3" stroke-dasharray="0.5 8"' +
    ' stroke-linecap="round" stroke-linejoin="round"/>' +
    '<polyline id="tripprog" points="" fill="none" stroke="var(--accent)"' +
    ' stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    tripPts.map(p =>
      '<circle class="tripdot" cx="' + p[0] + '" cy="' + p[1] + '" r="5.5"' +
      ' fill="var(--card)" stroke="var(--bar)" stroke-width="2.5"/>').join('');
  const stops = $('stops');
  stops.innerHTML = '';
  ranks.forEach(([name], i) => {
    const s = document.createElement('span');
    s.className = 'sname';
    s.textContent = name;
    const [x, y] = tripPts[i];
    if (vert) {
      s.style.left = (x + 16) + 'px';
      s.style.top = y + 'px';
      s.style.transform = 'translateY(-50%)';
    } else {
      // Horizontal rails keep labels on a fixed baseline (no zigzag riding).
      s.style.left = x + 'px';
      s.style.top = '58px';
      s.style.transform = 'translateX(-50%)';
    }
    stops.appendChild(s);
  });
}

/** Paint progress along the route: solid road behind, dotted ahead. */
function renderTrip() {
  if (!tripPts) return;
  // Progress in "stop space": integer part = last rank reached, fraction =
  // interpolation toward the next threshold.
  let seg = 0;
  for (let i = 0; i < ranks.length; i++) if (total >= ranks[i][1]) seg = i;
  let frac = seg;
  if (seg < ranks.length - 1) {
    const lo = ranks[seg][1], hi = ranks[seg + 1][1];
    frac = seg + Math.min(1, (total - lo) / Math.max(1, hi - lo));
  }
  const i = Math.min(Math.floor(frac), tripPts.length - 1), t = frac - i;
  const cut = tripPts.slice(0, i + 1).map(p => p.slice());
  if (i < tripPts.length - 1 && t > 0) {
    const [ax, ay] = tripPts[i], [bx, by] = tripPts[i + 1];
    cut.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
  }
  $('tripprog').setAttribute('points', cut.map(p => p.join(',')).join(' '));
  const cur = rank();
  document.querySelectorAll('.tripdot').forEach((d, idx) => {
    const reached = total >= ranks[idx][1];
    d.setAttribute('fill', reached ? 'var(--accent)' : 'var(--card)');
    d.setAttribute('stroke', reached ? 'var(--accent)' : 'var(--bar)');
    d.setAttribute('r', ranks[idx][0] === cur ? 7 : 5.5);
  });
  document.querySelectorAll('.sname').forEach((s, idx) => {
    s.classList.toggle('reached', total >= ranks[idx][1]);
    s.classList.toggle('current', ranks[idx][0] === cur);
  });
  // Horizontal rails: nudge any label back inside the card. An end label
  // centered on its dot (especially when enlarged as current) would otherwise
  // poke past the card edge. Runs after the class toggles above, since
  // becoming current changes a label's width.
  if (!isVerticalTrip()) {
    const tr = document.querySelector('.trip').getBoundingClientRect();
    document.querySelectorAll('.sname').forEach(s => {
      s.style.marginLeft = '0px';
      const r = s.getBoundingClientRect();
      if (r.left < tr.left) s.style.marginLeft = (tr.left - r.left) + 'px';
      else if (r.right > tr.right) s.style.marginLeft = (tr.right - r.right) + 'px';
    });
  }
}

/* ================================================================
 * 9. Stats
 * ================================================================ */

/** Repaint the stats modal from the lifetime record (finished days only). */
function renderStats() {
  const days = Object.entries(statsDays).filter(([, v]) => v.w > 0);
  const set = new Set(days.map(([k]) => k));

  // Current streak: walk back from today; an unfinished today doesn't break it.
  let streak = 0;
  for (let d = todayDate(); ; d.setDate(d.getDate() - 1)) {
    if (set.has(dkey(d))) streak++;
    else if (dkey(d) === todayKey()) continue;
    else break;
  }

  // Best streak: longest run of consecutive dates in the record.
  let best = 0, run = 0, prev = null;
  for (const k of [...set].sort()) {
    const cur = new Date(k + 'T12:00');
    run = (prev && (cur - prev) < 1.5 * 86400000) ? run + 1 : 1;
    best = Math.max(best, run);
    prev = cur;
  }

  $('statplayed').textContent = days.length;
  $('statstreak').textContent = streak;
  $('statbest').textContent = best;

  // Rank distribution, top rank first; today highlighted once finished.
  const counts = {};
  for (const [name] of RANKS) counts[name] = 0;
  for (const [, v] of days) if (counts[v.r] !== undefined) counts[v.r]++;
  const max = Math.max(1, ...Object.values(counts));
  const todayRank = (isDaily && finished) ? rank() : null;
  const box = $('dist');
  box.innerHTML = '';
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const name = RANKS[i][0];
    const row = document.createElement('div');
    row.className = 'distrow' + (name === todayRank ? ' today' : '');
    row.innerHTML = '<span class="dname">' + name + '</span>' +
      '<span class="dbar"><i style="width:' + (100 * counts[name] / max) + '%"></i></span>' +
      '<b>' + counts[name] + '</b>';
    box.appendChild(row);
  }
}

/* ================================================================
 * 10. Messages & label flashes
 * ================================================================ */

let sayTimer = null, sayHideTimer = null;

/** Show feedback near the input; auto-expires (longer if it carries a button).
 *  Sentence-cases the message and fades it in/out via .msg.show. */
function say(text, cls, extra) {
  const m = $('msg');
  clearTimeout(sayTimer);
  clearTimeout(sayHideTimer);
  if (!text && !extra) {                       // explicit clear (plate reset): no fade
    m.textContent = '';
    m.className = 'msg';
    return;
  }
  m.textContent = text.charAt(0).toUpperCase() + text.slice(1);
  m.className = 'msg ' + (cls || '');          // drops .show; the reflow below restarts the fade
  if (extra) m.appendChild(extra);
  void m.offsetWidth;
  m.classList.add('show');
  sayTimer = setTimeout(() => {
    m.classList.remove('show');                // fade out, then empty
    sayHideTimer = setTimeout(() => { m.textContent = ''; m.className = 'msg'; }, 300);
  }, extra ? 6000 : 3000);
}

/** Swap a button's label briefly ("Copied") without changing its width —
 *  buttons reserve room in CSS via min-width. */
function flashLabel(el, text) {
  if (el.dataset.flashing) return;
  el.dataset.flashing = '1';
  const t = el.textContent;
  el.style.minWidth = el.offsetWidth + 'px';   // hold width during the flash
  el.textContent = text;
  setTimeout(() => {
    el.textContent = t;
    el.style.minWidth = '';
    delete el.dataset.flashing;
  }, 1200);
}

/* ================================================================
 * 11. Play actions
 * ================================================================ */

/** Set up a plate (today's or a dev roll) and reset per-plate state. */
function setPlate(clue) {
  CLUE = clue;
  isDaily = (clue === dailyClue());
  UP = clue.toUpperCase().split('').join('-');

  const ca = computeAnswers(clue);
  answers = ca.answers;
  vpWord = ca.vp;
  perfect = VP_BONUS;
  for (const w in answers) perfect += answers[w].p;
  ranks = RANKS.map(([n, f]) => [n, Math.round(perfect * f / 5) * 5]);

  total = 0; found = []; hinted = new Set();
  hintsUsed = 0; finished = false;

  document.body.classList.remove('fin');
  $('inp').disabled = false;
  $('hintbtn').disabled = false;
  $('finishbtn').style.display = '';
  const sb = $('sharebtn');
  sb.classList.add('gated');
  sb.title = GATE_TIP;
  syncCover();

  $('clue').textContent = CLUE.toUpperCase();
  $('ptop').textContent = plateTopText();
  $('fclue').textContent = CLUE.toUpperCase();
  $('fptop').textContent = plateTopText();
  document.documentElement.style.setProperty('--pline-size',
    (21.5 * 8 / (CLUE.length + 5)).toFixed(2) + 'cqw');
  $('column').innerHTML = '';
  $('column').classList.remove('two');
  $('empty').style.display = 'block';
  $('reveal').innerHTML = '';
  $('candlist').innerHTML = '';
  $('candcount').textContent = '';
  closeModal('wlmodal');
  $('upcoming').value = '';

  buildTrip();
  say('', '');
  render();
}

/** Enter today's plate, restoring saved progress (boot cache first, then live
 *  storage — the initial render would otherwise clobber the snapshot). */
function goDaily() {
  const snap = bootUsed ? unstore(DAY_KEY, null) : bootDay;
  bootUsed = true;
  setPlate(dailyClue());
  restoreDay(snap);
  $('inp').focus();
}

/** Handle a word submission. */
function submitWord() {
  if (finished) return;
  const inp = $('inp');
  const w = inp.value.trim().toLowerCase();
  inp.value = '';
  if (!w) return;
  const W = w.toUpperCase();
  // A word exactly the clue's length can only be the clue itself, spelled
  // out — allowed (OAF is valid for O-A-F). Anything shorter can't fit.
  if (w.length < CLUE.length) return say('too short', 'err');
  if (!isValid(w, CLUE)) return say(W + " doesn't contain " + UP, 'err');
  if (found.includes(w)) return say('already found', 'err');

  const a = answers[w];
  if (!a) {
    // Not on the answer list: dev mode may rescue it into the dictionary.
    if (decisions.get(w) === 'add') return rescue(w);
    if (!isDev()) return say(W + ' is not in the word list', 'err');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '+ rescue ' + W;
    btn.onclick = () => rescue(w);
    return say(W + ' is not in the word list', 'err', btn);
  }

  found.push(w);
  const pts = a.p + (a.vp ? VP_BONUS : 0);
  const before = total;
  total += pts;
  if (a.vp) say('VANITY PLATE! ' + W + '  +' + pts, 'gold');
  else say(W + '  +' + pts, 'ok');
  addFoundRow(w, pts, a, '');
  syncReveal();
  render();
  // Crossing into the top rank mid-play earns the Liftoff celebration.
  const top = ranks[ranks.length - 1][1];
  if (before < top && total >= top) openLiftoff();
}

/** Reveal the shortest unfound word as a mask (cheapest remaining answer). */
function hint() {
  if (finished) return;
  const pool = Object.keys(answers).filter(w =>
    !found.includes(w) && !hinted.has(w) && decisions.get(w) !== 'remove');
  if (!pool.length) return say('nothing left to hint', 'err');
  pool.sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
  const w = pool[0];
  hinted.add(w);
  hintsUsed++;
  insertRow(w, makeHintRow(w));
  say('', '');
  render();
}

/** Dev: accept an off-list word into the pending dictionary additions. */
function rescue(w) {
  const sc = scoreWord(w, CLUE);
  decisions.set(w, 'add');
  persistDecisions();
  found.push(w);
  total += sc.p;
  addFoundRow(w, sc.p, { s: sc.s }, ' rescued' + (sc.s ? ' snug' : ''));
  say(w.toUpperCase() + ' rescued  +' + sc.p, 'ok');
  renderPending();
  render();
}

/** Dev: back out a rescued word — points, found row, and pending addition. */
function unrescue(w) {
  decisions.delete(w);
  persistDecisions();
  total -= scoreWord(w, CLUE).p;
  found.splice(found.indexOf(w), 1);
  const row = document.querySelector('#column .row[data-w="' + w + '"]');
  if (row) row.remove();
  updateColumns();
  say(w.toUpperCase() + ' un-rescued', 'err');
  syncCand();
  renderPending();
  render();
}

/* ================================================================
 * 12. Finish & sharing
 * ================================================================ */

/** Four-line text share card. */
function shareText() {
  return 'Plates #' + (dayIndex() + 1) + ': ' + dateStr() + '\n' +
         '[' + CLUE.toUpperCase() + ' - ' + total + '] ' + rank() + '\n' +
         'Hints used: ' + hintsUsed + '\n' +
         'platesgame.com';
}

/** The plate's hover cover doubles as the share gate / copy affordance. */
function syncCover() {
  $('platecover').textContent =
    finished ? (TAP ? 'Tap to copy' : 'Click to copy') : GATE_TIP;
}

/** Lock the page into the finished ("trophy") state. */
function applyFinished() {
  $('inp').disabled = true;
  $('hintbtn').disabled = true;
  $('finishbtn').style.display = 'none';
  const sb = $('sharebtn');
  sb.classList.remove('gated');
  sb.title = '';
  document.body.classList.add('fin');
  $('pbot').textContent =
    (rank() + ' • hints used: ' + hintsUsed).toUpperCase();
  syncCover();
}

function finishGame(withConfetti) {
  finished = true;
  applyFinished();
  saveDay();
  if (withConfetti) confetti();
  openFinish();
}

/** Gold palette for the Liftoff burst. */
const GOLD_CONFETTI = ['#a8781a', '#c9971f', '#e0b32c', '#f0c94a',
                       '#f7e08a', '#fff3c4'];

/** Brief burst of confetti over everything (default: logo blues). */
function confetti(palette, count) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:fixed;inset:0;z-index:40;pointer-events:none;';
  cv.width = innerWidth;
  cv.height = innerHeight;
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const cols = palette || ['#1a57c2', '#3f7ae0', '#6f9ae8', '#a5c2f5',
                           '#dce9ff', '#fffaf0'];
  const parts = Array.from({ length: count || 150 }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.55,
    y: innerHeight * 0.32 + (Math.random() - 0.5) * 60,
    vx: (Math.random() - 0.5) * 9,
    vy: -(4 + Math.random() * 8),
    w: 5 + Math.random() * 7,
    h: 4 + Math.random() * 4,
    r: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    c: cols[Math.floor(Math.random() * cols.length)],
  }));
  const t0 = performance.now();
  (function tick(t) {
    const el = (t - t0) / 1000;
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.vy += 0.18; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.globalAlpha = Math.max(0, 1 - el / 2);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (el < 2.1) requestAnimationFrame(tick); else cv.remove();
  })(t0);
}

/**
 * Draw the share image: the page plate's twin (same top field, rank color,
 * stretched registration) plus the rank/hints bottom field.
 */
async function drawPlate() {
  try { await document.fonts.load('150px "License Plate"'); } catch (e) { /* draw anyway */ }
  paintShareCanvas($('plateimg').getContext('2d'), design,
                   { b: drawImg, f: drawImgF });
}

/** Copy a canvas as PNG to the clipboard, downloading as fallback. */
function copyCanvas(cb) {
  $('plateimg').toBlob(async blob => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      cb('Copied');
    } catch (e) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'plates-' + todayKey() + '.png';
      a.click();
      URL.revokeObjectURL(a.href);
      cb('Downloaded');
    }
  }, 'image/png');
}

/** Page plate click: gate reminder before finish, image copy after. */
async function plateClick() {
  const c = $('platecover');
  if (!finished) {
    c.classList.add('show');                     // touch devices have no hover
    setTimeout(() => c.classList.remove('show'), 1200);
    return;
  }
  await drawPlate();
  copyCanvas(result => {
    c.textContent = result;
    c.classList.add('show');
    setTimeout(() => { c.classList.remove('show'); syncCover(); }, 1200);
  });
}

/** Modal plate click: copy with an overlay flash on the plate itself. */
function copyPlate() {
  copyCanvas(result => {
    const f = $('plateflash');
    f.textContent = result;
    f.classList.add('show');
    setTimeout(() => f.classList.remove('show'), 1200);
  });
}

function copyText(ev) {
  navigator.clipboard.writeText(shareText())
    .then(() => flashLabel(ev.target, 'Copied'));
}

/** Share copies the plate IMAGE; "Copy as text" covers the text card. */
async function shareClick() {
  const btn = $('sharebtn');
  if (!finished) return say(GATE_TIP, 'err');
  await drawPlate();
  copyCanvas(result => flashLabel(btn, result));
}

/* ================================================================
 * 13. Modals
 * ================================================================ */

function openModal(id) { $(id).classList.add('open'); }
function closeModal(id) { $(id).classList.remove('open'); }

async function openFinish() {
  $('finishscore').innerHTML = '<b>' + total + '</b> points &mdash; ' + rank();
  $('copynote').textContent = (TAP ? 'tap' : 'click') + ' the plate to copy it';
  await drawPlate();
  openModal('finishmodal');
}
function closeFinish() { closeModal('finishmodal'); }

/** The Liftoff celebration: gold confetti and a finish-or-continue choice. */
function openLiftoff() {
  openModal('liftoffmodal');
  confetti(GOLD_CONFETTI, 320);
}

/** Yesterday's full answer list: found words bolded, VP in gold. */
function renderYesterday() {
  const info = yesterdayInfo();
  const sub = $('ysub');
  const box = $('ylist');
  box.innerHTML = '';
  if (!info) {
    sub.textContent = 'This is the very first Plates: no yesterday yet.';
  } else {
    const { answers: ya, vp } = computeAnswers(info.clue);
    const got = new Set((statsDays[info.key] && statsDays[info.key].f) || []);
    sub.textContent = 'Plates #' + info.no + ' • ' +
      info.clue.toUpperCase().split('').join('-') + ' • you found ' +
      [...got].filter(w => ya[w]).length + ' of ' + Object.keys(ya).length;
    for (const w of Object.keys(ya).sort()) {
      const row = document.createElement('div');
      row.className = 'yword' + (got.has(w) ? ' got' : '') + (w === vp ? ' vp' : '');
      row.innerHTML = w.toUpperCase() +
        (w === vp ? ' <span class="tag vp">VP</span>' : '') +
        ' <b>+' + (ya[w].p + (w === vp ? VP_BONUS : 0)) + '</b>';
      box.appendChild(row);
    }
  }
}

/* ================================================================
 * 14. Dev tools
 * ================================================================ */

function isDev() { return document.body.classList.contains('dev'); }

/**
 * Dev mode is gated by a password so players don't stumble into spoilers.
 * Only this SHA-256 hash of the password appears in source; a successful
 * unlock is remembered per browser (storing the hash, so changing the
 * password below revokes old unlocks).
 *
 * This is spoiler protection, not security: the site is fully client-side,
 * so a determined reader can see the answers in data.js regardless.
 *
 * To change the password, run this in the browser console and paste the
 * result here:
 *   await (async s => [...new Uint8Array(await crypto.subtle.digest(
 *     'SHA-256', new TextEncoder().encode(s)))].map(
 *     x => x.toString(16).padStart(2, '0')).join(''))('new password')
 */
const DEV_HASH = '6eaf141afb05baff85d459d00518f8503a680def287d9ccd25f24010210e4b2d';
const DEV_UNLOCK_KEY = 'plates-dev-ok';

function devUnlocked() { return unstore(DEV_UNLOCK_KEY, '') === DEV_HASH; }

/** SHA-256 hex digest of a string. */
async function sha256hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

/** Difficulty band for dev rolls (gimme counts from ELIG). */
function inBand(g) {
  return diff === 'easy' ? g >= 6 :
         diff === 'medium' ? (g >= 3 && g <= 5) : g <= 2;
}

function setDiff(d) {
  diff = d;
  document.querySelectorAll('#seg button').forEach(b =>
    b.classList.toggle('active', b.dataset.d === d));
  roll();
}

function setRollLen(l) {
  rollLen = l;
  document.querySelectorAll('#lenseg button').forEach(b =>
    b.classList.toggle('active', b.dataset.l === l));
  roll();
}

/** Roll a random eligible clue in the current band and length choice. */
function roll() {
  const pool = ELIG.filter(([c, g]) => inBand(g) && c !== CLUE &&
    (rollLen === 'any' || c.length === +rollLen));
  if (!pool.length) return say('no eligible clues for that combination', 'err');
  setPlate(pool[Math.floor(Math.random() * pool.length)][0]);
  $('inp').focus();
}

/**
 * Wordlist management (dev): one modal holding the day's wordlist beside the
 * candidate pool, with every pending decision reviewable in a footer strip.
 * Both lists build lazily on first open and are cleared by setPlate.
 */
async function openWordlist() {
  $('wltitle').textContent = 'Wordlist for ' + UP;
  setWlStatus('');
  buildWordlistPane();
  syncReveal();
  renderPending();
  openModal('wlmodal');
  await buildCandidatePane();
  syncCand();
}

/** Left pane: the current plate's full answer list, click-to-mark-removal. */
function buildWordlistPane() {
  const box = $('reveal');
  $('wlcount').textContent = Object.keys(answers).length +
    ' words';
  if (box.childElementCount) return;
  for (const w of Object.keys(answers).sort()) {
    const a = answers[w];
    const row = document.createElement('div');
    row.dataset.w = w;
    let tags = '';
    if (a.vp) tags += ' <span class="tag vp">VP</span>';
    if (a.s) tags += ' <span class="tag snug">SNUG</span>';
    row.innerHTML = w.toUpperCase() + tags +
      ' <b>' + (a.p + (a.vp ? VP_BONUS : 0)) + '</b>';
    row.onclick = () => {
      if (decisions.get(w) === 'remove') decisions.delete(w);
      else decisions.set(w, 'remove');
      persistDecisions();
      syncReveal();
      renderPending();
      render();
    };
    box.appendChild(row);
  }
}

/**
 * Candidate pool (dev): candidates.js defines EXTRA — every SCOWL
 * lowercase-only word of length >= 4 that is NOT in the game dictionary.
 * It's ~800KB, so it loads only when a dev first opens the candidates card.
 */
let extraLoaded = null;
function loadExtra() {
  if (!extraLoaded) {
    extraLoaded = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'candidates.js?v=' + BUILD;
      s.onload = resolve;
      s.onerror = () => {
        extraLoaded = null;
        reject(new Error('could not load candidates.js'));
      };
      document.head.appendChild(s);
    });
  }
  return extraLoaded;
}

/** Right pane: out-of-dictionary words fitting the clue, click-to-queue. */
async function buildCandidatePane() {
  const box = $('candlist');
  if (box.childElementCount) return;
  $('candcount').textContent = 'loading…';
  try { await loadExtra(); } catch (e) {
    $('candcount').textContent = e.message;
    return;
  }
  const fits = EXTRA.filter(w => isValid(w, CLUE));
  $('candcount').textContent =
    fits.length;
  for (const w of fits) {
    const row = document.createElement('div');
    row.dataset.w = w;
    row.innerHTML = w.toUpperCase() + ' <b>' + scoreWord(w, CLUE).p + '</b>';
    row.onclick = () => {
      if (decisions.get(w) === 'add') decisions.delete(w);
      else decisions.set(w, 'add');
      persistDecisions();
      syncCand();
      renderPending();
      render();
    };
    box.appendChild(row);
  }
}

function syncCand() {
  document.querySelectorAll('#candlist div[data-w]').forEach(row => {
    row.className = 'cword' +
      (decisions.get(row.dataset.w) === 'add' ? ' adding' : '');
  });
}

function syncReveal() {
  document.querySelectorAll('#reveal div[data-w]').forEach(row => {
    const w = row.dataset.w;
    row.className = 'rword' + (found.includes(w) ? '' : ' missed') +
                    (decisions.get(w) === 'remove' ? ' removed' : '');
  });
}

/* ---- dictionary commits ----
 *
 * Pending decisions (rescues and removals) are committed straight to the
 * repo via the GitHub contents API: DICT inside data.js is edited in place
 * (ELIG and SCHED stay frozen, so no past or future plate changes), and
 * dictionary.txt is regenerated to match. The site deploy workflow then
 * ships the new dictionary automatically.
 *
 * Needs a fine-grained personal access token (contents read/write on
 * mschachner/plates), asked for once and kept in this browser only.
 */

const GH_TOKEN_KEY = 'plates-gh-token';
const GH_API = 'https://api.github.com/repos/mschachner/plates/contents/';

function ghHeaders() {
  return { Authorization: 'Bearer ' + unstore(GH_TOKEN_KEY, ''),
           Accept: 'application/vnd.github+json' };
}

/** UTF-8-safe base64 codecs for the contents API. */
function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
function b64decode(s) { return decodeURIComponent(escape(atob(s.replace(/\n/g, '')))); }

async function ghGet(file) {
  const r = await fetch(GH_API + file, { headers: ghHeaders() });
  if (!r.ok) throw new Error(file + ': HTTP ' + r.status);
  return r.json();
}

async function ghPut(file, text, sha, message) {
  const r = await fetch(GH_API + file, {
    method: 'PUT',
    headers: ghHeaders(),
    body: JSON.stringify({ message, content: b64encode(text), sha }),
  });
  if (!r.ok) throw new Error(file + ': HTTP ' + r.status);
}

/** Footer strip: every pending decision as a discardable chip. */
function renderPending() {
  const chips = $('wlchips');
  chips.innerHTML = '';
  $('wlpending').textContent = decisions.size
    ? decisions.size + ' pending:' : 'No pending changes.';
  for (const [w, c] of [...decisions].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
    const chip = document.createElement('span');
    chip.className = 'wlchip ' + c;
    chip.title = c === 'add' ? 'queued for addition' : 'marked for removal';
    chip.innerHTML = '<span class="wlword">' + w.toUpperCase() + '</span>';
    const x = document.createElement('button');
    x.type = 'button';
    x.innerHTML = '&times;';
    x.title = 'Discard this change';
    x.onclick = () => discardDecision(w);
    chip.appendChild(x);
    chips.appendChild(chip);
  }
  $('wlcommit').disabled = !decisions.size;
}

/** Drop one pending decision; discarding a rescue also backs the word out. */
function discardDecision(w) {
  if (decisions.get(w) === 'add' && found.includes(w) && !answers[w]) {
    return unrescue(w);                    // un-rescue handles the rest
  }
  decisions.delete(w);
  persistDecisions();
  syncReveal();
  syncCand();
  renderPending();
  render();
}

/** Commit status line inside the modal's footer strip. */
function setWlStatus(text, cls) {
  const s = $('wlstatus');
  s.textContent = text;
  s.className = 'wlstatus' + (cls ? ' ' + cls : '');
}

async function commitDictionary() {
  if (!decisions.size) return;
  if (!unstore(GH_TOKEN_KEY, '')) return openModal('ghmodal');
  const btn = $('wlcommit');
  btn.disabled = true;
  setWlStatus('committing\u2026');
  const committed = [...decisions];
  try {
    const data = await ghGet('data.js');
    const text = b64decode(data.content);
    const m = text.match(/const DICT = "([^"]*)"/);
    if (!m) throw new Error('DICT not found in data.js');
    const words = new Set(m[1].split(' '));
    let added = 0, removed = 0;
    for (const [w, c] of decisions) {
      if (c === 'add' && !words.has(w)) { words.add(w); added++; }
      else if (c === 'remove' && words.delete(w)) removed++;
    }
    const list = [...words].sort();
    const msg = 'Dictionary: +' + added + ' \u2212' + removed +
                ' (in-game curation)';
    await ghPut('data.js',
                text.replace(m[0], 'const DICT = "' + list.join(' ') + '"'),
                data.sha, msg);
    const dict = await ghGet('dictionary.txt');
    await ghPut('dictionary.txt', list.join('\n') + '\n', dict.sha, msg);
    // Keep the dev candidate pool in step: committed additions leave EXTRA,
    // removals re-enter it (close enough for curation tooling — a removed
    // non-SCOWL rescue re-entering the pool is harmless).
    try {
      const cand = await ghGet('candidates.js');
      const ctext = b64decode(cand.content);
      const cm = ctext.match(/const EXTRA = "([^"]*)"/);
      if (cm) {
        const pool = new Set(cm[1].split(' '));
        for (const [w, c] of committed) {
          if (c === 'add') pool.delete(w);
          else if (w.length >= 4) pool.add(w);
        }
        await ghPut('candidates.js',
                    ctext.replace(cm[0],
                      'const EXTRA = "' + [...pool].sort().join(' ') + '"'),
                    cand.sha, msg);
      }
    } catch (e) { /* pool sync is best-effort */ }
    decisions.clear();
    persistDecisions();
    syncReveal();
    syncCand();
    renderPending();
    render();
    setWlStatus('committed +' + added + ' \u2212' + removed +
                '. live after the next deploy', 'ok');
  } catch (e) {
    // A 401 means the stored token is bad or expired: forget it and re-ask.
    if (String(e.message).includes('401')) {
      store(GH_TOKEN_KEY, '');
      openModal('ghmodal');
    }
    setWlStatus('commit failed. ' + e.message, 'err');
  }
  btn.disabled = !decisions.size;
}

/** Dev: set the score one short word from Liftoff, to test the celebration. */
function nearLiftoff() {
  if (finished) return say('reset finish first', 'err');
  total = Math.max(0, ranks[ranks.length - 1][1] - LENGTH_POINTS);
  render();
  say('one word from Liftoff', 'ok');
}

/** Dev: unlock a finished day (also un-records it from stats). */
function resetFinish(ev) {
  finished = false;
  document.body.classList.remove('fin');
  delete statsDays[todayKey()];
  store(STATS_KEY, statsDays);
  $('inp').disabled = false;
  $('hintbtn').disabled = false;
  $('finishbtn').style.display = '';
  const sb = $('sharebtn');
  sb.classList.add('gated');
  sb.title = GATE_TIP;
  syncCover();
  saveDay();
  flashLabel(ev.target, 'Done');
}

/** Dev: wipe today back to a blank slate. */
function resetToday(ev) {
  delete statsDays[todayKey()];
  store(STATS_KEY, statsDays);
  setPlate(dailyClue());
  saveDay();
  flashLabel(ev.target, 'Done');
}

/* ================================================================
 * 15. Rendering root, event wiring & boot
 * ================================================================ */

/** Repaint everything score-dependent and persist. Called after any change. */
function render() {
  setOdo(total);
  renderTrip();
  const nRem = [...decisions.values()].filter(v => v === 'remove').length;
  const parts = [];
  if (found.length) {
    parts.push(found.length + ' of ' + Object.keys(answers).length + ' words');
  }
  if (decisions.size) {
    parts.push((decisions.size - nRem) + ' rescued · ' +
               nRem + ' marked for removal');
  }
  $('count').textContent = parts.join(' · ');
  $('hintbtn').textContent = hintsUsed
    ? 'Hint (' + hintsUsed + ' used)' : 'Hint';
  $('wlbtn').textContent = decisions.size
    ? 'Manage wordlist (' + decisions.size + ')' : 'Manage wordlist';
  document.documentElement.style.setProperty('--rankc', rankColor());
  document.body.classList.toggle('liftoff', rank() === 'Liftoff');
  repaintPlates();
  saveDay();
  renderStats();
}

function wireEvents() {
  // Play
  $('form').addEventListener('submit', e => { e.preventDefault(); submitWord(); });
  // Tapping the on-screen Enter or Hint button must not move focus off the
  // input, or the mobile keyboard collapses. Cancelling pointerdown keeps
  // focus where it is; the click (and form submit) still fire.
  $('enterbtn').addEventListener('pointerdown', e => e.preventDefault());
  $('hintbtn').addEventListener('pointerdown', e => e.preventDefault());
  $('floattoggle').addEventListener('pointerdown', e => e.preventDefault());
  $('inp').addEventListener('input', () => {
    const inp = $('inp');
    const clean = inp.value.replace(/[^a-zA-Z]/g, '');   // letters only
    if (clean !== inp.value) inp.value = clean;
  });
  $('hintbtn').addEventListener('click', hint);
  $('finishbtn').addEventListener('click', () => finishGame(true));
  // Liftoff modal: Finish skips the blue confetti (gold already fell).
  $('lofinish').addEventListener('click', () => {
    closeModal('liftoffmodal');
    finishGame(false);
  });
  $('lokeep').addEventListener('click', () => closeModal('liftoffmodal'));
  $('sharebtn').addEventListener('click', shareClick);
  $('copytextbtn').addEventListener('click', copyText);
  $('fincopybtn').addEventListener('click', copyText);
  document.querySelector('.plate').addEventListener('click', plateClick);

  // Header
  $('rulesbtn').addEventListener('click', () => openModal('rulesmodal'));
  wireDesigner();
  // Collapsible Stats / Yesterday sections. Stats content is kept fresh by
  // render(); yesterday's answer list is computed on first expand.
  $('statshead').addEventListener('click', () =>
    $('statsdisc').classList.toggle('open'));
  $('yesthead').addEventListener('click', () => {
    if (!$('yestdisc').classList.contains('open')) renderYesterday();
    $('yestdisc').classList.toggle('open');
  });
  // The dev switch shows only where it's relevant: on a browser that has
  // unlocked dev mode before, or when the page is visited with #dev.
  const syncDevVisibility = () => document.body.classList.toggle('devvis',
    devUnlocked() || location.hash === '#dev');
  window.addEventListener('hashchange', syncDevVisibility);
  syncDevVisibility();
  $('devtoggle').addEventListener('change', e => {
    if (e.target.checked && !devUnlocked()) {
      e.target.checked = false;
      $('devpass').value = '';
      $('devpassmsg').textContent = '';
      openModal('devmodal');
      $('devpass').focus();
      return;
    }
    document.body.classList.toggle('dev', e.target.checked);
  });
  $('devform').addEventListener('submit', async e => {
    e.preventDefault();
    if (await sha256hex($('devpass').value) !== DEV_HASH) {
      $('devpassmsg').textContent = 'Wrong password.';
      $('devpass').select();
      return;
    }
    store(DEV_UNLOCK_KEY, DEV_HASH);
    syncDevVisibility();
    closeModal('devmodal');
    $('devtoggle').checked = true;
    document.body.classList.add('dev');
  });
  // Floating score plate (mobile): built once, toggled by its button, with
  // the choice remembered across visits.
  buildFloatPlate();
  $('floattoggle').addEventListener('click', () => setFloatPlate($('floatplate').hidden));
  window.addEventListener('resize', layoutMobileChrome);
  setFloatPlate(unstore(FLOAT_KEY, false));
  $('buildtag').textContent = 'b' + BUILD;

  // Welcome
  $('welcomego').addEventListener('click', () => closeModal('welcomemodal'));
  $('welcomehow').addEventListener('click', () => {
    closeModal('welcomemodal');
    openModal('rulesmodal');
  });

  // Finish modal
  $('plateimg').addEventListener('click', copyPlate);

  // Dev tools
  $('rollbtn').addEventListener('click', roll);
  $('todaybtn').addEventListener('click', goDaily);
  $('wlbtn').addEventListener('click', openWordlist);
  $('wlcommit').addEventListener('click', commitDictionary);
  $('ghform').addEventListener('submit', e => {
    e.preventDefault();
    const t = $('ghtoken').value.trim();
    if (!t) return;
    store(GH_TOKEN_KEY, t);
    closeModal('ghmodal');
    commitDictionary();
  });
  // Upcoming plates: the next 14 scheduled days, playable ahead of time.
  const up = $('upcoming');
  const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let k = 1; k <= 14; k++) {
    const idx = dayIndex() + k, n = SCHED.length;
    const d = todayDate();
    d.setDate(d.getDate() + k);
    const o = document.createElement('option');
    o.value = SCHED[((idx % n) + n) % n];
    o.textContent = '#' + (idx + 1) + ' / ' + d.getDate() + ' ' +
                    MO[d.getMonth()] + ' / ' + o.value.toUpperCase();
    up.appendChild(o);
  }
  up.addEventListener('change', () => {
    if (up.value) { setPlate(up.value); $('inp').focus(); }
  });
  $('resetfinbtn').addEventListener('click', resetFinish);
  $('resettodaybtn').addEventListener('click', resetToday);
  $('nearliftbtn').addEventListener('click', nearLiftoff);
  document.querySelectorAll('#seg button').forEach(b =>
    b.addEventListener('click', () => setDiff(b.dataset.d)));
  document.querySelectorAll('#lenseg button').forEach(b =>
    b.addEventListener('click', () => setRollLen(b.dataset.l)));
  // Custom clue: type any 3- or 4-letter clue and load it as a test plate.
  $('clueform').addEventListener('submit', e => {
    e.preventDefault();
    const c = $('cluein').value.trim().toLowerCase();
    if (!/^[a-z]{3,4}$/.test(c)) {
      return say('clue must be 3 or 4 letters', 'err');
    }
    $('cluein').value = '';
    setPlate(c);
    say(Object.keys(answers).length + ' answers for ' + UP, 'ok');
    $('inp').focus();
  });

  // Leaving without pressing Finish forfeits the day's stats entry, so warn
  // when today's plate has real progress. (Browsers show their own generic
  // wording; the handler just opts in. Dev rolls and finished days never
  // warn, and neither does an untouched page.)
  window.addEventListener('beforeunload', e => {
    if (isDaily && !finished && found.length > 0) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Modals: any .close button or backdrop click closes; Escape closes all.
  document.querySelectorAll('.overlay').forEach(ov => {
    ov.addEventListener('click', e => {
      if (e.target === ov) ov.classList.remove('open');
    });
    const x = ov.querySelector('.close');
    if (x) x.addEventListener('click', () => ov.classList.remove('open'));
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.overlay.open').forEach(ov =>
        ov.classList.remove('open'));
    }
  });

  // Layout reactions
  window.addEventListener('resize', () => {
    updateColumns();
    if (tripPts) { buildTrip(); renderTrip(); }
    repaintPlates();
  });
  new ResizeObserver(() => {
    if (tripPts) { buildTrip(); renderTrip(); }
  }).observe(document.querySelector('.trip'));
}

function boot() {
  // Restore pending dictionary decisions.
  for (const [w, c] of unstore(DECISIONS_KEY, [])) decisions.set(w, c);
  // The welcome modal reuses the header logo's embedded image.
  $('welcomelogo').src = document.querySelector('.logo').src;
  wireEvents();
  goDaily();
  loadDrawImg();
}

boot();
