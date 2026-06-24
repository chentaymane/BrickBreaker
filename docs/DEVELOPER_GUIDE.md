# Brick Breaker — Full Developer Guide

A complete, from-zero walkthrough of how this game works. No prior knowledge of the
codebase is assumed. Read it top to bottom and you'll understand every file, every
function, and the built-in browser features they rely on.

---

## 1. The big picture (read this first)

This is a **Brick Breaker / Arkanoid** game built with **only** three things:

- **HTML** (`index.html`) — the structure: menus, overlays, buttons, the game box.
- **CSS** (`style.css`) — all the looks: neon colors, glows, layout, animations.
- **Vanilla JavaScript** (the `script/` folder) — all the behavior: moving the ball,
  bouncing, breaking bricks, scoring, power-ups, sound.

**No frameworks, no libraries, no build step.** You literally double-click
`index.html` and it runs. That's rare and worth appreciating — there's no React, no
npm, no webpack. Everything is the raw browser.

### The single most important idea

Most games draw everything onto a `<canvas>` and repaint pixels 60 times a second.
**This game does NOT do that for the gameplay.** Instead:

> Every game object — the ball, the paddle, each brick, each power-up — is a real
> **HTML `<div>` element**. The game moves them around by changing their CSS
> `transform`. The browser does the actual drawing.

So "move the ball" really means "change a `<div>`'s `style.transform`". This is called
a **DOM-based game** (DOM = Document Object Model = the live tree of HTML elements).
The only `<canvas>` in the project is the **background** (floating particles) — that
one *is* drawn pixel-by-pixel.

Keep that in mind and everything else clicks into place.

---

## 2. How the files fit together

```
index.html          ← loads everything, defines all the HTML
style.css           ← all styling
favicon.svg         ← the little tab icon (a ball + paddle drawn in SVG)
sounds/*.mp3        ← sound effects + music
script/
  background.js     ← animated particle background (the only <canvas> code)
  core/
    constants.js    ← fixed values + grabs all HTML elements + level layouts
    state.js        ← the "live" variables that change while you play
  audio/
    sounds.js       ← loads the sound files, handles autoplay rules
  game/
    collision.js    ← one helper: "do two rectangles overlap?"
    ball.js         ← create a ball, reset ball onto paddle
    powerup.js      ← drop power-ups, apply their effects
    level.js        ← build a level, the HUD, full reset
    loop.js         ← THE HEART: the per-frame game loop + losing a ball
  events.js         ← all keyboard/button input
```

### Load order matters

At the bottom of `index.html`:

```html
<script src="script/background.js"></script>
<script src="script/core/constants.js"></script>
<script src="script/core/state.js"></script>
<script src="script/audio/sounds.js"></script>
<script src="script/game/collision.js"></script>
<script src="script/game/ball.js"></script>
<script src="script/game/powerup.js"></script>
<script src="script/game/level.js"></script>
<script src="script/game/loop.js"></script>
<script src="script/events.js"></script>
```

These are **plain scripts** (not ES modules). That means every variable and function
declared with `let`, `const`, or `function` at the top level is **global** — shared
across all files automatically. There is no `import`/`export`. `constants.js` defines
`dom`, and `loop.js` can use `dom` directly because they share one global scope.

Because of that, **order matters**: a file can only use something that an earlier file
already defined. `constants.js` and `state.js` come first because everyone needs them.
`events.js` comes last because it wires up buttons to functions that all the other
files defined.

> ⚠️ One quirk worth knowing: because all variables are global, the names have to be
> unique across the whole project. That's why you'll see one shared `dom` object,
> one `balls` array, etc.

---

## 3. The HTML structure (`index.html`)

The page contains several "screens" that are shown/hidden by toggling a CSS class
called `.hidden` (which is just `display: none !important;`). They all exist in the
DOM at all times; the game just flips which ones are visible.

| Element | Purpose |
|---|---|
| `<canvas id="bg-canvas">` | The animated particle background, behind everything. |
| `#hud` | Top bar: LEVEL / SCORE / TIME / LIVES. Hidden until you start. |
| `#game-container` | The 900×600 play area. Bricks, paddle, ball get injected here. |
| `#menu-container` | The start screen (title, START button, tutorial). |
| `.pause-container` | Pause button + music/SFX buttons (top-left corner). |
| `#pause-overlay` | The "PAUSED" screen. |
| `#win-overlay` | The "YOU WIN!" screen. |
| `#gameover-overlay` | The "GAME OVER" screen. |

Notice the **tutorial icons** and the **favicon** are inline `<svg>` — vector graphics
drawn with `<path>` data. For example, the lightning bolt for Multi-Ball:

```html
<svg class="tut-icon" viewBox="0 0 24 24" fill="currentColor">
  <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
</svg>
```

`fill="currentColor"` is a nice trick: the SVG takes whatever text `color` the CSS
gives it, so the icon matches the surrounding theme automatically.

Important: the game box `#game-container` starts **empty**. The bricks, paddle, and
ball don't exist in the HTML — JavaScript creates them when a level starts (see §8).

---

## 4. `core/constants.js` — fixed values and element references

### 4.1 The `$` helper and the `dom` object

```js
const $ = (s) => document.querySelector(s);
```

`document.querySelector(selector)` is a **built-in browser function**. You give it a
CSS selector string (like `"#hud"` or `".start-button"`) and it returns the first
matching element, or `null`. This one-line helper just shortens `document.querySelector`
to `$` so the rest of the code reads cleaner.

```js
const dom = {
    resume: $(".resume-btn"),
    restart: $(".restart-btn"),
    music: document.querySelectorAll(".musical"),
    ...
};
```

`dom` is a plain object that **caches** references to every HTML element the game will
touch. Grabbing them once here (instead of searching the page over and over) is faster
and keeps all the lookups in one place. Now anywhere in the code you can write
`dom.hud` instead of `document.querySelector("#hud")`.

Note `document.querySelectorAll(".musical")` (plural) returns a **NodeList** — a
list of *all* matching elements (there are two music buttons: one in the corner, one in
the pause overlay). That's why later code loops over `dom.music`.

### 4.2 The constants

```js
const WIDTH = 900, HEIGHT = 600, BORDER = 4;
const CONTENT_WIDTH = WIDTH - BORDER * 2;     // 892, the playable inner width
const PADDLE_WIDTH = 250, PADDLE_HEIGHT = 18, BALL_SIZE = 20;
const ROWS = 6, COLUMNS = 8, SPEED = 5, PADDLE_SPEED = 10;
const LEVEL_TIME = 60;                         // seconds per level
const POWERUP_SIZE = 36, POWERUP_SPEED = 2,
      POWERUP_CHANCE = 0.3,                     // 30% chance a broken brick drops one
      POWERUP_DURATION = 360;                   // fireball lasts ~360 frames (~6s)
```

These never change while the game runs (hence `const`). Using named constants instead
of "magic numbers" sprinkled in the code makes the game easy to tune: want a wider
paddle? Change one number here.

### 4.3 The level data

`LEVEL_COLORS` is an array of 10 color **pairs** — even rows use the first color, odd
rows the second.

`LEVELS` is the cool part: **10 levels, each a 6×8 grid of 1s and 0s.**

```js
// Level 1 — Pyramid
[
  [0, 0, 0, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
  ...
]
```

`1` = put a brick here, `0` = leave a gap. So the level design is just data — to add a
new level you'd draw a new grid of 1s and 0s. That's a very clean separation of "what
the level looks like" from "the code that builds it."

---

## 5. `core/state.js` — the live game variables

While `constants.js` holds things that never change, `state.js` holds the variables
that **do** change as you play. They use `let` (reassignable) instead of `const`.

```js
const keys = {};         // which keyboard keys are currently held down
let paddle = null;       // the paddle <div> element
let balls = [];          // array of ball objects (usually 1, up to 3 with multi-ball)
let powerups = [];       // array of falling power-up objects
let bricks = [];         // array of brick <div> elements currently on screen
let ballAttached = true; // true = ball stuck to paddle waiting for launch
let gameRunning = false; // is the game loop active? (false when paused/over)
let paddleX = 325;       // paddle's horizontal position in px
let score = 0;
let lives = 3;
let level = 1;
let ballSpeed = SPEED;          // gets faster on later levels
let paddleWidth = PADDLE_WIDTH; // shrinks when you lose a life
let throughBall = false;        // is the fireball power-up active?
let throughTimer = 0;           // frames remaining on fireball
let timeLeft = LEVEL_TIME;      // seconds left this level
let timerAccum = 0;             // milliseconds accumulated toward the next second tick
let lastFrameTime = 0;          // timestamp of previous frame (for the timer)
```

This is the game's "memory." Almost every function reads or writes these. A **ball
object** looks like `{ el, x, y, dx, dy }`:
- `el` — the actual `<div>` on the page
- `x`, `y` — its position in pixels inside the game box
- `dx`, `dy` — its velocity: how many pixels it moves each frame horizontally /
  vertically. (`d` stands for "delta", i.e. change.)

---

