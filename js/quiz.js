/**
 * quiz.js — Quiz screen logic.
 * URL params: ?category=<name>&start=<index>
 */

const params       = new URLSearchParams(window.location.search);
const categoryName = params.get('category') || '';
const startIndex   = parseInt(params.get('start') || '0', 10);
const modeParam    = params.get('mode') || '';

let allCategoryQs = []; // ordered full list for this category
let queue         = [];
let qIndex        = 0;
let score         = 0;
let answered      = 0;
let flaggedMode   = false;
let wrongMode     = false;

// ── Queue ─────────────────────────────────────────────────────────────────────
function buildQueue(startAt = 0) {
  let pool = allCategoryQs.slice();

  if (flaggedMode) pool = pool.filter(q => State.flagged.has(q.id));
  if (wrongMode)   pool = pool.filter(q => State.getStatus(q.id) === 'wrong');

  // When using filters, shuffle. When browsing normally, keep original order.
  if (flaggedMode || wrongMode) {
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return { queue: pool, index: 0 };
  }

  return { queue: pool, index: startAt };
}

function resetSession(startAt = 0) {
  const result = buildQueue(startAt);
  queue    = result.queue;
  qIndex   = result.index;
  score    = 0;
  answered = 0;

  document.getElementById('end-screen').classList.remove('visible');
  document.getElementById('quiz-area').classList.remove('hidden');

  if (queue.length === 0) { showEmpty(); return; }
  renderQuestion();
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderQuestion() {
  document.getElementById('empty-msg').style.display   = 'none';
  document.getElementById('q-explanation').classList.remove('visible');
  document.getElementById('btn-next').classList.remove('visible');
  document.getElementById('btn-submit').classList.remove('visible');

  if (qIndex >= queue.length) { showEndScreen(); return; }

  const q = queue[qIndex];
  updateHeader();

  document.getElementById('flag-btn').classList.toggle('flagged', State.flagged.has(q.id));
  document.getElementById('q-domain').textContent = q.category || '';
  document.getElementById('q-text').textContent   = q.question;

  const hintEl = document.getElementById('q-type-hint');
  if (q.question_type === 'multiple-response') {
    hintEl.textContent    = `Select ${q.answer.length} answers`;
    hintEl.style.display  = 'block';
  } else {
    hintEl.style.display  = 'none';
  }

  document.getElementById('q-explanation').innerHTML =
    '<strong>Explanation:</strong> ' + escHtml(q.explanation || '');

  const container = document.getElementById('options-container');
  container.innerHTML = '';
  Object.entries(q.options).forEach(([letter, text]) => {
    const btn = document.createElement('button');
    btn.className       = 'option-btn';
    btn.dataset.letter  = letter;
    btn.innerHTML =
      `<span class="option-label">${letter}</span>` +
      `<span class="option-text">${escHtml(text)}</span>`;
    btn.addEventListener('click', () => selectOption(letter));
    container.appendChild(btn);
  });
}

function updateHeader() {
  const total = queue.length;
  const pct   = total > 0 ? Math.round((qIndex / total) * 100) : 0;

  document.getElementById('progress-bar').style.width    = `${pct}%`;
  document.getElementById('q-counter').textContent       =
    `Question ${Math.min(qIndex + 1, total || 1)} of ${total || 0}`;
  document.getElementById('score-badge').textContent     = `${score} / ${answered}`;
  document.getElementById('accuracy-pct').textContent    =
    answered > 0 ? `${Math.round((score / answered) * 100)}% correct` : '—';
}

function showEmpty() {
  document.getElementById('q-text').textContent = '';
  document.getElementById('q-domain').textContent = '';
  document.getElementById('options-container').innerHTML = '';
  document.getElementById('q-explanation').classList.remove('visible');
  document.getElementById('empty-msg').style.display = 'block';
  document.getElementById('btn-next').classList.remove('visible');
  updateHeader();
}

// ── Answer selection ──────────────────────────────────────────────────────────
function selectOption(chosen) {
  const q = queue[qIndex];

  // Multi-response: toggle selection, show submit button
  if (q.question_type === 'multiple-response') {
    const btn = document.querySelector(`.option-btn[data-letter="${chosen}"]`);
    btn.classList.toggle('selected');
    const anySelected = document.querySelectorAll('.option-btn.selected').length > 0;
    document.getElementById('btn-submit').classList.toggle('visible', anySelected);
    return;
  }

  // Single answer: reveal immediately
  const correct = q.answer;
  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const l = btn.dataset.letter;
    if (l === correct && l !== chosen) btn.classList.add('reveal-correct');
    if (l === chosen && l === correct) btn.classList.add('selected-correct');
    if (l === chosen && l !== correct) btn.classList.add('selected-wrong');
  });

  const isCorrect = chosen === correct;
  answered++;
  if (isCorrect) score++;

  State.recordAnswer(q.id, isCorrect);

  document.getElementById('q-explanation').classList.add('visible');
  document.getElementById('btn-next').classList.add('visible');
  updateHeader();
}

