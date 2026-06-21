# Brick Breaker — Function Reference

Every function in the project, what it does, how it works, and when it runs.
Listed file by file, in the order the files load.

---

## background.js

### `resize()`
**When it runs:** once at startup, and every time the browser window is resized.
**What it does:** makes the background canvas exactly fill the window.
**How it works:**
- Sets `canvas.width = window.innerWidth` and `canvas.height = window.innerHeight`.
- Without this, the canvas would have a default tiny size and the particles would look
  stretched. It's wired up with `window.addEventListener('resize', resize)` so the
  background always matches the window.
**Returns:** nothing.

### `loop()`  *(the background animation loop)*
**When it runs:** continuously, ~60 times per second, forever (started once at the bottom
of the file, then it re-schedules itself).
**What it does:** draws and moves the 90 floating neon particles.
**How it works, step by step:**
1. Paints a **barely transparent** dark rectangle over the whole canvas. This doesn't
   fully erase the previous frame — old particle positions fade slowly, creating the soft
   comet/trail effect.
2. Loops over every particle and draws it as a small glowing circle (using its color,
   transparency, and a shadow blur for the glow).
3. Moves each particle by its velocity (`p.x += p.dx; p.y += p.dy`). All particles drift
   slowly upward.
4. If a particle floats off the top, it's recycled to the bottom at a new random x. If it
   drifts off a side, it wraps to the other side.
5. Calls `requestAnimationFrame(loop)` to run itself again on the next frame.
**Returns:** nothing. This function never "finishes" — it loops for the life of the page.

> Both of the above live inside an IIFE `(function(){ ... })()`, so they're private to the
> background and don't interfere with the game's functions.

---

## constants.js

### `$(s)`
**When it runs:** whenever you call it (used immediately to build the `dom` object).
**What it does:** a shortcut for finding one element on the page.
**How it works:** it's a one-line wrapper around the built-in `document.querySelector`.
You pass a CSS selector string like `"#hud"` or `".start-button"`, and it returns the
first matching element.
**Returns:** the found element (or `null` if nothing matches).
**Example:** `$("#pause-btn")` → the pause button element.

---

## sounds.js

### `activateAudio()`
**When it runs:** exactly **once**, on the user's first click or keypress anywhere on the
page.
**What it does:** turns the background music on (browsers won't let sound play until the
user interacts with the page).
**How it works:**
1. Unmutes the theme music (`theme.muted = false`) and plays it.
2. Removes its own `click` and `keydown` listeners so it can never run a second time.
**Returns:** nothing.
**Why it exists:** the music is loaded muted and "played" on page load so it's ready, but
it stays silent until this function unlocks real sound after the first interaction.

---

## collision.js

### `aabb(a, b)`
**When it runs:** many times per frame — every time the game checks if two things are
touching (ball↔brick, ball↔paddle, power-up↔paddle).
**What it does:** answers one question — *do these two rectangles overlap?*
**How it works:** `a` and `b` are rectangles with `left/right/top/bottom`. It returns
`true` only if they overlap on **both** axes at once:
- horizontally: `a.right > b.left` AND `a.left < b.right`
- vertically: `a.bottom > b.top` AND `a.top < b.bottom`

If any one of those four checks fails, there's a gap between them and they don't touch.
**Returns:** `true` (overlapping) or `false` (not touching).
**Name:** AABB = "Axis-Aligned Bounding Box," the standard rectangle-collision test.

---

## ball.js

### `spawnBall(x, y, dx, dy)`
**When it runs:** every time a new ball needs to appear — at launch, and when multi-ball
adds extra balls.
**What it does:** creates one ball on screen and returns a ball object to track it.
**How it works:**
1. Creates a new `<div>` and gives it the class `ball` (and `fire` too, if a fireball is
   currently active, so it glows orange).
2. Adds it into the game box.
3. Positions it at `(x, y)` using a CSS transform.
4. Returns an object `{ el, x, y, dx, dy }` — the element plus its position and velocity —
   which gets stored in the `balls` array.
**Inputs:** `x, y` = starting position; `dx, dy` = starting velocity (pixels per frame).
**Returns:** the ball object.

### `attachBall()`
**When it runs:** at the start of every level, and after losing a life — i.e. whenever the
ball needs to be reset onto the paddle, waiting for launch.
**What it does:** clears the field of balls/power-ups and places one fresh ball centered
on the paddle.
**How it works, step by step:**
1. Sets `ballAttached = true` (ball is "stuck" to the paddle until you press Space).
2. Removes any existing balls and power-ups from the screen and empties those arrays.
3. Turns off the fireball state.
4. Centers the paddle, sets its width (it may have shrunk from losing lives), and removes
   the fire/multi color classes so it looks normal again.
