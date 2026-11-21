// Twin Lanterns — difference model. A scene's two panels come from one element
// list; the right panel is the same list with the scene's differences applied.
// A difference is always a fair, visible change: hide an element, recolour it,
// move it, add one, resize it, or mirror it. Each difference carries its click
// point on both panels (they differ only for a move) and a hit radius.
import { CLICK_RADIUS } from './config.js';

/**
 * The element list a side shows. The left side is the scene as written; the
 * right side is the same list with every difference applied.
 */
export function elementsForSide(scene, side) {
  if (side === 'left') return scene.elements;
  const list = scene.elements.map((el) => ({ ...el }));
  for (const diff of scene.diffs) {
    if (diff.kind === 'add') {
      list.push({ ...diff.element });
      continue;
    }
    const el = list[diff.el];
    if (!el) continue;
    if (diff.kind === 'hide') el.hidden = true;
    if (diff.kind === 'color') el.color = diff.color;
    if (diff.kind === 'color2') el.color2 = diff.color;
    if (diff.kind === 'move') {
      el.x += diff.dx;
      el.y += diff.dy;
    }
    if (diff.kind === 'scale') el.s = (el.s ?? 1) * diff.s;
    if (diff.kind === 'flip') el.flip = !el.flip;
  }
  return list.filter((el) => !el.hidden);
}

/** Click targets for a scene: one per difference, with a point per panel. */
export function diffTargets(scene) {
  return scene.diffs.map((diff) => {
    const r = diff.r ?? CLICK_RADIUS;
    if (diff.kind === 'add') {
      return { lx: diff.element.x, ly: diff.element.y, rx: diff.element.x, ry: diff.element.y, r };
    }
    const el = scene.elements[diff.el];
    const lx = el.x;
    const ly = el.y;
    if (diff.kind === 'move') return { lx, ly, rx: lx + diff.dx, ry: ly + diff.dy, r };
    return { lx, ly, rx: lx, ry: ly, r };
  });
}

/**
 * Which difference (if any) a click hits. `side` is the panel clicked;
 * `x, y` are scene coordinates on that panel. Returns the difference index
 * or -1. The click must land inside the radius around that side's point
 * for the difference (a moved object is caught where it sits on the side
 * clicked). When two points overlap, the nearest one wins, so clicking a
 * moved object never finds the neighbour hiding beside it instead.
 */
export function hitDifference(scene, side, x, y) {
  const targets = diffTargets(scene);
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i];
    const px = side === 'left' ? t.lx : t.rx;
    const py = side === 'left' ? t.ly : t.ry;
    const dx = x - px;
    const dy = y - py;
    const dist = dx * dx + dy * dy;
    if (dist <= t.r * t.r && dist < bestDist) {
      best = i;
      bestDist = dist;
    }
  }
  return best;
}
