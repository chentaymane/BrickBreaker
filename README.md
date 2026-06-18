# Brick Breaker

A classic brick breaker game built with vanilla HTML, CSS, and JavaScript.

## How to Play

Open `index.html` in a browser. No build step or server required.

1. Click **START GAME** on the menu screen.
2. Move your mouse to control the paddle.
3. Click anywhere on the game area to launch the ball.
4. Break all the bricks to win. You have 3 lives.

## Controls

| Input | Action |
|-------|--------|
| Mouse | Move paddle |
| Click | Launch ball |
| Pause button | Pause / resume |

## Scoring

- Each brick is worth **10 points**.
- Your final score is shown on the win and game over screens.

## Project Structure

```
BrickBreaker/
├── index.html
├── style.css
└── script/
    ├── constants.js   # DOM references and game constants
    ├── state.js       # Mutable game state variables
    ├── game.js        # Core game logic (init, loop, collision)
    └── events.js      # Input and UI event listeners
```
