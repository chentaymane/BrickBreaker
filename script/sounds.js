const boom = new Audio("sounds/boom.mp3");
const eat = new Audio("sounds/eat.mp3");
const gameover = new Audio("sounds/gameover.mp3");
const impact = new Audio("sounds/impact.mp3");
const lose = new Audio("sounds/lose.mp3");
const theme = new Audio("sounds/theme.mp3");
const win = new Audio("sounds/win.mp3");
const select = new Audio("sounds/select.mp3");
const clicked = new Audio("sounds/click.mp3");

// theme music enabling

theme.loop = true;

theme.volume = 0.4;

// 3. MUTE it initially so the browser allows it to play immediately on load
theme.muted = true;

// 4. Start playing it silently the moment the script runs
theme.play().catch((error) => {
    // This catches any strict browser blocks, ensuring the app doesn't crash
    console.log("Waiting for user interaction to unmute...");
});

// 5. Create a function to unmute the music
function activateAudio() {
    theme.muted = false;
    // In case the browser blocked the initial silent play, call play() again
    theme.play();

    // Clean up: Remove this listener so it doesn't keep running on every single click
    document.removeEventListener("click", activateAudio);
    document.removeEventListener("keydown", activateAudio);
}

// 6. Listen for the very first click or keypress ANYWHERE on the page
document.addEventListener("click", activateAudio);
document.addEventListener("keydown", activateAudio);
