# 📚 Brick Breaker — Documentation

Everything you need to understand how this project works, from zero. Start here.

This game is built with **pure HTML, CSS, and vanilla JavaScript** — no frameworks, no
libraries, no build step. Open `index.html` and it runs.

---

## 🚀 Where to start

Read the docs in this order. Each one goes a little deeper than the last.

### 1. [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) — *Start here*
The big-picture tour. Explains the project structure, what every file does, how the
files connect, and the most important idea in the whole game: **every object (ball,
paddle, brick) is a real HTML element, not a canvas drawing.** Ends with a cheat-sheet of
every built-in browser function used.

> 👉 Read this first to understand the shape of the project.

### 2. [FUNCTIONS.md](FUNCTIONS.md) — *The function reference*
Every single function in the project, one by one: **when it runs, what it does, how it
works, and what it returns.** Includes a call map showing which function calls which.

> 👉 Use this as a lookup whenever you see a function name and wonder what it does.

### 3. [MECHANICS.md](MECHANICS.md) — *How the game moves & breaks (with math)*
The gameplay engine explained with **real numbers**: how the ball moves, how the paddle
moves, how bouncing works (walls, paddle, bricks), how bricks break, and every
calculation behind it — paddle bounce angles, brick-side detection, multi-ball velocity,
the timer, speed scaling. Worked examples throughout.

> 👉 Read this to understand the actual gameplay logic and the math.

### 4. [DEEP_DIVE.md](DEEP_DIVE.md) — *Everything, from the ground up*
The most detailed doc. Explains how a web page even runs (the DOM, scripts, the event
loop), the coordinate system, the render loop, and traces a **full play-through frame by
frame**. Read this if you want to understand *why* things work, not just *what* they do.

> 👉 Read this last, for complete understanding.

---

## 🗺️ Quick reference

### Project structure
```
BrickBreaker/
├── index.html          ← loads everything, defines all the HTML
├── style.css           ← all the visuals (neon theme, layout, animations)
├── favicon.svg         ← the browser-tab icon
├── sounds/             ← music + sound effects (.mp3)
├── docs/               ← 📚 you are here
└── script/
    ├── background.js   ← animated particle background (the only real <canvas>)
    ├── core/
    │   ├── constants.js  ← fixed values + element refs + the 10 level layouts
    │   └── state.js      ← the live variables that change while you play
    ├── audio/
    │   └── sounds.js     ← loads sounds, handles browser autoplay rules
    └── game/
        ├── collision.js  ← aabb(): do two rectangles overlap?
        ├── ball.js       ← spawnBall(), attachBall()
        ├── powerup.js    ← dropPowerup(), applyPowerup()
        ├── level.js      ← updateHUD(), initLevel(), init(), reset()
        └── loop.js       ← THE HEART: gameLoop(), loseBall()
```

### The one idea that explains everything
> The ball, paddle, every brick, and every power-up is a real HTML `<div>`. The game
> moves them by changing their CSS `transform`, and a single loop (`gameLoop`) runs ~60
> times a second to advance everything one tiny step. **Change numbers → redraw → repeat.**

### How the game flows
```
START clicked → init() → initLevel() → builds bricks + paddle + ball
                                      → starts gameLoop (runs ~60×/sec)

Each frame, gameLoop():
   tick timer → move paddle → move balls → bounce off walls/bricks/paddle
   → break bricks → fall/catch power-ups → check win/lose → draw next frame

All bricks broken → next level (or YOU WIN on level 10)
Ball lost / time out → loseBall() → lose a life (or GAME OVER at 0 lives)
```

---

## 🎮 Want to just play it?
See the main [README](../README.md) in the project root for controls and gameplay.
Open `index.html` in any browser to start.
