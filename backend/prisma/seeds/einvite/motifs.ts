// ============================================================================
// Ornament library: flowers, leaves, borders, architecture and objects.
// Everything returns Fabric objects in page coordinates (600 x 800).
// ============================================================================
import {
  CX,
  H,
  W,
  dot,
  dropD,
  ellD,
  grad,
  petalD,
  poly,
  radial,
  rng,
  shape,
  r1,
  type Fill,
  type Obj,
  type Palette,
  type Pt,
} from './kit';

const rad = (deg: number) => (deg * Math.PI) / 180;

/** Samples a quadratic curve. */
export function quadPts(p0: Pt, c: Pt, p1: Pt, n = 60): Pt[] {
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

// ----------------------------------------------------------------------------
// Generic radial pieces
// ----------------------------------------------------------------------------

/** Petals radiating from one point. angles are degrees (0 = right, -90 = up, clockwise positive). */
export function fan(
  x: number, y: number, count: number, from: number, to: number, len: number, wid: number,
  fill: string, stroke?: string, opacity = 1, sw = 1,
): Obj[] {
  const out: Obj[] = [];
  for (let k = 0; k < count; k++) {
    const ang = count === 1 ? (from + to) / 2 : from + ((to - from) * k) / (count - 1);
    out.push(shape(petalD(len, wid), { x, y, rot: ang }, { fill, stroke: stroke ?? null, sw: stroke ? sw : 0, opacity }));
  }
  return out;
}

/** A full ring of petals around a centre, starting `r0` away from it. */
export function petalRing(
  cx: number, cy: number, n: number, r0: number, len: number, wid: number,
  fill: string, stroke?: string, opacity = 1, offsetDeg = 0, sw = 1,
): Obj[] {
  const out: Obj[] = [];
  for (let k = 0; k < n; k++) {
    const ang = offsetDeg + (360 * k) / n;
    const x = cx + Math.cos(rad(ang)) * r0;
    const y = cy + Math.sin(rad(ang)) * r0;
    out.push(shape(petalD(len, wid), { x, y, rot: ang }, { fill, stroke: stroke ?? null, sw: stroke ? sw : 0, opacity }));
  }
  return out;
}

export function star(cx: number, cy: number, R: number, r: number, n = 5, rotDeg = -90): Pt[] {
  const pts: Pt[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rr = i % 2 === 0 ? R : r;
    const a = rad(rotDeg + (i * 180) / n);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return pts;
}

export function sparkle(cx: number, cy: number, R: number, fill: string, opacity = 1): Obj {
  return poly(
    [[cx, cy - R], [cx + R * 0.16, cy - R * 0.16], [cx + R, cy], [cx + R * 0.16, cy + R * 0.16], [cx, cy + R], [cx - R * 0.16, cy + R * 0.16], [cx - R, cy], [cx - R * 0.16, cy - R * 0.16]],
    { fill, opacity },
  );
}

export function heart(cx: number, cy: number, s: number, fill: string, opacity = 1, rot = 0): Obj {
  return shape('M0 0.9 C-1.3 -0.1 -0.7 -1 0 -0.4 C0.7 -1 1.3 -0.1 0 0.9 Z', { x: cx, y: cy, s, rot }, { fill, opacity });
}

/** A crescent moon: outer circle R minus an inner circle of radius r2 whose centre is d to the right. */
export function crescent(cx: number, cy: number, R: number, r2: number, d: number, fill: string, rotDeg = 0, opacity = 1): Obj {
  const x0 = (d * d + R * R - r2 * r2) / (2 * d);
  const y0 = Math.sqrt(Math.max(0, R * R - x0 * x0));
  const a1 = Math.atan2(-y0, x0);
  const a2 = Math.atan2(y0, x0);
  const pts: Pt[] = [];
  const n = 40;
  // outer arc, the long way round through the left
  const start = a1;
  const end = a2 - 2 * Math.PI;
  for (let i = 0; i <= n; i++) {
    const a = start + ((end - start) * i) / n;
    pts.push([R * Math.cos(a), R * Math.sin(a)]);
  }
  // inner arc back
  const b1 = Math.atan2(y0, x0 - d);
  const b2 = Math.atan2(-y0, x0 - d);
  const endB = b2 < b1 ? b2 + 2 * Math.PI : b2;
  for (let i = 0; i <= n; i++) {
    const a = b1 + ((endB - b1) * i) / n;
    pts.push([d + r2 * Math.cos(a), r2 * Math.sin(a)]);
  }
  const t = rad(rotDeg);
  const moved = pts.map((p): Pt => [cx + p[0] * Math.cos(t) - p[1] * Math.sin(t), cy + p[0] * Math.sin(t) + p[1] * Math.cos(t)]);
  return poly(moved, { fill, opacity });
}

export function sunburst(cx: number, cy: number, r1_: number, r2_: number, n: number, fill: string, opacity = 1): Obj[] {
  const out: Obj[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k * 2 * Math.PI) / n;
    const w = Math.PI / n * 0.55;
    out.push(
      poly(
        [
          [cx + Math.cos(a - w) * r1_, cy + Math.sin(a - w) * r1_],
          [cx + Math.cos(a) * r2_, cy + Math.sin(a) * r2_],
          [cx + Math.cos(a + w) * r1_, cy + Math.sin(a + w) * r1_],
        ],
        { fill, opacity },
      ),
    );
  }
  return out;
}

export function cloud(x: number, y: number, s: number, fill = '#ffffff', opacity = 0.95): Obj[] {
  return [
    shape('M-60 0 C-90 0 -90 -34 -56 -34 C-54 -64 -6 -70 6 -42 C26 -66 70 -52 62 -24 C92 -22 90 0 60 0 Z', { x, y, s }, { fill, opacity }),
  ];
}

// ----------------------------------------------------------------------------
// Flowers
// ----------------------------------------------------------------------------
export function marigold(x: number, y: number, r: number, p: Palette, dark = '#a84a05'): Obj[] {
  return [
    ...petalRing(x, y, 14, r * 0.12, r * 0.92, r * 0.5, '#e8751a', '#c85f10', 0.97, 0, 0.6),
    ...petalRing(x, y, 11, r * 0.1, r * 0.66, r * 0.42, p.gold, undefined, 0.97, 16),
    dot(x, y, r * 0.2, dark, 0.85),
  ];
}

export function rose(x: number, y: number, r: number, c: string, dark: string, light: string): Obj[] {
  const spiral: Pt[] = [];
  for (let i = 0; i <= 60; i++) {
    const t = (i / 60) * Math.PI * 5.2;
    const rr = r * (0.08 + (0.62 * i) / 60);
    spiral.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr * 0.92]);
  }
  return [
    dot(x, y, r, dark, 0.95),
    dot(x - r * 0.04, y - r * 0.04, r * 0.88, c, 1),
    dot(x + r * 0.08, y + r * 0.02, r * 0.55, light, 0.55),
    poly(spiral, { stroke: dark, sw: Math.max(1.2, r * 0.07), closed: false, opacity: 0.85 }),
    ...[0, 1, 2, 3, 4].map((k) =>
      shape('M0 0 C8 -10 22 -10 30 0', { x: x + Math.cos(rad(k * 72 + 20)) * r * 0.62, y: y + Math.sin(rad(k * 72 + 20)) * r * 0.62, s: r / 32, rot: k * 72 + 110 }, { stroke: dark, sw: 1.1, opacity: 0.6, closed: false }),
    ),
  ];
}

