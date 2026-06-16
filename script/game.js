// Axis-aligned bounding box collision check
function aabb(a, b) {
  return a.right > b.left && a.left < b.right && a.bottom > b.top && a.top < b.bottom;
}

// Update score, lives and level display
function updateHUD() {
  dom.levelEl.textContent = `LEVEL: ${level}`;
  dom.scoreEl.textContent = `SCORE: ${score}`;
  dom.livesEl.textContent = `LIVES: ${lives}`;
}

// Reset ball on paddle ready to launch
function attachBall() {
  ballAttached = true;
  paddleX = (CONTENT_WIDTH - paddleWidth) / 2;
  ballX = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
  ballY = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
  ballDx = 0;
  ballDy = -ballSpeed;
  paddle.style.width = paddleWidth + 'px';
  paddle.style.transform = `translateX(${paddleX}px)`;
  ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
}

// Create bricks, paddle, ball and start the game
function init() {
  dom.game.innerHTML = '';

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

  ball = document.createElement('div');
  ball.id = 'ball';
  dom.game.appendChild(ball);

  score = 0;
  lives = 3;
  paddleWidth = PADDLE_WIDTH;
  updateHUD();
  attachBall();
  gameRunning = true;
  requestAnimationFrame(gameLoop);
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
  level = 1;
}

// Main game loop running at 60fps via requestAnimationFrame
function gameLoop() {
  if (!gameRunning) return;

  // Keyboard paddle movement (works whether ball is attached or not)
  if ((keys['ArrowLeft'] || keys['a']) && paddle) {
    paddleX = Math.max(0, paddleX - PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && ball) {
      ballX = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
      ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
    }
  }
  if ((keys['ArrowRight'] || keys['d']) && paddle) {
    paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && ball) {
      ballX = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
      ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
    }
  }

  if (!ballAttached) {
    ballX += ballDx;
    ballY += ballDy;

    if (ballX <= 0 || ballX >= CONTENT_WIDTH - BALL_SIZE) ballDx = -ballDx;
    if (ballY <= 0) ballDy = -ballDy;

    if (ballY >= CONTENT_HEIGHT - BALL_SIZE) {
      loseBall();
    } else {
      ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
      let ballRect = ball.getBoundingClientRect();

      for (let brick of bricks) {
        if (brick.style.visibility === 'hidden') continue;
        let brickRect = brick.getBoundingClientRect();
        if (aabb(ballRect, brickRect)) {
          brick.style.visibility = 'hidden';
          score += 10;
          updateHUD();
          if (bricks.every(x => x.style.visibility === 'hidden')) {
            if (level < LEVELS.length) {
              level++;
              init();
            } else {
              gameRunning = false;
              dom.winScore.textContent = `SCORE: ${score}`;
              dom.win.classList.remove('hidden');
            }
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
        let hitOffset = (ballX + BALL_SIZE / 2) - (paddleX + paddleWidth / 2);
        let angle = (hitOffset / (paddleWidth / 2)) * (Math.PI / 4);
        ballDx = Math.sin(angle) * ballSpeed;
        ballDy = -Math.cos(angle) * ballSpeed;
        ballY = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
        ball.style.transform = `translate(${ballX}px, ${ballY}px)`;
      }
    }
  }

  if (gameRunning) requestAnimationFrame(gameLoop);
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
  paddleWidth = Math.max(60, paddleWidth - 60);
  updateHUD();
  attachBall();
}
