# Brick Breaker

A neon arcade brick breaker built with vanilla HTML, CSS, and JavaScript — no dependencies, no build step.

> 📚 **Want to understand how the code works?** See the [`docs/`](docs/README.md) folder —
> a full from-zero explanation of every file, function, and calculation in the game.

## How to Play

Open `index.html` in any browser. That's it.

1. Click **START GAME** on the menu screen.
2. Press **Space** to launch the ball.
3. Move the paddle to keep the ball in play.
4. Break all the bricks to advance to the next level.
5. You have **3 lives** and **60 seconds** per level.

## Controls

| Input | Action |
|-------|--------|
| `←` `→` or `A` `D` | Move paddle |
| `Space` | Launch ball |
| `Escape` or Pause button | Pause / resume |
| Music button | Toggle background music |
| SFX button | Toggle sound effects |

## Power-ups

Power-ups drop randomly when bricks are broken.

| Icon | Name | Effect |
|------|------|--------|
| ⚡ | Multi-Ball | Splits into 3 balls |
| 🔥 | Fireball | Ball breaks through all bricks; paddle narrows when power-up ends |

## Levels

10 levels with unique brick layouts (pyramid, diamond, X, checkerboard, castle…). Ball speed increases every 2 levels. Score and lives carry over between levels.

## Scoring

- **10 points** per brick destroyed.
- Score is shown live in the HUD and on the win / game over screen.

## Project Structure

```
BrickBreaker/
├── index.html
├── style.css
├── sounds/
│   ├── theme.mp3
│   ├── boom.mp3
│   ├── eat.mp3
│   ├── impact.mp3
│   ├── lose.mp3
│   ├── win.mp3
│   ├── gameover.mp3
│   ├── select.mp3
│   └── click.mp3
└── script/
    ├── background.js  # Animated canvas background
    ├── constants.js   # DOM refs, game constants, level layouts
    ├── state.js       # Mutable game state
    ├── game.js        # Core loop, collision, power-ups
    ├── sounds.js      # Audio setup
    └── events.js      # Input and UI event listeners
```