/** A lotus: back petals, front petals, and a small seed centre. base = bottom centre. */
export function lotus(x: number, base: number, w: number, c1: string, c2: string, line: string): Obj[] {
  const len = w * 0.62;
  const out: Obj[] = [];
  out.push(...fan(x, base, 5, -158, -22, len * 0.95, w * 0.2, c2, line, 0.92, 1));
  out.push(...fan(x, base, 3, -128, -52, len, w * 0.24, c1, line, 1, 1.1));
  out.push(shape(petalD(len * 1.02, w * 0.25), { x, y: base, rot: -90 }, { fill: c1, stroke: line, sw: 1.2 }));
  out.push(shape('M-34 0 C-22 12 22 12 34 0 C20 8 -20 8 -34 0 Z', { x, y: base + 2, s: w / 70 }, { fill: c2, opacity: 0.7 }));
  return out;
}

/** A hibiscus / simple five-petal flower. */
export function blossom(x: number, y: number, r: number, c: string, centre: string, rotDeg = 0, line?: string): Obj[] {
  return [
    ...petalRing(x, y, 5, r * 0.1, r, r * 0.78, c, line, 1, rotDeg, 1),
    dot(x, y, r * 0.2, centre, 1),
    ...[0, 1, 2, 3, 4].map((k) => dot(x + Math.cos(rad(rotDeg + k * 72 + 36)) * r * 0.32, y + Math.sin(rad(rotDeg + k * 72 + 36)) * r * 0.32, r * 0.045, centre, 0.8)),
  ];
}

export function jasmineString(x0: number, y0: number, x1: number, y1: number, sag: number, n: number, p: Palette, seed = 3): Obj[] {
  const rnd = rng(seed);
  const curve = quadPts([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 1.4, closed: false, opacity: 0.8 })];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    out.push(...blossom(x, y + 5, 7 + rnd() * 2, '#ffffff', p.gold, rnd() * 72, '#cfd6c0'));
  }
  return out;
}

export function garland(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, seed = 11): Obj[] {
  const rnd = rng(seed);
  const curve = quadPts([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 2.2, closed: false })];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    out.push(...marigold(x, y + 6, 9 + rnd() * 3, p));
  }
  return out;
}

// ----------------------------------------------------------------------------
// Leaves
// ----------------------------------------------------------------------------
/** A curved stem with leaves along it. */
export function sprig(p0: Pt, c: Pt, p1: Pt, leaves: number, size: number, leaf: string, leaf2: string, stroke: string, round = false): Obj[] {
  const curve = quadPts(p0, c, p1, 60);
  const out: Obj[] = [poly(curve, { stroke, sw: 2.2, closed: false })];
  for (let i = 0; i < leaves; i++) {
    const idx = Math.round(((i + 0.6) / leaves) * 58);
    const [x, y] = curve[idx];
    const [x2, y2] = curve[idx + 1];
    const base = Math.atan2(y2 - y, x2 - x);
    const ang = base + (i % 2 ? 1 : -1) * 0.95;
    const sz = size * (1 - (idx / 60) * 0.35);
    out.push(
      round
        ? shape(petalD(sz, sz * 0.9, 0.9), { x, y, rot: (ang * 180) / Math.PI }, { fill: i % 3 === 0 ? leaf2 : leaf, stroke, sw: 0.6, opacity: 0.95 })
        : shape(petalD(sz, sz * 0.46), { x, y, rot: (ang * 180) / Math.PI }, { fill: i % 3 === 0 ? leaf2 : leaf, stroke, sw: 0.8, opacity: 0.95 }),
    );
  }
  return out;
}

export function vine(p: Palette, p0: Pt, c: Pt, p1: Pt, leaves: number, size: number): Obj[] {
  return sprig(p0, c, p1, leaves, size, p.leaf, p.leafLight, p.leafDeep);
}

/** A palm frond: curved midrib with leaflets on both sides. rotDeg turns the whole frond around its base. */
export function palm(x: number, y: number, len: number, bend: number, rotDeg: number, fill: string, fill2: string, rib: string): Obj[] {
  const out: Obj[] = [];
  const pts = quadPts([0, 0], [len * 0.5, -bend], [len, 0], 40);
  const t = (p: Pt): Pt => {
    const a = rad(rotDeg);
    return [x + p[0] * Math.cos(a) - p[1] * Math.sin(a), y + p[0] * Math.sin(a) + p[1] * Math.cos(a)];
  };
  const n = 15;
  for (let i = 1; i <= n; i++) {
    const idx = Math.round((i / (n + 1)) * 40);
    const [px, py] = pts[idx];
    const [qx, qy] = pts[Math.min(40, idx + 1)];
    const base = Math.atan2(qy - py, qx - px);
    const size = len * 0.34 * (1 - Math.abs(i - n * 0.45) / (n * 0.9));
    for (const side of [-1, 1]) {
      const ang = base + side * (1.0 - 0.0 * i);
      const [sx, sy] = t([px, py]);
      out.push(shape(petalD(size, size * 0.2), { x: sx, y: sy, rot: ((ang * 180) / Math.PI) + rotDeg }, { fill: side < 0 ? fill : fill2, opacity: 0.97 }));
    }
  }
  out.push(poly(pts.map(t), { stroke: rib, sw: 2.4, closed: false }));
  return out;
}

