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

function syncMusicBtns() {
    dom.music.forEach((btn) => btn.classList.toggle("audio-off", theme.paused));
}

function syncEffectBtns() {
    dom.effects.forEach((btn) => btn.classList.toggle("audio-off", boom.muted));
}

// Music and Effects buttons
dom.music.forEach((elem) => {
    elem.addEventListener("click", () => {
        if (theme.paused) {
            theme.play();
        } else {
            theme.pause();
        }
        syncMusicBtns();
    });
});

dom.effects.forEach((elem) => {
    elem.addEventListener("click", () => {
        const shouldMute = !boom.muted;
        boom.muted = shouldMute;
        eat.muted = shouldMute;
        gameover.muted = shouldMute;
        impact.muted = shouldMute;
        lose.muted = shouldMute;
        win.muted = shouldMute;
        syncEffectBtns();
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
