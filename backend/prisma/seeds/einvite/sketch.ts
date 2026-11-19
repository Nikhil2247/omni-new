// ============================================================================
// The original "sketchbook" artwork (wobbly outlines, brush highlights, bunting, marigold garlands, rangoli corners,
// the painted arch, leaf wreaths and vines), ported unchanged so those designs look exactly as they always did.
// ============================================================================
import { dot, poly, rng, type Obj, type Palette, type Pt } from './kit';

export function quadO(p0: Pt, c: Pt, p1: Pt, n: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) * (1 - t);
    const b = 2 * (1 - t) * t;
    const c2 = t * t;
    out.push([a * p0[0] + b * c[0] + c2 * p1[0], a * p0[1] + b * c[1] + c2 * p1[1]]);
  }
  return out;
}

/** A hand-drawn rectangle outline: straight edges, each point nudged a little. */
export function wobbleRect(x: number, y: number, w: number, h: number, jitter: number, seed: number): Pt[] {
  const rnd = rng(seed);
  const pts: Pt[] = [];
  const edge = (a: Pt, b: Pt) => {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(2, Math.round(len / 38));
    for (let i = 0; i < n; i++) {
      const t = i / n;
      pts.push([a[0] + (b[0] - a[0]) * t + (rnd() - 0.5) * 2 * jitter, a[1] + (b[1] - a[1]) * t + (rnd() - 0.5) * 2 * jitter]);
    }
  };
  const tl: Pt = [x, y];
  const tr: Pt = [x + w, y];
  const br: Pt = [x + w, y + h];
  const bl: Pt = [x, y + h];
  edge(tl, tr);
  edge(tr, br);
  edge(br, bl);
  edge(bl, tl);
  return pts;
}

/** A rounded, slightly irregular blob, used as a brush stroke behind text. */
export function brushShape(cx: number, cy: number, w: number, h: number, seed: number): Pt[] {
  const rnd = rng(seed);
  const pts: Pt[] = [];
  const n = 56;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const c = Math.cos(t);
    const s = Math.sin(t);
    const x = Math.sign(c) * Math.pow(Math.abs(c), 0.4);
    const y = Math.sign(s) * Math.pow(Math.abs(s), 0.4);
    const j = 1 + (rnd() - 0.5) * 0.08;
    pts.push([cx + (w / 2) * x * j, cy + (h / 2) * y * (1 + (rnd() - 0.5) * 0.18)]);
  }
  return pts;
}

/** A petal or leaf: a lens shape whose base sits at (ox, oy) and points along (dx, dy). */
export function lens(ox: number, oy: number, dx: number, dy: number, len: number, wid: number, base = 0): Pt[] {
  const norm = Math.hypot(dx, dy) || 1;
  const ux = dx / norm;
  const uy = dy / norm;
  const px = -uy;
  const py = ux;
  const upper: Pt[] = [];
  const lower: Pt[] = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const along = base + (len - base) * t;
    const half = (wid / 2) * Math.pow(Math.sin(Math.PI * t), 0.85);
    upper.push([ox + ux * along + px * half, oy + uy * along + py * half]);
    lower.push([ox + ux * along - px * half, oy + uy * along - py * half]);
  }
  return [...upper, ...lower.reverse()];
}

// ----------------------------------------------------------------------------
// Decoration pieces
// ----------------------------------------------------------------------------

/** Soft painted washes behind the page. */
export function sketchWashes(p: Palette, spots: Array<[number, number, number, 'wash' | 'gold' | 'leafLight' | 'rose']>): Obj[] {
  return spots.map(([x, y, r, k]) => dot(x, y, r, p[k], k === 'wash' ? 0.34 : 0.2));
}

/** A brush highlight behind a line of text. */
export function sketchBrush(p: Palette, cx: number, cy: number, w: number, h: number, seed: number, colour: string, opacity = 0.5): Obj {
  return poly(brushShape(cx, cy, w, h, seed), { fill: colour, opacity });
}

