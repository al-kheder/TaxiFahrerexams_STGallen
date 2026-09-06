# ARV 2 Lernplattform — Taxiprüfung St. Gallen

A learning and exam-simulation app for the Swiss **ARV 2** examination
(*Berufsmässiger Personentransport* — professional passenger transport), built
from three original Testbogen. 90 questions, German wording preserved verbatim,
each with a short Arabic description of what it asks and a short Arabic
explanation of the answer.

## What is in here

```
assets/                     the three scanned Testbogen (source of truth)
content/extraction/         how the answer key was read, and the key itself
  answer-key.md             method, the 90 answers, and the 5 disputed ones
  markers-testbogen-*.json  raw darkness measurements per page
tools/extract/              the scan-reading tools (Python, no dependencies)
tools/validate-content.ts   content validation, run in CI and before deploys
data/questions/             the dataset: one file per Testbogen
lib/                        types, repository, quiz engine, progress store
components/                 UI
app/                        Next.js App Router pages
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
| `npm test` | unit tests for the grading rules and the dataset |
| `npm run validate:content` | dataset integrity check |

There are **no environment variables**. Progress is stored in the browser's
`localStorage`; there is no backend and no database.

## Deploying to Vercel

The app is a stock Next.js App Router project, so Vercel needs no configuration
beyond its defaults.

1. Push the repository to GitHub/GitLab/Bitbucket.
2. In Vercel, **Add New → Project** and import it.
3. Accept the detected settings — Framework **Next.js**, build `next build`,
   install `npm install`. Leave the output directory blank.
4. Deploy.

Or from the CLI:

```bash
npx vercel --prod
```

Before deploying, run the checks locally:

```bash
npm run validate:content && npm run typecheck && npm test && npm run build
```

Notes that matter for Vercel specifically:

- No `localhost` URLs are referenced anywhere in the app code.
- All routes are static except `/fragen`, which reads a query parameter and is
  server-rendered on demand. Both work on Vercel without extra config.
- `assets/` and `.extract-cache/` are development inputs only. `.extract-cache/`
  is git-ignored; `assets/` is kept in the repo as provenance for the dataset
  but is never imported by the app, so it is not part of the bundle.

## The dataset

Each question is one object in `data/questions/testbogen-N.ts`:

```ts
{
  id: "t1-f16",
  testbogen: 1,
  number: 16,
  topicKey: "arbeitspause-6h",     // links the same rule across sheets
  category: "arbeitspause",
  questionAr: "ما الحد الأدنى لاستراحة العمل عند العمل 6 ساعات؟",
  options: [{ key: "a", text: "…" }, …],
  correct: "b",                     // or null when unreadable
  explanationAr: "التوضيح: …",
  source: "Testbogen 1, Frage 16",
  needsVerification: true,          // optional
  verificationNote: "…"             // required when flagged
}
```

Adding a fourth Testbogen means adding one file and one line in
`data/questions/index.ts`. Nothing in the UI needs to change.

### Three deliberate constraints

**The sheets print no question text.** Each numbered block is simply three
statements; the candidate marks the one that is correct. The app therefore shows
a single shared instruction — `QUESTION_PROMPT` in `lib/types.ts` — rather than
90 invented German question sentences. It is presentation, not source content,
and is kept in one place so it can never be mistaken for extracted text.

**Arabic is a description, not a translation.** `questionAr` says what the
question asks and what separates the options; it is shown before answering.
`explanationAr` says why the answer is right and appears after. Neither
translates the German options, because the exam itself is sat in German — the
learner has to read the German statements to choose.

**Categories are ours, not the exam's.** The sheets carry no category headings.
The six categories in `lib/categories.ts` are derived from the subject matter,
which follows the same thematic order on all three sheets. They are a navigation
aid the app adds.

## Accuracy

The answer key is the whole product, so it is treated as such:

- Answers were measured from the scans, then **verified individually at double
  magnification** using composed strips that put the question number, the option
  letter and the marker cell side by side. That pass caught two genuine
  off-by-one errors — see `content/extraction/answer-key.md`.
- Where two sheets ask the same rule, their keys were compared. 14 rules appear
  on more than one sheet and agree.
- **Five questions carry contradictions in the source material.** The app shows
  the marked answer, states the conflict, and does not score them. They are
  listed in `content/extraction/answer-key.md` and reachable in the app at
  `/fragen?nurPruefen=1`.

`npm run validate:content` enforces the structural rules: 30 questions per
sheet, exactly three options a/b/c, an answer that is one of them, Arabic text
in both the description and the explanation, and a written note on every flagged
question.

## Known gaps

- **No pass threshold.** The official ARV 2 pass mark is not in the source
  material. The exam screen reports a score and explicitly declines to say
  "bestanden". Provide the official figure and it can be added.
- **No time limit.** Likewise unknown, so the exam shows an elapsed-time
  stopwatch labelled *nur Information* rather than a countdown.
- **No difficulty ratings.** The sheets do not grade their questions, so the app
  does not invent difficulty levels; filtering is by topic, sheet and status.
- The five flagged questions above need confirmation against the ARV 2 text
  (SR 822.222) or the course provider.
