function gameLoop(timestamp) {
    if (!gameRunning) return;

    // Countdown timer (only ticks while ball is in play)
    if (!ballAttached) {
        if (lastFrameTime === 0) lastFrameTime = timestamp;
        let dt = Math.min(timestamp - lastFrameTime, 50);
        lastFrameTime = timestamp;
        timerAccum += dt;
        if (timerAccum >= 1000) {
            timerAccum -= 1000;
            timeLeft = Math.max(0, timeLeft - 1);
            updateHUD();
            if (timeLeft <= 0) {
                timeLeft = LEVEL_TIME;
                timerAccum = 0;
                lastFrameTime = 0;
                loseBall();
                if (gameRunning) requestAnimationFrame(gameLoop);
                return;
            }
        }
    } else {
        lastFrameTime = 0;
    }

    // Paddle movement
    if ((keys["ArrowLeft"] || keys["a"]) && paddle) {
        paddleX = Math.max(0, paddleX - PADDLE_SPEED);
        paddle.style.transform = `translateX(${paddleX}px)`;
        if (ballAttached && balls[0]) {
            balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
            balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
        }
    }
    if ((keys["ArrowRight"] || keys["d"]) && paddle) {
        paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);
        paddle.style.transform = `translateX(${paddleX}px)`;
        if (ballAttached && balls[0]) {
            balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
            balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
        }
    }

    if (!ballAttached) {
        // Fireball timer
        if (throughBall) {
            throughTimer--;
            if (throughTimer <= 0) {
                throughBall = false;
                balls.forEach((b) => b.el.classList.remove("fire"));
                paddle.classList.remove("paddle-fire");
            }
        }

        // Power-ups fall and get caught
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
        removedPowerups.forEach((p) => p.el.remove());
        powerups = powerups.filter((p) => !removedPowerups.includes(p));

        // Move balls
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
                if (brick.style.visibility === "hidden") continue;
                let brickRect = brick.getBoundingClientRect();
                if (!aabb(ballRect, brickRect)) continue;

                brick.style.visibility = "hidden";
                score += 10;
                updateHUD();
                dropPowerup(brickRect);
                boom.currentTime = 0;
                boom.play();
                if (bricks.every((x) => x.style.visibility === "hidden")) {
                    if (level < LEVELS.length) {
                        level++;
                        win.currentTime = 0;
                        win.play();
                        initLevel();
                    } else {
                        win.currentTime = 0;
                        win.play();
                        gameRunning = false;
                        dom.winScore.textContent = `SCORE: ${score}`;
                        dom.win.classList.remove("hidden");
                    }
                    return;
                }

                if (!throughBall && !bounced) {
                    let overlapX = Math.min(
                        ballRect.right - brickRect.left,
                        brickRect.right - ballRect.left,
                    );
                    let overlapY = Math.min(
                        ballRect.bottom - brickRect.top,
                        brickRect.bottom - ballRect.top,
                    );
                    if (overlapX < overlapY) {
                        b.dx = -b.dx;
                        b.x += b.dx;
                    } else {
                        b.dy = -b.dy;
                        b.y += b.dy;
                    }
                    bounced = true;
                    break;
                }
                // throughBall: continue through all bricks in path
            }

            // Paddle collision
            if (aabb(ballRect, paddleRect)) {
                impact.currentTime = 0;
                impact.play();
                let hitOffset =
                    b.x + BALL_SIZE / 2 - (paddleX + paddleWidth / 2);
                let angle = (hitOffset / (paddleWidth / 2)) * (Math.PI / 4);
                b.dx = Math.sin(angle) * ballSpeed;
                b.dy = -Math.cos(angle) * ballSpeed;
                b.y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
                b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
            }
        }

        deadBalls.forEach((b) => {
            b.el.remove();
            balls = balls.filter((x) => x !== b);
        });
        if (balls.length === 0) loseBall();
    }

    if (gameRunning) requestAnimationFrame(gameLoop);
}

function loseBall() {
    lose.currentTime = 0;
    lose.play();
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
