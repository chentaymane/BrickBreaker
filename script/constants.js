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

const WIDTH = 900, HEIGHT = 600, BORDER = 4;
const CONTENT_WIDTH = WIDTH - BORDER * 2, CONTENT_HEIGHT = HEIGHT - BORDER * 2;
const PADDLE_WIDTH = 250, PADDLE_HEIGHT = 18, BALL_SIZE = 20;
const ROWS = 6, COLUMNS = 8, SPEED = 3;
