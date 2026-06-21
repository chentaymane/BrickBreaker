# Brick Breaker — Deep Dive (Every Detail)

This is the companion to `DEVELOPER_GUIDE.md`. The guide explains **what each file does**.
This document explains **how it all actually works underneath** — the browser, the
language, the math — assuming the reader has never built a game before. We go slow and
use real numbers.

> If `DEVELOPER_GUIDE.md` is the map, this is the walking tour where we stop and inspect
> every brick.

---

## PART A — How a web page even runs

Before any game logic, you need to know what the browser does when it opens
`index.html`. There are three languages and they have three different jobs:

- **HTML** = the *nouns*. It lists what exists: "there is a menu, a button, a game box."
- **CSS** = the *adjectives*. It describes how those things look: "the button is cyan and
  glows."
- **JavaScript** = the *verbs*. It makes things happen over time: "when clicked, start
  the game; every frame, move the ball."

### A.1 The DOM — the live tree of your page

When the browser reads your HTML, it builds an in-memory tree called the **DOM**
(Document Object Model). Each tag becomes a **node** (an object). For example this HTML:

```html
<body>
  <div id="hud">
    <span id="score-display">SCORE: 0</span>
  </div>
</body>
```

becomes a tree:

```
document
└─ body
   └─ div#hud
      └─ span#score-display  →  text "SCORE: 0"
```

JavaScript doesn't edit the HTML *text file*. It edits this **live tree**. When you write
`dom.scoreEl.textContent = "SCORE: 10"`, you're reaching into the tree, finding that
`<span>` node, and changing its text. The browser instantly re-draws that part of the
screen. **This is the entire trick of every web game:** change the DOM, the screen
updates.

### A.2 What "running a script" means

At the bottom of `index.html` there are `<script>` tags. The browser reads them
**top to bottom, one at a time**, and *executes every line immediately* as it reads it.

So when the browser hits `script/core/constants.js`, it runs:

```js
const $ = (s) => document.querySelector(s);
const dom = { resume: $(".resume-btn"), ... };
```

Line 1 creates a function. Line 2 *runs* `$(".resume-btn")` right now, searches the DOM
tree, and stores the found element. By the time this script finishes, `dom` is fully
populated. This is why **load order matters**: when `events.js` runs last, `dom` already
exists because `constants.js` ran first.

### A.3 Global scope — why files can see each other

Normally each file is separate. But these scripts are loaded as **plain scripts** (not
modules). In a plain script, anything you declare at the "top level" (not inside a
function) goes into one shared global bucket called `window`.

So `let balls = []` in `state.js` and `function gameLoop()` in `loop.js` both live in the
same global space. `gameLoop` can use `balls` directly — no importing needed. It's like
all the files were pasted into one big file in load order.

The cost: **every name must be unique across the whole project**, and any file can
accidentally overwrite another's variable. That's the trade-off for simplicity.
(`background.js` deliberately wraps itself in `(function(){...})()` to *opt out* and keep
its variables private — see Part F.)

### A.4 The browser is event-driven and single-threaded

JavaScript in the browser does **one thing at a time** (single thread). It sits idle
until something happens — a click, a keypress, a timer, an animation frame — then it runs
the matching function to completion, then goes back to idle. This queue of "things to
react to" is the **event loop**.

