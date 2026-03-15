# AWS SAA-C03 Quiz PWA — Project Reference

## Purpose
A personal offline-capable Progressive Web App to study for the AWS Solutions Architect Associate (SAA-C03) exam. All 669 questions are bundled locally so the app works fully without internet after the first load.

## Goals
- Help the user pass the AWS SAA-C03 exam.
- Works completely offline after first load (PWA with service worker caching).
- Fast, mobile-friendly UI with no external dependencies.

---

## Architecture

```
aws_quiz_pwa/
├── index.html          # Home screen: category list + quick-review buttons
├── category.html       # Category detail: question grid with status tiles
├── quiz.html           # Quiz screen: question + options + explanation
├── settings.html       # Settings: reset/clear progress options
├── sw.js               # Service worker: cache-first offline strategy
├── questions.json      # All 669 questions (id, question, options, answer, explanation, category)
├── css/styles.css      # All styles
└── js/
    ├── state.js        # Shared state, localStorage persistence, loadQuestions(), registerSW()
    ├── home.js         # Home screen logic
    ├── category.js     # Category screen logic
    ├── quiz.js         # Quiz screen logic
    └── settings.js     # Settings screen logic
```

---

## questions.json Schema

```json
{
  "id": 1,
  "question": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "answer": "A",            // string for single, array for multi-response
  "question_type": "single-choice" | "multiple-response",
  "category": "...",
  "explanation": "..."
}
```

- **669 questions** across multiple AWS service categories
- Each explanation uses format: `🎯 What's being tested: ... ✅ X – Correct: ... ❌ Y – Wrong: ...`

---

## Features

### Home Screen (`index.html`)
- Shows overall stats: total questions, correct count, wrong count
- Quick-review buttons: "Review Wrong" and "Review Flagged" (disabled when empty)
- Category cards with progress bars and per-category correct/wrong/remaining counts
- Tapping a category navigates to `category.html?name=<category>`

### Category Screen (`category.html`)
- Shows category name, correct/wrong/remaining summary
- Grid of question tiles colored by status (correct = green, wrong = red, unanswered = default)
- Tapping a tile navigates to `quiz.html?category=<cat>&start=<index>`

### Quiz Screen (`quiz.html`)
- Displays question text, option buttons, progress bar, score badge, accuracy %
- Single-choice: answer revealed immediately on tap
- Multiple-response: checkboxes with Submit button; hint shows how many to select
- Correct answer shown in green; wrong selection shown in red
- Explanation panel revealed after answering
- Flag button (bookmark icon) to flag/unflag questions
- Filter toggles: "Flagged Only" and "Wrong Only" — shuffles pool when active
- End screen shows score, %, emoji feedback, and option to restart or review flagged
- `?mode=wrong` and `?mode=flagged` URL params for quick-review from home screen

### Settings Screen (`settings.html`)
- Reset All Progress (clears history + flags, keeps best score)
- Clear Wrong Answers only
- Clear Correct Answers only
- Clear Flagged Questions only
- Reset Best Score
- All resets use a confirmation modal before executing

---

## Offline / PWA

- Service worker (`sw.js`) uses **cache-first** strategy
- All app assets and `questions.json` are pre-cached on install
- `loadQuestions()` uses try/catch — shows a user-friendly message if fetch fails
- Service worker returns a proper 503 response (not undefined) on cache miss + network failure
- Cache version constant in `sw.js` must be bumped when any cached file changes

---

## Data Persistence (localStorage)

| Key | Value | Purpose |
|---|---|---|
| `aws_history` | `{ [id]: { correct: bool } }` | Per-question answer history |
| `aws_flagged` | `[id, id, ...]` | Flagged question IDs |
| `aws_best_pct` | `"72"` | Best quiz score percentage |

---

## Explanation Patching Workflow

`patch_explanations.py` (in parent directory) holds a `EXPLANATIONS` dict keyed by question ID and patches `questions.json` in batches:

```bash
python patch_explanations.py   # outputs: Patched N questions.
```

- Always check the patched count matches expectation before continuing
- Batch size: ~25 questions per edit to avoid context issues
- All 669 questions now have explanations

---

## Development Notes

- No build step, no bundler, no npm — plain HTML/CSS/JS
- No external CDN dependencies — fully offline-capable
- Bump `CACHE` version in `sw.js` on every deployment that changes cached files
- Git repo is in `aws_quiz_pwa/` (not the parent directory)
- Push to: `https://github.com/JesseChen543/aws_prac.git`