/** A quarter rangoli mandala growing out of a corner. */
export function mandalaCorner(p: Palette, ox: number, oy: number, sx: number, sy: number, s: number): Obj[] {
  const out: Obj[] = [];
  const dir = (deg: number): [number, number] => [sx * Math.cos((deg * Math.PI) / 180), sy * Math.sin((deg * Math.PI) / 180)];
  out.push(dot(ox, oy, 38 * s, p.wash, 0.5));
  out.push(dot(ox, oy, 20 * s, p.gold, 0.55));
  for (let k = 0; k < 7; k++) {
    const [dx, dy] = dir(6.4 + k * 12.86);
    out.push(poly(lens(ox, oy, dx, dy, 122 * s, 30 * s, 70 * s), { fill: p.gold, stroke: p.soft, sw: 0.8, opacity: 0.5 }));
  }
  for (let k = 0; k < 6; k++) {
    const [dx, dy] = dir(7.5 + k * 15);
    out.push(poly(lens(ox, oy, dx, dy, 172 * s, 34 * s, 124 * s), { fill: p.rose, stroke: p.soft, sw: 0.8, opacity: 0.42 }));
  }
  for (let q = 0; q < 9; q++) {
    const [dx, dy] = dir(q * 10 + 5);
    out.push(dot(ox + dx * 186 * s, oy + dy * 186 * s, 2.6 * s + 0.6, p.rose, 0.8));
  }
  return out;
}

/** A string of bunting hung between two points. */
export function sketchBunting(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, h: number, w: number): Obj[] {
  const string = quadO([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 40);
  const out: Obj[] = [poly(string, { stroke: p.ink, sw: 1.6, closed: false, opacity: 0.85 })];
  const colours = [p.main, p.gold, p.rose, p.leaf];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [x, y] = quadO([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100)[Math.round(t * 100)];
    out.push(poly([[x - w / 2, y], [x + w / 2, y], [x, y + h]], { fill: colours[i % colours.length], stroke: p.ink, sw: 1.3, opacity: 0.92 }));
  }
  return out;
}

/** A marigold garland hung between two points. */
export function sketchGarland(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number): Obj[] {
  const rnd = rng(11);
  const curve = quadO([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 2.2, closed: false })];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    out.push(dot(x, y + 6, 8.5 + rnd() * 3, i % 3 === 0 ? '#e8751a' : p.gold, 0.95));
    out.push(dot(x, y + 6, 3, '#a84a05', 0.7));
  }
  return out;
}

/** A leafy vine along a curve. */
export function sketchVine(p: Palette, p0: Pt, c: Pt, p1: Pt, leaves: number, size: number): Obj[] {
  const curve = quadO(p0, c, p1, 60);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 2.4, closed: false })];
  for (let i = 0; i < leaves; i++) {
    const idx = Math.round(((i + 0.6) / leaves) * 58);
    const [x, y] = curve[idx];
    const [x2, y2] = curve[idx + 1];
    const ang = Math.atan2(y2 - y, x2 - x) + (i % 2 ? 1 : -1) * 0.95;
    out.push(poly(lens(x, y, Math.cos(ang), Math.sin(ang), size, size * 0.46), { fill: i % 3 === 0 ? p.leafLight : p.leaf, stroke: p.leafDeep, sw: 0.8, opacity: 0.92 }));
  }
  return out;
}

/** A leafy wreath around an ellipse. */
export function wreath(p: Palette, cx: number, cy: number, rx: number, ry: number, n: number): Obj[] {
  const ring: Pt[] = [];
  for (let i = 0; i < 80; i++) {
    const t = (i / 80) * Math.PI * 2;
    ring.push([cx + rx * Math.cos(t), cy + ry * Math.sin(t)]);
  }
  const out: Obj[] = [poly(ring, { stroke: p.leafDeep, sw: 2.2, opacity: 0.9 })];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const x = cx + rx * Math.cos(t);
    const y = cy + ry * Math.sin(t);
    const tx = -rx * Math.sin(t);
    const ty = ry * Math.cos(t);
    const base = Math.atan2(ty, tx);
    const ang = base + (i % 2 ? 0.7 : -0.7);
    out.push(poly(lens(x, y, Math.cos(ang), Math.sin(ang), 46, 19), { fill: i % 3 === 0 ? p.leafLight : p.leaf, stroke: p.leafDeep, sw: 0.9, opacity: 0.93 }));
    if (i % 4 === 0) out.push(dot(x + Math.cos(base) * 4, y + Math.sin(base) * 4, 7, i % 8 === 0 ? p.gold : p.rose, 0.95));
  }
  return out;
}

