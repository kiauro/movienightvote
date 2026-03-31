// =====================================================
//  CineVote — Movie Voting App
//  All data stored in localStorage under "cinevote_*"
// =====================================================

// ---- State ----
let movies  = loadJSON('cinevote_movies', []);
let votes   = loadJSON('cinevote_votes', []);
let selections = []; // [{id, title, year}, ...] up to 3

// ---- Boot ----
document.addEventListener('DOMContentLoaded', () => {
  renderAdminList();
  // Allow Enter key on title input
  document.getElementById('movie-title').addEventListener('keydown', e => {
    if (e.key === 'Enter') addMovie();
  });
  document.getElementById('movie-year').addEventListener('keydown', e => {
    if (e.key === 'Enter') addMovie();
  });
});

// =====================================================
//  PANEL NAVIGATION
// =====================================================
function showPanel(id) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openVoting() {
  if (movies.length < 3) {
    toast('Add at least 3 movies first!');
    return;
  }
  selections = [];
  renderVotingList();
  updateVoteButton();
  document.getElementById('voter-name').value = '';
  showPanel('voting-panel');
}

function openResults() {
  renderResults();
  showPanel('results-panel');
}

// =====================================================
//  ADMIN — MOVIE MANAGEMENT
// =====================================================
function addMovie() {
  const titleInput = document.getElementById('movie-title');
  const yearInput  = document.getElementById('movie-year');
  const title = titleInput.value.trim();
  const year  = yearInput.value.trim();

  if (!title) { toast('Please enter a movie title.'); titleInput.focus(); return; }

  // Duplicate check (case-insensitive)
  if (movies.some(m => m.title.toLowerCase() === title.toLowerCase())) {
    toast('That movie is already on the list!');
    titleInput.select();
    return;
  }

  const movie = {
    id:    Date.now().toString(36) + Math.random().toString(36).slice(2),
    title,
    year: year || ''
  };
  movies.push(movie);
  save();
  renderAdminList();

  titleInput.value = '';
  yearInput.value  = '';
  titleInput.focus();
  toast(`"${title}" added!`);
}

function deleteMovie(id) {
  movies = movies.filter(m => m.id !== id);
  save();
  renderAdminList();
}