Your whole game is built on this: you *register* functions ("when START is clicked, run
this"; "before each repaint, run `gameLoop`") and the browser calls them at the right
moments. You never write a `while(true)` loop that would freeze the page — instead you
ask the browser to call you back.

---

## PART B — The JavaScript you need to read this code

Every language feature used in the project, explained with tiny examples.

### B.1 Variables: `const` vs `let`

```js
const SPEED = 5;   // a box whose contents can NEVER be reassigned
let score = 0;     // a box whose contents CAN change later
score = 10;        // ✅ allowed
// SPEED = 9;      // ❌ error
```

`const` doesn't mean "the value can't change," it means "this *name* can't be pointed at
something else." That's why `const dom = {...}` is fine even though we change
`dom.scoreEl.textContent` — we're editing the object's *insides*, not repointing `dom`.

The game keeps unchanging settings (`WIDTH`, `PADDLE_SPEED`, `LEVELS`) as `const` in
`constants.js`, and changing gameplay values (`score`, `lives`, `balls`) as `let` in
`state.js`.

### B.2 Functions — three forms, all used in this project

```js
// 1. Classic declaration
function spawnBall(x, y, dx, dy) { return { el, x, y, dx, dy }; }

// 2. Arrow function stored in a variable
const $ = (s) => document.querySelector(s);

// 3. Anonymous function passed straight into something
dom.start.addEventListener("click", function () { init(); });
```

A function is a reusable recipe. You **define** it once and **call** it (`spawnBall(...)`)
many times. The values in the parentheses when you call it are **arguments**; the names
in the parentheses when you define it are **parameters**. Calling
`spawnBall(100, 200, 0, -5)` runs the body with `x=100, y=200, dx=0, dy=-5`.

Arrow functions (`(s) => ...`) are just a shorter way to write a function. `(s) => s * 2`
means "take `s`, give back `s * 2`."

### B.3 Objects — bundles of named values

```js
let ball = { el: someDiv, x: 100, y: 200, dx: 0, dy: -5 };
ball.x         // read → 100
ball.x = 105;  // write
```

An object groups related data under labels (called **properties**). The ball needs five
things tracked together — its element, position, and velocity — so they're bundled into
one object. `ball.x` reads the `x` property.

**Shorthand:** `{ el, x, y, dx, dy }` is identical to
`{ el: el, x: x, y: y, dx: dx, dy: dy }` — when the property name matches the variable
name, you can write it once. `spawnBall` uses this to return its result.

### B.4 Arrays — ordered lists

```js
let balls = [];          // empty list
balls.push(ball);        // add to the end → [ball]
balls.length             // how many → 1
balls[0]                 // the first item
balls.forEach(b => ...)  // do something with each item
```

The game holds several lists: `balls`, `powerups`, `bricks`. `LEVELS` is an **array of
arrays of arrays** (a level is 6 rows, each row is 8 numbers). `LEVELS[0][2][3]` reads
level 1, row 3, column 4.

Array methods used throughout:
| Method | Meaning | Example in game |
|---|---|---|
| `.push(x)` | add to end | `balls.push(spawnBall(...))` |
| `.forEach(fn)` | run fn on each | `balls.forEach(b => b.el.remove())` |
| `.filter(fn)` | keep items where fn is true | `powerups.filter(p => !removed.includes(p))` |
| `.every(fn)` | true if fn true for ALL | `bricks.every(x => x.hidden)` → level cleared? |
| `.includes(x)` | is x in the list? | `removedPowerups.includes(p)` |

### B.5 Conditionals and the ternary

```js
if (lives <= 0) { showGameOver(); } else { keepPlaying(); }

// ternary = if/else as a single expression that produces a value:
let cls = isBrick ? "brick red" : "brick-gap";
```

`condition ? A : B` reads as "if condition then A else B." The level builder uses it to
pick a class for each cell: `layout[r][i] ? "brick ..." : "brick-gap"`.

### B.6 Loops

```js
for (let r = 0; r < 6; r++) { ... }      // counts r = 0,1,2,3,4,5
for (let b of balls) { ... }             // gives each ball in turn
```

The classic `for (init; test; step)` runs as long as the test is true. The level builder
nests two of them (rows × columns) to visit all 48 grid cells. `for...of` is simpler when
you just want each item of an array.

### B.7 Template literals — building strings

```js
let level = 3;
`LEVEL: ${level}`     // → "LEVEL: 3"
`translate(${x}px, ${y}px)`   // → "translate(100px, 200px)"
```

Backticks let you drop `${variable}` right into a string. The game uses this constantly to
build the CSS `transform` strings that move elements, and the HUD text.

### B.8 Truthy / falsy and short-circuits

```js
if (!b) return;            // if b is null/undefined, stop
let mag = something || 1;  // use `something`, but if it's 0/empty, use 1 instead
keys["a"] || keys["ArrowLeft"]   // true if EITHER key is held
```

`0`, `""`, `null`, `undefined`, `NaN`, and `false` are **falsy** (treated as false in a
test); everything else is **truthy**. `x || y` gives `x` if it's truthy, otherwise `y` —
used in `mag = Math.sqrt(...) || 1` to avoid dividing by zero.

---

## PART C — The coordinate system (where things are)

This trips up beginners, so let's be very explicit.

### C.1 Screen coordinates start at the TOP-LEFT

In web/games, the origin `(0, 0)` is the **top-left corner**. X grows **right**, Y grows
**DOWN**. This is upside-down from school graphs!

```
(0,0) ───────────────► X increases
  │
  │      • a point at (100, 50) is
  │        100px right, 50px down
  ▼
Y increases (downward)
```

This is why **going up means a NEGATIVE y velocity**. When the ball launches upward, its
`dy = -ballSpeed` (e.g. `-5`). Each frame `b.y += b.dy` makes `y` *smaller*, moving the
ball up the screen. When it bounces down, `dy` becomes `+5` and `y` grows.

### C.2 The play area is 900 × 600

`#game-container` is exactly 900px wide and 600px tall (set in CSS). It has a 4px border,
so the *playable inside* is:

```js
CONTENT_WIDTH  = 900 - 4*2 = 892
CONTENT_HEIGHT = 600 - 4*2 = 592
```

Every ball/paddle/brick position is measured **relative to the top-left inside corner of
this box**, not the whole browser window. So a ball at `x = 0` is touching the left wall;
at `x = 892 - 20 = 872` (because the ball is 20px wide) it's touching the right wall.

### C.3 Two ways to position; the game uses `transform`

You *could* move an element with `style.left` / `style.top`. The game instead uses
`style.transform = "translate(Xpx, Ypx)"`. Both move the element, but `transform`:
- is calculated by the GPU (graphics chip), so it's fast for 60fps motion;
- doesn't force the browser to recompute the layout of the whole page.

The CSS hint `will-change: transform` on `.ball` and `#paddle` tells the browser "this
will move a lot, please optimize." That's why the game stays smooth.

### C.4 `getBoundingClientRect()` — measuring the real screen box

```js
let r = ball.el.getBoundingClientRect();
// r = { left, top, right, bottom, width, height }  — in WINDOW pixels
```

This built-in returns the element's exact rectangle **in window coordinates** (relative
to the visible browser viewport, including all the page offsets). The collision test
needs both the ball's and the brick's rectangles in the *same* coordinate space, and
`getBoundingClientRect` gives exactly that — so two rects from it can be compared
directly. (That's why `dropPowerup` has to subtract `gameRect.left` and `BORDER` to
convert *back* from window space into game-box space when placing a new power-up.)

