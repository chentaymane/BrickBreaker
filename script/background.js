// Force 60 FPS always - never stop rendering even when idle
let frameCounter = 0;

function maintain60FPS() {
    // Toggle a CSS variable to force constant repaints
    // This keeps 60 FPS even when nothing is animating
    frameCounter++;
    document.documentElement.style.setProperty('--frame-tick', frameCounter % 2);
    requestAnimationFrame(maintain60FPS);
}

maintain60FPS();