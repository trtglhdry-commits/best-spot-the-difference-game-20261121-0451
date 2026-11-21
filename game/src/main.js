// Twin Lanterns — the game. Owns the state machine (menu, playing, scene
// done, game over), the timer, the score and combo, the found markers, the
// hint pulse and the overlays. Panels are rendered once per scene to
// offscreen canvases; each frame only blits them and draws the live marks.
import {
  PANEL_WIDTH,
  PANEL_HEIGHT,
  DIFFERENCES_PER_SCENE,
  SCENE_TIME_SECONDS,
  TIME_BONUS_PER_FIND,
  WRONG_CLICK_PENALTY_SECONDS,
  HINTS_PER_SCENE,
  HINT_COST_POINTS,
  HINT_SHOW_MS,
  POINTS_PER_FIND,
  COMBO_STEP,
  MAX_COMBO_BONUS,
  MISS_FLASH_MS,
  FOUND_RING_COLOR,
  MISS_COLOR,
  HINT_COLOR,
} from './config.js';
import { SCENES } from './scenes.js';
import { drawScene } from './render.js';
import { diffTargets, hitDifference } from './differences.js';
import { sfx } from './audio.js';
import { InputController } from './input.js';

const $ = (id) => document.getElementById(id);

const game = {
  screen: 'menu',
  sceneIndex: 0,
  found: new Set(),
  foundAt: new Map(),
  score: 0,
  combo: 0,
  bestCombo: 0,
  timeLeft: SCENE_TIME_SECONDS,
  hintsLeft: HINTS_PER_SCENE,
  totalFound: 0,
  totalMisses: 0,
  hint: null, // { diff, until }
  missFlash: null, // { side, x, y, until }
  paused: false,
  lastTickSecond: -1,
  sceneStartScore: 0,
  offLeft: document.createElement('canvas'),
  offRight: document.createElement('canvas'),
};

game.offLeft.width = PANEL_WIDTH;
game.offLeft.height = PANEL_HEIGHT;
game.offRight.width = PANEL_WIDTH;
game.offRight.height = PANEL_HEIGHT;

const scene = () => SCENES[game.sceneIndex];
const targets = () => diffTargets(scene());

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function renderPanels() {
  drawScene(game.offLeft, scene(), 'left');
  drawScene(game.offRight, scene(), 'right');
}