---

## PART D — The render loop, explained slowly

This is the engine of every game. Read this section twice.

### D.1 What "60 frames per second" means

Your monitor redraws ~60 times every second (every ~16.67 milliseconds). A **game loop**
is a function that runs once per redraw and nudges everything forward a tiny bit. Do that
60 times a second and the eye sees smooth motion — like a flipbook.

### D.2 `requestAnimationFrame` — the heartbeat

```js
function gameLoop(timestamp) {
    // ... move everything a little ...
    requestAnimationFrame(gameLoop);   // "call me again before the next redraw"
}
requestAnimationFrame(gameLoop);       // start it once
```

`requestAnimationFrame(fn)` (often shortened to **rAF**) tells the browser: "right before
you paint the next frame, run `fn` once." Inside `gameLoop`, the **last line asks for the
next frame again** — so it keeps looping forever, ~60×/sec, like a snake eating its tail.

Why not `setInterval` or a `while` loop? rAF is synced to the actual screen refresh
(smoother), and it **automatically pauses when the tab is in the background** (saves
battery). A `while(true)` loop would freeze the entire browser.

The `timestamp` argument is handed to you for free by the browser: it's the current time
in milliseconds. The countdown timer uses it to measure real elapsed time (Part E).

### D.3 How pausing works (this is elegant)

```js
function gameLoop(timestamp) {
    if (!gameRunning) return;     // ← stop here, do NOT request another frame
    ...
    if (gameRunning) requestAnimationFrame(gameLoop);
}
```

To pause, the code just sets `gameRunning = false`. Next time `gameLoop` runs, the very
first line returns immediately and — crucially — never calls `requestAnimationFrame`
again. The chain stops. The snake stops eating its tail. To **resume**, an event handler
sets `gameRunning = true` and calls `requestAnimationFrame(gameLoop)` once to restart the
chain. No special "pause flag checks" scattered everywhere — the loop simply isn't running.

