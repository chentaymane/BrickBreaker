# 🎮 Brick Breaker

A **retro neon arcade brick breaker** game built with vanilla HTML, CSS, and JavaScript. Zero dependencies. Zero build steps. Just pure, unoptimized fun.

## ✨ Features

- **60 FPS constant** — smooth, responsive gameplay
- **10 unique levels** — pyramid, diamond, X-pattern, checkerboard, castle, and more
- **Power-ups** — multi-ball and fireball mechanics
- **Dynamic difficulty** — ball speed increases each level
- **Persistent HUD** — real-time level, score, timer, and lives display
- **Sound effects & music** — toggle on/off during gameplay
- **Pause system** — pause/resume with audio toggle in-game
- **Responsive design** — neon UI with glowing effects

## 🚀 Quick Start

1. **Open** `index.html` in any modern browser
2. **Click** START GAME
3. **Press Space** to launch the ball
4. **Move paddle** with arrow keys or `A`/`D`
5. **Break all bricks** to advance to the next level

That's it. No server, no build, no installation.

## 🎮 How to Play

### Objective
Break all bricks on the screen within 60 seconds. You have 3 lives. Advance through 10 levels to win.

### Controls
| Input | Action |
|-------|--------|
| `←` / `→` or `A` / `D` | Move paddle |
| `Space` | Launch ball |
| `Esc` or **PAUSE button** | Pause / resume game |
| **Music button** | Toggle background music |
| **SFX button** | Toggle sound effects |

### Mechanics
- **Ball physics** — bounces off walls, paddle, and bricks
- **Paddle collision** — spin the ball based on impact zone
- **Brick destruction** — 10 points per brick
- **Timer** — 60 seconds per level (turns red at 10s remaining)
- **Lives** — lose one each time the ball falls off screen

## 🎁 Power-ups

Power-ups drop randomly when you break bricks.

| Icon | Name | Effect |
|------|------|--------|
| ⚡ | **Multi-Ball** | Ball splits into 3 balls with separate physics |
| 🔥 | **Fireball** | Ball destroys all bricks it touches (no bouncing) |

Power-up effects last 8 seconds, then revert to normal.

## 📊 Scoring

| Action | Points |
|--------|--------|
| Brick destroyed | +10 |
| Level completed | +100 |
| Bonus (time remaining) | +time left |

Scores persist across levels. See your total on the win/game-over screen.

## 📐 Level Layouts

All 10 levels feature unique brick patterns:

1. **Pyramid** — classic triangle layout
2. **Diamond** — centered diamond shape
3. **X-Pattern** — diagonal cross
4. **Checkerboard** — alternating grid
5. **Castle** — two towers
6. **Waves** — rippling rows
7. **Spiral** — rotating pattern
8. **Rings** — concentric circles
9. **Zigzag** — lightning bolt shape
10. **Final Boss** — dense wall

Ball speed increases on each level.

## 📁 Project Structure

```
BrickBreaker/
├── index.html                  # Game entry point
├── style.css                   # Simplified neon styling
├── README.md                   # This file
│
├── sounds/                     # Game audio
│   ├── theme.mp3              # Background music
│   ├── boom.mp3               # Brick destruction
│   ├── eat.mp3                # Power-up collected
│   ├── impact.mp3             # Ball impact
│   ├── lose.mp3               # Lost life
│   ├── win.mp3                # Level won
│   ├── gameover.mp3           # Game over
│   ├── select.mp3             # Menu selection
│   └── click.mp3              # Button click
│
└── script/                     # Game logic
    ├── background.js          # 60 FPS tick loop
    ├── events.js              # Input handlers & UI
    │
    ├── core/
    │   ├── constants.js       # Game config & level layouts
    │   └── state.js           # Game state variables
    │
    ├── audio/
    │   └── sounds.js          # Sound manager
    │
    └── game/
        ├── ball.js            # Ball spawn & physics
        ├── collision.js       # Collision detection (AABB)
        ├── powerup.js         # Power-up logic
        ├── level.js           # Level management
        └── loop.js            # Main game loop
```

## 🛠️ Browser Compatibility

- **Chrome/Chromium** ✅
- **Firefox** ✅
- **Safari** ✅
- **Edge** ✅

Requires ES6+ JavaScript and HTML5 Audio API.

## 📝 License

Open source. Do whatever you want with it.

---

**Made with ❤️ and neon vibes**
