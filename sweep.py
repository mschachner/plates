"""Sweep all 17,576 three-letter clues over the game dictionary (dictionary.txt).

The dictionary: SCOWL (wamerican-large) lowercase-only words of length >= 4
with zipf frequency >= 2.0, minus the editor's ditches/removals, plus keeps,
rescues, and in-game additions (curation-log.csv + in-game commits).

Scoring: 5 points per letter beyond three, plus burial (flat 0 / half-buried 10
/ buried 25), plus 15 for snug, plus the 250 Vanity Plate bonus per puzzle.
Eligibility for a daily: 20-100 answers. (The old rule banning clues that
spell a word was removed.)

Output: sweep_results.csv with one row per clue.
Requires: apt-get install wamerican-large; pip install wordfreq
"""

import csv
from itertools import combinations

from wordfreq import zipf_frequency

TIER_BONUS = {0: 0, 1: 10, 2: 25}
SNUG_BONUS = 15
LENGTH_POINTS = 5
VP_BONUS = 250
GIMME_ZIPF = 4.3
INK = dict(a=1, b=3, c=3, d=2, e=1, f=4, g=2, h=4, i=1, j=8, k=5, l=1, m=3,
           n=1, o=1, p=3, q=10, r=1, s=1, t=1, u=1, v=4, w=4, x=8, y=4, z=10)


def main():
    dictionary = open('dictionary.txt').read().split()

    stats = {}  # clue -> [n, points, gimmes, vp_key]
    for w in dictionary:
        subseqs = set(combinations(w, 3))
        substrs = {tuple(w[i:i + 3]) for i in range(len(w) - 2)}
        density = sum(INK[c] for c in w) / len(w)
        gimme = zipf_frequency(w, 'en') >= GIMME_ZIPF
        vp_key = (-density, len(w), w)
        for clue in subseqs:
            tier = (w[0] != clue[0]) + (w[-1] != clue[2])
            pts = (LENGTH_POINTS * (len(w) - 3) + TIER_BONUS[tier]
                   + (SNUG_BONUS if clue in substrs else 0))
            s = stats.get(clue)
            if s is None:
                stats[clue] = [1, pts, int(gimme), vp_key]
            else:
                s[0] += 1
                s[1] += pts
                s[2] += gimme
                if vp_key < s[3]:
                    s[3] = vp_key

    with open('sweep_results.csv', 'w', newline='') as f:
        out = csv.writer(f)
        out.writerow(['clue', 'n_answers', 'gimmes', 'perfect_score', 'vp_word'])
        alphabet = 'abcdefghijklmnopqrstuvwxyz'
        for a in alphabet:
            for b in alphabet:
                for c in alphabet:
                    clue = (a, b, c)
                    name = a + b + c
                    s = stats.get(clue)
                    n, pts, g = (s[0], s[1] + VP_BONUS, s[2]) if s else (0, 0, 0)
                    out.writerow([name, n, g, pts, s[3][2] if s else ''])
    elig = [s for clue, s in stats.items() if 20 <= s[0] <= 100]
    print(f'{len(elig)} eligible clues; '
          f'max perfect {max(s[1] for s in elig) + VP_BONUS}')


if __name__ == '__main__':
    main()
