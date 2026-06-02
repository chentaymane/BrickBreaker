
function startGame() {
    let menuContainer = document.querySelector('.menu-container');
     let pauseBtn = document.getElementById('pause-btn');
    menuContainer.addEventListener('click', function() {
        menuContainer.style.display = 'none';
        pauseBtn.hidden = false;
    });
}

function togglePause() {
    let pauseBtn = document.getElementById('pause-btn');
    let pauseOverlay = document.getElementById('pause-overlay');  
    
    pauseBtn.addEventListener('click', function() {
        if (pauseOverlay.classList.contains('hidden')) {
            pauseOverlay.classList.remove('hidden');
        }
    });

}