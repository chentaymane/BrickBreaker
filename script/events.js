// Start button: show game and initialize
dom.start.addEventListener("click", function () {
    select.currentTime = 0;
    select.play();
    gamestarted = true;
    dom.menu.style.display = "none";
    dom.pause.hidden = false;
    dom.hud.classList.remove("hidden");
    dom.game.classList.remove("hidden");
    init();
});

// Music and Effects buttons
dom.music.forEach((elem) => {
    elem.addEventListener("click", () => {
        if (theme.paused) {
            theme.play();
        } else {
            theme.pause();
        }
    });
});

dom.effects.forEach((elem) => {
    elem.addEventListener("click", () => {
        if (
            boom.muted &&
            eat.muted &&
            gameover.muted &&
            impact.muted &&
            lose.muted &&
            win.muted
        ) {
            boom.muted = false;
            eat.muted = false;
            gameover.muted = false;
            impact.muted = false;
            lose.muted = false;
            win.muted = false;
        } else {
            boom.muted = true;
            eat.muted = true;
            gameover.muted = true;
            impact.muted = true;
            lose.muted = true;
            win.muted = true;
        }
    });
});

// Space launches the ball; Arrow/WASD tracked for paddle movement
document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (e.key === " " && ballAttached && gameRunning) {
        ballAttached = false;
    }
});

document.addEventListener("keyup", function (e) {
    keys[e.key] = false;
});

// Toggle pause overlay and stop the loop
dom.pause.addEventListener("click", function () {
    select.currentTime = 0;
    select.play();
    dom.overlay.classList.remove("hidden");
    gameRunning = false;
    lastFrameTime = 0;
});

// Adding escape to pause the game and unpause it
document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && gamestarted) {
        select.currentTime = 0;
        select.play();
        if (gameRunning) {
            dom.overlay.classList.remove("hidden");
            gameRunning = false;
            lastFrameTime = 0;
        } else {
            dom.overlay.classList.add("hidden");
            gameRunning = true;
            requestAnimationFrame(gameLoop);
        }
    }
});

// Resume: hide overlay and restart the loop
dom.resume.addEventListener("click", function () {
    clicked.currentTime = 0;
    clicked.play();
    dom.overlay.classList.add("hidden");
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

dom.restart.addEventListener("click", () => {
    clicked.currentTime = 0;
    clicked.play();
    reset();
});
dom.win.querySelector(".restart-btn").addEventListener("click", reset);
dom.gameover.querySelector(".restart-btn").addEventListener("click", reset);