function drawMarkers(ctx, side) {
  const now = performance.now();
  const list = targets();
  for (const idx of game.found) {
    const t = list[idx];
    const x = side === 'left' ? t.lx : t.rx;
    const y = side === 'left' ? t.ly : t.ry;
    const born = game.foundAt.get(idx) ?? now;
    const age = Math.min(1, (now - born) / 260);
    const r = t.r * (0.6 + 0.4 * age);
    ctx.strokeStyle = FOUND_RING_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(x, y, r + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = FOUND_RING_COLOR;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#1d7a2e';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 9, y);
    ctx.lineTo(x - 2, y + 8);
    ctx.lineTo(x + 11, y - 8);
    ctx.stroke();
  }
  if (game.hint && now < game.hint.until) {
    const t = list[game.hint.diff];
    const x = side === 'left' ? t.lx : t.rx;
    const y = side === 'left' ? t.ly : t.ry;
    const pulse = 1 + 0.18 * Math.sin(now / 130);
    ctx.strokeStyle = HINT_COLOR;
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(x, y, t.r * pulse + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  if (game.missFlash && game.missFlash.side === side && now < game.missFlash.until) {
    const { x, y } = game.missFlash;
    const fade = 1 - (now - (game.missFlash.until - MISS_FLASH_MS)) / MISS_FLASH_MS;
    ctx.strokeStyle = `rgba(255,90,90,${Math.max(0, fade)})`;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.moveTo(x + 10, y - 10);
    ctx.lineTo(x - 10, y + 10);
    ctx.stroke();
  }
}

function blit() {
  const cl = $('panel-left').getContext('2d');
  const cr = $('panel-right').getContext('2d');
  cl.drawImage(game.offLeft, 0, 0);
  cr.drawImage(game.offRight, 0, 0);
  drawMarkers(cl, 'left');
  drawMarkers(cr, 'right');
}

function updateHud() {
  const remaining = DIFFERENCES_PER_SCENE - game.found.size;
  $('scene-name').textContent = `Scene ${game.sceneIndex + 1} of ${SCENES.length} — ${scene().name}`;
  $('scene-tag').textContent = scene().tagline;
  $('found-count').textContent = `${game.found.size} / ${DIFFERENCES_PER_SCENE} found`;
  $('left-count').textContent = `${remaining} LEFT`;
  $('score').textContent = String(game.score);
  $('combo').textContent = game.combo > 1 ? `COMBO x${game.combo}` : '';
  const timerEl = $('timer');
  timerEl.textContent = fmtTime(game.timeLeft);
  timerEl.classList.toggle('low', game.timeLeft <= 15);
  $('hint-btn').textContent = `Hint (${game.hintsLeft})`;
  $('hint-btn').disabled = game.hintsLeft <= 0 || game.screen !== 'playing';
  $('mag-btn').textContent = input.magnifierOn ? 'Magnifier: ON (M)' : 'Magnifier (M)';
  $('sound-btn').textContent = sfx.isMuted() ? 'Sound: OFF (S)' : 'Sound: ON (S)';
  $('progress-dots').textContent = SCENES.map((_, i) =>
    i < game.sceneIndex ? '●' : i === game.sceneIndex ? '◉' : '○',
  ).join(' ');
}

function showOverlay(id) {
  for (const el of document.querySelectorAll('.overlay')) el.classList.remove('show');
  if (id) $(id).classList.add('show');
}

function startScene(index) {
  game.sceneIndex = index;
  game.found = new Set();
  game.foundAt = new Map();
  game.timeLeft = SCENE_TIME_SECONDS;
  game.hintsLeft = HINTS_PER_SCENE;
  game.combo = 0;
  game.hint = null;
  game.missFlash = null;
  game.paused = false;
  game.lastTickSecond = -1;
  game.sceneStartScore = game.score;
  renderPanels();
  game.screen = 'playing';
  showOverlay(null);
  updateHud();
}

function startGame() {
  game.score = 0;
  game.bestCombo = 0;
  game.totalFound = 0;
  game.totalMisses = 0;
  sfx.click();
  startScene(0);
}

function sceneComplete() {
  const timeBonus = Math.ceil(game.timeLeft) * 10;
  game.score += timeBonus;
  sfx.win();
  game.screen = 'sceneDone';
  $('done-title').textContent = `Scene ${game.sceneIndex + 1} complete!`;
  $('done-detail').textContent =
    `${scene().name} — all ${DIFFERENCES_PER_SCENE} differences found. ` +
    `Time bonus +${timeBonus} (${fmtTime(game.timeLeft)} left). Scene score: ${game.score - game.sceneStartScore}.`;
  $('next-btn').textContent = game.sceneIndex + 1 < SCENES.length ? 'Next scene →' : 'See results →';
  showOverlay('overlay-done');
  updateHud();
}

function gameOver(reason) {
  game.screen = 'gameOver';
  const accuracy = game.totalFound + game.totalMisses === 0
    ? 100
    : Math.round((game.totalFound / (game.totalFound + game.totalMisses)) * 100);
  $('over-title').textContent = reason === 'time' ? "Time's up!" : 'You found them all!';
  $('over-detail').textContent =
    `Final score ${game.score} · ${game.totalFound} differences found · ` +
    `best combo x${Math.max(1, game.bestCombo)} · accuracy ${accuracy}%.`;
  $('over-sub').textContent =
    reason === 'time'
      ? `The clock beat you on ${scene().name} with ${DIFFERENCES_PER_SCENE - game.found.size} differences still hiding.`
      : 'Every scene cleared — the lanterns are lit and nothing hides any more.';
  showOverlay('overlay-over');
  updateHud();
}

function mark(side, x, y) {
  if (game.screen !== 'playing' || game.paused) return;
  const idx = hitDifference(scene(), side, x, y);
  if (idx >= 0 && !game.found.has(idx)) {
    game.found.add(idx);
    game.foundAt.set(idx, performance.now());
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    const comboBonus = Math.min(MAX_COMBO_BONUS, (game.combo - 1) * COMBO_STEP);
    game.score += POINTS_PER_FIND + comboBonus;
    game.timeLeft += TIME_BONUS_PER_FIND;
    game.totalFound += 1;
    sfx.pop();
    if (game.found.size === DIFFERENCES_PER_SCENE) {
      setTimeout(sceneComplete, 450);
    }
  } else if (idx < 0) {
    game.combo = 0;
    game.timeLeft = Math.max(0, game.timeLeft - WRONG_CLICK_PENALTY_SECONDS);
    game.totalMisses += 1;
    game.missFlash = { side, x, y, until: performance.now() + MISS_FLASH_MS };
    sfx.miss();
  }
  updateHud();
}

function useHint() {
  if (game.screen !== 'playing' || game.paused || game.hintsLeft <= 0) return;
  const remaining = targets().map((_, i) => i).filter((i) => !game.found.has(i));
  if (remaining.length === 0) return;
  const pick = remaining[Math.floor(Math.random() * remaining.length)];
  game.hintsLeft -= 1;
  game.score = Math.max(0, game.score - HINT_COST_POINTS);
  game.hint = { diff: pick, until: performance.now() + HINT_SHOW_MS };
  sfx.hint();
  updateHud();
}

function togglePause() {
  if (game.screen !== 'playing') return;
  game.paused = !game.paused;
  $('overlay-pause').classList.toggle('show', game.paused);
}

function loop(now) {
  if (game.screen === 'playing' && !game.paused) {
    game.timeLeft -= 1 / 60;
    const whole = Math.ceil(game.timeLeft);
    if (whole !== game.lastTickSecond) {
      game.lastTickSecond = whole;
      if (whole <= 10 && whole > 0) sfx.tick();
      updateHud();
    }
    if (game.timeLeft <= 0) {
      game.timeLeft = 0;
      updateHud();
      gameOver('time');
    }
  }
  if (game.screen === 'playing' || game.screen === 'sceneDone') blit();
  requestAnimationFrame(loop);
}

const input = new InputController({
  onMark: mark,
  onHint: useHint,
  onToggleMagnifier: () => updateHud(),
  onPause: togglePause,
  onToggleSound: () => {
    sfx.setMuted(!sfx.isMuted());
    updateHud();
  },
  getSceneCanvas: (side) => (side === 'left' ? game.offLeft : game.offRight),
});

input.attach($('panel-left'), $('panel-right'));
$('play-btn').addEventListener('click', startGame);
$('again-btn').addEventListener('click', startGame);
$('next-btn').addEventListener('click', () => {
  sfx.click();
  if (game.sceneIndex + 1 < SCENES.length) startScene(game.sceneIndex + 1);
  else gameOver('done');
});
$('resume-btn').addEventListener('click', togglePause);
$('hint-btn').addEventListener('click', useHint);
$('mag-btn').addEventListener('click', () => {
  input.magnifierOn = !input.magnifierOn;
  input.drawLens();
  updateHud();
});
$('sound-btn').addEventListener('click', () => {
  sfx.setMuted(!sfx.isMuted());
  updateHud();
});
$('pause-btn').addEventListener('click', togglePause);

renderPanels();
updateHud();
requestAnimationFrame(loop);

// Debug hook for automated play-testing and screenshots: the screenshot
// script drives the real game through these (real clicks where it can).
window.__spot = {
  game,
  targets,
  scene,
  markFound(indices) {
    for (const i of indices) {
      if (!game.found.has(i)) {
        const t = targets()[i];
        mark('left', t.lx, t.ly);
      }
    }
  },
};
