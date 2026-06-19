function spawnBall(x, y, dx, dy) {
    let el = document.createElement("div");
    el.className = "ball";
    if (throughBall) el.classList.add("fire");
    dom.game.appendChild(el);
    el.style.transform = `translate(${x}px, ${y}px)`;
    return { el, x, y, dx, dy };
}

function attachBall() {
    ballAttached = true;
    balls.forEach((b) => b.el.remove());
    balls = [];
    powerups.forEach((p) => p.el.remove());
    powerups = [];
    throughBall = false;
    throughTimer = 0;

    paddleX = (CONTENT_WIDTH - paddleWidth) / 2;
    paddle.style.width = paddleWidth + "px";
    paddle.style.transform = `translateX(${paddleX}px)`;
    paddle.classList.remove("paddle-fire", "paddle-multi");

    let x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
    let y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
    balls.push(spawnBall(x, y, 0, -ballSpeed));
}
