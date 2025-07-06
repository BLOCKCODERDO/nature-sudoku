// 🌿 Nature Sudoku - With Background Puzzle Preload

window.addEventListener('load', () => {
  setTheme();
  loadGame(); // ✅ Start game right away in background

  // Show splash for 4s, then fade it out
  setTimeout(() => {
    const splash = document.getElementById('splash');
    splash.classList.add('hide');

    setTimeout(() => {
      splash.style.display = 'none';
    }, 500); // fade duration
  }, 4000);
});

const boardEl = document.getElementById('board');
const timerEl = document.getElementById('timer');
const mistakesEl = document.getElementById('mistakes');
const messageEl = document.getElementById('message');
const newBtn = document.getElementById('newPuzzleBtn');
const hintBtn = document.getElementById('hintBtn');
const solveBtn = document.getElementById('solveBtn');
const themeSelect = document.getElementById('themeSelect');
const shareBtn = document.getElementById('shareBtn');

newBtn.addEventListener('click', () => init());
hintBtn.addEventListener('click', showHint);
solveBtn.addEventListener('click', autoSolve);
themeSelect.addEventListener('change', setTheme);
shareBtn.addEventListener('click', shareURL);

let board = [], solution = [], time = 0, mistakes = 0, timerInterval;

function init(state) {
  clearInterval(timerInterval);
  time = mistakes = 0;
  timerEl.textContent = '00:00';
  mistakesEl.textContent = `Mistakes: 0`;

  if (state) {
    ({ board, solution, time, mistakes } = state);
    renderBoard();
    timerEl.textContent = msToTime(time);
    mistakesEl.textContent = `Mistakes: ${mistakes}`;
  } else {
    ({ puzzle: board, solution } = generatePuzzle(40));
    renderBoard();
  }

  timerInterval = setInterval(() => {
    time++;
    timerEl.textContent = msToTime(time);
  }, 1000);
}

function msToTime(t) {
  const m = String(Math.floor(t / 60)).padStart(2, '0');
  const s = String(t % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function saveGame() {
  localStorage.setItem('sudoku-save', JSON.stringify({ board, solution, time, mistakes }));
}
function loadGame() {
  const s = localStorage.getItem('sudoku-save');
  if (s) {
    try {
      const state = JSON.parse(s);
      if (state.board && state.solution) {
        init(state);
        return true;
      }
    } catch (err) {
      console.warn('Corrupted save. Starting new game.');
    }
  }
  init(); // ✅ fallback to fresh puzzle
  return false;
}
window.addEventListener('beforeunload', saveGame);

function shareURL() {
  const state = encodeURIComponent(JSON.stringify({ board, solution, time, mistakes }));
  navigator.clipboard.writeText(`${location.origin}${location.pathname}?state=${state}`);
  showMessage('🔗 URL copied!');
}
function setTheme() {
  document.body.className = themeSelect.value;
}

function generatePuzzle(removeCount = 40) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillSudoku(grid);
  const sol = grid.map(r => [...r]);
  removeCells(grid, removeCount);
  return { puzzle: grid, solution: sol };
}

function fillSudoku(grid) {
  function valid(r, c, val) {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === val || grid[i][c] === val) return false;
      const br = 3 * Math.floor(r / 3) + Math.floor(i / 3);
      const bc = 3 * Math.floor(c / 3) + i % 3;
      if (grid[br][bc] === val) return false;
    }
    return true;
  }

  function solve(r = 0, c = 0) {
    if (r === 9) return true;
    if (c === 9) return solve(r + 1, 0);
    const nums = [1,2,3,4,5,6,7,8,9].sort(() => Math.random() - 0.5);
    for (const v of nums) {
      if (valid(r, c, v)) {
        grid[r][c] = v;
        if (solve(r, c + 1)) return true;
        grid[r][c] = 0;
      }
    }
    return false;
  }

  solve();
}

function removeCells(g, count) {
  let rem = 0;
  while (rem < count) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (g[r][c] !== 0) {
      g[r][c] = 0;
      rem++;
    }
  }
}

function renderBoard() {
  boardEl.innerHTML = '';
  board.flat().forEach((_, i) => {
    const r = Math.floor(i / 9), c = i % 9;
    const v = board[r][c];
    const cell = document.createElement('div');
    cell.className = 'cell bounce-in';
    cell.style.animationDelay = `${i * 7}ms`;
    cell.dataset.r = r; cell.dataset.c = c;
    if (v) {
      cell.textContent = v;
      cell.classList.add('fixed');
    } else {
      const inp = document.createElement('input');
      inp.maxLength = 1;
      inp.addEventListener('input', e => onInput(e, r, c, cell));
      cell.appendChild(inp);
    }
    boardEl.appendChild(cell);
  });
}

function onInput(e, r, c, cell) {
  const v = e.target.value;
  if (!/^[1-9]$/.test(v)) return e.target.value = '';
  checkMove(r, c, v, cell);
}

function checkMove(r, c, v, cell) {
  if (solution[r][c] != v) {
    mistakes++;
    mistakesEl.textContent = `Mistakes: ${mistakes}`;
    cell.classList.add('bounce');
    setTimeout(() => cell.classList.remove('bounce'), 300);
    return;
  }
  cell.textContent = v;
  cell.firstChild.remove();
  board[r][c] = +v;
  cell.classList.add('bounce');
  setTimeout(() => cell.classList.remove('bounce'), 300);
  const solved = board.flat().every((n, idx) =>
    n === solution[Math.floor(idx / 9)][idx % 9]
  );
  if (solved) showMessage('🎉 Solved!');
}

function showHint() {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        board[r][c] = solution[r][c];
        renderBoard();
        return;
      }
    }
  }
}

function autoSolve() {
  board = solution.map(r => [...r]);
  renderBoard();
}

function showMessage(msg) {
  messageEl.textContent = msg;
  messageEl.classList.add('show');
  clearTimeout(messageEl._hide);
  messageEl._hide = setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}
