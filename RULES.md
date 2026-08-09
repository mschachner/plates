# Plates — Rules

Plates is a daily word game built on the letter sequences of license plates. Each puzzle presents a clue; the player supplies words valid for that clue and accumulates points.

## Conventions

Words internal to the game are written in uppercase letters, like EXAMPLE. This removes the need for quotation marks.

A **clue** is a sequence of uppercase letters separated by hyphens, like T-E-S-T. Clue letters may repeat, as in E-C-E. The **length** of a clue is its number of letters. Clues are typically of length 3, matching the three-letter block of a standard license plate.

## Validity

A word is **valid** for a clue if the clue appears in the word as an ordered, not necessarily contiguous, subsequence.

Formally, let the clue be C₁-C₂-⋯-C_k and let the word be W = W₁W₂⋯W_n. An **embedding** of the clue in the word is a sequence of indices i₁ < i₂ < ⋯ < i_k with W_{i_j} = C_j for each j ≤ k. The word is valid for the clue exactly when at least one embedding exists. A valid word may admit several embeddings.

Because the indices of an embedding are strictly increasing, repeated clue letters must be matched to distinct positions in the word: FLEECE is valid for E-C-E only because it contains an E before its C and another E after.

## Clues

A clue must not spell a word: T-E-S-T is excluded as a clue because of TEST, while K-M-U is acceptable.

A word of length k valid for a clue of length k is the clue itself, spelled out. So under this restriction, every valid word for a clue of length k has at least k + 1 letters; in particular, every valid word for a three-letter clue has at least four letters.

### Examples

ENTRANCE and FLEECE are valid for E-C-E.

CHEER is not valid for E-C-E: no E precedes the C.

KUMQUAT is valid for K-M-U, by the embedding (1, 3, 5): the U of the clue is matched to the second U of the word.

## Scoring

A word's score is its length component plus flat bonuses. Longer words score better: finding a longer word should feel like the bigger achievement.

### Length

A valid word of length n scores 5(n − 3) points as its base: 5 points per letter beyond the clue's three. ITEM is worth 5; AUTOBIOGRAPHY carries a base of 50.

### Burial tiers

Fix a clue C₁-⋯-C_k and a valid word W = W₁⋯W_n. The word's tier is determined by its boundary letters:

- **flat**: W₁ = C₁ and W_n = C_k. The word wears the clue on its ends, as ORANGE does for O-G-E. No bonus.
- **half-buried**: exactly one of W₁ = C₁, W_n = C_k holds. Bonus +10.
- **buried**: W₁ ≠ C₁ and W_n ≠ C_k, as FORGET for O-G-E. Bonus +25.

### Snug bonus

A valid word is **snug** if some embedding of the clue is contiguous, that is, if the clue appears in the word as a substring: TOGETHER is snug for O-G-E. A snug word scores +15 on top of its other points. The bonuses stack: TOGETHER (8 letters, buried, snug) is worth 25 + 25 + 15 = 65.

### Vanity Plate

The **ink value** of a letter is its Scrabble value:

| 1 | A E I L N O R S T U |
|---|---|
| 2 | D G |
| 3 | B C M P |
| 4 | F H V W Y |
| 5 | K |
| 8 | J X |
| 10 | Q Z |

The **ink density** of a word is the mean ink value of its letters. The **Vanity Plate** of a puzzle is the word on the answer list with the greatest ink density, ties broken first by fewer letters, then alphabetically. Finding it scores +250 on top of the word's ordinary score.

For K-M-U, the ink-density maximum over an entire unabridged dictionary is KUMQUAT (22 ink over 7 letters, density 3.14). The rule is computed over the day's answer list, not the full dictionary, so that the Vanity Plate is always a findable word.

### The plate format

A day's **perfect score** is the sum of all word scores on the answer list, plus the Vanity Plate bonus. A player's score is shared as a license plate: clue plus total, like [O-G-E 2110]. Clue selection (below) guarantees every score is at most four digits: against the current dictionary, eligible-clue perfect scores run from about 800 to 6,500, median about 2,300.

### Known issue: inflection scoring

Appending an inflectional suffix buys points twice: length (ITEMS outscores ITEM by 5) and often burial (for I-T-M, ITEM is flat but ITEMS is half-buried; VICTIM is half-buried but VICTIMS is buried). Proposed fix: answer lists contain lemmas only — no regular plurals or verb inflections.

## Clue selection

### The dictionary

The game dictionary is dictionary.txt (33,731 words), built from SCOWL (wamerican-large), keeping only all-lowercase entries — SCOWL is case-sensitive, so this drops proper nouns while keeping inflected forms. Membership:

- words with zipf frequency at least 3.5 enter automatically;
- words with zipf in [2.5, 3.5) enter if kept in the editor's triage (all 21,390 were reviewed);
- 925 hand-kept words below 2.5, drawn from sub-floor SCOWL ranked by ink density (the KUMQUAT rescue).

Ongoing curation happens through play: the daily tester lets the editor rescue a rejected word or mark answers for removal, exporting a decisions.csv of adds and removes to fold back into dictionary.txt.

One dictionary governs every puzzle: whether a word counts must have the same answer every day.

### Eligibility of a daily clue

A clue is eligible as a daily puzzle when:

- it does not spell a word (see Clues);
- it has between 20 and 100 valid words in the game dictionary.

Under the 100-answer cap, perfect scores across all eligible clues top out near 6,500 in practice — the four-digit plate format holds automatically, with no separate score cap.

### Difficulty and the daily schedule

A clue's **difficulty** is measured by its count of everyday answers — words with zipf frequency at least 4.3. Easy clues have 6 or more, medium 3–5, hard 2 or fewer. Findability, not answer count, is what separates a gentle plate from a brutal one.

One clue is played per day, the same for every player: a fixed schedule assigns a clue to each date, baked into the game rather than computed live, so dictionary revisions never silently change a past or future day's plate. Plates No. 1 is 9 August 2026. The weekday pattern: Monday–Wednesday easy, Thursday–Friday medium, Saturday hard, Sunday medium.

### Supply and character

Against the current dictionary roughly 3,900 clues are eligible — over a decade of dailies. Clues built from common letters (E-C-E: 1,284 valid words) overflow the cap; clues built from rare letters (K-M-U: 2 words) fall short of it. Eligible clues sit at middling letter frequency, and the dictionary's size decides which band of the clue space is playable: a larger dictionary shifts eligibility toward rarer-lettered clues.
