// UI ELEMENTS 
let resumeBtn = document.querySelector('.resume-btn');
let restartBtn = document.querySelector('.restart-btn');
let pauseBtn = document.getElementById('pause-btn');
let pauseOverlay = document.getElementById('pause-overlay');
let menuContainer = document.getElementById('menu-container');
let startBtn = document.querySelector('.start-button');
let gameContainer = document.getElementById("game-container");

let paddle = null;
let ball = null;

// HIGH-PERFORMANCE GAME STATE VARIABLES
let ballAttached = true; 
let gameRunning = false;

let paddleX = 325; // Initial centered paddle position
let ballX = 440;   // Coordinates mapped perfectly to transforms
let ballY = 38;    // Rests right above paddle (bottom 20px + paddle height 18px)

let ballDx = 5;    // Horizontal velocity
let ballDy = 5;    // Vertical velocity

// START GAME 
startBtn.addEventListener('click', function() {
    menuContainer.style.display = 'none';
    pauseBtn.hidden = false;
    gameContainer.classList.remove("hidden");

    // Create bricks
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

    // Create paddle
    paddle = document.createElement("div");
    paddle.id = "paddle";
    gameContainer.appendChild(paddle);

    // Create ball
    ball = document.createElement("div");
    ball.id = "ball";
    gameContainer.appendChild(ball);

    // Reset setup states
    ballAttached = true;
    gameRunning = true;
    ballX = 440;
    ballY = 38;
    
    // Set initial layout using hardware acceleration
    paddle.style.transform = `translateX(${paddleX}px)`;
    ball.style.transform = `translate(${ballX}px, ${-ballY}px)`;
});

// LAUNCH BALL ON CLICK
gameContainer.addEventListener('click', function() {
    if (ballAttached && gameRunning) {
        ballAttached = false;
        requestAnimationFrame(gameLoop); // Kickstarts the optimized pipeline loop
    }
});

// MOVE PADDLE (Hardware Accelerated mouse tracking)
document.addEventListener("mousemove", (e) => {
    if (!paddle || !gameRunning) return;

    let rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;

    let paddleWidth = 250;
    let maxX = rect.width - paddleWidth; // 900 - 250 = 650
    paddleX = x - paddleWidth / 2;

    // Clamp inside container
    if (paddleX < 0) paddleX = 0;
    if (paddleX > maxX) paddleX = maxX;

    // Execute via fast composite layer tracking
    paddle.style.transform = `translateX(${paddleX}px)`;

    // Stick ball to the center of paddle if not launched yet
    if (ballAttached && ball) {
        ballX = paddleX + (paddleWidth / 2) - 10; // 10 is half of ball width
        ball.style.transform = `translate(${ballX}px, ${-ballY}px)`;
    }
});

// THE SMOOTH 60 FPS GAME LOOP
function gameLoop() {
    // If user pauses or ball resets, break out of loop to save CPU tasks
    if (ballAttached || !gameRunning) return;

    // 1. Calculate physics tasks
    ballX += ballDx;
    ballY += ballDy;

    // 2. Compute Layout boundaries (Container: 900x600, Ball: 20x20)
    if (ballX <= 0 || ballX >= 880) ballDx = -ballDx; // Wall hit
    if (ballY >= 580) ballDy = -ballDy;               // Ceiling hit
    if (ballY <= 0) ballDy = -ballDy;                 // Temporary floor hit

    // 3. Update DOM via Compositing step (Skips expensive Layout & Paint stages)
    // Note: Y is negative because transforms calculate upward movements inversely from baseline 0
    ball.style.transform = `translate(${ballX}px, ${-ballY}px)`;

    // 4. Request clean frame synchronization from the browser
    requestAnimationFrame(gameLoop);
}

// PAUSE GAME
pauseBtn.addEventListener('click', function() {
    pauseOverlay.classList.remove('hidden');
    gameRunning = false;
});

// RESUME GAME
resumeBtn.addEventListener('click', function() {
    pauseOverlay.classList.add('hidden');
    gameRunning = true;
    if (!ballAttached) {
        requestAnimationFrame(gameLoop); // Safely resume loops without stack multiplication
    }
});

// RESTART GAME
restartBtn.addEventListener('click', function() {
    location.reload();
});