/** A big tropical leaf with a midrib and veins. */
export function bigLeaf(x: number, y: number, len: number, wid: number, rotDeg: number, fill: string, vein: string, opacity = 1): Obj[] {
  const out: Obj[] = [shape(petalD(len, wid, 0.7), { x, y, rot: rotDeg }, { fill, opacity })];
  out.push(shape(`M0 0 L${len * 0.96} 0`, { x, y, rot: rotDeg }, { stroke: vein, sw: 1.8, closed: false, opacity: 0.8 }));
  for (let i = 1; i < 6; i++) {
    const px = (len * i) / 6.4;
    const h = wid * 0.42 * Math.sin((Math.PI * i) / 6.4);
    out.push(shape(`M${px} 0 L${px + len * 0.12} ${-h}`, { x, y, rot: rotDeg }, { stroke: vein, sw: 1, closed: false, opacity: 0.55 }));
    out.push(shape(`M${px} 0 L${px + len * 0.12} ${h}`, { x, y, rot: rotDeg }, { stroke: vein, sw: 1, closed: false, opacity: 0.55 }));
  }
  return out;
}

/** Eucalyptus-style stem with round leaves. */
export function eucalyptus(p0: Pt, c: Pt, p1: Pt, n: number, size: number, c1: string, c2: string, stem: string): Obj[] {
  const curve = quadPts(p0, c, p1, 60);
  const out: Obj[] = [poly(curve, { stroke: stem, sw: 2, closed: false })];
  for (let i = 0; i < n; i++) {
    const idx = Math.round(((i + 0.5) / n) * 58);
    const [x, y] = curve[idx];
    const [x2, y2] = curve[idx + 1];
    const base = Math.atan2(y2 - y, x2 - x);
    const side = i % 2 ? 1 : -1;
    const s = size * (0.55 + 0.45 * Math.sin((Math.PI * (i + 0.5)) / n));
    const ax = x + Math.cos(base + side * 1.1) * s * 0.9;
    const ay = y + Math.sin(base + side * 1.1) * s * 0.9;
    out.push(shape(ellD(0, 0, s, s * 0.82), { x: ax, y: ay }, { fill: i % 2 ? c1 : c2, opacity: 0.93 }));
    out.push(shape(`M${x} ${y} L${ax} ${ay}`, {}, { stroke: stem, sw: 1, closed: false, opacity: 0.8 }));
  }
  return out;
}

/** A hanging mango-leaf toran across the top of the page, with marigold beads. */
export function toran(p: Palette, x0: number, x1: number, y: number, sag: number, n: number, leafLen = 54): Obj[] {
  const curve = quadPts([x0, y], [(x0 + x1) / 2, y + 2 * sag], [x1, y], 120);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 2.4, closed: false })];
  for (let i = 0; i < n; i++) {
    const [x, yy] = curve[Math.round(((i + 0.5) / n) * 120)];
    out.push(shape(petalD(leafLen, leafLen * 0.34), { x, y: yy, rot: 90 }, { fill: i % 2 ? p.leaf : p.leafLight, stroke: p.leafDeep, sw: 0.9, opacity: 0.97 }));
    out.push(shape(`M0 0 L${leafLen * 0.9} 0`, { x, y: yy, rot: 90 }, { stroke: p.leafDeep, sw: 0.8, closed: false, opacity: 0.55 }));
    if (i % 3 === 1) out.push(...marigold(x + (x1 - x0) / (2 * n), yy + 6, 7.5, p));
  }
  return out;
}

// ----------------------------------------------------------------------------
// Mandalas and ornaments
// ----------------------------------------------------------------------------
export interface MandalaOpts {
  c1: string;
  c2: string;
  c3: string;
  line: string;
  dots?: string;
  opacity?: number;
}

/** A full round mandala made of rings of petals, dots and circles. */
export function mandala(cx: number, cy: number, R: number, o: MandalaOpts): Obj[] {
  const op = o.opacity ?? 1;
  return [
    dot(cx, cy, R, o.c3, 0.18 * op),
    ...petalRing(cx, cy, 24, R * 0.62, R * 0.38, R * 0.1, o.c3, o.line, 0.9 * op, 0, 0.6),
    ...petalRing(cx, cy, 16, R * 0.4, R * 0.34, R * 0.16, o.c1, o.line, 0.95 * op, 11.25, 0.7),
    dot(cx, cy, R * 0.43, 'rgba(0,0,0,0)', 1, o.line, 1),
    ...petalRing(cx, cy, 12, R * 0.17, R * 0.27, R * 0.17, o.c2, o.line, 0.97 * op, 0, 0.8),
    ...petalRing(cx, cy, 8, R * 0.1, R * 0.17, R * 0.09, o.c1, o.line, 1 * op, 22.5, 0.7),
    dot(cx, cy, R * 0.07, o.c3, op, o.line, 1),
    ...Array.from({ length: 36 }, (_, k) =>
      dot(cx + Math.cos(rad(k * 10)) * R * 1.0, cy + Math.sin(rad(k * 10)) * R * 1.0, R * 0.016 + 0.8, o.dots ?? o.c2, 0.9 * op),
    ),
    dot(cx, cy, R, 'rgba(0,0,0,0)', 1, o.line, 1.2),
  ];
}

/** A quarter rangoli growing out of a corner (sx, sy = +-1 point into the page). */
export function rangoliCorner(p: Palette, ox: number, oy: number, sx: number, sy: number, s: number, c1?: string, c2?: string): Obj[] {
  const out: Obj[] = [];
  const dir = (deg: number): [number, number] => [sx * Math.cos(rad(deg)), sy * Math.sin(rad(deg))];
  const a = c1 ?? p.gold;
  const b = c2 ?? p.rose;
  out.push(dot(ox, oy, 38 * s, p.wash, 0.5));
  out.push(dot(ox, oy, 20 * s, a, 0.6));
  for (let k = 0; k < 7; k++) {
    const [dx, dy] = dir(6.4 + k * 12.86);
    out.push(shape(petalD(122 * s, 30 * s), { x: ox + dx * 70 * s, y: oy + dy * 70 * s, rot: (Math.atan2(dy, dx) * 180) / Math.PI }, { fill: a, stroke: p.soft, sw: 0.8, opacity: 0.55 }));
  }
  for (let k = 0; k < 6; k++) {
    const [dx, dy] = dir(7.5 + k * 15);
    out.push(shape(petalD(172 * s - 124 * s, 34 * s), { x: ox + dx * 124 * s, y: oy + dy * 124 * s, rot: (Math.atan2(dy, dx) * 180) / Math.PI }, { fill: b, stroke: p.soft, sw: 0.8, opacity: 0.5 }));
  }
  for (let q = 0; q < 9; q++) {
    const [dx, dy] = dir(q * 10 + 5);
    out.push(dot(ox + dx * 186 * s, oy + dy * 186 * s, 2.6 * s + 0.6, b, 0.85));
  }
  return out;
}

