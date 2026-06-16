function aabb(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

function updateHUD() {
  dom.levelEl.textContent = `LEVEL: ${level}`;
  dom.scoreEl.textContent = `SCORE: ${score}`;
  dom.livesEl.textContent = `LIVES: ${lives}`;
}

function spawnBall(x, y, dx, dy) {
  let el = document.createElement('div');
  el.className = 'ball';
  if (throughBall) el.classList.add('fire');
  dom.game.appendChild(el);
  el.style.transform = `translate(${x}px, ${y}px)`;
  return { el, x, y, dx, dy };
}

function attachBall() {
  ballAttached = true;
  balls.forEach(b => b.el.remove());
  balls = [];
  powerups.forEach(p => p.el.remove());
  powerups = [];
  throughBall = false;
  throughTimer = 0;

  paddleX = (CONTENT_WIDTH - paddleWidth) / 2;
  paddle.style.width = paddleWidth + 'px';
  paddle.style.transform = `translateX(${paddleX}px)`;

  let x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
  let y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
  balls.push(spawnBall(x, y, 0, -ballSpeed));
}

function dropPowerup(brickRect) {
  if (Math.random() > POWERUP_CHANCE) return;
  let gameRect = dom.game.getBoundingClientRect();
  let px = brickRect.left - gameRect.left + (brickRect.width - POWERUP_SIZE) / 2;
  let py = brickRect.top - gameRect.top;
  let type = Math.random() < 0.5 ? 'multi' : 'fire';
  let el = document.createElement('div');
  el.className = `powerup ${type}`;
  el.textContent = type === 'multi' ? '✕3' : '🔥';
  dom.game.appendChild(el);
  el.style.transform = `translate(${px}px, ${py}px)`;
  powerups.push({ el, x: px, y: py, type });
}

function applyPowerup(type) {
  if (type === 'multi') {
    let b = balls[0];
    [-0.5, 0.5].forEach(offset => {
      let mag = Math.sqrt((b.dx + offset * ballSpeed) ** 2 + b.dy ** 2);
      let ndx = (b.dx + offset * ballSpeed) / mag * ballSpeed;
      let ndy = b.dy / mag * ballSpeed;
      balls.push(spawnBall(b.x, b.y, ndx, ndy));
    });
  } else if (type === 'fire') {
    throughBall = true;
    throughTimer = POWERUP_DURATION;
    balls.forEach(b => b.el.classList.add('fire'));
  }
}

function init() {
  dom.game.innerHTML = '';
  balls = [];
  powerups = [];
  throughBall = false;
  throughTimer = 0;

  let layout = LEVELS[level - 1];
  ballSpeed = SPEED + (level - 1);

  let bricksContainer = document.createElement('div');
  bricksContainer.className = 'bricks-container';
  for (let r = 0; r < ROWS; r++) {
    let row = document.createElement('div');
    row.className = 'brick-row';
    for (let i = 0; i < COLUMNS; i++) {
      let el = document.createElement('div');
      el.className = layout[r][i] ? `brick ${r % 2 ? 'yellow' : 'red'}` : 'brick-gap';
      row.appendChild(el);
    }
    bricksContainer.appendChild(row);
  }
  dom.game.appendChild(bricksContainer);
  bricks = [...document.querySelectorAll('.brick')];

  paddle = document.createElement('div');
  paddle.id = 'paddle';
  dom.game.appendChild(paddle);

  score = 0;
  lives = 3;
  paddleWidth = PADDLE_WIDTH;
  updateHUD();
  attachBall();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
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
  balls = [];
  powerups = [];
  ballAttached = true;
  gameRunning = false;
  level = 1;
  throughBall = false;
  throughTimer = 0;
}

function gameLoop() {
  if (!gameRunning) return;

  // Paddle movement
  if ((keys['ArrowLeft'] || keys['a']) && paddle) {
    paddleX = Math.max(0, paddleX - PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && balls[0]) {
      balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
      balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
    }
  }
  if ((keys['ArrowRight'] || keys['d']) && paddle) {
    paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && balls[0]) {
      balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
      balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
    }
  }

  if (!ballAttached) {
    // Through-ball timer countdown
    if (throughBall) {
      throughTimer--;
      if (throughTimer <= 0) {
        throughBall = false;
        balls.forEach(b => b.el.classList.remove('fire'));
      }
    }

    // Move and check power-ups
    let paddleRect = paddle.getBoundingClientRect();
    let removedPowerups = [];
    for (let p of powerups) {
      p.y += POWERUP_SPEED;
      p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      if (p.y > CONTENT_HEIGHT) {
        removedPowerups.push(p);
      } else if (aabb(p.el.getBoundingClientRect(), paddleRect)) {
        applyPowerup(p.type);
        removedPowerups.push(p);
      }
    }
    removedPowerups.forEach(p => { p.el.remove(); });
    powerups = powerups.filter(p => !removedPowerups.includes(p));

    // Move and check balls
    let deadBalls = [];
    for (let b of balls) {
      b.x += b.dx;
      b.y += b.dy;

      if (b.x <= 0 || b.x >= CONTENT_WIDTH - BALL_SIZE) b.dx = -b.dx;
      if (b.y <= 0) b.dy = -b.dy;

      if (b.y >= CONTENT_HEIGHT - BALL_SIZE) {
        deadBalls.push(b);
        continue;
      }

      b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      let ballRect = b.el.getBoundingClientRect();

      // Brick collisions
      let bounced = false;
      for (let brick of bricks) {
        if (brick.style.visibility === 'hidden') continue;
        let brickRect = brick.getBoundingClientRect();
        if (!aabb(ballRect, brickRect)) continue;

        brick.style.visibility = 'hidden';
        score += 10;
        updateHUD();
        dropPowerup(brickRect);

        if (bricks.every(x => x.style.visibility === 'hidden')) {
          if (level < LEVELS.length) { level++; init(); }
          else {
            gameRunning = false;
            dom.winScore.textContent = `SCORE: ${score}`;
            dom.win.classList.remove('hidden');
          }
          return;
        }

        if (!throughBall && !bounced) {
          let overlapX = Math.min(ballRect.right - brickRect.left, brickRect.right - ballRect.left);
          let overlapY = Math.min(ballRect.bottom - brickRect.top, brickRect.bottom - ballRect.top);
          if (overlapX < overlapY) { b.dx = -b.dx; b.x += b.dx; }
          else                     { b.dy = -b.dy; b.y += b.dy; }
          bounced = true;
          break;
        }
        // throughBall: keep looping — break through all bricks in path
      }

      // Paddle collision
      if (aabb(ballRect, paddleRect)) {
        let hitOffset = (b.x + BALL_SIZE / 2) - (paddleX + paddleWidth / 2);
        let angle = (hitOffset / (paddleWidth / 2)) * (Math.PI / 4);
        b.dx = Math.sin(angle) * ballSpeed;
        b.dy = -Math.cos(angle) * ballSpeed;
        b.y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
    }

    deadBalls.forEach(b => { b.el.remove(); balls = balls.filter(x => x !== b); });
    if (balls.length === 0) loseBall();
  }

  if (gameRunning) requestAnimationFrame(gameLoop);
}

function loseBall() {
  lives--;
  if (lives <= 0) {
    dom.gameoverScore.textContent = `SCORE: ${score}`;
    dom.gameover.classList.remove('hidden');
    gameRunning = false;
    return;
  }
  paddleWidth = Math.max(60, paddleWidth - 60);
  updateHUD();
  attachBall();
}
