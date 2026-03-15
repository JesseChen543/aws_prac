/**
 * settings.js — Settings screen: reset/clear progress options.
 */

const RESET_CONFIG = {
  all:       { title: 'Reset All Progress',     desc: 'This will clear every correct and wrong answer and all flags. Best score is kept.', label: 'Reset All' },
  wrong:     { title: 'Clear Wrong Answers',     desc: 'All questions marked wrong will be reset to unanswered.',                        label: 'Clear Wrong' },
  correct:   { title: 'Clear Correct Answers',   desc: 'All questions marked correct will be reset to unanswered.',                      label: 'Clear Correct' },
  flagged:   { title: 'Clear Flagged Questions', desc: 'All flags will be removed.',                                                     label: 'Clear Flags' },
  bestscore: { title: 'Reset Best Score',        desc: 'Your saved best percentage will be removed.',                                    label: 'Reset Score' },
};

function confirmReset(type) {
  const cfg = RESET_CONFIG[type];
  document.getElementById('modal-title').textContent       = cfg.title;
  document.getElementById('modal-desc').textContent        = cfg.desc;
  document.getElementById('modal-confirm-btn').textContent = cfg.label;
  document.getElementById('modal-confirm-btn').onclick     = () => { executeReset(type); closeModal(); };
  document.getElementById('modal-backdrop').classList.add('visible');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('visible');
}

function executeReset(type) {
  switch (type) {
    case 'all':       State.resetAll(); State.clearFlagged(); break;
    case 'wrong':     State.resetWrong();     break;
    case 'correct':   State.resetCorrect();   break;
    case 'flagged':   State.clearFlagged();   break;
    case 'bestscore': State.clearBestScore(); break;
  }
}

// Close modal when clicking the backdrop
document.getElementById('modal-backdrop').addEventListener('click', function (e) {
  if (e.target === this) closeModal();
});
