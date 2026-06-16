// Start button: show game and initialize
dom.start.addEventListener('click', function() {
  dom.menu.style.display = 'none';
  dom.pause.hidden = false;
  dom.hud.classList.remove('hidden');
  dom.game.classList.remove('hidden');
  init();
});

// Space launches the ball; Arrow/WASD tracked for paddle movement
document.addEventListener('keydown', function(e) {
  keys[e.key] = true;
  if (['ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (e.key === ' ' && ballAttached && gameRunning) {
    ballAttached = false;
  }
});

document.addEventListener('keyup', function(e) {
  keys[e.key] = false;
});

// Toggle pause overlay and stop the loop
dom.pause.addEventListener('click', function() {
  dom.overlay.classList.remove('hidden');
  gameRunning = false;
});

// Resume: hide overlay and restart the loop
dom.resume.addEventListener('click', function() {
  dom.overlay.classList.add('hidden');
  gameRunning = true;
  requestAnimationFrame(gameLoop);
});

dom.restart.addEventListener('click', reset);
dom.win.querySelector('.restart-btn').addEventListener('click', reset);
dom.gameover.querySelector('.restart-btn').addEventListener('click', reset);