/** A paisley (teardrop with a curl and dots), pointing up from its base at (x, y). */
export function paisley(x: number, y: number, s: number, rotDeg: number, c1: string, c2: string, line: string): Obj[] {
  const t = { x, y, s, rot: rotDeg };
  return [
    shape('M0 0 C-30 -8 -34 -52 -6 -84 C6 -98 24 -92 22 -76 C20 -62 8 -64 6 -52 C16 -40 28 -18 0 0 Z', t, { fill: c1, stroke: line, sw: 1.2 }),
    shape('M0 -8 C-18 -14 -20 -44 -4 -64 C6 -72 14 -66 12 -58 C16 -46 18 -26 0 -8 Z', t, { fill: c2, opacity: 0.95 }),
    shape(ellD(-2, -34, 5, 5), t, { fill: c1, opacity: 0.9 }),
    shape(ellD(-3, -50, 3, 3), t, { fill: c1, opacity: 0.9 }),
  ];
}

/** A row of repeated pieces along a baseline: pass a builder that draws one piece at (x, y). */
export function repeatRow(x0: number, x1: number, y: number, step: number, build: (x: number, y: number, i: number) => Obj[]): Obj[] {
  const out: Obj[] = [];
  let i = 0;
  for (let x = x0; x <= x1 + 0.1; x += step) out.push(...build(x, y, i++));
  return out;
}

/** Scalloped (half-circle) border along a horizontal edge. dir 1 = scallops hang down, -1 = point up. */
export function scallopRow(x0: number, x1: number, y: number, r: number, fill: string, line: string, dir: 1 | -1 = 1): Obj[] {
  const out: Obj[] = [];
  for (let x = x0 + r; x <= x1 - r + 0.1; x += r * 2) {
    out.push(shape(`M${-r} 0 C${-r} ${dir * r * 1.35} ${r} ${dir * r * 1.35} ${r} 0 Z`, { x, y }, { fill, stroke: line, sw: 1.2 }));
  }
  return out;
}

/** Row of pointed arches along a baseline, like a temple frieze. */
export function archRow(x0: number, x1: number, y: number, w: number, h: number, fill: string, line: string, inner?: string): Obj[] {
  const out: Obj[] = [];
  for (let x = x0; x + w <= x1 + 0.1; x += w) {
    out.push(shape(`M0 0 L0 ${-h * 0.55} C0 ${-h * 0.8} ${w * 0.4} ${-h * 0.92} ${w * 0.5} ${-h} C${w * 0.6} ${-h * 0.92} ${w} ${-h * 0.8} ${w} ${-h * 0.55} L${w} 0 Z`, { x, y }, { fill, stroke: line, sw: 1.2 }));
    if (inner) {
      out.push(shape(`M0 0 L0 ${-h * 0.5} C0 ${-h * 0.68} ${w * 0.3} ${-h * 0.78} ${w * 0.4} ${-h * 0.84} C${w * 0.5} ${-h * 0.78} ${w * 0.8} ${-h * 0.68} ${w * 0.8} ${-h * 0.5} L${w * 0.8} 0 Z`, { x: x + w * 0.1, y }, { fill: inner, opacity: 0.9 }));
    }
  }
  return out;
}

export function zigzag(x0: number, x1: number, y: number, h: number, step: number, fill: string, opacity = 1, flip = false): Obj[] {
  const out: Obj[] = [];
  for (let x = x0; x < x1; x += step) {
    out.push(poly(flip ? [[x, y + h], [x + step / 2, y], [x + step, y + h]] : [[x, y], [x + step / 2, y + h], [x + step, y]], { fill, opacity }));
  }
  return out;
}

export function diamondBand(x0: number, x1: number, y: number, s: number, c1: string, c2: string): Obj[] {
  const out: Obj[] = [];
  let i = 0;
  for (let x = x0 + s; x <= x1; x += s * 2) {
    out.push(poly([[x, y - s], [x + s, y], [x, y + s], [x - s, y]], { fill: i % 2 ? c1 : c2 }));
    out.push(dot(x, y, s * 0.28, i % 2 ? c2 : c1, 1));
    i++;
  }
  return out;
}

/** A clean rectangular frame with a quarter-circle flourish in each corner. */
export function frame(inset: number, line: string, sw: number, opacity = 1, radius = 0): Obj {
  const x0 = inset;
  const y0 = inset;
  const x1 = W - inset;
  const y1 = H - inset;
  if (!radius) return poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], { stroke: line, sw, opacity });
  return shape(
    `M${x0 + radius} ${y0} L${x1 - radius} ${y0} Q${x1} ${y0} ${x1} ${y0 + radius} L${x1} ${y1 - radius} Q${x1} ${y1} ${x1 - radius} ${y1} L${x0 + radius} ${y1} Q${x0} ${y1} ${x0} ${y1 - radius} L${x0} ${y0 + radius} Q${x0} ${y0} ${x0 + radius} ${y0} Z`,
    {}, { stroke: line, sw, opacity },
  );
}

/** Ornate corner: quarter circles, a leaf and dots. (ox, oy) is the page corner, sx/sy point inward. */
export function cornerFlourish(ox: number, oy: number, sx: number, sy: number, s: number, c1: string, c2: string): Obj[] {
  const t = { x: ox, y: oy, sx: sx * s, sy: sy * s };
  return [
    shape('M0 70 C0 30 30 0 70 0', t, { stroke: c1, sw: 2.2 / s, closed: false }),
    shape('M0 52 C0 24 24 0 52 0', t, { stroke: c1, sw: 1.2 / s, closed: false, opacity: 0.8 }),
    shape('M6 6 C22 14 38 34 38 56 C20 50 8 30 6 6 Z', t, { fill: c2, opacity: 0.9 }),
    shape('M6 6 C14 22 34 38 56 38 C50 20 30 8 6 6 Z', t, { fill: c2, opacity: 0.75 }),
    dot(ox + sx * 14 * s, oy + sy * 14 * s, 5 * s, c1, 0.95),
    dot(ox + sx * 82 * s, oy + sy * 6 * s, 2.6 * s, c1, 0.9),
    dot(ox + sx * 6 * s, oy + sy * 82 * s, 2.6 * s, c1, 0.9),
  ];
}

