function dropPowerup(brickRect) {
    if (Math.random() > POWERUP_CHANCE) return;
    let gameRect = dom.game.getBoundingClientRect();
    let px =
        brickRect.left -
        gameRect.left -
        BORDER +
        (brickRect.width - POWERUP_SIZE) / 2;
    let py = brickRect.top - gameRect.top - BORDER;
    let type = Math.random() < 0.5 ? "multi" : "fire";
    let el = document.createElement("div");
    el.className = `powerup ${type}`;
    el.innerHTML =
        type === "multi"
            ? `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M7 2v11h3v9l7-12h-4l4-8z"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z"/></svg>`;
    dom.game.appendChild(el);
    el.style.transform = `translate(${px}px, ${py}px)`;
    powerups.push({ el, x: px, y: py, type });
}

function applyPowerup(type) {
    eat.currentTime = 0;
    eat.play();
    if (type === "multi") {
        let b = balls[0];
        if (!b) return;
        [-0.5, 0.5].forEach((offset) => {
            let ndx = b.dx + offset * ballSpeed;
            let ndy = b.dy;
            let mag = Math.sqrt(ndx * ndx + ndy * ndy) || 1;
            balls.push(
                spawnBall(
                    b.x,
                    b.y,
                    (ndx / mag) * ballSpeed,
                    (ndy / mag) * ballSpeed,
                ),
            );
        });
        paddle.classList.remove("paddle-fire");
        paddle.classList.add("paddle-multi");
    } else if (type === "fire") {
        throughBall = true;
        throughTimer = POWERUP_DURATION;
        balls.forEach((b) => b.el.classList.add("fire"));
        paddle.classList.remove("paddle-multi");
        paddle.classList.add("paddle-fire");
    }
}