/** A row of small dots, used as a divider. */
export function sketchDots(p: Palette, x0: number, x1: number, y: number, colour?: string): Obj[] {
  const out: Obj[] = [];
  for (let x = x0; x <= x1; x += 14) out.push(dot(x, y, 2.2, colour ?? p.gold, 0.9));
  out.push(poly([[CX, y - 6], [CX + 6, y], [CX, y + 6], [CX - 6, y]], { fill: colour ?? p.gold }));
  return out;
}

/** The painted arch: sky, sun and hills inside a wobbly outline with an offset cobalt line. */
export function paintedArch(p: Palette, cx: number, top: number, bottom: number, w: number, withHills: boolean): Obj[] {
  const r = w / 2;
  const rnd = rng(23);
  const outline = (dx: number, dy: number): Pt[] => {
    const pts: Pt[] = [[cx - r + dx, bottom + dy]];
    for (let i = 0; i <= 36; i++) {
      const t = Math.PI + (i / 36) * Math.PI;
      pts.push([cx + r * Math.cos(t) + dx + (rnd() - 0.5) * 1.6, top + r + r * Math.sin(t) + dy + (rnd() - 0.5) * 1.6]);
    }
    pts.push([cx + r + dx, bottom + dy]);
    return pts;
  };
  const out: Obj[] = [poly(outline(0, 0), { fill: p.sky })];
  out.push(dot(cx + r * 0.45, top + r * 0.4, 52, p.gold, 0.22));
  out.push(dot(cx + r * 0.45, top + r * 0.4, 30, p.gold, 0.95));
  if (withHills) {
    const hill = (base: number, amp: number, phase: number, fill: string, op: number): Obj => {
      const pts: Pt[] = [];
      for (let x = cx - r + 4; x <= cx + r - 4; x += 8) pts.push([x, base - amp * Math.sin((x - cx) / 62 + phase)]);
      pts.push([cx + r - 4, bottom - 2], [cx - r + 4, bottom - 2]);
      return poly(pts, { fill, opacity: op });
    };
    out.push(hill(bottom - 58, 16, 0.4, p.leafLight, 0.95));
    out.push(hill(bottom - 30, 14, 2.2, p.leaf, 0.95));
  }
  out.push(poly(outline(5, 5), { stroke: p.main, sw: 3, closed: false, opacity: 0.5 }));
  out.push(poly(outline(0, 0), { stroke: p.ink, sw: 4, opacity: 0.95 }));
  return out;
}

// ----------------------------------------------------------------------------
// The original six layouts
// ----------------------------------------------------------------------------
export type SketchLayout = 'bunting' | 'mandala' | 'arch' | 'wreath' | 'garland' | 'vinebor';

import { CX, H, W, rect, textBlock, type BlockStyle, type Copy } from './kit';

let blockOverride: Partial<BlockStyle> = {};
const textBlockOrig = (p: Palette, c: Copy, ys: Parameters<typeof textBlock>[1], namesSize = 62, lineWidth = 420): Obj[] =>
  textBlock(c, ys, { ink: p.ink, soft: p.soft, main: p.main, nameSize: namesSize, lineWidth, ...blockOverride });