### D.4 The structure of one frame

Every single frame, in order, `gameLoop` does:

1. **Guard:** if not running, stop.
2. **Timer:** if the ball is launched, add elapsed milliseconds; every 1000ms drop
   `timeLeft` by 1. If it hits 0, lose a ball.
3. **Paddle:** if Left/A held, move paddle left (and drag the attached ball with it);
   same for Right/D.
4. **(only if ball launched)**:
   - tick the fireball timer;
   - make power-ups fall, catch the ones touching the paddle;
   - for each ball: move it, bounce off walls, check brick hits, check paddle hit;
   - remove balls that fell off the bottom; if none left, lose a ball.
5. **Re-arm:** request the next frame.

Everything in the game is just this list repeated 60 times a second.

---

## PART E — Worked numeric examples (follow the actual numbers)

Now let's trace real values so there is zero mystery.

### E.1 The ball launching and moving

Suppose after `attachBall()` the ball is at `x = 436, y = 554` with velocity
`dx = 0, dy = -5` (`ballSpeed` is 5 on level 1). While `ballAttached` is true, the move
code is skipped — the ball just sits there. You press **Space**, which sets
`ballAttached = false`. Now each frame runs:

```
b.x += b.dx;  b.y += b.dy;
```

| Frame | x | y | note |
|---|---|---|---|
| 0 | 436 | 554 | launch |
| 1 | 436 | 549 | y dropped by 5 → moved UP 5px |
| 2 | 436 | 544 | |
| 3 | 436 | 539 | |
| ... | ... | ... | climbing straight up because dx=0 |

It moves straight up because `dx = 0`. 5px per frame × 60 frames = 300px per second.

### E.2 Bouncing off the left wall

Say a ball is heading up-left: `dx = -4, dy = -3`, currently at `x = 6`.

```js
b.x += b.dx;     // 6 + (-4) = 2
if (b.x <= 0 || b.x >= CONTENT_WIDTH - BALL_SIZE) b.dx = -b.dx;
```

Frame by frame:

| Frame | x before | x after move | `x<=0`? | dx after |
|---|---|---|---|---|
| 1 | 6 | 2 | no | -4 |
| 2 | 2 | -2 | **yes** | **+4** (flipped) |
| 3 | -2 | 2 | no | +4 |
| 4 | 2 | 6 | no | +4 |

When `x` goes to `-2` (past the wall), the condition fires and **flips the sign** of
`dx` from `-4` to `+4`. Next frame the ball moves right (`-2 → 2`), back into the box.
That sign-flip *is* the bounce. The ceiling works identically with `dy` when `y <= 0`.

### E.3 Hitting the paddle — where you hit decides the angle

This is the most important math in the game. The paddle is at `paddleX = 321`, width
`paddleWidth = 250`, so its center is at `321 + 125 = 446`. `ballSpeed = 5`.

```js
let hitOffset = b.x + BALL_SIZE/2 - (paddleX + paddleWidth/2);
let angle     = (hitOffset / (paddleWidth/2)) * (Math.PI/4);
b.dx = Math.sin(angle) * ballSpeed;
b.dy = -Math.cos(angle) * ballSpeed;
```

**Case 1 — ball hits dead center.** Ball center lands at x = 446 (same as paddle center).

```
hitOffset = 446 - 446 = 0
angle     = (0 / 125) * 45° = 0°
dx = sin(0°) * 5 = 0
dy = -cos(0°) * 5 = -5      → straight up
```

**Case 2 — ball hits the far right edge.** Ball center at x = 571 (paddle right edge).

```
hitOffset = 571 - 446 = 125
angle     = (125 / 125) * 45° = 45°
dx = sin(45°) * 5 = +3.54   → moving right
dy = -cos(45°) * 5 = -3.54  → moving up
```

**Case 3 — ball hits the far left edge.** Ball center at x = 321.

```
hitOffset = 321 - 446 = -125
angle     = -45°
dx = sin(-45°) * 5 = -3.54  → moving left
dy = -cos(-45°) * 5 = -3.54 → moving up
```

