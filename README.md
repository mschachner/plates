# Plates

Plates is a daily word game based on license plates which I love to play! Every day, a new plate clue is presented, and players try to supply as many words as they can which are valid for that clue.

## Validity

A word is valid for a clue if the clue appears in the word as an ordered subsequence (not necessarily contiguous).

For example:

- ENTRANCE and FLEECE are valid for E-C-E.
- CHEER is not valid for E-C-E, since no E precedes the C.

## Scoring

A word's score is determined by its length and a few additional bonuses.

### Length, burial, snugness

**Length.** A valid word 5 points per letter beyond the clue's letters.

**Burial.** Words can be *flat*, meaning their first letter is the clue's first letter and their last letter is the clue's last letter; *half-buried*, if exactly one of these holds; or *buried*, in case none of these holds. (For example, for the clue O-G-E, the word ORANGE is flat, the word STOOGE is half-buried, and the word FORGET is buried.)

Flat words get no bonus, half-buried words get +10 points, and buried words get +25 points.

**Snugness**. A valid word is *snug* if the clue appears contiguously in it: e.g., TOGETHER is snug for O-G-E. A snug word scores +15 on top of its other points. 

### Vanity Plate

Plates uses Scrabble scoring to sort letters by rarity:

| 1 | A E I L N O R S T U |
|---|:--|
| 2 | D G |
| 3 | B C M P |
| 4 | F H V W Y |
| 5 | K |
| 8 | J X |
| 10 | Q Z |

The **Vanity Plate** of a puzzle is the word on the answer list with the greatest average Scrabble score, and gets a bonus of +250 points. (Ties are broken first by fewer letters, then alphabetically.)

## Extra words

The game dictionary (`dictionary.txt`) is the everyday word list, and it alone decides the ranks, the Vanity Plate, the hints, and the "x of N" counter. Every *other* SCOWL word — roughly 63,000 of them, held in `candidates.js`, minus the ones deliberately ditched — is an **Extra word**.

Extra words score at the ordinary rate, with no bonus of their own. What they don't do is move the goalposts: an Extra word is never the Vanity Plate, never surfaces as a hint, never counts toward the word tally, and never enters the perfect score the rank thresholds are cut from. So no real word is turned away for being obscure, while the ranks stay tuned to words people actually know.

Extra words show up in blue in the word list, and yesterday's answers are split into **Standard** and **Extra** tabs.

## Clue selection

The game dictionary is `dictionary.txt`, built by filtering SCOWL (wamerican-large) to words of zipf frequency ≥ 2.0, then curating by hand.  

Clues are selected so that a daily puzzle has roughly 20–100 valid words.

**Difficulty and the daily schedule.** A clue's **difficulty** is measured by its count of "everyday" valid words. Difficulty scales by day of the week.