## 6. `audio/sounds.js` — sound and the autoplay problem

```js
const boom = new Audio("sounds/boom.mp3");
const eat  = new Audio("sounds/eat.mp3");
...
const theme = new Audio("sounds/theme.mp3");
```

`new Audio(url)` is a **built-in** — it creates an audio player for a file. Calling
`someSound.play()` plays it. `someSound.currentTime = 0` rewinds it to the start (so a
rapidly-repeated sound like `boom` restarts cleanly instead of refusing to replay).

```js
theme.loop = true;     // background music repeats forever
theme.volume = 0.4;    // 40% volume
theme.muted = true;    // start muted...
theme.play().catch(() => { ... });
```

**The autoplay problem:** modern browsers block audio from playing until the user
interacts with the page (a real click or keypress). If you just call `play()` on load,
it gets rejected. The trick used here:

1. Start the music **muted** and play it (browsers allow *muted* autoplay).
2. Wait for the first click or keydown anywhere on the page.
3. When that happens, `activateAudio()` unmutes it and removes its own listeners (so it
   only runs once).

```js
function activateAudio() {
    theme.muted = false;
    theme.play();
    document.removeEventListener("click", activateAudio);
    document.removeEventListener("keydown", activateAudio);
}
document.addEventListener("click", activateAudio);
document.addEventListener("keydown", activateAudio);
```

`.play().catch(() => {...})` — `play()` returns a **Promise** (an async operation that
can succeed or fail). `.catch()` handles the failure case quietly instead of throwing an
error into the console.

---

## 7. `background.js` — the canvas background

`background.js` sets up the `<canvas>` element that sits behind the entire game and keeps
it filled with a solid dark colour.

```js
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
```

`canvas.getContext('2d')` returns a **drawing context** — the toolbox for painting on the
canvas (`fillRect`, `arc`, etc.).

```js
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
```

`resizeCanvas` is called once at startup and again whenever the browser window is resized
(`window.addEventListener('resize', resizeCanvas)`), so the canvas always matches the
window size exactly.

```js
function drawBackground() {
    ctx.fillStyle = '#000814';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    requestAnimationFrame(drawBackground);
}
drawBackground();
```

`drawBackground` fills the whole canvas with a single solid dark colour (`#000814`) each
frame and reschedules itself with `requestAnimationFrame` — creating a continuous loop
that keeps the background painted. Because the fill is opaque and covers the whole
canvas, there is no fade or trail effect; it is simply a clean dark backdrop for the game.

> **Note:** unlike the game scripts, `background.js` does **not** use an IIFE. `canvas`,
> `ctx`, `resizeCanvas`, and `drawBackground` are all plain globals — they just don't
> conflict with anything else because no other file uses those names.

---

## 8. `game/level.js` — building a level and the HUD

### 8.1 `updateHUD()`

```js
function updateHUD() {
    dom.levelEl.textContent = `LEVEL: ${level}`;
    dom.scoreEl.textContent = `SCORE: ${score}`;
    dom.timerEl.textContent = `TIME: ${timeLeft}`;
    dom.timerEl.classList.toggle("timer-urgent", timeLeft <= 10);
    dom.livesEl.textContent = `LIVES: ${lives}`;
}
```

- `element.textContent = "..."` — sets the visible text of an element.
- The backtick `` `LEVEL: ${level}` `` is a **template literal**: `${...}` inserts a
  variable into the string.
- `classList.toggle("timer-urgent", condition)` — adds the class if `condition` is true,
  removes it if false. Here, when 10 seconds or less remain, it adds `timer-urgent`,
  which the CSS animates into a red blinking warning.

### 8.2 `initLevel()` — the level builder

This is called every time a new level starts. Step by step:

```js
function initLevel() {
    dom.game.innerHTML = "";   // wipe the play area clean
    balls = []; powerups = [];
    throughBall = false; throughTimer = 0;
    timeLeft = LEVEL_TIME; timerAccum = 0; lastFrameTime = 0;

    let layout = LEVELS[level - 1];        // pick this level's grid (arrays are 0-indexed)
    let colors = LEVEL_COLORS[level - 1];
    ballSpeed = SPEED + level;             // +1 speed every level
```

`innerHTML = ""` is a quick way to delete all child elements of the game box.
`level - 1` because `level` starts at 1 but array indexes start at 0.

Now it builds the bricks by reading the grid:

```js
    let bricksContainer = document.createElement("div");
    bricksContainer.className = "bricks-container";
    for (let r = 0; r < ROWS; r++) {
        let row = document.createElement("div");
        row.className = "brick-row";
        for (let i = 0; i < COLUMNS; i++) {
            let el = document.createElement("div");
            el.className = layout[r][i]
                ? `brick ${r % 2 ? colors[1] : colors[0]}`  // 1 → a colored brick
                : "brick-gap";                              // 0 → an invisible spacer
            row.appendChild(el);
        }
        bricksContainer.appendChild(row);
    }
    dom.game.appendChild(bricksContainer);
    bricks = [...document.querySelectorAll(".brick")];
```

Built-ins used here:
- `document.createElement("div")` — makes a brand-new `<div>` in memory (not yet on the
  page).
- `element.className = "..."` — sets its CSS classes.
- `parent.appendChild(child)` — attaches the element into the page tree.
- The two nested `for` loops walk the 6×8 grid. For each cell, `layout[r][i]` is 1 or 0.
- `layout[r][i] ? A : B` — a **ternary**: if the cell is 1, give it class
  `brick <color>`; if 0, give it `brick-gap` (a same-size but invisible placeholder so
  the grid stays aligned).
- `r % 2` — `%` is remainder. `r % 2` is 1 for odd rows, 0 for even, so it alternates
  the two colors row by row.
- `[...document.querySelectorAll(".brick")]` — `querySelectorAll` returns a NodeList;
  the `[...spread]` copies it into a real **array** so the game can use array methods
  like `.every()` and `.filter()` on it later.

Then it creates the paddle and finishes setup:

```js
    paddle = document.createElement("div");
    paddle.id = "paddle";
    dom.game.appendChild(paddle);

    paddleWidth = PADDLE_WIDTH;   // reset paddle to full width each level
    updateHUD();
    attachBall();                 // place ball on paddle (see §9)
    gameRunning = true;
    requestAnimationFrame(gameLoop);  // START the game loop
}
```

That last line kicks off the gameplay loop in `loop.js`.

### 8.3 `init()` vs `reset()`

```js
function init() {     // start a brand-new game
    score = 0; lives = 3; level = 1;
    initLevel();
}
```

`init()` is the "new game" entry point (called by the START button). It zeroes the
score/lives/level, then builds level 1.

```js
function reset() {    // return to the main menu
    dom.game.innerHTML = "";
    dom.menu.style.display = "";       // show menu again
    dom.pause.hidden = true;
    dom.hud.classList.add("hidden");
    ... hide all overlays ...
    gameRunning = false;
    level = 1; ... reset all state ...
}
```

`reset()` is the "back to menu / play again" function — it clears the board and hides
every overlay so you're back at the start screen.

> **Note on advancing levels:** there is no single `nextLevel()` function. When the last
> brick of a level breaks, the loop simply does `level++` and calls `initLevel()` again.
> Score and lives carry over because `initLevel()` doesn't touch them (only `init()`
> resets them).

---

## 9. `game/ball.js` — creating and resetting the ball

### `spawnBall(x, y, dx, dy)`

```js
function spawnBall(x, y, dx, dy) {
    let el = document.createElement("div");
    el.className = "ball";
    if (throughBall) el.classList.add("fire");   // fiery look if fireball is active
    dom.game.appendChild(el);
    el.style.transform = `translate(${x}px, ${y}px)`;
    return { el, x, y, dx, dy };
}
```

Creates one ball `<div>`, positions it, and returns a ball object. **Positioning is done
with `transform: translate(x, y)`** rather than `left`/`top`. Why? `transform` is
GPU-accelerated and doesn't force the browser to recalculate page layout — it's the fast
way to move things every frame.

`return { el, x, y, dx, dy }` uses **shorthand**: `{ el }` is the same as `{ el: el }`.

### `attachBall()`

Called at the start of a level and after losing a ball. It "resets" the ball back onto
the center of the paddle, waiting for launch:

```js
function attachBall() {
    ballAttached = true;
    balls.forEach((b) => b.el.remove());   // remove any existing ball <div>s
    balls = [];
    powerups.forEach((p) => p.el.remove());
    powerups = [];
    throughBall = false; throughTimer = 0;

    paddleX = (CONTENT_WIDTH - paddleWidth) / 2;   // center the paddle
    paddle.style.width = paddleWidth + "px";
    paddle.style.transform = `translateX(${paddleX}px)`;
    paddle.classList.remove("paddle-fire", "paddle-multi");  // back to normal look

    let x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;       // centered on paddle
    let y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;  // just above paddle
    balls.push(spawnBall(x, y, 0, -ballSpeed));   // dx=0, dy=-speed → ready to fly up
}
```

- `element.remove()` — built-in that deletes the element from the page.
- `array.forEach(fn)` — runs `fn` once for every item; here it cleans up old balls and
  power-ups.