So edge hits fling the ball off at 45°, center hits go straight up, everything in between
scales smoothly. **And the speed is always exactly 5**, because for any angle
`dx² + dy² = (sin²+cos²)·5² = 5²`. (That's the Pythagorean identity — direction changes,
speed never does.) This is *the* mechanic that makes the game controllable: you steer the
ball with paddle position.

### E.4 Which side of a brick did we hit? (the overlap test)

When the ball overlaps a brick, the game decides "did I hit a vertical side or the
top/bottom?" by measuring how deep the overlap is on each axis. The smaller overlap is the
face you came through.

Imagine the ball (20×20) overlapping a brick. From `getBoundingClientRect`:

```
ballRect:  left=100 right=120 top=300 bottom=320
brickRect: left=110 right=195 top=290 bottom=320
```

```js
overlapX = Math.min(ballRect.right - brickRect.left,   // 120 - 110 = 10
                    brickRect.right - ballRect.left);  // 195 - 100 = 95  → min = 10
overlapY = Math.min(ballRect.bottom - brickRect.top,   // 320 - 290 = 30
                    brickRect.bottom - ballRect.top);  // 320 - 300 = 20  → min = 20
```

`overlapX (10) < overlapY (20)`, so the ball entered from the **side** → flip `dx`. If it
had been the other way, it would flip `dy` (hit the top or bottom). After flipping, the
code nudges the ball back out (`b.x += b.dx`) so it doesn't get stuck inside the brick.
This is what makes bounces look correct instead of random.

### E.5 The countdown timer doing delta-time accounting

Frames don't arrive exactly every 16.67ms — sometimes 15, sometimes 20, sometimes a big
gap if you switch tabs. So the timer counts **real milliseconds**, not frames.

```js
let dt = Math.min(timestamp - lastFrameTime, 50);  // ms since last frame, capped at 50
lastFrameTime = timestamp;
timerAccum += dt;
if (timerAccum >= 1000) { timerAccum -= 1000; timeLeft = Math.max(0, timeLeft - 1); }
```

Suppose `timestamp` is 1000, 1017, 1033, ... Each frame `dt ≈ 16-17ms` gets added to
`timerAccum`. After ~60 frames `timerAccum` reaches ~1000, so we subtract 1000 and tick
`timeLeft` down by 1 second. The leftover (e.g. the extra 3ms) stays in `timerAccum` so no
time is lost — it's exact over the long run.

**Why `Math.min(dt, 50)`?** If you alt-tab for 5 seconds, rAF pauses, and the next
`timestamp` is 5000ms later. Without the cap, `dt` would be 5000 and the timer would
instantly lose 5 seconds (unfair). Capping `dt` at 50ms means a long freeze costs you at
most a sliver of time. This is a standard "spiral of death" guard in game loops.

### E.6 Multi-ball: spawning 2 extra balls at the right speed

You have one ball with `dx = 2, dy = -4` (`ballSpeed = 5`). The power-up adds two balls,
nudged by `-0.5` and `+0.5` × speed:

```js
[-0.5, 0.5].forEach(offset => {
    let ndx = b.dx + offset * ballSpeed;   // e.g. 2 + (-2.5) = -0.5  ... or 2 + 2.5 = 4.5
    let ndy = b.dy;                        // -4
    let mag = Math.sqrt(ndx*ndx + ndy*ndy);// length of that velocity
    balls.push(spawnBall(b.x, b.y, (ndx/mag)*5, (ndy/mag)*5));  // rescaled to speed 5
});
```

For the first new ball: `ndx = -0.5, ndy = -4`, `mag = √(0.25 + 16) = √16.25 ≈ 4.03`.
Then `dx = (-0.5/4.03)*5 ≈ -0.62`, `dy = (-4/4.03)*5 ≈ -4.96`. Check the speed:
`√(0.62² + 4.96²) ≈ √(0.38+24.6) ≈ √25 = 5`. ✅ The **direction** changed (fanned out)
but the **speed is still exactly 5**. Dividing by `mag` then multiplying by `ballSpeed`
is called **normalizing** a vector — turning it into a pure direction of fixed length.

---

## PART F — Two patterns worth understanding deeply

