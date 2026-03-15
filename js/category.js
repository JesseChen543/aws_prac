/**
 * category.js — Category detail screen: question grid with correct/wrong indicators.
 */

const params       = new URLSearchParams(window.location.search);
const categoryName = params.get('name') || '';

function renderSummary(qs) {
  const correct    = qs.filter(q => State.getStatus(q.id) === 'correct').length;
  const wrong      = qs.filter(q => State.getStatus(q.id) === 'wrong').length;
  const unanswered = qs.length - correct - wrong;

  document.getElementById('cat-summary').innerHTML = `
    <div class="cat-sum-item"><div class="cat-sum-num c">${correct}</div><div class="cat-sum-label">Correct</div></div>
    <div class="cat-sum-item"><div class="cat-sum-num w">${wrong}</div><div class="cat-sum-label">Wrong</div></div>
    <div class="cat-sum-item"><div class="cat-sum-num u">${unanswered}</div><div class="cat-sum-label">Remaining</div></div>
  `;
}

function renderGrid(qs) {
  const grid = document.getElementById('q-grid');
  grid.innerHTML = '';

  qs.forEach((q, idx) => {
    const status = State.getStatus(q.id);
    const icon   = status === 'correct' ? '&#10003;' : status === 'wrong' ? '&#10007;' : '&nbsp;';

    const tile = document.createElement('div');
    tile.className = `q-tile ${status === 'unanswered' ? '' : status}`;
    tile.addEventListener('click', () => {
      window.location.href = `quiz.html?category=${encodeURIComponent(categoryName)}&start=${idx}`;
    });
    tile.innerHTML = `
      <div class="q-tile-num">Q${idx + 1}</div>
      <div class="q-tile-icon">${icon}</div>`;
    grid.appendChild(tile);
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
document.getElementById('cat-screen-title').textContent = categoryName;

loadQuestions()
  .then(questions => {
    const qs = questions.filter(q => q.category === categoryName);
    renderSummary(qs);
    renderGrid(qs);
  })
  .catch(err => {
    document.getElementById('q-grid').innerHTML =
      `<div class="empty-msg"><b>Failed to load questions.json</b><br>${err.message}</div>`;
  });
