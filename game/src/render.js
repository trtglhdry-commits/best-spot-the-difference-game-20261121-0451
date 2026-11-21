// Twin Lanterns — canvas renderer. Draws a scene definition onto a canvas:
// sky gradient, ground, then every element in order. The right panel is the
// same scene with its differences applied (see differences.js). All art is
// original vector shapes — no images.
import { PANEL_WIDTH, PANEL_HEIGHT } from './config.js';
import { elementsForSide } from './differences.js';

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function poly(ctx, points, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function star5(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/** Run a painter mirrored around the element's x when el.flip is set. */
function withFlip(ctx, el, fn) {
  if (!el.flip) {
    fn();
    return;
  }
  ctx.save();
  ctx.translate(el.x, 0);
  ctx.scale(-1, 1);
  ctx.translate(-el.x, 0);
  fn();
  ctx.restore();
}

const PAINTERS = {
  sun(ctx, el) {
    const s = el.s ?? 1;
    if (el.rays) {
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 4 * s;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const x1 = el.x + Math.cos(a) * (el.r + 6) * s;
        const y1 = el.y + Math.sin(a) * (el.r + 6) * s;
        const x2 = el.x + Math.cos(a) * (el.r + 18) * s;
        const y2 = el.y + Math.sin(a) * (el.r + 18) * s;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    }
    circle(ctx, el.x, el.y, el.r * s, el.color);
  },
  moon(ctx, el) {
    circle(ctx, el.x, el.y, el.r, el.color);
    circle(ctx, el.x - el.r * 0.3, el.y - el.r * 0.2, el.r * 0.18, 'rgba(0,0,0,0.12)');
    circle(ctx, el.x + el.r * 0.25, el.y + el.r * 0.3, el.r * 0.13, 'rgba(0,0,0,0.12)');
  },
  cloud(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ellipse(ctx, el.x, el.y, 34 * s, 16 * s, 'rgba(255,255,255,0.92)');
    ellipse(ctx, el.x - 20 * s, el.y + 6 * s, 22 * s, 12 * s, 'rgba(255,255,255,0.92)');
    ellipse(ctx, el.x + 22 * s, el.y + 6 * s, 24 * s, 13 * s, 'rgba(255,255,255,0.92)');
    circle(ctx, el.x - 6 * s, el.y - 10 * s, 14 * s, 'rgba(255,255,255,0.92)');
  },
  star(ctx, el) {
    const r = el.r ?? 5;
    ctx.fillStyle = el.color ?? '#ffffff';
    ctx.beginPath();
    ctx.moveTo(el.x, el.y - r * 1.6);
    ctx.quadraticCurveTo(el.x, el.y, el.x + r * 1.6, el.y);
    ctx.quadraticCurveTo(el.x, el.y, el.x, el.y + r * 1.6);
    ctx.quadraticCurveTo(el.x, el.y, el.x - r * 1.6, el.y);
    ctx.quadraticCurveTo(el.x, el.y, el.x, el.y - r * 1.6);
    ctx.fill();
  },
  bird(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      ctx.strokeStyle = el.color ?? '#3a3a44';
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.x - 14 * s, el.y);
      ctx.quadraticCurveTo(el.x - 7 * s, el.y - 9 * s, el.x, el.y);
      ctx.quadraticCurveTo(el.x + 7 * s, el.y - 9 * s, el.x + 14 * s, el.y);
      ctx.stroke();
    });
  },
  tree(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(el.x - 4 * s, el.y - 6 * s, 8 * s, 26 * s);
    if (el.shape === 'round') {
      circle(ctx, el.x, el.y - 22 * s, 24 * s, el.color ?? '#2f6b3a');
      circle(ctx, el.x - 16 * s, el.y - 10 * s, 16 * s, el.color ?? '#2f6b3a');
      circle(ctx, el.x + 16 * s, el.y - 10 * s, 16 * s, el.color ?? '#2f6b3a');
    }
  },
  pine(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(el.x - 4 * s, el.y - 4 * s, 8 * s, 22 * s);
    poly(ctx, [[el.x, el.y - 78 * s], [el.x - 26 * s, el.y - 28 * s], [el.x + 26 * s, el.y - 28 * s]], '#2f7d4a');
    poly(ctx, [[el.x, el.y - 58 * s], [el.x - 21 * s, el.y - 16 * s], [el.x + 21 * s, el.y - 16 * s]], '#35965a');
    poly(ctx, [[el.x, el.y - 40 * s], [el.x - 16 * s, el.y - 4 * s], [el.x + 16 * s, el.y - 4 * s]], '#3fae68');
    circle(ctx, el.x - 8 * s, el.y - 52 * s, 3 * s, '#ffffff');
    circle(ctx, el.x + 10 * s, el.y - 30 * s, 3 * s, '#ffffff');
  },
  house(ctx, el) {
    const s = el.s ?? 1;
    const w = 84 * s;
    const h = 56 * s;
    const top = el.y - h;
    ctx.fillStyle = el.wall;
    ctx.fillRect(el.x - w / 2, top, w, h);
    poly(ctx, [[el.x - w / 2 - 8 * s, top], [el.x, top - 34 * s], [el.x + w / 2 + 8 * s, top]], el.roof);
    ctx.fillStyle = '#5a3a28';
    ctx.fillRect(el.x - 8 * s, el.y - 26 * s, 16 * s, 26 * s);
    const win = el.lit ? '#ffd34d' : '#3a4a5a';
    ctx.fillStyle = win;
    ctx.fillRect(el.x - w / 2 + 10 * s, top + 12 * s, 14 * s, 14 * s);
    ctx.fillRect(el.x + w / 2 - 24 * s, top + 12 * s, 14 * s, 14 * s);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(el.x - w / 2 + 10 * s, top + 12 * s, 14 * s, 14 * s);
    ctx.strokeRect(el.x + w / 2 - 24 * s, top + 12 * s, 14 * s, 14 * s);
  },
  stall(ctx, el) {
    const s = el.s ?? 1;
    const w = 110 * s;
    const top = el.y - 46 * s;
    ctx.fillStyle = '#6b4a2f';
    ctx.fillRect(el.x - w / 2, top + 26 * s, w, 26 * s);
    ctx.fillStyle = el.awning;
    ctx.beginPath();
    ctx.moveTo(el.x - w / 2 - 6 * s, top);
    ctx.lineTo(el.x + w / 2 + 6 * s, top);
    ctx.lineTo(el.x + w / 2, top + 22 * s);
    ctx.lineTo(el.x - w / 2, top + 22 * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = -2; i <= 2; i += 2) {
      ctx.fillRect(el.x + i * 22 * s - 9 * s, top, 18 * s, 22 * s);
    }
    circle(ctx, el.x - 26 * s, top + 16 * s, 7 * s, el.goods);
    circle(ctx, el.x, top + 16 * s, 7 * s, el.goods);
    circle(ctx, el.x + 26 * s, top + 16 * s, 7 * s, el.goods);
  },
  lantern(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = '#3a2b22';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y - 34 * s);
    ctx.lineTo(el.x, el.y - 16 * s);
    ctx.stroke();
    const glow = ctx.createRadialGradient(el.x, el.y, 2, el.x, el.y, 30 * s);
    glow.addColorStop(0, el.color);
    glow.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(el.x, el.y, 30 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = el.color;
    ctx.beginPath();
    ctx.ellipse(el.x, el.y, 11 * s, 15 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2b22';
    ctx.fillRect(el.x - 7 * s, el.y - 19 * s, 14 * s, 4 * s);
    ctx.fillRect(el.x - 7 * s, el.y + 15 * s, 14 * s, 4 * s);
  },
  lamp(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(el.x - 2 * s, el.y - 52 * s, 4 * s, 52 * s);
    const glow = ctx.createRadialGradient(el.x, el.y - 56 * s, 2, el.x, el.y - 56 * s, 26 * s);
    glow.addColorStop(0, el.color ?? '#ffd34d');
    glow.addColorStop(1, 'rgba(255,211,77,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(el.x, el.y - 56 * s, 26 * s, 0, Math.PI * 2);
    ctx.fill();
    circle(ctx, el.x, el.y - 56 * s, 7 * s, el.color ?? '#ffd34d');
  },
  cat(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      ctx.fillStyle = el.color ?? '#23232c';
      ellipse(ctx, el.x, el.y - 12 * s, 16 * s, 13 * s, el.color ?? '#23232c');
      circle(ctx, el.x + 10 * s, el.y - 30 * s, 9 * s, el.color ?? '#23232c');
      poly(ctx, [[el.x + 4 * s, el.y - 36 * s], [el.x + 6 * s, el.y - 44 * s], [el.x + 11 * s, el.y - 36 * s]], el.color ?? '#23232c');
      poly(ctx, [[el.x + 12 * s, el.y - 37 * s], [el.x + 16 * s, el.y - 44 * s], [el.x + 18 * s, el.y - 36 * s]], el.color ?? '#23232c');
      ctx.strokeStyle = el.color ?? '#23232c';
      ctx.lineWidth = 4 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.x - 14 * s, el.y - 2 * s);
      ctx.quadraticCurveTo(el.x - 26 * s, el.y - 6 * s, el.x - 22 * s, el.y - 20 * s);
      ctx.stroke();
    });
  },
  kite(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      poly(ctx, [[el.x, el.y - 22 * s], [el.x + 16 * s, el.y], [el.x, el.y + 22 * s], [el.x - 16 * s, el.y]], el.color);
      ctx.strokeStyle = '#3a3a44';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y + 22 * s);
      ctx.quadraticCurveTo(el.x - 6 * s, el.y + 40 * s, el.x + 2 * s, el.y + 52 * s);
      ctx.stroke();
      poly(ctx, [[el.x - 2 * s, el.y + 32 * s], [el.x + 4 * s, el.y + 36 * s], [el.x - 2 * s, el.y + 40 * s]], '#ff5a5a');
    });
  },
  fish(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      ellipse(ctx, el.x, el.y, 22 * s, 11 * s, el.color);
      poly(ctx, [[el.x - 20 * s, el.y], [el.x - 32 * s, el.y - 10 * s], [el.x - 32 * s, el.y + 10 * s]], el.color);
      poly(ctx, [[el.x - 2 * s, el.y - 10 * s], [el.x + 6 * s, el.y - 16 * s], [el.x + 10 * s, el.y - 9 * s]], el.color);
      circle(ctx, el.x + 13 * s, el.y - 2 * s, 2.5 * s, '#1c1c22');
    });
  },
  coral(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = el.color;
    ctx.lineWidth = 7 * s;
    ctx.lineCap = 'round';
    const branch = (x0, y0, x1, y1, x2, y2) => {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x1, y1, x2, y2);
      ctx.stroke();
    };
    branch(el.x, el.y + 24 * s, el.x - 6 * s, el.y, el.x - 14 * s, el.y - 22 * s);
    branch(el.x, el.y + 24 * s, el.x + 4 * s, el.y - 4 * s, el.x + 2 * s, el.y - 34 * s);
    branch(el.x, el.y + 24 * s, el.x + 12 * s, el.y + 2 * s, el.x + 20 * s, el.y - 16 * s);
    circle(ctx, el.x - 14 * s, el.y - 22 * s, 5 * s, el.color);
    circle(ctx, el.x + 2 * s, el.y - 34 * s, 5 * s, el.color);
    circle(ctx, el.x + 20 * s, el.y - 16 * s, 5 * s, el.color);
  },
  seaweed(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = el.color;
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    for (const off of [-10, 0, 10]) {
      ctx.beginPath();
      ctx.moveTo(el.x + off * s, el.y + 26 * s);
      ctx.quadraticCurveTo(el.x + (off - 8) * s, el.y, el.x + (off + 4) * s, el.y - 26 * s);
      ctx.stroke();
    }
  },
  bubble(ctx, el) {
    const r = el.r ?? 8;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(el.x, el.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath();
    ctx.arc(el.x - r * 0.3, el.y - r * 0.3, r * 0.4, Math.PI * 0.9, Math.PI * 1.6);
    ctx.stroke();
  },
  starfish(ctx, el) {
    star5(ctx, el.x, el.y, 16 * (el.s ?? 1), el.color);
    circle(ctx, el.x - 4, el.y - 2, 1.8, '#7a3b12');
    circle(ctx, el.x + 4, el.y - 2, 1.8, '#7a3b12');
  },
  shell(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = el.color ?? '#f7ede2';
    ctx.beginPath();
    ctx.moveTo(el.x, el.y + 10 * s);
    ctx.quadraticCurveTo(el.x - 20 * s, el.y - 12 * s, el.x, el.y - 16 * s);
    ctx.quadraticCurveTo(el.x + 20 * s, el.y - 12 * s, el.x, el.y + 10 * s);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1.5;
    for (const a of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(el.x, el.y + 8 * s);
      ctx.lineTo(el.x + Math.sin(a) * 16 * s, el.y - 14 * s);
      ctx.stroke();
    }
  },
  rock(ctx, el) {
    const s = el.s ?? 1;
    ellipse(ctx, el.x, el.y, 22 * s, 12 * s, el.color ?? '#8d99ae');
    ellipse(ctx, el.x - 4 * s, el.y - 3 * s, 14 * s, 7 * s, 'rgba(255,255,255,0.18)');
  },
  snowman(ctx, el) {
    const s = el.s ?? 1;
    circle(ctx, el.x, el.y, 18 * s, '#ffffff');
    circle(ctx, el.x, el.y - 24 * s, 13 * s, '#ffffff');
    circle(ctx, el.x, el.y - 42 * s, 10 * s, '#ffffff');
    circle(ctx, el.x - 4 * s, el.y - 44 * s, 1.8 * s, '#1c1c22');
    circle(ctx, el.x + 4 * s, el.y - 44 * s, 1.8 * s, '#1c1c22');
    ctx.strokeStyle = '#6b4a2f';
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(el.x - 12 * s, el.y - 24 * s);
    ctx.lineTo(el.x - 26 * s, el.y - 34 * s);
    ctx.moveTo(el.x + 12 * s, el.y - 24 * s);
    ctx.lineTo(el.x + 26 * s, el.y - 34 * s);
    ctx.stroke();
    ctx.fillStyle = '#2b2b33';
    ctx.fillRect(el.x - 8 * s, el.y - 56 * s, 16 * s, 4 * s);
    ctx.fillRect(el.x - 5 * s, el.y - 62 * s, 10 * s, 7 * s);
  },
  carrot(ctx, el) {
    const s = el.s ?? 1;
    poly(ctx, [[el.x - 4 * s, el.y - 3 * s], [el.x + 14 * s, el.y], [el.x - 4 * s, el.y + 3 * s]], el.color ?? '#ff8c42');
  },
  smoke(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    circle(ctx, el.x, el.y, 9 * s, 'rgba(255,255,255,0.75)');
    circle(ctx, el.x + 8 * s, el.y - 12 * s, 12 * s, 'rgba(255,255,255,0.6)');
    circle(ctx, el.x + 2 * s, el.y - 26 * s, 14 * s, 'rgba(255,255,255,0.45)');
  },
  fountain(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = '#b8b0a4';
    ellipse(ctx, el.x, el.y, 34 * s, 10 * s, '#b8b0a4');
    ctx.fillStyle = el.water ?? '#7ec8e3';
    ellipse(ctx, el.x, el.y - 2 * s, 28 * s, 7 * s, el.water ?? '#7ec8e3');
    ctx.fillStyle = '#b8b0a4';
    ctx.fillRect(el.x - 3 * s, el.y - 26 * s, 6 * s, 24 * s);
    ctx.strokeStyle = el.water ?? '#7ec8e3';
    ctx.lineWidth = 3 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(el.x, el.y - 26 * s);
    ctx.quadraticCurveTo(el.x - 16 * s, el.y - 34 * s, el.x - 22 * s, el.y - 14 * s);
    ctx.moveTo(el.x, el.y - 26 * s);
    ctx.quadraticCurveTo(el.x + 16 * s, el.y - 34 * s, el.x + 22 * s, el.y - 14 * s);
    ctx.stroke();
  },
  tower(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = el.wall ?? '#c9b18c';
    ctx.fillRect(el.x - 26 * s, el.y - 60 * s, 52 * s, 90 * s);
    poly(ctx, [[el.x - 32 * s, el.y - 60 * s], [el.x, el.y - 92 * s], [el.x + 32 * s, el.y - 60 * s]], el.roof ?? '#7a5a3b');
    circle(ctx, el.x, el.y - 34 * s, 20 * s, '#fdf6e3');
    ctx.strokeStyle = '#2b2b33';
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.arc(el.x, el.y - 34 * s, 20 * s, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(el.x + Math.cos(a) * 16 * s, el.y - 34 * s + Math.sin(a) * 16 * s);
      ctx.lineTo(el.x + Math.cos(a) * 19 * s, el.y - 34 * s + Math.sin(a) * 19 * s);
      ctx.stroke();
    }
    ctx.fillStyle = '#5a3a28';
    ctx.fillRect(el.x - 8 * s, el.y + 8 * s, 16 * s, 22 * s);
  },
  hands(ctx, el) {
    const s = el.s ?? 1;
    const a = el.angle ?? 1.2;
    ctx.strokeStyle = el.color ?? '#2b2b33';
    ctx.lineCap = 'round';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + Math.cos(a) * 12 * s, el.y + Math.sin(a) * 12 * s);
    ctx.stroke();
    ctx.lineWidth = 2 * s;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y);
    ctx.lineTo(el.x + Math.cos(a + 1.9) * 16 * s, el.y + Math.sin(a + 1.9) * 16 * s);
    ctx.stroke();
    circle(ctx, el.x, el.y, 2.5 * s, el.color ?? '#2b2b33');
  },
  flower(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = '#3f7d3a';
    ctx.lineWidth = 3 * s;
    ctx.beginPath();
    ctx.moveTo(el.x, el.y + 16 * s);
    ctx.lineTo(el.x, el.y - 2 * s);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
      ellipse(ctx, el.x + Math.cos(a) * 9 * s, el.y - 8 * s + Math.sin(a) * 9 * s, 7 * s, 7 * s, el.color);
    }
    circle(ctx, el.x, el.y - 8 * s, 6 * s, '#ffd34d');
  },
  butterfly(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      ellipse(ctx, el.x - 9 * s, el.y - 6 * s, 9 * s, 12 * s, el.color);
      ellipse(ctx, el.x + 9 * s, el.y - 6 * s, 9 * s, 12 * s, el.color);
      ellipse(ctx, el.x - 7 * s, el.y + 8 * s, 6 * s, 8 * s, el.color);
      ellipse(ctx, el.x + 7 * s, el.y + 8 * s, 6 * s, 8 * s, el.color);
      ctx.strokeStyle = '#2b2b33';
      ctx.lineWidth = 2.5 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(el.x, el.y - 12 * s);
      ctx.lineTo(el.x, el.y + 12 * s);
      ctx.stroke();
    });
  },
  mushroom(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = '#f7ede2';
    ctx.fillRect(el.x - 5 * s, el.y - 4 * s, 10 * s, 14 * s);
    ctx.fillStyle = el.cap ?? '#d94f4f';
    ctx.beginPath();
    ctx.arc(el.x, el.y - 2 * s, 15 * s, Math.PI, 0);
    ctx.fill();
    circle(ctx, el.x - 6 * s, el.y - 10 * s, 2.5 * s, '#ffffff');
    circle(ctx, el.x + 5 * s, el.y - 6 * s, 2 * s, '#ffffff');
  },
  grass(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = el.color ?? '#5a8c4a';
    ctx.lineWidth = 2.5 * s;
    ctx.lineCap = 'round';
    for (const off of [-8, 0, 8]) {
      ctx.beginPath();
      ctx.moveTo(el.x + off * s, el.y);
      ctx.lineTo(el.x + (off - 3) * s, el.y - 14 * s);
      ctx.stroke();
    }
  },
  cactus(ctx, el) {
    const s = el.s ?? 1;
    ctx.fillStyle = el.color ?? '#3f7d5a';
    ctx.beginPath();
    ctx.ellipse(el.x, el.y - 12 * s, 9 * s, 26 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(el.x - 14 * s, el.y - 4 * s, 6 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(el.x - 18 * s, el.y - 8 * s, 10 * s, 5 * s);
    ctx.beginPath();
    ctx.ellipse(el.x + 14 * s, el.y - 10 * s, 6 * s, 12 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(el.x + 8 * s, el.y - 14 * s, 10 * s, 5 * s);
  },
  tent(ctx, el) {
    const s = el.s ?? 1;
    withFlip(ctx, el, () => {
      poly(ctx, [[el.x - 42 * s, el.y + 14 * s], [el.x, el.y - 34 * s], [el.x + 42 * s, el.y + 14 * s]], el.color);
      poly(ctx, [[el.x - 14 * s, el.y + 14 * s], [el.x, el.y - 34 * s], [el.x + 14 * s, el.y + 14 * s]], 'rgba(0,0,0,0.25)');
      ctx.strokeStyle = '#5a3a28';
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      ctx.moveTo(el.x, el.y - 34 * s);
      ctx.lineTo(el.x, el.y - 52 * s);
      ctx.stroke();
      poly(ctx, [[el.x, el.y - 52 * s], [el.x + 16 * s, el.y - 47 * s], [el.x, el.y - 42 * s]], '#ffd34d');
    });
  },
  palm(ctx, el) {
    const s = el.s ?? 1;
    ctx.strokeStyle = '#8a6d3f';
    ctx.lineWidth = 7 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(el.x, el.y + 16 * s);
    ctx.quadraticCurveTo(el.x + 4 * s, el.y - 20 * s, el.x + 12 * s, el.y - 44 * s);
    ctx.stroke();
    ctx.strokeStyle = '#2f9e4a';
    ctx.lineWidth = 5 * s;
    for (const a of [-2.4, -1.8, -1.2, -0.6, 0]) {
      ctx.beginPath();
      ctx.moveTo(el.x + 12 * s, el.y - 44 * s);
      ctx.quadraticCurveTo(
        el.x + (12 + Math.cos(a) * 26) * s,
        el.y + (-44 + Math.sin(a) * 14 - 8) * s,
        el.x + (12 + Math.cos(a) * 34) * s,
        el.y + (-44 + Math.sin(a) * 22 + 6) * s,
      );
      ctx.stroke();
    }
  },
  pond(ctx, el) {
    const s = el.s ?? 1;
    ellipse(ctx, el.x, el.y, 34 * s, 12 * s, el.color ?? '#7ec8e3');
    ellipse(ctx, el.x - 8 * s, el.y - 3 * s, 18 * s, 5 * s, 'rgba(255,255,255,0.35)');
  },
  dune(ctx, el) {
    ctx.fillStyle = el.color ?? '#d9a45b';
    ctx.beginPath();
    ctx.ellipse(el.x, el.y, (el.w ?? 400) / 2, el.h ?? 80, 0, Math.PI, 0);
    ctx.fill();
  },
};

/** Draw one element by kind. Unknown kinds are skipped silently. */
export function drawElement(ctx, el) {
  const paint = PAINTERS[el.kind];
  if (paint) paint(ctx, el);
}

/**
 * Render a whole panel to `canvas`: sky gradient, ground band, then the
 * scene's elements for `side` ('left' or 'right'). A soft vignette keeps
 * the edges calm so markers read clearly.
 */
export function drawScene(canvas, scene, side) {
  const ctx = canvas.getContext('2d');
  const W = PANEL_WIDTH;
  const H = PANEL_HEIGHT;
  const sky = ctx.createLinearGradient(0, 0, 0, scene.groundY);
  sky.addColorStop(0, scene.skyTop);
  sky.addColorStop(1, scene.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, scene.groundY);
  ctx.fillStyle = scene.ground;
  ctx.fillRect(0, scene.groundY, W, H - scene.groundY);
  for (const el of elementsForSide(scene, side)) drawElement(ctx, el);
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.85);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.14)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
