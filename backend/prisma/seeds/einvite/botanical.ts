// ============================================================================
// Botanical and painterly pieces: peonies, daisies, lavender, olive and blossom branches, soft colour washes,
// the moon, and thin line frames.
// ============================================================================
import { dot, ellD, petalD, poly, radial, rng, shape, type Obj, type Pt } from './kit';
import { blossom, petalRing, quadPts, sparkle } from './motifs';

/** "#rrggbb" + alpha -> "rgba(...)". */
export function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

/** A soft, feathered colour wash (like watercolour bleeding into paper). */
export function softBlob(x: number, y: number, r: number, color: string, opacity = 0.6): Obj {
  return dot(x, y, r, radial([[0, hexA(color, opacity)], [0.65, hexA(color, opacity * 0.55)], [1, hexA(color, 0)]]), 1);
}

export function peony(x: number, y: number, r: number, c1: string, c2: string, c3: string, line: string, rot = 0): Obj[] {
  return [
    dot(x, y, r * 1.06, hexA(c3, 0.25), 1),
    ...petalRing(x, y, 9, r * 0.1, r * 0.98, r * 0.86, c1, line, 0.97, rot, 0.8),
    ...petalRing(x, y, 7, r * 0.08, r * 0.74, r * 0.7, c2, line, 0.97, rot + 20, 0.8),
    ...petalRing(x, y, 6, r * 0.06, r * 0.52, r * 0.52, c1, line, 0.98, rot + 8, 0.8),
    ...petalRing(x, y, 5, r * 0.04, r * 0.3, r * 0.34, c2, line, 1, rot + 30, 0.7),
    dot(x, y, r * 0.09, '#e8b84a', 1),
  ];
}

export function daisy(x: number, y: number, r: number, petal = '#ffffff', centre = '#f2b73a', line = '#d9d4c4'): Obj[] {
  return [
    ...petalRing(x, y, 14, r * 0.1, r, r * 0.3, petal, line, 1, 0, 0.6),
    dot(x, y, r * 0.26, centre, 1),
    dot(x - r * 0.06, y - r * 0.06, r * 0.1, '#ffffff', 0.5),
  ];
}

/** A lavender stem with rows of small buds. */
export function lavender(p0: Pt, c: Pt, p1: Pt, buds: number, size: number, c1: string, c2: string, stem: string): Obj[] {
  const curve = quadPts(p0, c, p1, 60);
  const out: Obj[] = [poly(curve, { stroke: stem, sw: 1.8, closed: false })];
  const from = Math.round(60 * 0.4);
  for (let i = 0; i < buds; i++) {
    const idx = from + Math.round(((i + 0.5) / buds) * (58 - from));
    const [x, y] = curve[idx];
    const [x2, y2] = curve[Math.min(60, idx + 1)];
    const base = Math.atan2(y2 - y, x2 - x);
    const shrink = 1 - (i / buds) * 0.45;
    for (const side of [-1, 1]) {
      const a = base + side * 0.7;
      out.push(shape(ellD(0, 0, size * 0.34 * shrink, size * 0.6 * shrink), { x: x + Math.cos(a) * size * 0.5 * shrink, y: y + Math.sin(a) * size * 0.5 * shrink, rot: (a * 180) / Math.PI + 90 }, { fill: i % 2 ? c1 : c2, opacity: 0.95 }));
    }
    out.push(shape(ellD(0, 0, size * 0.3 * shrink, size * 0.55 * shrink), { x, y, rot: (base * 180) / Math.PI + 90 }, { fill: c1, opacity: 0.95 }));
  }
  return out;
}