- The new ball starts with velocity `(0, -ballSpeed)` — straight up — but it won't
  actually move until you press Space (`ballAttached` is true until then; see §11).

---

## 10. `game/collision.js` and `game/powerup.js`

### 10.1 `aabb(a, b)` — the collision test

```js
function aabb(a, b) {
    return a.right > b.left && a.left < b.right &&
           a.bottom > b.top && a.top < b.bottom;
}
```

**AABB = Axis-Aligned Bounding Box**, the standard rectangle-overlap test. Given two
rectangles `a` and `b` (each with `left/right/top/bottom`), it returns `true` if they
overlap. The logic: they overlap only if they overlap on **both** the horizontal axis
(`a.right > b.left && a.left < b.right`) **and** the vertical axis. If any one of those
four conditions fails, there's a gap between them. This one tiny function powers all
ball↔brick and power-up↔paddle collision checks.

The rectangles come from `element.getBoundingClientRect()` — a built-in that returns an
element's exact on-screen position and size (`{left, top, right, bottom, width, height}`).

### 10.2 `dropPowerup(brickRect)`

When a brick breaks, maybe spawn a falling power-up:

```js
function dropPowerup(brickRect) {
    if (Math.random() > POWERUP_CHANCE) return;   // 70% of the time: do nothing
    let gameRect = dom.game.getBoundingClientRect();
    let px = brickRect.left - gameRect.left - BORDER
             + (brickRect.width - POWERUP_SIZE) / 2;   // center under the brick
    let py = brickRect.top - gameRect.top - BORDER;
    let type = Math.random() < 0.5 ? "multi" : "fire";  // 50/50 which kind
    let el = document.createElement("div");
    el.className = `powerup ${type}`;
    el.innerHTML = type === "multi" ? `<svg.../>` : `<svg.../>`;  // the icon
    dom.game.appendChild(el);
    el.style.transform = `translate(${px}px, ${py}px)`;
    powerups.push({ el, x: px, y: py, type });
}
```

