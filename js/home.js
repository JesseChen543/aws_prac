/**
 * home.js — Category list / home screen logic.
 */

function getCategories(questions) {
  return [...new Set(questions.map(q => q.category))].sort();
}

function renderStats(questions) {
  const vals = Object.values(State.history);
  document.getElementById('hs-total').textContent   = questions.length;
  document.getElementById('hs-correct').textContent = vals.filter(h => h.correct).length;
  document.getElementById('hs-wrong').textContent   = vals.filter(h => !h.correct).length;

  const wrongCount  = vals.filter(h => !h.correct).length;
  const flagCount   = State.flagged.size;

  document.getElementById('qa-wrong-count').textContent = wrongCount;
  document.getElementById('qa-flag-count').textContent  = flagCount;
  document.getElementById('qa-wrong').disabled = wrongCount === 0;
  document.getElementById('qa-flag').disabled  = flagCount === 0;
}

function renderCategories(questions) {
  const list = document.getElementById('categories-list');
  list.innerHTML = '';

  getCategories(questions).forEach(cat => {
    const qs        = questions.filter(q => q.category === cat);
    const total     = qs.length;
    const correct   = qs.filter(q => State.getStatus(q.id) === 'correct').length;
    const wrong     = qs.filter(q => State.getStatus(q.id) === 'wrong').length;
    const remaining = total - correct - wrong;
    const pct       = total > 0 ? Math.round((correct / total) * 100) : 0;

    const barColor = correct === total && total > 0
      ? 'var(--correct)'
      : correct > 0 ? 'var(--primary)' : 'var(--border)';

    const card = document.createElement('button');
    card.className = 'cat-card';
    card.addEventListener('click', () => {
      window.location.href = `category.html?name=${encodeURIComponent(cat)}`;
    });
    card.innerHTML = `
      <div class="cat-card-top">
        <div class="cat-name">${escHtml(cat)}</div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="cat-count">${total} Q</span>
          <span class="cat-arrow">&#8250;</span>
        </div>
      </div>
      <div class="cat-progress-wrap">
        <div class="cat-progress-bar" style="width:${pct}%;background:${barColor};"></div>
      </div>
      <div class="cat-stats">
        <span class="cat-stat c">&#10003; ${correct}</span>
        <span class="cat-stat w">&#10007; ${wrong}</span>
        <span class="cat-stat u">&#183; ${remaining} left</span>
      </div>`;
    list.appendChild(card);
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
registerSW();

loadQuestions()
  .then(questions => {
    renderStats(questions);
    renderCategories(questions);
  })
  .catch(err => {
    document.getElementById('categories-list').innerHTML =
      `<div class="empty-msg"><b>Failed to load questions.json</b><br>${err.message}</div>`;
  });