/** An olive branch: narrow leaves in pairs, with a few olives. */
export function oliveBranch(p0: Pt, c: Pt, p1: Pt, pairs: number, size: number, leaf: string, leaf2: string, stem: string, fruit: string): Obj[] {
  const curve = quadPts(p0, c, p1, 60);
  const out: Obj[] = [poly(curve, { stroke: stem, sw: 2, closed: false })];
  for (let i = 0; i < pairs; i++) {
    const idx = Math.round(((i + 0.5) / pairs) * 58);
    const [x, y] = curve[idx];
    const [x2, y2] = curve[idx + 1];
    const base = Math.atan2(y2 - y, x2 - x);
    const s = size * (1 - (idx / 60) * 0.3);
    for (const side of [-1, 1]) {
      out.push(shape(petalD(s, s * 0.27, 0.9), { x, y, rot: ((base + side * 0.72) * 180) / Math.PI }, { fill: side < 0 ? leaf : leaf2, opacity: 0.97 }));
    }
    if (i % 3 === 1) out.push(shape(ellD(0, 0, s * 0.15, s * 0.22), { x: x + Math.cos(base + 1.5) * s * 0.55, y: y + Math.sin(base + 1.5) * s * 0.55, rot: 15 }, { fill: fruit, opacity: 0.95 }));
  }
  return out;
}

/** A flowering branch (cherry, magnolia, plum): a bare twig with blossoms along it. */
export function blossomBranch(
  p0: Pt, c: Pt, p1: Pt, n: number, size: number, petal: string, centre: string, twig: string, seed = 5, buds = true,
): Obj[] {
  const rnd = rng(seed);
  const curve = quadPts(p0, c, p1, 80);
  const out: Obj[] = [poly(curve, { stroke: twig, sw: 4, closed: false })];
  for (let i = 0; i < n; i++) {
    const idx = Math.round(((i + 0.4) / n) * 78);
    const [x, y] = curve[idx];
    const off = (rnd() - 0.5) * size * 1.4;
    out.push(shape(`M${x} ${y} L${x} ${y + off}`, {}, { stroke: twig, sw: 1.6, closed: false, opacity: 0.8 }));
    out.push(...blossom(x, y + off, size * (0.75 + rnd() * 0.5), petal, centre, rnd() * 72, undefined));
    if (buds && i % 2 === 0) out.push(dot(x + size * 0.9, y - size * 0.4, size * 0.2, petal, 0.9));
  }
  return out;
}

export function moon(x: number, y: number, r: number, disc: string, glow: string): Obj[] {
  return [
    dot(x, y, r * 2.4, radial([[0, hexA(glow, 0.5)], [0.5, hexA(glow, 0.16)], [1, hexA(glow, 0)]]), 1),
    dot(x, y, r, disc, 1),
    dot(x - r * 0.3, y - r * 0.2, r * 0.18, hexA('#000000', 0.05), 1),
    dot(x + r * 0.28, y + r * 0.32, r * 0.13, hexA('#000000', 0.05), 1),
  ];
}

export function starField(seed: number, n: number, x0: number, y0: number, x1: number, y1: number, color: string): Obj[] {
  const rnd = rng(seed);
  return Array.from({ length: n }, () => sparkle(x0 + rnd() * (x1 - x0), y0 + rnd() * (y1 - y0), 1.6 + rnd() * 3.4, color, 0.35 + rnd() * 0.55));
}

/** A tall arch outline (round top) standing on y = bottom. */
export function archOutline(cx: number, top: number, bottom: number, w: number, stroke: string, sw: number, opacity = 1, fill?: string | null): Obj {
  const r = w / 2;
  const h = bottom - top;
  const k = 0.5523;
  const d = `M${-r} 0 L${-r} ${-(h - r)} C${-r} ${-(h - r) - r * k} ${-r * k} ${-h} 0 ${-h} C${r * k} ${-h} ${r} ${-(h - r) - r * k} ${r} ${-(h - r)} L${r} 0${fill ? ' Z' : ''}`;
  return shape(d, { x: cx, y: bottom }, { stroke, sw, opacity, fill: fill ?? null, closed: !!fill });
}

export function ringFrame(cx: number, cy: number, r: number, stroke: string, sw: number, opacity = 1): Obj {
  return dot(cx, cy, r, 'rgba(0,0,0,0)', opacity, stroke, sw);
}