// ----------------------------------------------------------------------------
// Objects
// ----------------------------------------------------------------------------
export function bunting(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, h: number, w: number, colors?: string[]): Obj[] {
  const curve = quadPts([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: p.ink, sw: 1.6, closed: false, opacity: 0.85 })];
  const cols = colors ?? [p.main, p.gold, p.rose, p.leaf];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    out.push(poly([[x - w / 2, y], [x + w / 2, y], [x, y + h]], { fill: cols[i % cols.length], stroke: p.ink, sw: 1.3, opacity: 0.93 }));
  }
  return out;
}

export function balloon(x: number, y: number, r: number, color: string, string_ = 90, lean = 0): Obj[] {
  const ry = r * 1.18;
  const knotY = y + ry;
  return [
    shape(`M${x} ${knotY + 2} C${x + lean * 0.4} ${knotY + string_ * 0.35} ${x - lean} ${knotY + string_ * 0.65} ${x + lean * 0.5} ${knotY + string_}`, {}, { stroke: '#6b6f80', sw: 1.4, closed: false, opacity: 0.8 }),
    shape(ellD(0, 0, r, ry), { x, y }, { fill: color }),
    poly([[x, knotY - 1], [x - r * 0.12, knotY + r * 0.16], [x + r * 0.12, knotY + r * 0.16]], { fill: color }),
    shape(ellD(0, 0, r * 0.14, r * 0.3), { x: x - r * 0.45, y: y - r * 0.42, rot: 28 }, { fill: '#ffffff', opacity: 0.55 }),
  ];
}

export function confetti(seed: number, count: number, x0: number, y0: number, x1: number, y1: number, colors: string[], skip?: (x: number, y: number) => boolean): Obj[] {
  const rnd = rng(seed);
  const out: Obj[] = [];
  for (let i = 0; i < count; i++) {
    const x = x0 + rnd() * (x1 - x0);
    const y = y0 + rnd() * (y1 - y0);
    if (skip?.(x, y)) continue;
    const c = colors[Math.floor(rnd() * colors.length)];
    const k = rnd();
    if (k < 0.34) out.push(dot(x, y, 2.4 + rnd() * 2.6, c, 0.9));
    else if (k < 0.68) out.push(shape('M-5 -2 L5 -2 L5 2 L-5 2 Z', { x, y, rot: rnd() * 180 }, { fill: c, opacity: 0.9 }));
    else out.push(poly(star(x, y, 5 + rnd() * 3, 2.4, 5, rnd() * 72), { fill: c, opacity: 0.9 }));
  }
  return out;
}

/** An oil lamp with a flame and a soft glow. */
export function diya(x: number, y: number, s: number, bowl: string, trim: string): Obj[] {
  return [
    dot(x, y - 14 * s, 46 * s, radial([[0, 'rgba(255,214,102,0.75)'], [1, 'rgba(255,214,102,0)']]), 1),
    shape('M-30 0 C-30 26 -12 34 0 34 C12 34 30 26 30 0 Q0 -10 -30 0 Z', { x, y, s }, { fill: bowl }),
    shape('M-30 0 Q0 -12 30 0 Q0 8 -30 0 Z', { x, y, s }, { fill: trim }),
    shape('M0 -2 C-10 -14 -9 -30 0 -48 C9 -30 10 -14 0 -2 Z', { x, y, s }, { fill: grad([[0, '#ffe27a'], [1, '#f26a1b']], 'up') }),
    shape('M0 -4 C-4 -12 -3 -22 0 -32 C3 -22 4 -12 0 -4 Z', { x, y, s }, { fill: '#fff6c7', opacity: 0.9 }),
    shape('M-24 3 Q0 -2 24 3', { x, y, s }, { stroke: trim, sw: 1.2, closed: false, opacity: 0.8 }),
  ];
}

export function lantern(x: number, y: number, s: number, c1: string, c2: string, line: string): Obj[] {
  return [
    shape(`M0 -60 L0 -30`, { x, y, s }, { stroke: line, sw: 1.6 / s, closed: false }),
    shape('M-16 -30 L16 -30 L22 -22 L-22 -22 Z', { x, y, s }, { fill: c2, stroke: line, sw: 1 }),
    shape('M-22 -22 C-34 -4 -34 22 -20 40 L20 40 C34 22 34 -4 22 -22 Z', { x, y, s }, { fill: c1, stroke: line, sw: 1 }),
    shape('M-10 -22 C-20 -4 -20 22 -10 40 M10 -22 C20 -4 20 22 10 40 M0 -22 L0 40', { x, y, s }, { stroke: line, sw: 0.8, closed: false, opacity: 0.55 }),
    shape('M-20 40 L20 40 L14 48 L-14 48 Z', { x, y, s }, { fill: c2, stroke: line, sw: 1 }),
    shape('M-6 48 L-6 66 M0 48 L0 72 M6 48 L6 66', { x, y, s }, { stroke: c2, sw: 1.6, closed: false }),
    dot(x, y + 8 * s, 9 * s, 'rgba(255,240,170,0.7)', 1),
  ];
}

