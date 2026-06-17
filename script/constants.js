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
  levelEl: $('#level-display'),
  scoreEl: $('#score-display'),
  timerEl: $('#timer-display'),
  livesEl: $('#lives-display'),
  winScore: $('#win-score'),
  gameoverScore: $('#gameover-score')
};

const WIDTH = 900, HEIGHT = 600, BORDER = 4;
const CONTENT_WIDTH = WIDTH - BORDER * 2, CONTENT_HEIGHT = HEIGHT - BORDER * 2;
const PADDLE_WIDTH = 250, PADDLE_HEIGHT = 18, BALL_SIZE = 20;
const ROWS = 6, COLUMNS = 8, SPEED = 5, PADDLE_SPEED = 10;
const LEVEL_TIME = 60;
const POWERUP_SIZE = 36, POWERUP_SPEED = 2, POWERUP_CHANCE = 0.30, POWERUP_DURATION = 360;

// Two brick colors per level (even rows, odd rows)
const LEVEL_COLORS = [
  ['red',    'yellow'],
  ['red',    'yellow'],
  ['blue',   'cyan'  ],
  ['blue',   'cyan'  ],
  ['green',  'purple'],
  ['green',  'purple'],
  ['orange', 'yellow'],
  ['pink',   'blue'  ],
  ['purple', 'cyan'  ],
  ['red',    'orange'],
];

// 10 levels — each is a 6×8 grid (1 = brick, 0 = empty)
const LEVELS = [
  // Level 1 — Pyramid
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
  // Level 2 — Diamond
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0],
    [0,0,0,0,0,0,0,0],
  ],
  // Level 3 — X shape
  [
    [1,1,0,0,0,0,1,1],
    [0,1,1,0,0,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,0,0,1,1,0],
    [1,1,0,0,0,0,1,1],
  ],
  // Level 4 — Checkerboard
  [
    [1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1],
    [1,0,1,0,1,0,1,0],
    [0,1,0,1,0,1,0,1],
  ],
  // Level 5 — Arrow up
  [
    [0,0,0,1,1,0,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
    [0,0,0,1,1,0,0,0],
    [0,0,0,1,1,0,0,0],
  ],
  // Level 6 — Castle
  [
    [1,0,1,0,1,0,1,0],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,0,0,0,0,0,0],
  ],
  // Level 7 — H shape
  [
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,0,0,0,0,1,1],
    [1,1,0,0,0,0,1,1],
  ],
  // Level 8 — Spiral frame
  [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,1,1,1,1,0,1],
    [1,0,1,0,0,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1],
  ],
  // Level 9 — Two triangles
  [
    [1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,0,0],
    [0,0,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,0],
    [1,1,1,1,1,1,1,1],
  ],
  // Level 10 — Full grid
  [
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
    [1,1,1,1,1,1,1,1],
  ],
];
