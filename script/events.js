dom.start.addEventListener("click", function () {
    select.currentTime = 0; select.play();
    gamestarted = true;
    dom.menu.style.display = "none";
    dom.pause.hidden = false;
    dom.hud.classList.remove("hidden");
    dom.game.classList.remove("hidden");
    init();
});

function syncMusicBtns() {
    dom.music.forEach(btn => btn.classList.toggle("audio-off", theme.paused));
}

function syncEffectBtns() {
    dom.effects.forEach(btn => btn.classList.toggle("audio-off", boom.muted));
}

dom.music.forEach(btn => btn.addEventListener("click", () => {
    theme.paused ? theme.play() : theme.pause();
    syncMusicBtns();
}));

dom.effects.forEach(btn => btn.addEventListener("click", () => {
    const mute = !boom.muted;
    [boom, eat, gameover, impact, lose, win].forEach(s => s.muted = mute);
    syncEffectBtns();
}));

document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (e.key === " " && ballAttached && gameRunning) ballAttached = false;
    if (e.key === "Escape" && gamestarted) {
        select.currentTime = 0; select.play();
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

document.addEventListener("keyup", e => { keys[e.key] = false; });

dom.pause.addEventListener("click", function () {
    select.currentTime = 0; select.play();
    dom.overlay.classList.remove("hidden");
    gameRunning = false;
    lastFrameTime = 0;
});

dom.resume.addEventListener("click", function () {
    clicked.currentTime = 0; clicked.play();
    dom.overlay.classList.add("hidden");
    gameRunning = true;
    requestAnimationFrame(gameLoop);
});

document.querySelectorAll(".restart-btn").forEach((e)=>{e.addEventListener("click", reset)});
