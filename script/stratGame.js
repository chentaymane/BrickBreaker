let resumeBtn = document.querySelector('.resume-btn');
let restartBtn = document.querySelector('.restart-btn');
let pauseBtn = document.getElementById('pause-btn');
let pauseOverlay = document.getElementById('pause-overlay');
let menuContainer = document.getElementById('menu-container');
let startBtn = document.querySelector('.start-button');

startBtn.addEventListener('click', function() {
    menuContainer.style.display = 'none';
    pauseBtn.hidden = false;
});

// 2. PAUSE BUTTON: Show the overlay
pauseBtn.addEventListener('click', function() {
    pauseOverlay.classList.remove('hidden');
    // logic to stop your game movement goes here (isPaused = true)
});

resumeBtn.addEventListener('click', function() {
    console.log('Resume');
    pauseOverlay.classList.add('hidden');
});

restartBtn.addEventListener('click', function() {
    console.log('Restart');
    location.reload();
});
