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

## Clue selection

The game dictionary is `dictionary.txt`, built by filtering SCOWL (wamerican-large).  

Clues are selected so that a daily puzzle has roughly 20–100 valid words.

**Difficulty and the daily schedule.** A clue's **difficulty** is measured by its count of "everyday" valid words. Difficulty scales by day of the week.
