const $ = s => document.querySelector(s);
const dom = {
  resume: $('.resume-btn'),
  restart: $('.restart-btn'),
  pause: $('#pause-btn'),
  overlay: $('#pause-overlay'),
  win: $('#win-overlay'),
  gameover: $('#gameover-overlay'),
  menu: $('#menu-container'),
  start: $('.start-button'),
  game: $('#game-container'),
  hud: $('#hud'),
  scoreEl: $('#score-display'),
  livesEl: $('#lives-display'),
  winScore: $('#win-score'),
  gameoverScore: $('#gameover-score')
};

let paddle = null;
let ball = null;
let bricks = [];
let ballAttached = true;
let gameRunning = false;
let paddleX = 325;
let ballX = 440;
let ballY = 38;
let ballDx = 5;
let ballDy = 5;
let score = 0;
let lives = 3;

const W = 900, H = 600, BORDER = 4;
const CW = W - BORDER * 2, CH = H - BORDER * 2;
const PW = 250, PH = 18, BS = 20;
const ROWS = 6, COLS = 8, SPD = 3;

function aabb(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

function updateHUD() {
  dom.scoreEl.textContent = `SCORE: ${score}`;
  dom.livesEl.textContent = `LIVES: ${lives}`;
}

function attachBall() {
  ballAttached = true;
  paddleX = (CW - PW) / 2;
  ballX = paddleX + PW / 2 - BS / 2;
  ballY = CH - 20 - PH - BS;
  ballDx = SPD;
  ballDy = -SPD;
  paddle.style.transform = `translateX(${paddleX}px)`;
  ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
}

function init() {
  dom.game.innerHTML = '';

  let bc = document.createElement('div');
  bc.className = 'bricks-container';
  for (let r = 0; r < ROWS; r++) {
    let row = document.createElement('div');
    row.className = 'brick-row';
    for (let i = 0; i < COLS; i++) {
      let b = document.createElement('div');
      b.className = `brick ${r % 2 ? 'yellow' : 'red'}`;
      row.appendChild(b);
    }
    bc.appendChild(row);
  }
  dom.game.appendChild(bc);
  bricks = [...document.querySelectorAll('.brick')];

  paddle = document.createElement('div');
  paddle.id = 'paddle';
  dom.game.appendChild(paddle);

  ball = document.createElement('div');
  ball.id = 'ball';
  dom.game.appendChild(ball);

  score = 0;
  lives = 3;
  updateHUD();
  attachBall();
  gameRunning = true;
}

function reset() {
  dom.game.innerHTML = '';
  dom.menu.style.display = '';
  dom.pause.hidden = true;
  dom.hud.classList.add('hidden');
  dom.overlay.classList.add('hidden');
  dom.win.classList.add('hidden');
  dom.gameover.classList.add('hidden');
  dom.game.classList.add('hidden');
  ballAttached = true;
  gameRunning = false;
}

dom.start.addEventListener('click', function() {
  dom.menu.style.display = 'none';
  dom.pause.hidden = false;
  dom.hud.classList.remove('hidden');
  dom.game.classList.remove('hidden');
  init();
});

dom.game.addEventListener('click', function() {
  if (ballAttached && gameRunning) {
    ballAttached = false;
    requestAnimationFrame(gameLoop);
  }
});

document.addEventListener('mousemove', function(e) {
  if (!paddle || !gameRunning) return;

  let rect = dom.game.getBoundingClientRect();
  paddleX = Math.max(0, Math.min(e.clientX - rect.left - BORDER - PW / 2, CW - PW));
  paddle.style.transform = `translateX(${paddleX}px)`;

  if (ballAttached && ball) {
    ballX = paddleX + PW / 2 - BS / 2;
    ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
  }
});

function gameLoop() {
  if (ballAttached || !gameRunning) return;

  ballX += ballDx;
  ballY += ballDy;

  if (ballX <= 0 || ballX >= CW - BS) ballDx = -ballDx;
  if (ballY <= 0) ballDy = -ballDy;
  if (ballY >= CH - BS) { loseBall(); return; }

  let br = ball.getBoundingClientRect();

  for (let b of bricks) {
    if (b.style.visibility === 'hidden') continue;
    let r = b.getBoundingClientRect();
    if (aabb(br, r)) {
      b.style.visibility = 'hidden';
      score += 10;
      updateHUD();
      if (bricks.every(x => x.style.visibility === 'hidden')) {
        gameRunning = false;
        dom.winScore.textContent = `SCORE: ${score}`;
        dom.win.classList.remove('hidden');
        return;
      }
      let overlapX = Math.min(br.right - r.left, r.right - br.left);
      let overlapY = Math.min(br.bottom - r.top, r.bottom - br.top);
      if (overlapX < overlapY) { ballDx = -ballDx; ballX += ballDx; }
      else                     { ballDy = -ballDy; ballY += ballDy; }
      break;
    }
  }

  if (aabb(br, paddle.getBoundingClientRect())) {
    ballDy = -SPD;
    ballY = CH - 20 - PH - BS;
  }

  ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
  requestAnimationFrame(gameLoop);
}

function loseBall() {
  lives--;
  if (lives <= 0) {
    dom.gameoverScore.textContent = `SCORE: ${score}`;
    dom.gameover.classList.remove('hidden');
    gameRunning = false;
    return;
  }
  updateHUD();
  attachBall();
}

dom.pause.addEventListener('click', function() {
  dom.overlay.classList.remove('hidden');
  gameRunning = false;
});

dom.resume.addEventListener('click', function() {
  dom.overlay.classList.add('hidden');
  gameRunning = true;
  if (!ballAttached) requestAnimationFrame(gameLoop);
});

dom.restart.addEventListener('click', reset);
dom.win.querySelector('.restart-btn').addEventListener('click', reset);
dom.gameover.querySelector('.restart-btn').addEventListener('click', reset);
