// UI ELEMENTS 
let resumeBtn = document.querySelector('.resume-btn');
let restartBtn = document.querySelector('.restart-btn');
let pauseBtn = document.getElementById('pause-btn');
let pauseOverlay = document.getElementById('pause-overlay');
let menuContainer = document.getElementById('menu-container');
let startBtn = document.querySelector('.start-button');

let gameContainer = document.getElementById("game-container");
let paddle = null;

// START GAME 
startBtn.addEventListener('click', function() {
    menuContainer.style.display = 'none';
    pauseBtn.hidden = false;

    // show game screen
    gameContainer.classList.remove("hidden");

    // create bricks
    let bricksContainer = document.createElement("div");
    bricksContainer.classList.add("bricks-container");

    for (let row = 0; row < 6; row++) {
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("brick-row");

        for (let i = 0; i < 10; i++) {
            let brick = document.createElement("div");
            brick.classList.add("brick");

            // alternate colors
            brick.classList.add(row % 2 === 0 ? "red" : "yellow");

            rowDiv.appendChild(brick);
        }

        bricksContainer.appendChild(rowDiv);
    }

    gameContainer.appendChild(bricksContainer);

    // create paddle
    paddle = document.createElement("div");
    paddle.id = "paddle";
    gameContainer.appendChild(paddle);
});

// MOVE PADDLE 
document.addEventListener("mousemove", (e) => {
    if (!paddle) return;

    let rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;

    let paddleWidth = 250;

    let maxX = rect.width - paddleWidth;
    let finalX = x - paddleWidth / 2;

    // clamp inside screen
    if (finalX < 0) finalX = 0;
    if (finalX > maxX) finalX = maxX;

    paddle.style.left = finalX + "px";
});
// PAUSE GAME 
pauseBtn.addEventListener('click', function() {
    pauseOverlay.classList.remove('hidden');
});

// RESUME GAME
resumeBtn.addEventListener('click', function() {
    pauseOverlay.classList.add('hidden');
});

// RESTART GAME 
restartBtn.addEventListener('click', function() {
    location.reload();
});