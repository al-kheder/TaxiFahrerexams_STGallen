# ARV 2 Lernplattform — Taxiprüfung St. Gallen

A learning app for the Swiss **ARV 2** examination (*Berufsmässiger
Personentransport* — professional passenger transport). 150 short questions on
working, driving and rest time, in German, grouped into five parts.

## What is in here

```
data/questions/             the dataset: one file per Teil (30 questions each)
lib/                        types, repository, quiz engine, progress store
components/                 UI
app/                        Next.js App Router pages
tools/validate-content.ts   dataset integrity check, run before deploys
archive/testbogen-scan/     the app's previous source, kept as provenance only
```

## Running it

```bash
npm install
npm run dev
```

| Command | Purpose |
|---|---|
| `npm run dev` | development server on http://localhost:3000 |
| `npm run build` | production build |
| `npm run typecheck` | TypeScript, no emit |
| `npm test` | unit tests for the session rules and the dataset |
| `npm run validate:content` | dataset integrity check |

There are **no environment variables**. Progress is stored in the browser's
`localStorage`; there is no backend and no database.

## Deploying to Vercel

A stock Next.js App Router project, so Vercel needs no configuration beyond its
defaults. The project is already linked; to redeploy:

```bash
npx vercel deploy --prod --yes
```

Run the checks first:

```bash
npm run validate:content && npm run typecheck && npm test && npm run build
```

For a fresh setup: import the repository in Vercel, accept the detected settings
(Framework **Next.js**, build `next build`), and deploy. No `localhost` URLs are
referenced anywhere in the app code, and every route is static.

## The dataset

Each question is one object in `data/questions/teil-N.ts`:

```ts
{
  id: "f49",
  number: 49,                  // as printed in the source, 1–150
  part: 2,                     // the "Teil" the source groups it under
  category: "arbeitspause",    // ours, for topic filtering
  question: "Wie lange muss die Arbeitspause bei bis zu 7 Stunden Tagesarbeitszeit sein?",
  answer: "Mindestens 20 Minuten.",
  source: "ARV 2 – 150 Prüfungsfragen, Frage 49",
}
```

Adding a further Teil means adding one file and one line in
`data/questions/index.ts`. Nothing in the UI needs to change.

### Three deliberate constraints

**The questions are open, so the app cannot mark them.** The source gives one
written answer per question, not options to choose from. The app therefore works
as a flashcard: read the question, recall the answer, reveal it, and rate
yourself *Gewusst* / *Nicht gewusst*. Inventing plausible-but-wrong options to
turn these into multiple choice would mean authoring exam content that is not in
the source, so we don't.

**Scoring is self-reported, and says so.** Every result screen states that the
percentage reflects the learner's own rating rather than a judgement by the app,
and no pass/fail verdict is shown.

**Categories are ours, not the source's.** The source groups questions into five
Teile by position, not by topic. The eight categories in `lib/categories.ts` are
derived from the subject matter so a learner can drill one area at a time; they
are a navigation aid the app adds.

## Content integrity

`npm run validate:content` fails the build on a defective dataset. It checks
150 questions, 30 per Teil, numbers 1–150 with no gaps or duplicates, ids
matching their numbers, each question assigned to the Teil its number falls in,
a known category, non-empty question and answer text, and — because the source
PDF is bilingual while this app ships German only — that no Arabic text has
survived transcription. The unit tests assert the same invariants.

## About the source

The questions come from a 150-question ARV 2 study set (Stand 1. März 2025).
Its own preface notes that it is **not a verbatim copy** of any particular
private exam book, and that cantonal or communal taxi rules may additionally
apply. The app repeats that caveat on the home screen.

The Arabic translations printed alongside the German in the source PDF are
deliberately **not** included: the exam is sat in German, and the validator
treats leftover Arabic as an error.

## Known gaps

- **No pass threshold and no time limit.** Neither is in the source, and with
  self-rated answers a pass mark would be meaningless anyway. The exam screen
  reports a percentage and an elapsed-time stopwatch labelled *nur Information*.
- **No difficulty ratings.** The source does not grade its questions, so the app
  does not invent difficulty levels; filtering is by topic, Teil and status.
