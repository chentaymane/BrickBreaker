function gameLoop(timestamp) {
    if (!gameRunning) return;
    updateTimer(timestamp);
    movePaddle();
    if (!ballAttached) {
        tickFireball();
        movePowerups();
        if (moveBalls()) return;
    }
    if (gameRunning) requestAnimationFrame(gameLoop);
}

function updateTimer(timestamp) {

    // dont count if ball is on paddle
    if (ballAttached) {
        lastFrameTime = 0;
        return;
    }

    // first frame after ball launches - save start time
    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
    }

    // how many ms passed since last frame
    let msPassed = timestamp - lastFrameTime;

    // save current time for next frame
    lastFrameTime = timestamp;

    // cap at 50ms to prevent tab switching bug
    if (msPassed > 50) {
        msPassed = 50;
    }

    // add ms to accumulator
    timerAccum = timerAccum + msPassed;

    // not 1 second yet - wait
    if (timerAccum < 1000) {
        return;
    }

    // 1 second passed - empty the jar
    timerAccum = 0;

    // subtract 1 from timer
    timeLeft = timeLeft - 1;

    // never go below 0
    if (timeLeft < 0) {
        timeLeft = 0;
    }

    // update screen
    updateHUD();

    // timer ran out - lose a life
    if (timeLeft === 0) {
        timeLeft = LEVEL_TIME;
        timerAccum = 0;
        lastFrameTime = 0;
        loseBall();
    }
}
function movePaddle() {
    if (!paddle) return;
    if (keys["ArrowLeft"]  || keys["a"]) paddleX = Math.max(0, paddleX - PADDLE_SPEED);
    if (keys["ArrowRight"] || keys["d"]) paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && balls[0]) {
        balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
        balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
    }
}

function tickFireball() {
    if (!throughBall) return;
    if (--throughTimer <= 0) {
        throughBall = false;
        balls.forEach(b => b.el.classList.remove("fire"));
        paddle.classList.remove("paddle-fire");
    }
}

function movePowerups() {
    let paddleRect = paddle.getBoundingClientRect();
    powerups = powerups.filter(p => {
        p.y += POWERUP_SPEED;
        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        if (p.y > CONTENT_HEIGHT) { p.el.remove(); return false; }
        if (aabb(p.el.getBoundingClientRect(), paddleRect)) { applyPowerup(p.type); p.el.remove(); return false; }
        return true;
    });
}

// Returns true when the level ended (so gameLoop exits without queuing another frame)
function moveBalls() {
    let paddleRect = paddle.getBoundingClientRect();

    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        b.x += b.dx;
        b.y += b.dy;

        if (b.x <= 0 || b.x >= CONTENT_WIDTH - BALL_SIZE) b.dx = -b.dx;
        if (b.y <= 0) b.dy = -b.dy;
        if (b.y >= CONTENT_HEIGHT - BALL_SIZE) { b.el.remove(); balls.splice(i, 1); continue; }

        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        let ballRect = b.el.getBoundingClientRect();

        // Brick collisions
        let bounced = false;
        for (let brick of bricks) {
            if (brick.style.visibility === "hidden") continue;
            let brickRect = brick.getBoundingClientRect();
            if (!aabb(ballRect, brickRect)) continue;

            brick.style.visibility = "hidden";
            score += 10;
            updateHUD();
            dropPowerup(brickRect);
            boom.currentTime = 0; boom.play();

            if (bricks.every(x => x.style.visibility === "hidden")) {
                win.currentTime = 0; win.play();
                if (level < LEVELS.length) { level++; initLevel(); }
                else { gameRunning = false; dom.winScore.textContent = `SCORE: ${score}`; dom.win.classList.remove("hidden"); }
                return true;
            }

            if (!throughBall && !bounced) {
                let ox = Math.min(ballRect.right - brickRect.left, brickRect.right - ballRect.left);
                let oy = Math.min(ballRect.bottom - brickRect.top, brickRect.bottom - ballRect.top);
                if (ox < oy) { b.dx = -b.dx; b.x += b.dx; }
                else         { b.dy = -b.dy; b.y += b.dy; }
                bounced = true;
                break;
            }
        }

        // Paddle collision
        if (aabb(ballRect, paddleRect)) {
            impact.currentTime = 0; impact.play();
            let hitPos = (b.x + BALL_SIZE / 2 - paddleX) / paddleWidth;
            b.dx = (hitPos - 0.5) * 2 * ballSpeed;
            b.dy = -ballSpeed;
            b.y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
            b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        }
    }

    if (balls.length === 0) loseBall();
    return false;
}

function loseBall() {
    lose.currentTime = 0; lose.play();
    lives--;
    if (lives <= 0) {
        gameover.play();
        dom.gameoverScore.textContent = `SCORE: ${score}`;
        dom.gameover.classList.remove("hidden");
        gameRunning = false;
        return;
    }
    paddleWidth = Math.max(60, paddleWidth - 60);
    updateHUD();
    attachBall();
}
