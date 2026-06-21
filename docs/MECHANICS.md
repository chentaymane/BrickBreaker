# Brick Breaker — Game Mechanics & Calculations

This document explains **how the game actually moves and breaks things in code**: the
ball, the paddle, bouncing, brick destruction, power-ups — and every calculation behind
them, with real numbers worked out.

All the code referenced here lives in `script/game/loop.js` (the main loop),
`script/game/ball.js`, `script/game/collision.js`, and `script/game/powerup.js`.

---

## 0. The core idea: position + velocity, 60 times a second

Every moving thing is tracked by two pairs of numbers:

- **Position** `(x, y)` — where it is, in pixels from the **top-left** of the game box.
- **Velocity** `(dx, dy)` — how far it moves each frame. `d` means "delta" (change).

The game runs a function called `gameLoop` about **60 times per second**. Each run is one
"frame." Every frame, the rule is always the same:

```
new position = old position + velocity
```

Do that 60 times a second and the eye sees smooth motion, like a flipbook.

### ⚠️ The screen is upside-down compared to math class

```
(0,0) ───────────────►  X gets BIGGER going right
  │
  │
  ▼
  Y gets BIGGER going DOWN
```

So **moving up means a NEGATIVE y velocity.** When the ball flies up, `dy` is negative
(like `-5`). When it falls, `dy` is positive. Keep this in mind for everything below.

### The play area size

The game box is 900 × 600 with a 4px border, so the usable inside is:

```js
CONTENT_WIDTH  = 900 - 4*2 = 892
CONTENT_HEIGHT = 600 - 4*2 = 592
BALL_SIZE      = 20
```

- A ball at `x = 0` touches the **left** wall.
- A ball at `x = 892 - 20 = 872` touches the **right** wall.
- A ball at `y = 0` touches the **ceiling**.
- A ball at `y = 592 - 20 = 572` reaches the **bottom** (and dies).

---

## 1. How the ball moves

A ball is an object: `{ el, x, y, dx, dy }` where `el` is its `<div>` on screen.

The actual movement is just **two additions** inside `gameLoop`:

```js
b.x += b.dx;   // move horizontally
b.y += b.dy;   // move vertically
```

Then the new numbers are drawn to the screen:

```js
b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
```

`transform: translate(...)` is what physically repositions the `<div>`. So each frame:
**change the numbers, then redraw.**

### Worked example — ball flying up-right

Start: `x = 400, y = 500, dx = 3, dy = -5`.

| Frame | x | y | what you see |
|---|---|---|---|
| 0 | 400 | 500 | start |
| 1 | 403 | 495 | moved 3px right, 5px up |
| 2 | 406 | 490 | |
| 3 | 409 | 485 | |
| 4 | 412 | 480 | climbing to the upper-right |

Speed in pixels/second = velocity × 60. So `dy = -5` means **300 px/second upward**.

### Why the ball waits before launch

At the start of a level the ball sits on the paddle with `ballAttached = true`. The entire
movement block is wrapped in:

```js
if (!ballAttached) {
    // ... all ball movement happens here ...
}
```

So while attached, the `b.x += b.dx` lines never run — the ball is frozen on the paddle.
Pressing **Space** sets `ballAttached = false` (in `events.js`), which switches the
movement on.

---

## 2. How the ball bounces off walls

A bounce is simply **flipping the sign of a velocity**. Nothing more.

```js
if (b.x <= 0 || b.x >= CONTENT_WIDTH - BALL_SIZE) b.dx = -b.dx;  // left & right walls
if (b.y <= 0) b.dy = -b.dy;                                       // ceiling
```

- Hit a **side wall** → reverse horizontal direction: `dx = -dx`.
- Hit the **ceiling** → reverse vertical direction: `dy = -dy`.

The ball keeps the exact same speed — it just goes the opposite way.

### Worked example — bouncing off the right wall

Ball moving right: `dx = +4`, near the right edge at `x = 870`. Right wall is at
`892 - 20 = 872`.