function submitMulti() {
  const q       = queue[qIndex];
  const correct = q.answer; // array
  const chosen  = [...document.querySelectorAll('.option-btn.selected')].map(b => b.dataset.letter);

  document.querySelectorAll('.option-btn').forEach(btn => {
    btn.disabled = true;
    const l = btn.dataset.letter;
    btn.classList.remove('selected');
    if (chosen.includes(l) && correct.includes(l))  btn.classList.add('selected-correct');
    else if (chosen.includes(l))                     btn.classList.add('selected-wrong');
    else if (correct.includes(l))                    btn.classList.add('reveal-correct');
  });

  const allCorrect = chosen.length === correct.length && chosen.every(l => correct.includes(l));
  answered++;
  if (allCorrect) score++;

  State.recordAnswer(q.id, allCorrect);

  document.getElementById('btn-submit').classList.remove('visible');
  document.getElementById('q-explanation').classList.add('visible');
  document.getElementById('btn-next').classList.add('visible');
  updateHeader();
}

function nextQuestion() {
  qIndex++;
  renderQuestion();
  document.querySelector('.quiz-main').scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Flag ──────────────────────────────────────────────────────────────────────
function toggleFlag() {
  if (qIndex >= queue.length) return;
  const q      = queue[qIndex];
  const isFlagged = State.toggleFlag(q.id);
  document.getElementById('flag-btn').classList.toggle('flagged', isFlagged);
}

// ── Filters ───────────────────────────────────────────────────────────────────
function toggleFlaggedMode() {
  flaggedMode = !flaggedMode;
  wrongMode   = false;
  document.getElementById('flagged-toggle').classList.toggle('active', flaggedMode);
  document.getElementById('wrong-toggle').classList.remove('active');
  resetSession();
}

function toggleWrongMode() {
  wrongMode   = !wrongMode;
  flaggedMode = false;
  document.getElementById('wrong-toggle').classList.toggle('active', wrongMode);
  document.getElementById('flagged-toggle').classList.remove('active');
  resetSession();
}

// ── End screen ────────────────────────────────────────────────────────────────
function showEndScreen() {
  document.getElementById('quiz-area').classList.add('hidden');
  document.getElementById('end-screen').classList.add('visible');

  const total = queue.length;
  const pct   = total > 0 ? Math.round((score / total) * 100) : 0;

  State.saveBestScore(pct);

  document.getElementById('end-score').textContent   = `${score} / ${total}`;
  document.getElementById('end-pct').textContent     = `${pct}% correct`;
  document.getElementById('end-correct').textContent = score;
  document.getElementById('end-wrong').textContent   = answered - score;
  document.getElementById('end-flagged').textContent = State.flagged.size;
  document.getElementById('end-total').textContent   = total;

  document.getElementById('btn-review-flagged').style.display =
    State.flagged.size > 0 ? '' : 'none';

  document.getElementById('end-emoji').textContent =
    pct >= 80 ? '🏆' : pct >= 72 ? '🎉' : pct >= 60 ? '💪' : '📚';
  document.getElementById('end-title').textContent =
    pct >= 80 ? 'Excellent — exam ready!'
    : pct >= 72 ? 'Quiz Complete!'
    : pct >= 60 ? 'Good effort, keep going!'
    : 'More study needed';
}

function restartQuiz() {
  document.getElementById('end-screen').classList.remove('visible');
  document.getElementById('quiz-area').classList.remove('hidden');
  resetSession();
}

function reviewFlagged() {
  flaggedMode = true;
  wrongMode   = false;
  document.getElementById('flagged-toggle').classList.add('active');
  document.getElementById('wrong-toggle').classList.remove('active');
  document.getElementById('end-screen').classList.remove('visible');
  document.getElementById('quiz-area').classList.remove('hidden');
  resetSession();
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.getElementById('quiz-title').textContent =
  modeParam === 'wrong'   ? 'Wrong Questions' :
  modeParam === 'flagged' ? 'Flagged Questions' :
  categoryName || 'AWS SAA-C03';

loadQuestions()
  .then(questions => {
    allCategoryQs = modeParam ? questions : questions.filter(q => q.category === categoryName);
    if (modeParam === 'wrong')   { wrongMode   = true; document.getElementById('wrong-toggle').classList.add('active'); }
    if (modeParam === 'flagged') { flaggedMode = true; document.getElementById('flagged-toggle').classList.add('active'); }
    resetSession(startIndex);
  })
  .catch(err => {
    document.getElementById('q-text').textContent = 'Failed to load questions: ' + err.message;
  });
