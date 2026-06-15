// Axis-aligned bounding box collision check
function aabb(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

// Update score and lives display
function updateHUD() {
  dom.scoreEl.textContent = `SCORE: ${score}`;
  dom.livesEl.textContent = `LIVES: ${lives}`;
}

// Reset ball on paddle ready to launch
function attachBall() {
  ballAttached = true;
  paddleX = (CONTENT_WIDTH - PADDLE_WIDTH) / 2;
  ballX = paddleX + PADDLE_WIDTH / 2 - BALL_SIZE / 2;
  ballY = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
  ballDx = SPEED;
  ballDy = -SPEED;
  paddle.style.transform = `translateX(${paddleX}px)`;
  ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
}

// Create bricks, paddle, ball and start the game
function init() {
  dom.game.innerHTML = '';

  let bricksContainer = document.createElement('div');
  bricksContainer.className = 'bricks-container';
  for (let r = 0; r < ROWS; r++) {
    let row = document.createElement('div');
    row.className = 'brick-row';
    for (let i = 0; i < COLUMNS; i++) {
      let brick = document.createElement('div');
      brick.className = `brick ${r % 2 ? 'yellow' : 'red'}`;
      row.appendChild(brick);
    }
    bricksContainer.appendChild(row);
  }
  dom.game.appendChild(bricksContainer);
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

// Return to menu and clear the game
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

// Main game loop running at 60fps via requestAnimationFrame
function gameLoop() {
  if (ballAttached || !gameRunning) return;

  ballX += ballDx;
  ballY += ballDy;

  if (ballX <= 0 || ballX >= CONTENT_WIDTH - BALL_SIZE) ballDx = -ballDx;
  if (ballY <= 0) ballDy = -ballDy;
  if (ballY >= CONTENT_HEIGHT - BALL_SIZE) { loseBall(); return; }

  let ballRect = ball.getBoundingClientRect();

  for (let brick of bricks) {
    if (brick.style.visibility === 'hidden') continue;
    let brickRect = brick.getBoundingClientRect();
    if (aabb(ballRect, brickRect)) {
      brick.style.visibility = 'hidden';
      score += 10;
      updateHUD();
      if (bricks.every(x => x.style.visibility === 'hidden')) {
        gameRunning = false;
        dom.winScore.textContent = `SCORE: ${score}`;
        dom.win.classList.remove('hidden');
        return;
      }
      let overlapX = Math.min(ballRect.right - brickRect.left, brickRect.right - ballRect.left);
      let overlapY = Math.min(ballRect.bottom - brickRect.top, brickRect.bottom - ballRect.top);
      if (overlapX < overlapY) { ballDx = -ballDx; ballX += ballDx; }
      else                     { ballDy = -ballDy; ballY += ballDy; }
      break;
    }
  }

  if (aabb(ballRect, paddle.getBoundingClientRect())) {
    ballDy = -SPEED;
    ballY = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
  }

  ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
  requestAnimationFrame(gameLoop);
}

// Decrement lives, game over if none left, otherwise respawn
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