### F.1 The IIFE in `background.js` (private scope)

```js
(function () {
   const canvas = ...;
   const particles = [...];
   function loop() { ... }
   loop();
})();
```

Remember Part A.3: top-level variables become global and must be unique. But the
background has its own `canvas`, `loop`, `particles` that would clash with nothing... yet
the author wisely **sealed them off**. The pattern `(function(){ ... })()` does two things:

1. `function(){ ... }` defines a function.
2. The final `()` **immediately calls it.**

Variables declared inside a function are *local* to that function — invisible outside. So
`particles`, `loop`, etc. live and die inside this bubble and never pollute the global
space the game scripts share. This is the **IIFE** (Immediately Invoked Function
Expression). It's the old-school way to make a private module without `import`/`export`.

### F.2 "Collect, then delete" — never mutate a list you're looping

You'll see this twice (power-ups and dead balls):

```js
let removedPowerups = [];
for (let p of powerups) {
    ...
    if (gone) removedPowerups.push(p);     // mark for removal, DON'T remove yet
}
removedPowerups.forEach(p => p.el.remove());                 // now remove from page
powerups = powerups.filter(p => !removedPowerups.includes(p)); // and from the array
```

Why not just delete inside the loop? Removing an item from an array while a `for...of` is
walking it shifts all the later items and the loop **skips one or crashes**. The safe
pattern is: during the loop, just *record* what to delete; after the loop ends, do the
deletions. The `filter` line rebuilds `powerups` keeping only the ones that were *not*
marked.

---

## PART G — The brick grid, from data to pixels

Let's trace level 1 turning into on-screen bricks.

### G.1 The data

```js
LEVELS[0] = [
  [0,0,0,1,1,0,0,0],   // row 0
  [0,0,1,1,1,1,0,0],   // row 1
  [0,1,1,1,1,1,1,0],   // row 2
  [0,0,0,0,0,0,0,0],   // row 3
  [0,0,0,0,0,0,0,0],   // row 4
  [0,0,0,0,0,0,0,0],   // row 5
];
LEVEL_COLORS[0] = ["red", "yellow"];
```

### G.2 The builder loop

```js
for (let r = 0; r < 6; r++) {              // each row
    let row = document.createElement("div");
    row.className = "brick-row";
    for (let i = 0; i < 8; i++) {           // each column
        let el = document.createElement("div");
        el.className = layout[r][i]
            ? `brick ${r % 2 ? colors[1] : colors[0]}`
            : "brick-gap";
        row.appendChild(el);
    }
    bricksContainer.appendChild(row);
}
```

Trace row 1 (`r = 1`, data `[0,0,1,1,1,1,0,0]`). `r % 2` = `1 % 2` = 1 (odd) → use
`colors[1]` = `"yellow"`:

| i | layout[1][i] | class assigned |
|---|---|---|
| 0 | 0 | `brick-gap` (invisible spacer) |
| 1 | 0 | `brick-gap` |
| 2 | 1 | `brick yellow` |
| 3 | 1 | `brick yellow` |
| 4 | 1 | `brick yellow` |
| 5 | 1 | `brick yellow` |
| 6 | 0 | `brick-gap` |
| 7 | 0 | `brick-gap` |

Row 2 (`r=2`, even, `r%2 = 0`) would use `colors[0]` = `"red"`. So even rows are red, odd
rows yellow — alternating stripes. The `brick-gap` divs are the same size as bricks but
`visibility: hidden`, so the visible bricks stay perfectly aligned in their columns even
where there are holes.

### G.3 From class name to appearance

The class `brick yellow` pulls in two CSS rules:

```css
.brick  { width: 85px; height: 30px; border-radius: 4px; ... }
.yellow { background: linear-gradient(to bottom, #ffdd00, #997700);
          box-shadow: 0 0 8px rgba(255,221,0,0.6); }   /* the glow */
```

So `.brick` gives the size/shape, `.yellow` gives the color + glow. The JS never sets
colors directly — it just assigns class names and lets CSS do the painting. Clean
separation.

### G.4 "Breaking" a brick

