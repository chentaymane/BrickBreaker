function updateHUD() {
    dom.levelEl.textContent = `LEVEL: ${level}`;
    dom.scoreEl.textContent = `SCORE: ${score}`;
    dom.timerEl.textContent = `TIME: ${timeLeft}`;
    dom.timerEl.classList.toggle("timer-urgent", timeLeft <= 10);
    dom.livesEl.textContent = `LIVES: ${lives}`;
}

// Per-level setup — score and lives carry over between levels
function initLevel() {
    dom.game.innerHTML = "";
    balls = [];
    powerups = [];
    throughBall = false;
    throughTimer = 0;
    timeLeft = LEVEL_TIME;
    timerAccum = 0;
    lastFrameTime = 0;

    let layout = LEVELS[level - 1];
    let colors = LEVEL_COLORS[level - 1];
    ballSpeed = SPEED + Math.floor((level - 1) / 2);

    let bricksContainer = document.createElement("div");
    bricksContainer.className = "bricks-container";
    for (let r = 0; r < ROWS; r++) {
        let row = document.createElement("div");
        row.className = "brick-row";
        for (let i = 0; i < COLUMNS; i++) {
            let el = document.createElement("div");
            el.className = layout[r][i]
                ? `brick ${r % 2 ? colors[1] : colors[0]}`
                : "brick-gap";
            row.appendChild(el);
        }
        bricksContainer.appendChild(row);
    }
    dom.game.appendChild(bricksContainer);
    bricks = [...document.querySelectorAll(".brick")];

    paddle = document.createElement("div");
    paddle.id = "paddle";
    dom.game.appendChild(paddle);

    paddleWidth = PADDLE_WIDTH;
    updateHUD();
    attachBall();
    gameRunning = true;
    requestAnimationFrame(gameLoop);
}

// Full game reset — resets score, lives and level
function init() {
    score = 0;
    lives = 3;
    level = 1;
    initLevel();
}

function reset() {
    dom.game.innerHTML = "";
    dom.menu.style.display = "";
    dom.pause.hidden = true;
    dom.hud.classList.add("hidden");
    dom.overlay.classList.add("hidden");
    dom.win.classList.add("hidden");
    dom.gameover.classList.add("hidden");
    dom.game.classList.add("hidden");
    balls = [];
    powerups = [];
    ballAttached = true;
    gameRunning = false;
    level = 1;
    throughBall = false;
    throughTimer = 0;
    timeLeft = LEVEL_TIME;
    timerAccum = 0;
    lastFrameTime = 0;
}
