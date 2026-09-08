# Archived: the scanned Testbogen source

This directory holds the work for the app's **previous** content source — three
scanned, hand-marked ARV 2 "Testbogen" (90 multiple-choice questions), which the
app no longer ships. It is kept as provenance, not as live code.

The app now uses the 150 open questions in `data/questions/`. Nothing here is
imported by the app, and `npm run validate:content` does not look at it.

- `tools/` — the scan readers. `read_markers.py` measures the grey answer band
  numerically; `make_answer_sheet.py` composes per-page strips that put the
  question number, option letter and marker cell side by side so the answer key
  could be read without counting rows.
- `extraction/answer-key.md` — the method, the 90 answers, and the five places
  where the three sheets contradicted each other.

The scanned PDFs themselves are in `assets/` (git-ignored).

One result worth carrying forward: those sheets disagreed about the minimum
break at 6 hours of daily working time (Testbogen 1 marked 30 minutes, 2 and 3
marked 20). The current source settles it — question 49 gives **20 minutes** for
a daily working time of up to 7 hours.