When the ball hits it: `brick.style.visibility = "hidden"`. The brick isn't deleted — it
becomes invisible but still occupies its grid slot. Future collision checks skip it
(`if (brick.style.visibility === "hidden") continue;`). Level-clear is detected when
`bricks.every(x => x.style.visibility === "hidden")` — i.e. *all* bricks invisible.

---

## PART H — Audio and the autoplay rules, in depth

Browsers **block sound from playing on page load** to stop annoying auto-playing ads. A
sound can only start *after* the user has interacted with the page (clicked or typed) at
least once. The game works around this in two layers:

**Layer 1 — music starts muted.** A *muted* sound is allowed to autoplay (it makes no
noise, so it's not annoying):

```js
theme.muted = true;
theme.play().catch(() => { /* ignore if even this is blocked */ });
```

`.play()` returns a **Promise** — an object representing an operation that finishes later
and can succeed or fail. `.catch(fn)` runs `fn` if it fails, swallowing the error quietly
instead of crashing.

**Layer 2 — unmute on first interaction.**

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

The first time the user clicks or presses a key *anywhere*, `activateAudio` runs, unmutes
the music, and then **removes its own listeners** so it can never run again. That
self-removal is important — you only need to unlock audio once.

Sound effects use `sound.currentTime = 0; sound.play();`. Setting `currentTime = 0`
rewinds the clip to the start so that rapid repeats (lots of bricks breaking quickly) each
play fully instead of being ignored because the previous play hadn't finished.

---

## PART I — A complete play-through, traced end to end

Putting every part together, here's exactly what happens, in order, from opening the file
to winning:

1. **Browser parses `index.html`**, builds the DOM tree, applies `style.css`. The menu is
   visible; HUD and game box have the `hidden` class.
2. **Scripts run top to bottom.** `background.js` (IIFE) starts its particle rAF loop —
   the background is now animating. `sounds.js` queues muted music and registers the
   audio-unlock listeners. `constants.js` caches all DOM elements into `dom`. `state.js`
   sets initial values. `events.js` registers every click/key handler. JavaScript now
   goes idle, waiting for events.
3. **You click anywhere** → `activateAudio` fires once, music unmutes.
4. **You click START** → its handler hides the menu, shows the HUD + game box, calls
   `init()`. `init()` zeroes score/lives/level then calls `initLevel()`.
5. **`initLevel()`** wipes the game box, reads `LEVELS[0]`, builds 6 rows of brick/gap
   divs, creates the paddle, sets `ballSpeed = 5 + floor(0/2) = 5`, calls `attachBall()`
   (ball sits centered on the paddle, `ballAttached = true`), sets `gameRunning = true`,
   and fires `requestAnimationFrame(gameLoop)`.
6. **`gameLoop` runs ~60×/sec.** While `ballAttached` is true: timer is frozen, and Left/
   Right slide the paddle with the ball riding along.
7. **You press Space** → `ballAttached = false`. Now the timer counts down, the ball moves
   (`y += dy`), bounces off walls/ceiling, and on brick contact: brick hides, `score +=
   10`, HUD updates, maybe a power-up drops, `boom` plays, and a smart bounce flips `dx`
   or `dy`.
8. **Catch a power-up** → `applyPowerup`. Multi-ball spawns 2 more balls (speed-normalized)
   and turns the paddle blue. Fireball sets `throughBall = true` for ~360 frames, ball &
   paddle glow orange, ball smashes through bricks without bouncing.
9. **Ball falls past the bottom** (or timer hits 0) → `loseBall()`: `lives--`, paddle
   shrinks by 60px, ball re-attaches. Multi-ball is forgiving — you only lose a life when
   the *last* ball is gone.
10. **Clear all bricks** → `level++`, `win` plays, `initLevel()` builds the next layout.
    Score & lives carry over; ball speed rises by 1 every 2 levels.
11. **Clear level 10** → `gameRunning = false`, the **YOU WIN!** overlay appears with the
    final score. **Run out of lives** → the **GAME OVER** overlay.
12. **Pause/Esc** stops the loop (`gameRunning = false`); **Resume** restarts it;
    **Play Again** calls `reset()` back to the menu, and the cycle can begin again.

That is the whole game, every detail, from the browser parsing the file to the win
screen. Nothing happens that isn't one of: an **event** firing a handler, or the **rAF
loop** advancing the world by one frame.
