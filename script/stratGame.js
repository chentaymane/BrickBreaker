let resumeBtn = document.querySelector('.resume-btn');
let restartBtn = document.querySelector('.restart-btn');
let pauseBtn = document.getElementById('pause-btn');
let pauseOverlay = document.getElementById('pause-overlay');
let menuContainer = document.getElementById('menu-container');
let startBtn = document.querySelector('.start-button');
let bricksContainer = document.querySelector('.bricks-container');
let paddle = document.createElement("div");
   
startBtn.addEventListener('click', function() {
    menuContainer.style.display = 'none';
    pauseBtn.hidden = false;

     paddle.id = "paddle";
    document.body.appendChild(paddle);

    // create 2 rows
    for (let row = 0; row < 5; row++) {
        let rowDiv = document.createElement("div");
        rowDiv.classList.add("brick-row");

        for (let i = 0; i <6; i++) {
            let brick = document.createElement("div");
            brick.classList.add("brick");

            // color logic
            if (row % 2=== 0) {
                brick.classList.add("red");
            } else {
                brick.classList.add("yellow");
            }

            rowDiv.appendChild(brick);
        }

        bricksContainer.appendChild(rowDiv);
    }

});

document.addEventListener("mousemove", (e) => {
    let x = e.clientX;

    paddle.style.left = x + "px";
});

pauseBtn.addEventListener('click', function() {
    pauseOverlay.classList.remove('hidden');
});

resumeBtn.addEventListener('click', function() {
    console.log('Resume');
    pauseOverlay.classList.add('hidden');
});

restartBtn.addEventListener('click', function() {
    console.log('Restart');
    location.reload();
});