/** A kalash (auspicious pot) with mango leaves and a coconut. */
export function kalash(x: number, y: number, s: number, pot: string, trim: string, leaf: string, leafDeep: string, cloth: string): Obj[] {
  const out: Obj[] = [];
  out.push(...fan(x, y - 70 * s, 7, -160, -20, 62 * s, 22 * s, leaf, leafDeep, 0.96, 0.9));
  out.push(shape('M-26 -78 C-36 -52 -50 -36 -44 -6 C-42 18 -22 30 0 30 C22 30 42 18 44 -6 C50 -36 36 -52 26 -78 Z', { x, y, s }, { fill: pot, stroke: trim, sw: 1.4 }));
  out.push(shape('M-24 -80 L24 -80 L30 -70 L-30 -70 Z', { x, y, s }, { fill: trim }));
  out.push(shape('M-34 -40 C-14 -30 14 -30 34 -40 M-42 -10 C-18 0 18 0 42 -10', { x, y, s }, { stroke: trim, sw: 1.6, closed: false, opacity: 0.9 }));
  out.push(shape('M-36 -34 C-12 -22 12 -22 36 -34 L38 -22 C14 -10 -14 -10 -38 -22 Z', { x, y, s }, { fill: cloth, opacity: 0.95 }));
  out.push(shape(ellD(0, -92, 20, 22), { x, y, s }, { fill: '#a8672a', stroke: '#6e3f14', sw: 1.2 }));
  out.push(shape('M0 -112 C-5 -104 5 -104 0 -112 M-8 -98 L8 -98', { x, y, s }, { stroke: '#6e3f14', sw: 1, closed: false }));
  return out;
}

export function cake(x: number, y: number, s: number, c1: string, c2: string, c3: string, ink: string): Obj[] {
  return [
    shape('M-70 0 L70 0 L70 -46 L-70 -46 Z', { x, y, s }, { fill: c1, stroke: ink, sw: 1.4 }),
    shape('M-70 -46 C-60 -34 -50 -34 -40 -46 C-30 -34 -20 -34 -10 -46 C0 -34 10 -34 20 -46 C30 -34 40 -34 50 -46 C58 -36 64 -34 70 -46 Z', { x, y, s }, { fill: c3, stroke: ink, sw: 1.2 }),
    shape('M-48 -46 L48 -46 L48 -86 L-48 -86 Z', { x, y, s }, { fill: c2, stroke: ink, sw: 1.4 }),
    shape('M-48 -86 C-40 -74 -32 -74 -24 -86 C-16 -74 -8 -74 0 -86 C8 -74 16 -74 24 -86 C32 -74 40 -74 48 -86 Z', { x, y, s }, { fill: c3, stroke: ink, sw: 1.2 }),
    ...[-30, -10, 10, 30].flatMap((cx) => [
      shape(`M${cx - 4} -86 L${cx - 4} -112 L${cx + 4} -112 L${cx + 4} -86 Z`, { x, y, s }, { fill: cx % 20 === 10 ? c1 : c3, stroke: ink, sw: 1 }),
      shape(`M${cx} -114 C${cx - 7} -122 ${cx - 5} -132 ${cx} -138 C${cx + 5} -132 ${cx + 7} -122 ${cx} -114 Z`, { x, y, s }, { fill: '#ffc83d' }),
    ]),
    shape('M-86 0 L86 0', { x, y, s }, { stroke: ink, sw: 2, closed: false }),
  ];
}

export function gift(x: number, y: number, s: number, box: string, ribbon: string, ink: string): Obj[] {
  return [
    shape('M-40 0 L40 0 L40 -52 L-40 -52 Z', { x, y, s }, { fill: box, stroke: ink, sw: 1.3 }),
    shape('M-44 -52 L44 -52 L44 -68 L-44 -68 Z', { x, y, s }, { fill: box, stroke: ink, sw: 1.3 }),
    shape('M-8 -68 L8 -68 L8 0 L-8 0 Z', { x, y, s }, { fill: ribbon }),
    shape('M0 -68 C-30 -102 -50 -76 -8 -68 M0 -68 C30 -102 50 -76 8 -68', { x, y, s }, { stroke: ribbon, sw: 5, closed: false }),
  ];
}

/** Academic cap. */
export function gradCap(x: number, y: number, s: number, cap: string, tassel: string, ink: string): Obj[] {
  return [
    shape('M-30 6 L-30 34 C-14 46 14 46 30 34 L30 6 Z', { x, y, s }, { fill: cap, stroke: ink, sw: 1.3 }),
    shape('M0 -26 L70 -2 L0 22 L-70 -2 Z', { x, y, s }, { fill: cap, stroke: ink, sw: 1.5 }),
    shape('M0 -26 L70 -2 L0 22 Z', { x, y, s }, { fill: '#000000', opacity: 0.12 }),
    dot(x, y - 2 * s, 4 * s, tassel, 1),
    shape('M0 -2 L52 8 L52 40', { x, y, s }, { stroke: tassel, sw: 2.4, closed: false }),
    shape('M46 40 L58 40 L56 56 L48 56 Z', { x, y, s }, { fill: tassel }),
  ];
}

/** Open laurel branches on both sides of a point, like an award wreath. */
export function laurel(cx: number, cy: number, h: number, c1: string, c2: string, line: string): Obj[] {
  const out: Obj[] = [];
  for (const side of [-1, 1]) {
    const curve = quadPts([cx + side * 6, cy + h / 2], [cx + side * h * 0.52, cy + h * 0.12], [cx + side * h * 0.2, cy - h / 2], 50);
    out.push(poly(curve, { stroke: line, sw: 2, closed: false }));
    for (let i = 0; i < 11; i++) {
      const idx = Math.round(((i + 0.5) / 11) * 48);
      const [x, y] = curve[idx];
      const [x2, y2] = curve[idx + 1];
      const base = Math.atan2(y2 - y, x2 - x);
      for (const o of [-1, 1]) {
        out.push(shape(petalD(26, 11), { x, y, rot: ((base + o * 0.85) * 180) / Math.PI }, { fill: o < 0 ? c1 : c2, stroke: line, sw: 0.6, opacity: 0.96 }));
      }
    }
  }
  return out;
}

/** Fairy lights hanging from a curve: little bulbs with a glow. */
export function fairyLights(x0: number, y0: number, x1: number, y1: number, sag: number, n: number, colors: string[]): Obj[] {
  const curve = quadPts([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: '#3a3a4a', sw: 1.4, closed: false, opacity: 0.8 })];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    const c = colors[i % colors.length];
    out.push(dot(x, y + 12, 15, radial([[0, c], [1, 'rgba(255,255,255,0)']]), 0.7));
    out.push(shape('M0 0 L0 6', { x, y }, { stroke: '#3a3a4a', sw: 1.4, closed: false }));
    out.push(shape(ellD(0, 0, 4.4, 6.4), { x, y: y + 12 }, { fill: c }));
  }
  return out;
}