5. Calculates the position just above the paddle center and calls `spawnBall(...)` there,
   with velocity `(0, -ballSpeed)` so it's aimed straight up, ready for launch.
**Returns:** nothing.

---

## powerup.js

### `dropPowerup(brickRect)`
**When it runs:** every time a brick is destroyed.
**What it does:** *maybe* spawns a falling power-up where the brick was.
**How it works:**
1. 70% of the time it does nothing (`if (Math.random() > POWERUP_CHANCE) return;` — only a
   30% drop chance).
2. Otherwise it calculates a position centered on the destroyed brick, converting from
   the brick's on-screen position into coordinates inside the game box.
3. Randomly picks the type: 50% `"multi"` (lightning), 50% `"fire"` (flame).
4. Creates a `<div>` with the power-up's class and SVG icon, places it, and pushes it into
   the `powerups` array so the game loop can make it fall.
**Inputs:** `brickRect` = the destroyed brick's rectangle (from `getBoundingClientRect`).
**Returns:** nothing.

### `applyPowerup(type)`
**When it runs:** when the paddle catches a falling power-up.
**What it does:** activates the caught power-up's effect.
**How it works:**
- Plays the "eat" sound.
- If `type === "multi"`: takes the first ball and spawns **two extra balls** angled
  slightly left and right, each rescaled to the normal ball speed (so all balls move at
  the same speed, just in a fan). Turns the paddle blue.
- If `type === "fire"`: sets `throughBall = true` and starts a countdown
  (`throughTimer = POWERUP_DURATION`). While active the ball smashes through bricks
  without bouncing. Adds the orange glow to every ball and the paddle.
**Inputs:** `type` = `"multi"` or `"fire"`.
**Returns:** nothing.

---

## level.js

### `updateHUD()`
**When it runs:** whenever a displayed value changes — score gained, time ticked, level
changed, life lost.
**What it does:** refreshes the top bar text (LEVEL / SCORE / TIME / LIVES).
**How it works:** writes the current `level`, `score`, `timeLeft`, and `lives` into their
HUD elements. It also toggles the `timer-urgent` class on the timer when 10 seconds or
fewer remain, which makes the clock turn red and blink (via CSS).
**Returns:** nothing.

### `initLevel()`
**When it runs:** at the start of every level (called by `init()` for level 1, and again
each time you advance a level).
**What it does:** builds the current level from scratch and starts the game loop.
**How it works, step by step:**
1. Empties the game box and resets per-level state (balls, power-ups, fireball, timer).
2. Looks up this level's brick layout (`LEVELS[level-1]`) and colors. Sets `ballSpeed`,
   which increases by 1 every 2 levels.
3. Builds the bricks: loops over the 6×8 grid; each `1` becomes a colored brick `<div>`,
   each `0` becomes an invisible spacer. Even rows get one color, odd rows the other.
4. Collects all the visible bricks into the `bricks` array.
5. Creates the paddle and resets its width to full.
6. Calls `updateHUD()`, `attachBall()` (ball onto paddle), sets `gameRunning = true`, and
   starts the loop with `requestAnimationFrame(gameLoop)`.
**Returns:** nothing.
**Note:** it does **not** reset score/lives — those carry over between levels.

### `init()`
**When it runs:** when you click START GAME (a brand-new game).
**What it does:** starts a completely fresh game from level 1.
**How it works:** zeroes `score`, sets `lives = 3` and `level = 1`, then calls
`initLevel()` to build level 1.
**Returns:** nothing.
**Difference from `initLevel`:** `init` resets the whole game (score/lives/level);
`initLevel` only builds the current level.

### `reset()`
**When it runs:** when you click any "Play Again" / "Restart" button.
**What it does:** returns the game to the main menu and clears everything.
**How it works:** empties the game box, shows the menu again, hides the HUD and all
overlays (pause/win/gameover), empties the ball/power-up arrays, and resets all the state
variables (level back to 1, timer, etc.). `gameRunning` becomes false so the loop stops.
**Returns:** nothing.

---

## loop.js

