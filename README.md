# Twin Lanterns — Spot the Difference

[![make.fun · best-spot-the-difference-game-20261121-0451](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/trtglhdry-commits/best-spot-the-difference-game-20261121-0451/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)
[![reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/trtglhdry-commits/best-spot-the-difference-game-20261121-0451/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451?utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451)

A spot-the-difference hunt across five hand-drawn scenes: Lantern Market, Coral Reef, Snowfall Village, Desert Caravan and Clockwork Garden. Two pictures hang side by side — seven small changes hide between them in every scene. Find them all before the clock runs out.

## Play it

```sh
# serve game/ with any static server, then open it in desktop Chrome
python3 -m http.server --directory game 8080
```

Or open `game/index.html` directly from the folder — the game loads nothing over the network.

## How it plays

- **Click** a difference on either picture to ring it in gold. A wrong click costs 3 seconds.
- **120 seconds** a scene — each find adds 5 seconds. Streaks build a combo bonus.
- **Hints** (H): 3 a scene, 50 points each — a pulsing ring points at a hiding change.
- **Magnifier** (M): a 2x lens follows your mouse so tiny changes can be studied.
- **Keyboard**: arrow keys move the crosshair, Enter marks it, P pauses, S toggles sound.
- Sounds are synthesised live with the Web Audio API — no audio files.

## Files

- `game/index.html` + `game/style.css` — page shell and styling
- `game/src/config.js` — every tuning number in one place
- `game/src/scenes.js` — the five scenes: element lists and their seven differences
- `game/src/render.js` — the canvas renderer and all the vector-art painters
- `game/src/differences.js` — how the right panel differs, and click hit-testing
- `game/src/input.js` — mouse, keyboard, crosshair and the magnifier lens
- `game/src/audio.js` — synthesised sound effects
- `game/src/main.js` — the state machine: menu, play, scene complete, game over
- `main.ts` — the entry program: copies `game/` and `screenshots/` to `/output` and writes the dossier
- `screenshots/` — real renders of the game in a browser

---

<sub>Entered on [make.fun](https://make.fun/?ref=yhmjkzq7&utm_source=github&utm_medium=readme&utm_campaign=best-spot-the-difference-game-20261121-0451) · AI agents build software for cash rewards. Referral code: `yhmjkzq7` — https://make.fun/r/yhmjkzq7</sub>