| Frame | x before | x after `+= dx` | `x >= 872`? | dx after | result |
|---|---|---|---|---|---|
| 1 | 866 | 870 | no | +4 | still going right |
| 2 | 870 | 874 | **yes** | **-4** | sign flipped! |
| 3 | 874 | 870 | no | -4 | now moving left |
| 4 | 870 | 866 | no | -4 | heading back into the box |

When `x` passes 872, the condition fires, `dx` flips from `+4` to `-4`, and the ball
heads back. **That sign-flip is the bounce.**

---

## 3. How the ball dies (falls off the bottom)

The bottom is **not** a wall — it's where you lose. Instead of bouncing, the ball is
marked dead:

```js
if (b.y >= CONTENT_HEIGHT - BALL_SIZE) {   // y >= 572
    deadBalls.push(b);   // mark for removal
    continue;            // skip the rest of the checks for this ball
}
```

After all balls are processed, the dead ones are removed:

```js
deadBalls.forEach((b) => { b.el.remove(); balls = balls.filter((x) => x !== b); });
if (balls.length === 0) loseBall();   // only lose a life when ALL balls are gone
```

With multi-ball you can have 3 balls; you only lose a life when the **last** one falls.

---

## 4. How the paddle moves

The paddle uses a "keys held down" system. In `events.js`, key events just **record**
which keys are currently pressed:

```js
document.addEventListener("keydown", e => { keys[e.key] = true;  });
document.addEventListener("keyup",   e => { keys[e.key] = false; });
```

Then `gameLoop` **reads** that record every frame and moves the paddle:

```js
if ((keys["ArrowLeft"] || keys["a"]) && paddle) {
    paddleX = Math.max(0, paddleX - PADDLE_SPEED);             // move left 10px, stop at wall
    paddle.style.transform = `translateX(${paddleX}px)`;
}
if ((keys["ArrowRight"] || keys["d"]) && paddle) {
    paddleX = Math.min(CONTENT_WIDTH - paddleWidth, paddleX + PADDLE_SPEED);  // right 10px
    paddle.style.transform = `translateX(${paddleX}px)`;
}
```

`PADDLE_SPEED = 10`, so each frame the paddle shifts 10px while a key is held.

### The clamps (so the paddle can't leave the box)

- **Left limit:** `Math.max(0, paddleX - 10)` — never lets `paddleX` go below 0.
- **Right limit:** `Math.min(CONTENT_WIDTH - paddleWidth, paddleX + 10)` — never lets the
  paddle's right edge pass the right wall.

  Example: with `paddleWidth = 250`, the furthest right `paddleX` can be is
  `892 - 250 = 642`.

### Why holding the key glides smoothly

The keys are read **every frame**, not once per press. Hold Right and the paddle moves 10px
× 60 frames = **600 px/second**, continuously, until you let go.

### The ball rides the paddle before launch

While the ball is still attached, the same movement blocks also drag the ball so you can
aim it:

```js
if (ballAttached && balls[0]) {
    balls[0].x = paddleX + paddleWidth / 2 - BALL_SIZE / 2;   // keep ball centered on paddle
    balls[0].el.style.transform = `translate(${balls[0].x}px, ${balls[0].y}px)`;
}
```

`paddleX + paddleWidth/2` is the paddle's center; subtracting `BALL_SIZE/2` centers the
20px ball on it.

---

## 5. How the ball bounces off the paddle (the aiming math)

This is the most important calculation in the game. **Where** you hit the paddle decides
**which direction** the ball flies. That's how you steer it.

```js
if (aabb(ballRect, paddleRect)) {                               // ball touches paddle?
    let hitOffset = b.x + BALL_SIZE/2 - (paddleX + paddleWidth/2);  // distance from center
    let angle = (hitOffset / (paddleWidth/2)) * (Math.PI/4);        // → an angle (±45°)
    b.dx = Math.sin(angle) * ballSpeed;
    b.dy = -Math.cos(angle) * ballSpeed;
    b.y = CONTENT_HEIGHT - 20 - PADDLE_HEIGHT - BALL_SIZE;          // sit on top of paddle
}
```

Step by step:

1. **`hitOffset`** = how far the ball's center is from the paddle's center.
   - Negative = hit the left half. Zero = dead center. Positive = right half.
2. **Divide by `paddleWidth/2`** → gives a ratio from **−1** (far left) to **+1** (far
   right).
3. **Multiply by `Math.PI/4`** (which is 45° in radians) → an angle from **−45° to +45°**.
4. **Convert angle back into velocity:**
   - `dx = sin(angle) × ballSpeed` — sideways speed.
   - `dy = -cos(angle) × ballSpeed` — the minus sign makes it go **up**.

### Worked examples (paddle center at x = 446, paddleWidth = 250, ballSpeed = 5)

**Hit dead center** — ball center at 446:
```
hitOffset = 446 - 446 = 0
ratio     = 0 / 125 = 0
angle     = 0 × 45° = 0°
dx = sin(0°)  × 5 =  0
dy = -cos(0°) × 5 = -5     →  straight up
```

**Hit the far right edge** — ball center at 571:
```
hitOffset = 571 - 446 = 125
ratio     = 125 / 125 = 1
angle     = 1 × 45° = 45°
dx = sin(45°)  × 5 = +3.54   →  moving right
dy = -cos(45°) × 5 = -3.54   →  moving up
```

**Hit the far left edge** — ball center at 321:
```
hitOffset = 321 - 446 = -125
ratio     = -1
angle     = -45°
dx = sin(-45°)  × 5 = -3.54   →  moving left
dy = -cos(-45°) × 5 = -3.54   →  moving up
```

### The speed never changes — only the direction

For ANY angle, total speed = `√(dx² + dy²) = √((sin·5)² + (cos·5)²) = 5 × √(sin²+cos²) = 5`.

(`sin² + cos² = 1` is the Pythagorean identity.) So the ball is always the same speed —
you only change **where** it goes, never how fast. This is what makes the controls feel
fair and predictable.

---

## 6. How a brick breaks

Every frame, each ball is tested against every brick. Here's the brick-breaking code:

```js
for (let brick of bricks) {
    if (brick.style.visibility === "hidden") continue;   // already broken → skip it
    let brickRect = brick.getBoundingClientRect();
    if (!aabb(ballRect, brickRect)) continue;            // not touching → skip it

    brick.style.visibility = "hidden";   // ←★ THIS is "breaking" the brick
    score += 10;                          // +10 points
    updateHUD();
    dropPowerup(brickRect);               // maybe spawn a falling power-up
    boom.currentTime = 0; boom.play();    // break sound
    ...
}
```

The key idea: **a brick is never deleted, just hidden.** `visibility = "hidden"` makes it
invisible, and the `continue` at the top means future frames skip hidden bricks. The brick
keeps its slot, so the grid stays aligned.

Each break gives **+10 points** and a 30% chance to drop a power-up (see §8).

---

## 7. Which side of the brick was hit? (the bounce calculation)

After hiding the brick, a normal ball must bounce. But should it flip horizontally or
vertically? The game figures this out by measuring **how deeply the ball overlaps the
brick on each axis.** The smaller overlap is the side it came through.

```js
if (!throughBall && !bounced) {
    let overlapX = Math.min(ballRect.right - brickRect.left, brickRect.right - ballRect.left);
    let overlapY = Math.min(ballRect.bottom - brickRect.top, brickRect.bottom - ballRect.top);
    if (overlapX < overlapY) { b.dx = -b.dx; b.x += b.dx; }   // hit a SIDE → flip horizontal
    else                     { b.dy = -b.dy; b.y += b.dy; }   // hit TOP/BOTTOM → flip vertical
    bounced = true;
    break;   // a normal ball bounces off only ONE brick per frame
}
```

### Worked example

Ball (20×20) overlapping a brick. From `getBoundingClientRect()`:

```
ballRect:  left=100  right=120  top=300  bottom=320
brickRect: left=110  right=195  top=290  bottom=320
```

```
overlapX = min(120-110, 195-100) = min(10, 95) = 10
overlapY = min(320-290, 320-300) = min(30, 20) = 20
```

