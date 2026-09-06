# Answer key read from the scanned Testbogen

The sheets carry no printed answer letters. A grey band covers the right-hand
column of every page and exactly one option per question is filled in with a
black marker. This file records how each of the 90 answers was read.

## Method

1. `tools/extract/read_markers.py` renders each page to greyscale at 300 dpi and
   measures the covering band numerically. It reports a confidence margin per
   question and never guesses.
2. `tools/extract/make_answer_sheet.py` composes, for every page, a strip that
   places the **question number**, the **option letter** and the **marker cell**
   side by side (they sit ~1500 px apart on the original page). Alignment then
   needs no counting and no hand-computed crop offsets.
3. Every one of the 90 answers was then read from those strips at double
   magnification (`*-top.png` / `*-bottom.png`).

Step 3 is not ceremony. Reading the pages whole, at normal scale, produced two
real off-by-one errors that the magnified strips caught:

| Question | First reading | Verified reading |
|---|---|---|
| Testbogen 1, Frage 16 | c (20 Min.) | **b (30 Min.)** |
| Testbogen 2, Frage 13 | a (62 h) | **b (59 h)** |

Testbogen 2 Frage 13 is the clearer illustration: 53 h (Taxi maximum) + 6 h
(extraordinary overtime) = 59 h, which is what the sheet actually marks.

## The key

`⚠` = flagged; the app shows a warning and does not score the question.

| Q | T1 | T2 | T3 |   | Q | T1 | T2 | T3 |
|---|----|----|----|---|---|----|----|----|
| 1 | a | a | b |   | 16 | b ⚠ | b | b |
| 2 | b | a | c |   | 17 | b ⚠ | c | b |
| 3 | a | c | a |   | 18 | a | c | c |
| 4 | b | c | b |   | 19 | a | c | c |
| 5 | c | a | b |   | 20 | b | a | a |
| 6 | c | b | a |   | 21 | b | a ⚠ | b |
| 7 | a | c | c |   | 22 | c | a | b |
| 8 | b | b | a |   | 23 | a | c | b ⚠ |
| 9 | b | c | c |   | 24 | c | a | a |
| 10 | a | b | a |   | 25 | b | b | c |
| 11 | c | c | a |   | 26 | c | b | b ⚠ |
| 12 | b | a | b |   | 27 | b | a | b |
| 13 | a | b | b |   | 28 | a | c | c |
| 14 | b | c | b |   | 29 | b | b | a |
| 15 | a * | a | c |   | 30 | a | a | a |

`*` Testbogen 1 Frage 15 falls across the page break (option a at the foot of
page 4, options b and c at the head of page 3) and its mark is faint. Option a's
cell is nonetheless clearly darker than the other two, and Testbogen 2 Frage 11
marks the same rule ("Die Arbeitszeit umfasst auch Arbeitspausen von weniger als
15 Minuten"). Recorded as `a`, with a source note shown in the app; not flagged.

## The five flagged questions

These are contradictions **in the source material**, not unresolved readings.
Every one of their markers was confirmed at double magnification.

| Question | Marked | Conflicts with |
|---|---|---|
| T1 Frage 16 | 30 Min. break at 6 h | T2 F16 and T3 F16 both mark **20 Min.** |
| T1 Frage 17 | break split into 2 × 15 Min. | T2 F15 and T3 F15 require each part to be **≥ 20 Min.** |
| T2 Frage 21 | 4× per week down to 10 h | T1 F24 and T3 F21 mark **3× per week down to 9 h** |
| T3 Frage 23 | daily rest may not be split | T1 F22/F23 and T2 F22/F23 describe the conditions under which it **may** be split |
| T3 Frage 26 | handwritten entries not permitted | T1 F26 and T2 F26 both treat them as **permitted**; here the blob also straddles the b/c rule |

These need confirmation against the ARV 2 text or the course provider. Until
then the app displays the marked answer, shows the conflict, and excludes the
question from scoring.

## Cross-sheet corroboration

Where the same rule appears on more than one sheet, the keys agree — the
strongest available evidence that the marking convention was read correctly.

| Rule | T1 | T2 | T3 |
|---|---|---|---|
| max. daily driving time | F3 → 9 h | F3 → 9 h | F3 → 9 h |
| max. weekly driving time | F4 → 45 h | F4 → 45 h | F4 → 45 h |
| break after 4.5 h driving | F5 → 45 min | F5 → after 4.5 h | F5 → 45 min |
| minimum sub-break | F6 → 20 min | F6 → 15 min too short | F7 → 2 × 20 min |
| presence time is working time | F2 → yes | F8 → yes | F8 → yes |
| working time definition | F8 | F9 | F9 |
| normal weekly overtime | F11 → 4 h | F12 → 4 h | F11 → 4 h |
| extraordinary overtime | F13 → 6 h | F13 → 59 h (53+6) | F13 → 6 h |
| break at the latest after | F14 → 5.5 h | F14 → 5.5 h | F14 → 5.5 h |
| work between sub-breaks | F19 → 5.5 h | F19 → 5.5 h | F19 → 5.5 h |
| total break at 10 h | F18 → 1 h | F18 → 2 × 30 min | F18 → 3 × 20 min |
| daily rest, not reduced | F20 → 11 h | F20 → 9 h reduced | F20 → 11 h |
| reduced daily rest | F24 → 3× to 9 h | F20 → 9 h | F21 → 9 h |
| used record sheets handed in | F28 → next week | F30 → next week | — |
