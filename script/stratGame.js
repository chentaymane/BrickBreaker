// UI ELEMENTS 
let resumeBtn = document.querySelector('.resume-btn');
let restartBtn = document.querySelector('.restart-btn');
let pauseBtn = document.getElementById('pause-btn');
let pauseOverlay = document.getElementById('pause-overlay');
let menuContainer = document.getElementById('menu-container');
let startBtn = document.querySelector('.start-button');

let gameContainer = document.getElementById("game-container");
let paddle = null;
let ball = null; // ADDED: Declare ball variable
let ballAttached = true; // ADDED: Keeps track of if the ball is stuck to the paddle

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

        for (let i = 0; i < 8; i++) {
            let brick = document.createElement("div");
            brick.classList.add("brick");
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

    // ADDED: Create the ball
    ball = document.createElement("div");
    ball.id = "ball";
    gameContainer.appendChild(ball);
});

// MOVE PADDLE AND BALL
document.addEventListener("mousemove", (e) => {
    if (!paddle) return;

    let rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;

    let paddleWidth = 250;
    let ballWidth = 20; // Matches the CSS width

    let maxX = rect.width - paddleWidth;
    let finalX = x - paddleWidth / 2;

    // clamp inside screen
    if (finalX < 0) finalX = 0;
    if (finalX > maxX) finalX = maxX;

    paddle.style.left = finalX + "px";

    // ADDED: Move the ball with the paddle if it hasn't been launched yet
    if (ballAttached && ball) {
        // Center the ball on the paddle
        let ballX = finalX + (paddleWidth / 2) - (ballWidth / 2);
        ball.style.left = ballX + "px";
    }
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