`overlapX (10) < overlapY (20)` → the ball entered from the **side** → flip `dx`.

After flipping, `b.x += b.dx` nudges the ball back out of the brick so it doesn't get
stuck inside. The `break` stops checking more bricks this frame.

### Fireball skips all of this

If the fireball power-up is active (`throughBall === true`), this whole bounce block is
skipped. The ball does **not** bounce — it keeps going and can smash several bricks in a
single frame.

---

## 8. How power-ups drop and get caught

### Dropping (when a brick breaks) — `dropPowerup`

```js
function dropPowerup(brickRect) {
    if (Math.random() > POWERUP_CHANCE) return;   // 0.3 → only 30% of bricks drop one
    ...
    let type = Math.random() < 0.5 ? "multi" : "fire";   // 50/50 which kind
    ...
    powerups.push({ el, x: px, y: py, type });
}
```

- `Math.random()` returns a decimal from 0 up to 1. `> 0.3` is true ~70% of the time, so
  it returns early and drops nothing 70% of the time → a **30% drop rate**.
- A second coin-flip picks `multi` or `fire`.

### Falling and catching (every frame) — inside `gameLoop`

```js
for (let p of powerups) {
    p.y += POWERUP_SPEED;                                 // fall 2px per frame
    p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
    if (p.y > CONTENT_HEIGHT) {
        removedPowerups.push(p);                          // fell off the bottom → gone
    } else if (aabb(p.el.getBoundingClientRect(), paddleRect)) {
        applyPowerup(p.type);                             // caught by paddle!
        removedPowerups.push(p);
    }
}
```

Power-ups fall at `POWERUP_SPEED = 2` px/frame. If one touches the paddle (`aabb` true),
`applyPowerup` runs its effect. If it slips past the bottom, it's just discarded.

---

## 9. Power-up effects — `applyPowerup`

### Multi-Ball — the velocity calculation

```js
if (type === "multi") {
    let b = balls[0];
    [-0.5, 0.5].forEach((offset) => {
        let ndx = b.dx + offset * ballSpeed;      // nudge sideways
        let ndy = b.dy;
        let mag = Math.sqrt(ndx*ndx + ndy*ndy) || 1;
        balls.push(spawnBall(b.x, b.y, (ndx/mag)*ballSpeed, (ndy/mag)*ballSpeed));
    });
}
```

Two extra balls are spawned, fanned slightly left and right, but each is **rescaled to the
normal speed.**

**Worked example** — original ball `dx = 2, dy = -4`, `ballSpeed = 5`. Take the `-0.5`
offset:

```
ndx = 2 + (-0.5 × 5) = 2 - 2.5 = -0.5
ndy = -4
mag = √((-0.5)² + (-4)²) = √(0.25 + 16) = √16.25 ≈ 4.03

new dx = (-0.5 / 4.03) × 5 ≈ -0.62
new dy = ( -4  / 4.03) × 5 ≈ -4.96

check speed: √(0.62² + 4.96²) = √(0.38 + 24.6) ≈ √25 = 5  ✅
```

So the **direction** changed (it fans out) but the **speed is still exactly 5**. Dividing
by `mag` then multiplying by `ballSpeed` is called **normalizing** — turning any velocity
into a pure direction of a fixed length. This keeps all balls moving at the same speed.

### Fireball

```js
} else if (type === "fire") {
    throughBall = true;
    throughTimer = POWERUP_DURATION;   // 360 frames ≈ 6 seconds
    balls.forEach((b) => b.el.classList.add("fire"));
    ...
}
```

Sets a flag (`throughBall`) that makes the ball pass through bricks (see §7), and starts a
countdown of 360 frames (~6 seconds at 60fps). The countdown is ticked down each frame in
the loop; when it reaches 0, the fire effect is removed.

---

## 10. How a level is won

Right after a brick is hidden, the game checks if the board is clear:

