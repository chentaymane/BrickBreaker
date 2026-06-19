const boom = new Audio("sounds/boom.mp3");
const eat = new Audio("sounds/eat.mp3");
const gameover = new Audio("sounds/gameover.mp3");
const impact = new Audio("sounds/impact.mp3");
const lose = new Audio("sounds/lose.mp3");
const theme = new Audio("sounds/theme.mp3");
const win = new Audio("sounds/win.mp3");
const select = new Audio("sounds/select.mp3");
const clicked = new Audio("sounds/click.mp3");

theme.loop = true;
theme.volume = 0.4;

// Muted initially so the browser allows it to play immediately on load
theme.muted = true;
theme.play().catch(() => {
    console.log("Waiting for user interaction to unmute...");
});

function activateAudio() {
    theme.muted = false;
    theme.play();
    document.removeEventListener("click", activateAudio);
    document.removeEventListener("keydown", activateAudio);
}

document.addEventListener("click", activateAudio);
document.addEventListener("keydown", activateAudio);