// ----------------------------------------------------------------------------
// Architecture
// ----------------------------------------------------------------------------
/** A South Indian temple tower (gopuram). Base centre at (cx, baseY). */
export function gopuram(cx: number, baseY: number, w: number, tiers: number, body: string, trim: string, line: string, door: string): Obj[] {
  const out: Obj[] = [];
  const tierH = w * 0.2;
  let y = baseY;
  let tw = w;
  out.push(shape('M-100 0 L100 0 L100 12 L-100 12 Z', { x: cx, y: baseY, s: w / 200 }, { fill: trim, stroke: line, sw: 1.2 }));
  for (let i = 0; i < tiers; i++) {
    const top = tw * 0.82;
    out.push(poly([[cx - tw / 2, y], [cx + tw / 2, y], [cx + top / 2, y - tierH], [cx - top / 2, y - tierH]], { fill: i % 2 ? body : trim, stroke: line, sw: 1.3 }));
    out.push(poly([[cx - top / 2 - 3, y - tierH], [cx + top / 2 + 3, y - tierH], [cx + top / 2 + 3, y - tierH - 5], [cx - top / 2 - 3, y - tierH - 5]], { fill: trim, stroke: line, sw: 1 }));
    // little windows
    const wc = Math.max(2, 5 - Math.floor(i / 2));
    for (let k = 0; k < wc; k++) {
      const wx = cx - (tw * 0.7) / 2 + ((k + 0.5) * (tw * 0.7)) / wc;
      out.push(shape('M-6 0 L-6 -8 Q0 -16 6 -8 L6 0 Z', { x: wx, y: y - 3, s: tw / 150 + 0.2 }, { fill: door, opacity: 0.85 }));
    }
    y -= tierH + 5;
    tw = top * 0.88;
  }
  // roof barrel and finials
  out.push(shape('M-34 0 C-34 -22 -20 -34 0 -34 C20 -34 34 -22 34 0 Z', { x: cx, y, s: tw / 56 }, { fill: trim, stroke: line, sw: 1.2 }));
  for (const dx of [-0.34, 0, 0.34]) {
    out.push(shape('M-4 0 L4 0 L2.4 -16 L-2.4 -16 Z M0 -16 C-5 -22 5 -26 0 -34', { x: cx + dx * tw * 0.9, y: y - 14, s: 1.25 }, { fill: trim, stroke: line, sw: 1.1 }));
  }
  // central gate
  out.push(shape('M-22 0 L-22 -46 Q0 -74 22 -46 L22 0 Z', { x: cx, y: baseY, s: w / 200 * 1.1 }, { fill: door, stroke: line, sw: 1.3 }));
  return out;
}

/** A Mughal palace front: onion dome, side domes, minarets and arched doors. */
export function palace(cx: number, baseY: number, w: number, body: string, dome: string, trim: string, line: string, door: string): Obj[] {
  const s = w / 300;
  const out: Obj[] = [];
  const T = { x: cx, y: baseY, s };
  // side minarets
  for (const side of [-1, 1]) {
    const mx = side * 138;
    out.push(shape(`M${mx - 9} 0 L${mx - 9} -170 L${mx + 9} -170 L${mx + 9} 0 Z`, T, { fill: body, stroke: line, sw: 1.2 / s }));
    out.push(shape(`M${mx - 13} -170 L${mx + 13} -170 L${mx + 11} -178 L${mx - 11} -178 Z`, T, { fill: trim, stroke: line, sw: 1.2 / s }));
    out.push(shape(`M${mx - 9} -178 C${mx - 12} -194 ${mx - 4} -204 ${mx} -214 C${mx + 4} -204 ${mx + 12} -194 ${mx + 9} -178 Z`, T, { fill: dome, stroke: line, sw: 1.2 / s }));
    out.push(shape(`M${mx} -214 L${mx} -228`, T, { stroke: trim, sw: 2 / s, closed: false }));
    for (const y of [-60, -110]) out.push(shape(`M${mx - 11} ${y} L${mx + 11} ${y}`, T, { stroke: trim, sw: 2 / s, closed: false }));
  }
  // main body + side wings
  out.push(shape('M-130 0 L-130 -78 L-62 -78 L-62 -118 L62 -118 L62 -78 L130 -78 L130 0 Z', T, { fill: body, stroke: line, sw: 1.4 / s }));
  // side domes
  for (const side of [-1, 1]) {
    out.push(shape(`M${side * 96 - 30} -78 C${side * 96 - 34} -108 ${side * 96 - 10} -128 ${side * 96} -138 C${side * 96 + 10} -128 ${side * 96 + 34} -108 ${side * 96 + 30} -78 Z`, T, { fill: dome, stroke: line, sw: 1.3 / s }));
    out.push(shape(`M${side * 96} -138 L${side * 96} -152`, T, { stroke: trim, sw: 2 / s, closed: false }));
  }
  // central dome
  out.push(shape('M-52 -118 C-62 -164 -26 -190 0 -228 C26 -190 62 -164 52 -118 Z', T, { fill: dome, stroke: line, sw: 1.5 / s }));
  out.push(shape('M-52 -118 L52 -118 L56 -108 L-56 -108 Z', T, { fill: trim, stroke: line, sw: 1.2 / s }));
  out.push(shape('M0 -228 L0 -262 M-8 -246 L8 -246 M-5 -256 L5 -256', T, { stroke: trim, sw: 2.2 / s, closed: false }));
  out.push(shape(ellD(0, -266, 4, 4), T, { fill: trim }));
  // dome ribs
  out.push(shape('M-26 -122 C-30 -160 -10 -184 0 -214 M26 -122 C30 -160 10 -184 0 -214 M0 -118 L0 -214', T, { stroke: line, sw: 0.9 / s, closed: false, opacity: 0.45 }));
  // arched doors
  const arch = (x: number, hh: number, ww: number) =>
    out.push(shape(`M${x - ww} 0 L${x - ww} ${-hh * 0.6} C${x - ww} ${-hh * 0.82} ${x - ww * 0.35} ${-hh * 0.9} ${x} ${-hh} C${x + ww * 0.35} ${-hh * 0.9} ${x + ww} ${-hh * 0.82} ${x + ww} ${-hh * 0.6} L${x + ww} 0 Z`, T, { fill: door, stroke: line, sw: 1.2 / s }));
  arch(0, 84, 24);
  arch(-86, 52, 14);
  arch(86, 52, 14);
  arch(-38, 40, 9);
  arch(38, 40, 9);
  return out;
}