```js
if (bricks.every((x) => x.style.visibility === "hidden")) {
    if (level < LEVELS.length) {        // not the last level
        level++;
        win.play();
        initLevel();                    // build the next layout
    } else {                            // that was level 10
        win.play();
        gameRunning = false;
        dom.winScore.textContent = `SCORE: ${score}`;
        dom.win.classList.remove("hidden");   // show YOU WIN!
    }
    return;
}
```

`bricks.every(...)` is true only when **all** bricks are hidden. Then it advances the
level (carrying over score and lives) or shows the win screen on level 10.

---

## 11. How you lose — `loseBall`

Triggered when all balls fall off the bottom **or** the level timer hits 0:

```js
function loseBall() {
    lose.currentTime = 0; lose.play();
    lives--;                                    // lose a life
    if (lives <= 0) {                           // no lives left → game over
        gameover.play();
        dom.gameoverScore.textContent = `SCORE: ${score}`;
        dom.gameover.classList.remove("hidden");
        gameRunning = false;
        return;
    }
    paddleWidth = Math.max(60, paddleWidth - 60);   // PENALTY: paddle shrinks 60px (min 60)
    updateHUD();
    attachBall();                               // put a fresh ball on the paddle
}
```

Each lost ball:
- subtracts a life,
- **shrinks the paddle by 60px** (down to a minimum of 60) — making the game harder,
- resets the ball onto the paddle.

At 0 lives → GAME OVER.

---

## 12. The countdown timer calculation

The timer counts **real milliseconds**, not frames, so it stays accurate even if the
frame rate stutters.

```js
let dt = Math.min(timestamp - lastFrameTime, 50);  // ms since last frame, capped at 50
lastFrameTime = timestamp;
timerAccum += dt;                                   // pile up the milliseconds
if (timerAccum >= 1000) {                           // a full second has passed
    timerAccum -= 1000;
    timeLeft = Math.max(0, timeLeft - 1);           // drop one second
    updateHUD();
    if (timeLeft <= 0) { ... loseBall(); }          // out of time → lose a ball
}
```

- `timestamp - lastFrameTime` = real milliseconds since the previous frame (~16-17ms).
- These pile up in `timerAccum`. Once it reaches 1000ms, one second is subtracted from the
  clock and the leftover is kept (so nothing is lost over time).
- **`Math.min(dt, 50)`** caps the gap: if you switch browser tabs for 5 seconds, the next
  frame's gap would be 5000ms and you'd instantly lose 5 seconds — unfair. Capping it at
  50ms means a long freeze costs you almost no time.
- The timer only runs while the ball is launched (`!ballAttached`), so you're not
  penalized while aiming.

---

## 13. Speed scaling per level

The ball gets faster every 2 levels:

```js
ballSpeed = SPEED + Math.floor((level - 1) / 2);   // SPEED = 5
```

| Level | `(level-1)/2` | `floor(...)` | ballSpeed |
|---|---|---|---|
| 1 | 0 | 0 | 5 |
| 2 | 0.5 | 0 | 5 |
| 3 | 1 | 1 | 6 |
| 4 | 1.5 | 1 | 6 |
| 5 | 2 | 2 | 7 |
| ... | | | ... |
| 9 | 4 | 4 | 9 |
| 10 | 4.5 | 4 | 9 |

`Math.floor` rounds down, so the speed bumps up by 1 every second level.

---

## Summary — the whole game in a nutshell

Every frame, `gameLoop` does this:

1. **Tick the timer** (real milliseconds → seconds).
2. **Move the paddle** from held keys (clamped to the walls).
3. **Move each ball:** `x += dx`, `y += dy`.
4. **Bounce off walls** by flipping `dx`/`dy` signs; **die** if it hits the bottom.
5. **Break bricks** it overlaps (hide them, +10 points), and bounce off using the
   smaller-overlap rule — unless fireball is active.
6. **Bounce off the paddle** using the hit-position angle math.
7. **Drop & catch power-ups.**
8. **Check win** (all bricks hidden) and **lose** (no balls left / time out).
9. **Redraw and request the next frame.**

That's the entire game: **add velocity to position, flip signs on contact, hide bricks
that get hit — 60 times a second.**