### `gameLoop(timestamp)`  *(the main game engine)*
**When it runs:** ~60 times per second while the game is active. It re-schedules itself
each frame, and stops scheduling when paused or game over.
**What it does:** advances the entire game by one frame — timer, paddle, balls, bricks,
power-ups, win/lose checks. This is the heart of the game.
**How it works, in order each frame:**
1. **Guard:** if `gameRunning` is false, return immediately (this is how pause/stop work —
   the loop simply isn't re-scheduled).
2. **Countdown timer:** only while the ball is launched, it adds the real elapsed
   milliseconds and ticks `timeLeft` down once per full second. If time hits 0, it calls
   `loseBall()`.
3. **Paddle movement:** if Left/A is held, move the paddle left (clamped to the wall); if
   Right/D, move right. While the ball is still attached, it slides along with the paddle.
4. **Only if the ball is launched:**
   - Counts down the fireball timer; when it expires, removes the fire effect.
   - Makes each power-up fall; if one reaches the paddle it calls `applyPowerup`, if it
     falls off the bottom it's discarded.
   - For each ball: moves it, bounces it off the side walls and ceiling, removes it if it
     falls off the bottom. Then checks brick collisions (hide the brick, add 10 points,
     maybe drop a power-up, play a sound, and either bounce off it or — with fireball —
     pass through). If that was the last brick, it advances the level or shows the win
     screen. Then checks the paddle collision and computes the new bounce angle based on
     where the ball hit.
   - After moving all balls, removes any that died; if none are left, calls `loseBall()`.
5. **Re-schedule:** if still running, calls `requestAnimationFrame(gameLoop)` for the next
   frame.
**Inputs:** `timestamp` = current time in milliseconds (passed automatically by the
browser), used by the countdown timer.
**Returns:** nothing.

### `loseBall()`
**When it runs:** when all balls fall off the bottom, or the level timer hits zero.
**What it does:** costs the player a life and either ends the game or resets the ball.
**How it works:**
1. Plays the "lose" sound and decrements `lives`.
2. If `lives` is now 0 or less: plays the game-over sound, shows the GAME OVER overlay
   with the final score, sets `gameRunning = false`, and stops.
3. Otherwise: shrinks the paddle by 60px (down to a minimum of 60) as a penalty, updates
   the HUD, and calls `attachBall()` to put a fresh ball back on the paddle.
**Returns:** nothing.

---

## events.js

These connect user actions to the functions above. The named helpers:

### `syncMusicBtns()`
**When it runs:** after the music is toggled on/off.
**What it does:** updates the look of the music buttons to match the music's state.
**How it works:** for each music button, adds or removes the dimmed `audio-off` class
depending on whether the music is currently paused.
**Returns:** nothing.

### `syncEffectBtns()`
**When it runs:** after sound effects are toggled.
**What it does:** updates the look of the SFX buttons to match the muted state.
**How it works:** for each effects button, adds/removes the `audio-off` class depending on
whether the sound effects are muted.
**Returns:** nothing.

### Event handlers (anonymous functions attached with `addEventListener`)
These aren't named functions but they're the "functions" that run on each input:

| Trigger | What its handler does |
|---|---|
| **Click START** | Plays a sound, hides the menu, shows the HUD + game, calls `init()`. |
| **Click a music button** | Plays or pauses the theme music, then `syncMusicBtns()`. |
| **Click an SFX button** | Mutes/unmutes all sound effects, then `syncEffectBtns()`. |
| **Key down** | Records the key as "held" in `keys`; if it's Space and the ball is attached, launches the ball (`ballAttached = false`). Blocks arrows/space from scrolling the page. |
| **Key up** | Records the key as "released" in `keys`. |
| **Click Pause button** | Shows the pause overlay and stops the loop (`gameRunning = false`). |
| **Press Escape** | Toggles pause: if running, pause and show the overlay; if paused, hide the overlay and restart the loop. |
| **Click Resume** | Hides the pause overlay, sets `gameRunning = true`, restarts the loop. |
| **Click Restart / Play Again** | Calls `reset()` to go back to the menu. |

---

## Quick map: which functions call which

```
START clicked
  └─ init()
       └─ initLevel()
            ├─ updateHUD()
            ├─ attachBall()
            │    └─ spawnBall()
            └─ requestAnimationFrame(gameLoop)

gameLoop()  (every frame)
  ├─ updateHUD()           (on score/time change)
  ├─ aabb()                (collision checks)
  ├─ dropPowerup()         (on brick break)
  ├─ applyPowerup()        (on catch)
  │    └─ spawnBall()      (multi-ball)
  ├─ initLevel()           (on level clear)
  ├─ loseBall()            (ball lost / time out)
  │    └─ attachBall()
  └─ requestAnimationFrame(gameLoop)   (next frame)

Play Again / Restart clicked
  └─ reset()
```
