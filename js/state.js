/**
 * state.js — Shared state and persistence layer.
 * Loaded first on every page.
 */

const State = {
  history: JSON.parse(localStorage.getItem('aws_history') || '{}'),
  flagged: new Set(JSON.parse(localStorage.getItem('aws_flagged') || '[]')),

  saveHistory() {
    localStorage.setItem('aws_history', JSON.stringify(this.history));
  },

  saveFlagged() {
    localStorage.setItem('aws_flagged', JSON.stringify([...this.flagged]));
  },

  getStatus(questionId) {
    const h = this.history[questionId];
    if (!h) return 'unanswered';
    return h.correct ? 'correct' : 'wrong';
  },

  recordAnswer(questionId, isCorrect) {
    this.history[questionId] = { correct: isCorrect };
    this.saveHistory();
  },

  toggleFlag(questionId) {
    if (this.flagged.has(questionId)) {
      this.flagged.delete(questionId);
    } else {
      this.flagged.add(questionId);
    }
    this.saveFlagged();
    return this.flagged.has(questionId);
  },

  resetAll() {
    this.history = {};
    this.saveHistory();
  },

  resetWrong() {
    Object.keys(this.history).forEach(id => {
      if (!this.history[id].correct) delete this.history[id];
    });
    this.saveHistory();
  },

  resetCorrect() {
    Object.keys(this.history).forEach(id => {
      if (this.history[id].correct) delete this.history[id];
    });
    this.saveHistory();
  },

  clearFlagged() {
    this.flagged = new Set();
    this.saveFlagged();
  },

  clearBestScore() {
    localStorage.removeItem('aws_best_pct');
  },

  getBestScore() {
    return localStorage.getItem('aws_best_pct');
  },

  saveBestScore(pct) {
    const prev = parseInt(localStorage.getItem('aws_best_pct') || '0');
    if (pct > prev) localStorage.setItem('aws_best_pct', String(pct));
  },
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function loadQuestions() {
  try {
    const res = await fetch('./questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    throw new Error(
      navigator.onLine
        ? `Failed to load questions (${err.message})`
        : 'You are offline. Open the app once with internet to cache it, then it works offline.'
    );
  }
}

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js', { scope: './' }).catch(() => {});
  }
}