- `if (Math.random() > 0.3) return;` — early-exit so only ~30% of bricks drop anything.
- The `px`/`py` math converts the brick's **screen** position into a position **relative
  to the game box** (subtracting the game box's own offset and border), so the power-up
  appears exactly where the brick was.
- `element.innerHTML = "<svg>...</svg>"` — sets the inner HTML, here injecting the SVG
  icon (lightning for multi, flame for fire).
- The new power-up gets pushed into the global `powerups` array; the game loop will make
  it fall.

### 10.3 `applyPowerup(type)`

Runs when the paddle catches a power-up:

```js
function applyPowerup(type) {
    eat.currentTime = 0; eat.play();    // "nom" sound
    if (type === "multi") {
        let b = balls[0];
        if (!b) return;
        balls.push(spawnBall(b.x, b.y, b.dx - ballSpeed / 2, b.dy));
        balls.push(spawnBall(b.x, b.y, b.dx + ballSpeed / 2, b.dy));
        paddle.classList.remove("paddle-fire");
        paddle.classList.add("paddle-multi");
    } else if (type === "fire") {
        throughBall = true;
        throughTimer = POWERUP_DURATION;             // fireball for ~360 frames
        balls.forEach((b) => b.el.classList.add("fire"));
        paddle.classList.remove("paddle-multi");
        paddle.classList.add("paddle-fire");
    }
}
```

**Multi-ball** spawns two extra balls at the same position as the current ball. Their
horizontal velocity is offset by `±ballSpeed / 2` to fan them out left and right;
vertical velocity (`dy`) stays the same. The new balls may travel slightly faster or
slower than `ballSpeed` depending on the angle of the original ball, but they'll fan
visibly in different directions.

**Fireball** sets `throughBall = true`, which (in the loop) lets the ball smash through
bricks without bouncing, and starts a countdown `throughTimer`. It also adds CSS classes
so the ball and paddle glow orange.

---

## 11. `game/loop.js` — THE HEART OF THE GAME

The game loop has been split into several focused functions instead of one big function.
`gameLoop` is now a thin coordinator that calls each helper in order:

```js
function gameLoop(timestamp) {
    if (!gameRunning) return;
    updateTimer(timestamp);
    movePaddle();
    if (!ballAttached) {
        tickFireball();
        movePowerups();
        if (moveBalls()) return;   // returns true when a level ended
    }
    if (gameRunning) requestAnimationFrame(gameLoop);
}
```

If `gameRunning` is false the function returns immediately and never schedules another
frame — that is how pausing works.

### 11.1 `updateTimer(timestamp)`

```js
function updateTimer(timestamp) {
    if (ballAttached) { lastFrameTime = 0; return; }
    if (lastFrameTime === 0) lastFrameTime = timestamp;
    let msPassed = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    if (msPassed > 50) msPassed = 50;   // cap: prevents tab-switch jump
    timerAccum += msPassed;
    if (timerAccum < 1000) return;
    timerAccum = 0;
    timeLeft = timeLeft - 1;
    if (timeLeft < 0) timeLeft = 0;
    updateHUD();
    if (timeLeft === 0) {
        timeLeft = LEVEL_TIME; timerAccum = 0; lastFrameTime = 0;
        loseBall();
    }
}
```

This is a **delta-time accumulator**. Frames don't arrive evenly, so instead of assuming
"60 frames = 1 second," it measures real milliseconds between frames, piles them up in
`timerAccum`, and decrements `timeLeft` once per 1000 ms. The 50 ms cap prevents a long
tab-switch from draining many seconds at once. The timer only runs while the ball is
launched (`!ballAttached`), so you're not penalized while aiming.

### 11.2 `movePaddle()`

```js
function movePaddle() {
    if (!paddle) return;
    if (keys["ArrowLeft"]  || keys["a"]) paddleX = Math.max(0, paddleX - PADDLE_SPEED);
    if (keys["ArrowRight"] || keys["d"]) paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);
    paddle.style.transform = `translateX(${paddleX}px)`;
    if (ballAttached && balls[0]) {
        balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;
        balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
    }
}
```

Reads the `keys` object on every frame. `Math.max` / `Math.min` clamp the paddle so it
never leaves the box. While the ball is still attached, it slides with the paddle.

### 11.3 `tickFireball()`

```js
function tickFireball() {
    if (!throughBall) return;
    if (--throughTimer <= 0) {
        throughBall = false;
        balls.forEach(b => b.el.classList.remove("fire"));
        paddle.classList.remove("paddle-fire");
    }
}
```

Counts down the fireball timer each frame and removes the effect when it expires.

### 11.4 `movePowerups()`

```js
function movePowerups() {
    let paddleRect = paddle.getBoundingClientRect();
    powerups = powerups.filter(p => {
        p.y += POWERUP_SPEED;
        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        if (p.y > CONTENT_HEIGHT) { p.el.remove(); return false; }
        if (aabb(p.el.getBoundingClientRect(), paddleRect)) {
            applyPowerup(p.type); p.el.remove(); return false;
        }
        return true;
    });
}
```

Uses `Array.filter` to move every power-up and rebuild the `powerups` array in one pass,
keeping only those still on screen. Power-ups that fall off the bottom or are caught by
the paddle remove their `<div>` and return `false` (excluded from the new array).

### 11.5 `moveBalls()` — brick and paddle collisions

```js
function moveBalls() {
    let paddleRect = paddle.getBoundingClientRect();
    for (let i = balls.length - 1; i >= 0; i--) {
        let b = balls[i];
        b.x += b.dx; b.y += b.dy;

        if (b.x <= 0 || b.x >= CONTENT_WIDTH - BALL_SIZE) b.dx = -b.dx;
        if (b.y <= 0) b.dy = -b.dy;
        if (b.y >= CONTENT_HEIGHT - BALL_SIZE) { b.el.remove(); balls.splice(i, 1); continue; }

        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        let ballRect = b.el.getBoundingClientRect();
        ...
    }
    if (balls.length === 0) loseBall();
    return false;
}
```

Iterates the `balls` array **backwards** (`i = balls.length - 1` down to `0`). Going
backwards lets the loop safely call `balls.splice(i, 1)` to remove a dead ball in-place
— removing an item from position `i` doesn't affect items at lower indices that haven't
been visited yet.

**Brick collisions** (same logic as before):

- Each ball is checked against every non-hidden brick using `aabb`.
- A hit brick is hidden (`visibility = "hidden"`), scores +10, and may drop a power-up.
- `bricks.every(x => x.style.visibility === "hidden")` detects a cleared level.
- A normal ball bounces using the smaller-overlap rule (see §7 in MECHANICS.md).
- A fireball skips the bounce and keeps smashing.
- `moveBalls` returns `true` when a level ends so `gameLoop` exits immediately.

**Paddle collision:**

```js
        if (aabb(ballRect, paddleRect)) {
            impact.currentTime = 0; impact.play();
            let hitPos = (b.x + BALL_SIZE / 2 - paddleX) / paddleWidth;
            b.dx = (hitPos - 0.5) * 2 * ballSpeed;
            b.dy = -ballSpeed;
            b.y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;
            b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        }
```

This is the **control mechanic** that makes the game playable. `hitPos` is 0 at the
paddle's left edge, 0.5 at dead center, and 1 at the right edge. Subtracting 0.5 and
multiplying by 2 turns that into a range of −1 to +1, which is then multiplied by
`ballSpeed` to get `dx`. `dy` is always exactly `−ballSpeed` (straight upward component).

So hitting the center gives `dx = 0` (straight up); hitting an edge gives `dx = ±ballSpeed`
(sharp diagonal). The ball always launches upward regardless of where it hits.

### 11.4 `loseBall()`

```js
function loseBall() {
    lose.currentTime = 0; lose.play();
    lives--;
    if (lives <= 0) {                       // game over
        gameover.play();
        dom.gameoverScore.textContent = `SCORE: ${score}`;
        dom.gameover.classList.remove("hidden");
        gameRunning = false;
        return;
    }
    paddleWidth = Math.max(60, paddleWidth - 60);   // punish: shrink paddle (min 60px)
    updateHUD();
    attachBall();                           // re-spawn ball on the paddle
}
```

Lose a life. If you're out, show GAME OVER and stop the loop. Otherwise the paddle
shrinks by 60px (down to a floor of 60) as a difficulty penalty, and the ball resets
onto the paddle for another go.

---

## 12. `events.js` — all the input

This file connects user actions (clicks, keypresses) to the functions above using
`addEventListener("event", handler)` — the standard way to react to events.

### Start button
```js
dom.start.addEventListener("click", function () {
    select.currentTime = 0; select.play();
    gamestarted = true;
    dom.menu.style.display = "none";        // hide menu
    dom.pause.hidden = false;
    dom.hud.classList.remove("hidden");     // show HUD + game
    dom.game.classList.remove("hidden");
    init();                                 // start a new game
});
```

### Music / SFX toggles
```js
dom.music.forEach((elem) => {
    elem.addEventListener("click", () => {
        if (theme.paused) theme.play(); else theme.pause();
        syncMusicBtns();
    });
});
```
There are two music buttons (corner + pause overlay), so it loops over both. SFX works
the same way but toggles a `muted` flag on each sound effect. `syncMusicBtns()` /
`syncEffectBtns()` just add/remove a dimmed `audio-off` class so the buttons visually
reflect the on/off state.

### Keyboard
```js
document.addEventListener("keydown", function (e) {
    keys[e.key] = true;                                       // remember key is down
    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
    if (e.key === " " && ballAttached && gameRunning) {
        ballAttached = false;                                 // SPACE launches the ball
    }
});
document.addEventListener("keyup", function (e) {
    keys[e.key] = false;                                      // remember key is up
});
```

This is the classic **"keys held down" pattern**. `keydown`/`keyup` just record each
key's state into the `keys` object; the game loop reads that object every frame to move
the paddle smoothly (much better than acting only on the one-time keydown event).
`e.preventDefault()` stops arrow keys and space from scrolling the page. Pressing Space
just flips `ballAttached` to false, which "releases" the ball so the loop starts moving
it.

### Pause / Escape / Resume
```js
dom.pause.addEventListener("click", function () {
    select.play();
    dom.overlay.classList.remove("hidden");   // show PAUSED screen
    gameRunning = false;                       // stop the loop
    lastFrameTime = 0;                         // reset timer baseline
});

document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && gamestarted) {
        if (gameRunning) { ...pause... }
        else { ...hide overlay, gameRunning = true, requestAnimationFrame(gameLoop); }
    }
});

dom.resume.addEventListener("click", function () {
    clicked.play();
    dom.overlay.classList.add("hidden");
    gameRunning = true;
    requestAnimationFrame(gameLoop);           // restart the loop
});
```

Pausing = set `gameRunning = false` (the loop self-stops) and show the overlay. Resuming
= hide the overlay, set `gameRunning = true`, and call `requestAnimationFrame(gameLoop)`
to **restart** the loop. Escape toggles between the two. Resetting `lastFrameTime = 0`
on pause is important so the countdown timer doesn't count the paused seconds.

### Restart buttons
```js
dom.restart.addEventListener("click", () => { clicked.play(); reset(); });
dom.win.querySelector(".restart-btn").addEventListener("click", reset);
dom.gameover.querySelector(".restart-btn").addEventListener("click", reset);
```
All "Play Again" / "Restart" buttons call `reset()` to return to the main menu.

---

## 13. `style.css` — how it looks

The visual style is **neon / synthwave**: a near-black background (`#06061a`) with
brightly glowing elements. The glow everywhere comes from CSS `box-shadow` and
`text-shadow` with colored blur and no offset, e.g.:

```css
#level-display {
    color: #00f0ff;
    text-shadow: 0 0 10px #00f0ff;   /* same-color blur = a glow */
}
```

Highlights:
- **`transform: translate(...)`** is used to position the ball, paddle, bricks, and
  power-ups (set from JS). It's GPU-friendly, hence the `will-change: transform` hints
  that tell the browser to optimize for it.
- **Bricks** are flex rows inside `.bricks-container`; each color (`.red`, `.cyan`, …)
  is a `linear-gradient` + matching glow.
- **`@keyframes`** drive two animations: `timer-blink` (the red blinking clock under 10
  s) and `powerup-fall` (power-ups gently pulse their opacity as they drop).
- **`.hidden { display: none !important; }`** is the master show/hide switch the JS
  toggles to flip between screens.
- **`backdrop-filter: blur(...)`** frosts the overlays so the game blurs behind the
  pause/win/gameover panels.
- **Paddle states**: `.paddle-multi` (blue) and `.paddle-fire` (orange) gradients are
  added/removed from JS to signal active power-ups.

---

## 14. The complete flow, start to finish

1. **Page loads.** All scripts run top to bottom. `background.js` starts the particle
   animation. `sounds.js` queues muted music. `constants.js` caches DOM elements.
   `events.js` wires up every button and key. The menu screen is showing; the game box
   is empty and hidden.
2. **First click/keypress** anywhere unmutes the music (`activateAudio`).
3. **Click START** → `init()` → `initLevel()` builds level 1's bricks from the grid,
   creates the paddle, places the ball, sets `gameRunning = true`, and starts
   `gameLoop` via `requestAnimationFrame`.
4. **Each frame** (`gameLoop`): run the countdown, move the paddle from held keys, and —
   once you press **Space** — move the balls, bounce off walls/bricks/paddle, break
   bricks (+10 each), drop & catch power-ups, and re-schedule the next frame.
5. **Break every brick** → `level++` and `initLevel()` for the next layout (score/lives
   carry over). Ball speed rises every 2 levels.
6. **Ball falls off the bottom or time hits 0** → `loseBall()`: −1 life, paddle shrinks,
   ball resets. At 0 lives → **GAME OVER** overlay.
7. **Clear level 10** → **YOU WIN!** overlay.
8. **Pause** (button/Esc) stops the loop; **Resume** restarts it; **Restart / Play
   Again** calls `reset()` back to the menu.

---

## 15. Cheat-sheet of every built-in used

| Built-in | What it does |
|---|---|
| `document.querySelector(sel)` | Find the first element matching a CSS selector. |
| `document.querySelectorAll(sel)` | Find **all** matching elements (a NodeList). |
| `document.getElementById(id)` | Find one element by its `id`. |
| `document.createElement(tag)` | Make a new element in memory. |
| `parent.appendChild(child)` | Attach an element into the page. |
| `element.remove()` | Delete an element from the page. |
| `element.textContent` | Get/set an element's visible text. |
| `element.innerHTML` | Get/set the HTML inside an element. |
| `element.className` / `classList.add/remove/toggle` | Manage CSS classes. |
| `element.style.transform` | Set inline CSS (used to move things). |
| `element.getBoundingClientRect()` | Get an element's on-screen position & size. |
| `addEventListener(type, fn)` | Run `fn` when an event (click, keydown…) fires. |
| `removeEventListener(type, fn)` | Stop listening (used once for audio unlock). |
| `requestAnimationFrame(fn)` | Run `fn` before the next repaint (~60 fps animation). |
| `new Audio(url)` / `.play()` / `.pause()` | Sound playback. |
| `Math.random()` | Random number in [0, 1). |
| `Math.floor / max / min` | Round down / clamp values. |
| `Math.sin / cos / sqrt / PI` | Trigonometry for bounce angles & speed. |
| `Array.from({length:n}, fn)` | Build an array of n generated items. |
| `array.forEach / filter / every / push / includes` | Standard array operations. |
| `[...nodeList]` (spread) | Copy a NodeList into a real array. |
| Template literal `` `x ${y}` `` | Build strings with embedded variables. |
| Ternary `cond ? a : b` | Inline if/else expression. |

---

That's the entire game. The design is worth admiring: **data-driven levels** (grids of
0s and 1s), **DOM elements instead of canvas pixels**, **separation of concerns** across
small files, and a **single `requestAnimationFrame` loop** that ties it all together.
