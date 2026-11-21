// Twin Lanterns — input. Mouse and keyboard play on both panels.
// Clicking a panel marks the spot under the cursor; arrow keys move a
// crosshair and Enter marks where it stands; H asks for a hint, M toggles
// the magnifier lens, P pauses. The lens is a small canvas that paints a
// 2x zoom of the panel under the mouse, so tiny differences can be studied.
import { MAGNIFIER_DIAMETER, MAGNIFIER_ZOOM } from './config.js';

export class InputController {
  constructor({ onMark, onHint, onToggleMagnifier, onPause, onToggleSound, getSceneCanvas }) {
    this.onMark = onMark;
    this.onHint = onHint;
    this.onToggleMagnifier = onToggleMagnifier;
    this.onPause = onPause;
    this.onToggleSound = onToggleSound;
    this.getSceneCanvas = getSceneCanvas;
    this.magnifierOn = false;
    this.hover = null; // { side, x, y } in scene coordinates
    this.crosshair = { side: 'left', x: 310, y: 220 };
    this.lens = document.getElementById('lens');
    this.crossEl = document.getElementById('crosshair');
  }

  attach(canvasLeft, canvasRight) {
    for (const [canvas, side] of [
      [canvasLeft, 'left'],
      [canvasRight, 'right'],
    ]) {
      canvas.addEventListener('mousemove', (ev) => this.onMove(ev, canvas, side));
      canvas.addEventListener('mouseleave', () => this.onLeave());
      canvas.addEventListener('click', (ev) => this.onClick(ev, canvas, side));
    }
    window.addEventListener('keydown', (ev) => this.onKey(ev));
    window.addEventListener('blur', () => this.onLeave());
  }

  toScene(ev, canvas) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * canvas.width,
      y: ((ev.clientY - rect.top) / rect.height) * canvas.height,
      clientX: ev.clientX,
      clientY: ev.clientY,
    };
  }

  onMove(ev, canvas, side) {
    const p = this.toScene(ev, canvas);
    this.hover = { side, x: p.x, y: p.y, clientX: p.clientX, clientY: p.clientY };
    this.crosshair = { side, x: p.x, y: p.y };
    this.positionCrosshair(canvas, p.clientX, p.clientY);
    this.drawLens();
  }

  onLeave() {
    this.hover = null;
    this.lens.style.display = 'none';
  }

  onClick(ev, canvas, side) {
    const p = this.toScene(ev, canvas);
    this.onMark(side, p.x, p.y);
  }

  positionCrosshair(canvas, clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const appRect = document.getElementById('app').getBoundingClientRect();
    this.crossEl.style.display = 'block';
    this.crossEl.style.left = `${rect.left - appRect.left + clientX - rect.left - 14}px`;
    this.crossEl.style.top = `${rect.top - appRect.top + clientY - rect.top - 14}px`;
  }

  drawLens() {
    if (!this.magnifierOn || !this.hover) {
      this.lens.style.display = 'none';
      return;
    }
    const src = this.getSceneCanvas(this.hover.side);
    if (!src) return;
    const d = MAGNIFIER_DIAMETER;
    const half = d / (2 * MAGNIFIER_ZOOM);
    const sx = Math.max(0, Math.min(src.width - d / MAGNIFIER_ZOOM, this.hover.x - half));
    const sy = Math.max(0, Math.min(src.height - d / MAGNIFIER_ZOOM, this.hover.y - half));
    const lctx = this.lens.getContext('2d');
    lctx.save();
    lctx.beginPath();
    lctx.arc(d / 2, d / 2, d / 2 - 2, 0, Math.PI * 2);
    lctx.clip();
    lctx.drawImage(src, sx, sy, d / MAGNIFIER_ZOOM, d / MAGNIFIER_ZOOM, 0, 0, d, d);
    lctx.restore();
    lctx.strokeStyle = '#ffd34d';
    lctx.lineWidth = 4;
    lctx.beginPath();
    lctx.arc(d / 2, d / 2, d / 2 - 2, 0, Math.PI * 2);
    lctx.stroke();
    lctx.strokeStyle = 'rgba(255,211,77,0.7)';
    lctx.lineWidth = 1;
    lctx.beginPath();
    lctx.moveTo(d / 2, 0);
    lctx.lineTo(d / 2, d);
    lctx.moveTo(0, d / 2);
    lctx.lineTo(d, d / 2);
    lctx.stroke();
    this.lens.style.display = 'block';
    const left = Math.min(window.innerWidth - d - 12, this.hover.clientX + 18);
    const top = Math.min(window.innerHeight - d - 12, this.hover.clientY + 18);
    this.lens.style.left = `${left}px`;
    this.lens.style.top = `${top}px`;
  }

  onKey(ev) {
    const tag = document.activeElement?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const step = ev.shiftKey ? 60 : 24;
    let used = true;
    if (ev.key === 'ArrowLeft') this.crosshair.x = Math.max(0, this.crosshair.x - step);
    else if (ev.key === 'ArrowRight') this.crosshair.x = Math.min(619, this.crosshair.x + step);
    else if (ev.key === 'ArrowUp') this.crosshair.y = Math.max(0, this.crosshair.y - step);
    else if (ev.key === 'ArrowDown') this.crosshair.y = Math.min(439, this.crosshair.y + step);
    else if (ev.key === 'Enter' || ev.key === ' ') {
      this.onMark(this.crosshair.side, this.crosshair.x, this.crosshair.y);
    } else if (ev.key === 'h' || ev.key === 'H') this.onHint();
    else if (ev.key === 'm' || ev.key === 'M') {
      this.magnifierOn = !this.magnifierOn;
      this.onToggleMagnifier(this.magnifierOn);
      this.drawLens();
    } else if (ev.key === 'p' || ev.key === 'P' || ev.key === 'Escape') this.onPause();
    else if (ev.key === 's' || ev.key === 'S') this.onToggleSound();
    else used = false;
    if (used) {
      ev.preventDefault();
      if (ev.key.startsWith('Arrow')) this.showCrosshairAtScenePoint();
    }
  }

  showCrosshairAtScenePoint() {
    const canvas = document.getElementById(this.crosshair.side === 'left' ? 'panel-left' : 'panel-right');
    const rect = canvas.getBoundingClientRect();
    this.crossEl.style.display = 'block';
    this.crossEl.style.left = `${rect.left + (this.crosshair.x / canvas.width) * rect.width - 14}px`;
    this.crossEl.style.top = `${rect.top + (this.crosshair.y / canvas.height) * rect.height - 14}px`;
    const app = document.getElementById('app');
    const appRect = app.getBoundingClientRect();
    this.crossEl.style.left = `${rect.left - appRect.left + (this.crosshair.x / canvas.width) * rect.width - 14}px`;
    this.crossEl.style.top = `${rect.top - appRect.top + (this.crosshair.y / canvas.height) * rect.height - 14}px`;
  }
}