export function sketchLayout(layout: SketchLayout, p: Palette, c: Copy, style: Partial<BlockStyle> = {}): Obj[] {
  blockOverride = style;
  const bg: Obj[] = [rect(CX, H / 2, W, H, p.paper)];

  if (layout === 'bunting') {
    return [
      ...bg,
      ...sketchWashes(p, [[60, 330, 120, 'wash'], [560, 520, 110, 'gold'], [140, 690, 100, 'leafLight']]),
      ...mandalaCorner(p, 0, H, 1, -1, 0.82),
      ...mandalaCorner(p, W, H, -1, -1, 0.82),
      ...sketchBunting(p, 24, 52, 576, 52, 54, 12, 36, 30),
      sketchBrush(p, CX, 292, 470, 92, 5, p.wash, 0.55),
      ...textBlockOrig(p, c, { label: 182, names: 292, line: 398, date: 492, time: 530, venue: 596, address: 630 }),
      ...sketchDots(p, 190, 410, 452),
      ...sketchGarland(p, 70, 748, 530, 748, 30, 24),
    ];
  }

  if (layout === 'mandala') {
    const frame1 = wobbleRect(24, 24, W - 48, H - 48, 1.6, 7);
    const frame2 = wobbleRect(38, 38, W - 76, H - 76, 1.4, 9);
    return [
      ...bg,
      ...sketchWashes(p, [[300, 380, 170, 'wash'], [90, 120, 80, 'gold'], [520, 700, 90, 'rose']]),
      poly(frame1, { stroke: p.gold, sw: 3, opacity: 0.95 }),
      poly(frame2, { stroke: p.ink, sw: 1.2, opacity: 0.55 }),
      ...mandalaCorner(p, 0, 0, 1, 1, 0.88),
      ...mandalaCorner(p, W, 0, -1, 1, 0.88),
      ...mandalaCorner(p, 0, H, 1, -1, 0.62),
      ...mandalaCorner(p, W, H, -1, -1, 0.62),
      sketchBrush(p, CX, 300, 430, 86, 13, p.gold, 0.4),
      ...textBlockOrig(p, c, { label: 205, names: 300, line: 402, date: 500, time: 538, venue: 602, address: 636 }, 62, 380),
      ...sketchDots(p, 200, 400, 456, p.rose),
    ];
  }

  if (layout === 'arch') {
    return [
      ...bg,
      ...sketchWashes(p, [[80, 560, 110, 'wash'], [540, 640, 100, 'leafLight']]),
      ...paintedArch(p, CX, 46, 470, 420, true),
      ...textBlockOrig(p, c, { label: 214, names: 296, line: 584, date: 632, time: 666, venue: 712, address: 744 }, 58, 440),
      ...sketchDots(p, 210, 390, 520),
    ];
  }

  if (layout === 'garland') {
    return [
      ...bg,
      ...sketchWashes(p, [[70, 360, 110, 'wash'], [550, 560, 120, 'leafLight'], [300, 780, 110, 'rose']]),
      ...sketchGarland(p, -10, 34, 610, 34, 46, 30),
      ...sketchGarland(p, -10, 34, 610, 34, 88, 30),
      ...sketchVine(p, [26, 796], [70, 700], [34, 610], 9, 32),
      ...sketchVine(p, [574, 796], [530, 700], [566, 610], 9, 32),
      sketchBrush(p, CX, 300, 450, 90, 21, p.wash, 0.5),
      ...textBlockOrig(p, c, { label: 206, names: 300, line: 402, date: 502, time: 540, venue: 606, address: 640 }),
      ...sketchDots(p, 200, 400, 460),
    ];
  }

  if (layout === 'vinebor') {
    return [
      ...bg,
      ...sketchWashes(p, [[300, 400, 190, 'wash'], [70, 130, 80, 'gold'], [540, 690, 90, 'rose']]),
      ...sketchVine(p, [46, 772], [-26, 420], [46, 38], 17, 36),
      ...sketchVine(p, [554, 772], [626, 420], [554, 38], 17, 36),
      ...sketchDots(p, 236, 364, 96),
      sketchBrush(p, CX, 292, 360, 88, 29, p.gold, 0.4),
      ...textBlockOrig(p, c, { label: 178, names: 292, line: 392, date: 494, time: 532, venue: 598, address: 632 }, 56, 340),
      ...sketchDots(p, 200, 400, 452, p.rose),
    ];
  }

  // wreath
  return [
    ...bg,
    ...sketchWashes(p, [[60, 80, 100, 'wash'], [550, 180, 90, 'gold'], [300, 720, 130, 'leafLight']]),
    ...wreath(p, CX, 285, 240, 168, 30),
    sketchBrush(p, CX, 286, 330, 84, 17, p.wash, 0.5),
    ...textBlockOrig(p, c, { label: 222, names: 286, line: 352, date: 530, time: 566, venue: 628, address: 662 }, 56, 340),
    ...sketchDots(p, 200, 400, 494),
    ...sketchVine(p, [60, 760], [300, 700], [540, 760], 14, 36),
  ];
}