function renderAdminList() {
  const list  = document.getElementById('movie-list');
  const empty = document.getElementById('empty-msg');
  const badge = document.getElementById('count-badge');
  const btn   = document.getElementById('start-vote-btn');

  badge.textContent = movies.length;
  btn.disabled = movies.length < 3;

  if (movies.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = movies.map((m, i) => `
    <li class="movie-item">
      <span class="num">${i + 1}</span>
      <span class="title">${escHtml(m.title)}</span>
      ${m.year ? `<span class="year">${escHtml(m.year)}</span>` : ''}
      <button class="delete-btn" onclick="deleteMovie('${m.id}')" title="Remove">✕</button>
    </li>
  `).join('');
}

// =====================================================
//  VOTING
// =====================================================
function renderVotingList() {
  const list = document.getElementById('voting-list');
  list.innerHTML = movies.map(m => {
    const sel = selections.find(s => s.id === m.id);
    const rank = sel ? selections.indexOf(sel) + 1 : '';
    const rankClass = sel ? `selected rank-${rank}` : '';
    return `
      <li class="vote-item ${rankClass}" id="vi-${m.id}" onclick="toggleSelection('${m.id}', '${escAttr(m.title)}', '${escAttr(m.year)}')">
        <div class="rank-badge">${rank || ''}</div>
        <span class="vote-title">${escHtml(m.title)}</span>
        ${m.year ? `<span class="vote-year">${escHtml(m.year)}</span>` : ''}
      </li>
    `;
  }).join('');
}

function toggleSelection(id, title, year) {
  const idx = selections.findIndex(s => s.id === id);

  if (idx !== -1) {
    // Deselect
    selections.splice(idx, 1);
  } else {
    if (selections.length >= 3) {
      toast('You can only pick 3 movies. Deselect one first.');
      return;
    }
    selections.push({ id, title, year });
  }

  renderVotingList();
  updateSelectionStatus();
  updateVoteButton();
}

function updateSelectionStatus() {
  const el = document.getElementById('selection-status');
  const n  = selections.length;
  el.textContent = n === 3
    ? '✓ 3 picks selected — ready to vote!'
    : `Select 3 movies (${n} / 3)`;
}

function updateVoteButton() {
  document.getElementById('submit-vote-btn').disabled = selections.length !== 3;
}

function submitVote() {
  if (selections.length !== 3) return;

  const voterName = document.getElementById('voter-name').value.trim() || 'Anonymous';
  const vote = {
    id:     Date.now().toString(36),
    voter:  voterName,
    picks:  selections.map(s => ({ id: s.id, title: s.title, year: s.year })),
    time:   new Date().toISOString()
  };

  votes.push(vote);
  save();

  toast(`Vote cast! Thanks, ${voterName} 🎬`);
  renderResults();
  showPanel('results-panel');
}

// =====================================================
//  RESULTS
// =====================================================
function renderResults() {
  const meta  = document.getElementById('results-meta');
  const list  = document.getElementById('results-list');
  const log   = document.getElementById('votes-log');

  meta.textContent = `${votes.length} vote${votes.length !== 1 ? 's' : ''} cast so far`;

  // Scoring: 1st pick = 3pts, 2nd = 2pts, 3rd = 1pt
  const scoreMap = {};
  votes.forEach(vote => {
    vote.picks.forEach((pick, i) => {
      if (!scoreMap[pick.id]) {
        scoreMap[pick.id] = { title: pick.title, year: pick.year, score: 0, votes: 0 };
      }
      scoreMap[pick.id].score += (3 - i);
      scoreMap[pick.id].votes++;
    });
  });

  // Include movies with 0 votes
  movies.forEach(m => {
    if (!scoreMap[m.id]) {
      scoreMap[m.id] = { title: m.title, year: m.year, score: 0, votes: 0 };
    }
  });

  const sorted = Object.entries(scoreMap)
    .map(([id, d]) => ({ id, ...d }))
    .sort((a, b) => b.score - a.score || b.votes - a.votes);

  const maxScore = sorted[0]?.score || 1;

  if (sorted.length === 0) {
    list.innerHTML = '<p class="empty-msg">No movies to show.</p>';
  } else {
    list.innerHTML = sorted.map((item, i) => `
      <li class="result-item" style="animation-delay:${i * 0.05}s">
        <div class="result-rank">${i + 1}</div>
        <div class="result-info">
          <div class="result-title">${escHtml(item.title)}</div>
          ${item.year ? `<div class="result-year">${escHtml(item.year)}</div>` : ''}
          <div class="score-bar-wrap">
            <div class="score-bar" style="width:${Math.round((item.score / maxScore) * 100)}%"></div>
          </div>
        </div>
        <div class="result-score-wrap">
          <div class="result-score">${item.score}</div>
          <div class="result-score-label">pts</div>
        </div>
      </li>
    `).join('');
  }

  // Individual votes log
  if (votes.length === 0) {
    log.innerHTML = '<p class="no-votes-msg">No votes yet.</p>';
  } else {
    log.innerHTML = [...votes].reverse().map(v => `
      <div class="vote-log-entry">
        <div class="vote-log-voter">👤 ${escHtml(v.voter)}</div>
        <div class="vote-log-picks">
          🥇 <span>${escHtml(v.picks[0]?.title)}</span> &nbsp;
          🥈 <span>${escHtml(v.picks[1]?.title)}</span> &nbsp;
          🥉 <span>${escHtml(v.picks[2]?.title)}</span>
        </div>
        <div class="vote-log-time">${formatTime(v.time)}</div>
      </div>
    `).join('');
  }
}

// =====================================================
//  RESET
// =====================================================
function resetAll() {
  if (!confirm('Reset everything? This will delete all movies and votes.')) return;
  movies = [];
  votes  = [];
  save();
  renderAdminList();
  toast('All data reset.');
  showPanel('admin-panel');
}

// =====================================================
//  PERSISTENCE
// =====================================================
function save() {
  localStorage.setItem('cinevote_movies', JSON.stringify(movies));
  localStorage.setItem('cinevote_votes',  JSON.stringify(votes));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// =====================================================
//  HELPERS
// =====================================================
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escAttr(str) {
  return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}