/** A Rajasthani jharokha: a cusped arch window with pillars and small domed canopies. */
export function jharokha(cx: number, top: number, w: number, h: number, body: string, trim: string, line: string, sky: Fill): Obj[] {
  const s = w / 240;
  const T = { x: cx, y: top, s };
  const out: Obj[] = [];
  const hh = h / s;
  // outer frame with domed canopies
  out.push(shape(`M-120 ${hh} L-120 60 C-120 20 -70 8 -40 -8 L0 -34 L40 -8 C70 8 120 20 120 60 L120 ${hh} Z`, T, { fill: body, stroke: line, sw: 1.6 / s }));
  for (const side of [-1, 1]) {
    out.push(shape(`M${side * 100 - 22} 34 C${side * 100 - 26} 6 ${side * 100 - 6} -10 ${side * 100} -26 C${side * 100 + 6} -10 ${side * 100 + 26} 6 ${side * 100 + 22} 34 Z`, T, { fill: trim, stroke: line, sw: 1.3 / s }));
    out.push(shape(`M${side * 100} -26 L${side * 100} -42`, T, { stroke: line, sw: 1.6 / s, closed: false }));
  }
  out.push(shape('M-26 -8 C-34 -30 -10 -44 0 -64 C10 -44 34 -30 26 -8 Z', T, { fill: trim, stroke: line, sw: 1.3 / s }));
  out.push(shape('M0 -64 L0 -82', T, { stroke: line, sw: 1.8 / s, closed: false }));
  // inner cusped arch window
  const inner = `M-70 ${hh} L-70 90 C-70 60 -58 52 -46 44 C-38 38 -36 28 -26 24 C-16 20 -12 8 0 4 C12 8 16 20 26 24 C36 28 38 38 46 44 C58 52 70 60 70 90 L70 ${hh} Z`;
  out.push(shape(inner, T, { fill: sky, stroke: line, sw: 2 / s }));
  out.push(shape(`M-58 ${hh} L-58 94 C-58 70 -48 62 -38 56 M58 ${hh} L58 94 C58 70 48 62 38 56`, T, { stroke: trim, sw: 2.4 / s, closed: false, opacity: 0.9 }));
  // pillars + base
  for (const side of [-1, 1]) {
    out.push(shape(`M${side * 96 - 9} ${hh} L${side * 96 - 9} 70 L${side * 96 + 9} 70 L${side * 96 + 9} ${hh} Z`, T, { fill: trim, stroke: line, sw: 1.2 / s }));
  }
  out.push(shape(`M-130 ${hh} L130 ${hh} L130 ${hh + 12} L-130 ${hh + 12} Z`, T, { fill: trim, stroke: line, sw: 1.3 / s }));
  return out;
}

/** A house front with a roof, door, windows and a toran. */
export function house(x: number, baseY: number, s: number, wall: string, roof: string, door: string, trim: string, window: string, line: string): Obj[] {
  const T = { x, y: baseY, s };
  return [
    shape('M-90 0 L-90 -92 L90 -92 L90 0 Z', T, { fill: wall, stroke: line, sw: 1.6 / s }),
    shape('M-108 -90 L0 -176 L108 -90 Z', T, { fill: roof, stroke: line, sw: 1.6 / s }),
    shape('M-70 -90 L0 -148 L70 -90', T, { stroke: trim, sw: 1.4 / s, closed: false, opacity: 0.6 }),
    shape('M70 -140 L70 -176 L86 -176 L86 -124 Z', T, { fill: roof, stroke: line, sw: 1.4 / s }),
    shape('M-20 0 L-20 -52 Q0 -76 20 -52 L20 0 Z', T, { fill: door, stroke: line, sw: 1.5 / s }),
    dot(x + 10 * s, baseY - 28 * s, 2.4 * s, trim, 1),
    shape('M-72 -62 L-42 -62 L-42 -34 L-72 -34 Z', T, { fill: window, stroke: line, sw: 1.4 / s }),
    shape('M72 -62 L42 -62 L42 -34 L72 -34 Z', T, { fill: window, stroke: line, sw: 1.4 / s }),
    shape('M-57 -62 L-57 -34 M-72 -48 L-42 -48 M57 -62 L57 -34 M72 -48 L42 -48', T, { stroke: line, sw: 1 / s, closed: false, opacity: 0.7 }),
    shape('M-22 -54 C-14 -44 -6 -44 0 -54 C6 -44 14 -44 22 -54', T, { stroke: trim, sw: 2 / s, closed: false }),
  ];
}

export function skyline(baseY: number, seed: number, colors: string[], windowColor: string, minH = 60, maxH = 230): Obj[] {
  const rnd = rng(seed);
  const out: Obj[] = [];
  let x = -10;
  while (x < W + 10) {
    const w = 34 + rnd() * 46;
    const h = minH + rnd() * (maxH - minH);
    const c = colors[Math.floor(rnd() * colors.length)];
    out.push(shape(`M0 0 L0 ${-h} L${w} ${-h} L${w} 0 Z`, { x, y: baseY }, { fill: c }));
    if (rnd() > 0.55) out.push(shape(`M${w * 0.4} ${-h} L${w * 0.4} ${-h - 22} L${w * 0.6} ${-h - 22} L${w * 0.6} ${-h}`, { x, y: baseY }, { fill: c }));
    for (let wy = 14; wy < h - 10; wy += 20) {
      for (let wx = 8; wx < w - 8; wx += 14) {
        if (rnd() > 0.45) out.push(shape('M0 0 L7 0 L7 9 L0 9 Z', { x: x + wx, y: baseY - h + wy }, { fill: windowColor, opacity: 0.9 }));
      }
    }
    x += w + 2;
  }
  return out;
}

/** Soft painted blobs behind the page. */
export function washes(spots: Array<[number, number, number, string, number?]>): Obj[] {
  return spots.map(([x, y, r, c, o]) => dot(x, y, r, c, o ?? 0.3));
}

/** A brush-stroke highlight behind a line of text. */
export function brush(cx: number, cy: number, w: number, h: number, seed: number, colour: string, opacity = 0.5): Obj {
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
  return poly(pts, { fill: colour, opacity });
}

export { CX, H, W, r1, dropD };
