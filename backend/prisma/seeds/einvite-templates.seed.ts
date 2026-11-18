import 'dotenv/config';
import { PrismaClient, EInviteCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ============================================================================
// E-INVITE TEMPLATES SEED - hand-painted "sketchbook" design
// ============================================================================
// Matches the Omnicassion web theme: paper background, cobalt blue, marigold,
// leaf green and rose accents, brush highlights, wobbly hand-drawn outlines,
// bunting, marigold garlands, quarter mandalas and a painted arch.
//
// Every template is a Fabric.js 5 canvas (600 x 800). Text boxes keep the ids the
// editor and the guest flow rely on (couple_names, person_name, event_date, ...).
// Fonts used by the canvas: Fraunces, Karla and Caveat. The frontend loads them
// (see frontend/src/lib/einvite-fonts.ts).
//
// Running the seed REPLACES the whole template library: all existing templates
// are removed (invitations that used one keep their own design and just lose the
// link to the template) and the new set is created.
// ============================================================================

const W = 600;
const H = 800;
const CX = W / 2;

type Pt = [number, number];

interface Palette {
  paper: string;
  main: string; // headline accent (cobalt in the default theme)
  wash: string; // soft painted wash
  sky: string; // pale fill for the arch
  ink: string;
  soft: string;
  gold: string;
  rose: string;
  leaf: string;
  leafDeep: string;
  leafLight: string;
}

const PALETTES: Record<string, Palette> = {
  cobalt: {
    paper: '#f7f6f1', main: '#2748c4', wash: '#a9bbf0', sky: '#d6e0fb', ink: '#1c2757', soft: '#4b5684',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  },
  marigold: {
    paper: '#fbf3e1', main: '#c2540a', wash: '#f6d58a', sky: '#fde7b8', ink: '#4a2a12', soft: '#7a5434',
    gold: '#f2a516', rose: '#e0707a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  },
  blush: {
    paper: '#fbf1ee', main: '#c4566b', wash: '#f4c3c8', sky: '#f9dcdc', ink: '#4a2433', soft: '#7a4a5a',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  },
  sage: {
    paper: '#f4f6ee', main: '#2f6048', wash: '#b6d1a0', sky: '#dcebd0', ink: '#1f3a2c', soft: '#4a6a56',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  },
  midnight: {
    paper: '#141c4d', main: '#f2a516', wash: '#33489a', sky: '#223070', ink: '#f3f5ff', soft: '#c1c9ee',
    gold: '#f5b53a', rose: '#d98d95', leaf: '#78a86f', leafDeep: '#a8d3a0', leafLight: '#3f6b50',
  },
};

// ----------------------------------------------------------------------------
// Deterministic random numbers (so re-seeding gives identical designs)
// ----------------------------------------------------------------------------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

// ----------------------------------------------------------------------------
// Fabric object builders
// ----------------------------------------------------------------------------
interface TextOpts {
  size?: number;
  font?: string;
  fill?: string;
  weight?: string;
  style?: string;
  width?: number;
  id?: string;
  editable?: boolean;
  spacing?: number;
  lineHeight?: number;
  angle?: number;
}

const text = (t: string, top: number, o: TextOpts = {}) => ({
  type: 'textbox',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left: CX,
  top,
  width: o.width ?? 440,
  height: 50,
  fill: o.fill ?? '#1c2757',
  stroke: null,
  strokeWidth: 0,
  scaleX: 1,
  scaleY: 1,
  angle: o.angle ?? 0,
  opacity: 1,
  text: t,
  fontSize: o.size ?? 22,
  fontWeight: o.weight ?? 'normal',
  fontFamily: o.font ?? 'Fraunces',
  fontStyle: o.style ?? 'normal',
  lineHeight: o.lineHeight ?? 1.2,
  textAlign: 'center',
  charSpacing: o.spacing ?? 0,
  styles: {},
  id: o.id,
  editable: o.editable !== false,
  selectable: true,
});

const rect = (left: number, top: number, width: number, height: number, fill: string) => ({
  type: 'rect',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left,
  top,
  width,
  height,
  fill,
  stroke: null,
  strokeWidth: 0,
  opacity: 1,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  selectable: false,
  evented: false,
});

const dot = (x: number, y: number, r: number, fill: string, opacity = 1, stroke?: string, sw = 0) => ({
  type: 'circle',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left: r1(x),
  top: r1(y),
  radius: r1(r),
  fill,
  stroke: stroke ?? null,
  strokeWidth: sw,
  opacity,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  selectable: false,
  evented: false,
});

interface PolyOpts {
  fill?: string | null;
  stroke?: string | null;
  sw?: number;
  opacity?: number;
  closed?: boolean;
}

/** A free-form shape built from absolute points. Position is the exact centre of the points. */
function poly(pts: Pt[], o: PolyOpts = {}) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const d = 'M' + pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L') + (o.closed === false ? '' : ' Z');
  return {
    type: 'path',
    version: '5.3.0',
    originX: 'center',
    originY: 'center',
    left: r1((minX + maxX) / 2),
    top: r1((minY + maxY) / 2),
    path: d,
    fill: o.fill ?? null,
    stroke: o.stroke ?? null,
    strokeWidth: o.sw ?? 0,
    strokeLineCap: 'round',
    strokeLineJoin: 'round',
    opacity: o.opacity ?? 1,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
  };
}

// ----------------------------------------------------------------------------
// Geometry helpers
// ----------------------------------------------------------------------------
function quad(p0: Pt, c: Pt, p1: Pt, n: number): Pt[] {
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
function wobbleRect(x: number, y: number, w: number, h: number, jitter: number, seed: number): Pt[] {
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
function brushShape(cx: number, cy: number, w: number, h: number, seed: number): Pt[] {
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
function lens(ox: number, oy: number, dx: number, dy: number, len: number, wid: number, base = 0): Pt[] {
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
type Obj = Record<string, unknown>;

/** Soft painted washes behind the page. */
function washes(p: Palette, spots: Array<[number, number, number, 'wash' | 'gold' | 'leafLight' | 'rose']>): Obj[] {
  return spots.map(([x, y, r, k]) => dot(x, y, r, p[k], k === 'wash' ? 0.34 : 0.2));
}

/** A brush highlight behind a line of text. */
function brush(p: Palette, cx: number, cy: number, w: number, h: number, seed: number, colour: string, opacity = 0.5): Obj {
  return poly(brushShape(cx, cy, w, h, seed), { fill: colour, opacity });
}

/** A quarter rangoli mandala growing out of a corner. */
function mandalaCorner(p: Palette, ox: number, oy: number, sx: number, sy: number, s: number): Obj[] {
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
function bunting(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number, h: number, w: number): Obj[] {
  const string = quad([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 40);
  const out: Obj[] = [poly(string, { stroke: p.ink, sw: 1.6, closed: false, opacity: 0.85 })];
  const colours = [p.main, p.gold, p.rose, p.leaf];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const [x, y] = quad([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100)[Math.round(t * 100)];
    out.push(poly([[x - w / 2, y], [x + w / 2, y], [x, y + h]], { fill: colours[i % colours.length], stroke: p.ink, sw: 1.3, opacity: 0.92 }));
  }
  return out;
}

/** A marigold garland hung between two points. */
function garland(p: Palette, x0: number, y0: number, x1: number, y1: number, sag: number, n: number): Obj[] {
  const rnd = rng(11);
  const curve = quad([x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + 2 * sag], [x1, y1], 100);
  const out: Obj[] = [poly(curve, { stroke: p.leafDeep, sw: 2.2, closed: false })];
  for (let i = 0; i < n; i++) {
    const [x, y] = curve[Math.round(((i + 0.5) / n) * 100)];
    out.push(dot(x, y + 6, 8.5 + rnd() * 3, i % 3 === 0 ? '#e8751a' : p.gold, 0.95));
    out.push(dot(x, y + 6, 3, '#a84a05', 0.7));
  }
  return out;
}

/** A leafy vine along a curve. */
function vine(p: Palette, p0: Pt, c: Pt, p1: Pt, leaves: number, size: number): Obj[] {
  const curve = quad(p0, c, p1, 60);
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
function wreath(p: Palette, cx: number, cy: number, rx: number, ry: number, n: number): Obj[] {
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
function dots(p: Palette, x0: number, x1: number, y: number, colour?: string): Obj[] {
  const out: Obj[] = [];
  for (let x = x0; x <= x1; x += 14) out.push(dot(x, y, 2.2, colour ?? p.gold, 0.9));
  out.push(poly([[CX, y - 6], [CX + 6, y], [CX, y + 6], [CX - 6, y]], { fill: colour ?? p.gold }));
  return out;
}

/** The painted arch: sky, sun and hills inside a wobbly outline with an offset cobalt line. */
function paintedArch(p: Palette, cx: number, top: number, bottom: number, w: number, withHills: boolean): Obj[] {
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
// Copy for each kind of invitation
// ----------------------------------------------------------------------------
interface Copy {
  label: string;
  names: string;
  namesId: string;
  line: string;
  date: string;
  time: string;
  venue: string;
  address: string;
}

const COPY: Record<string, Copy> = {
  wedding: {
    label: 'Wedding Invitation', names: 'Priya & Arjun', namesId: 'couple_names',
    line: 'Together with their families\ninvite you to celebrate their union',
    date: 'Saturday, 15th December 2026', time: 'Muhurat 7:30 PM', venue: 'The Grand Palace', address: 'Jaipur, Rajasthan',
  },
  engagement: {
    label: 'We are engaged', names: 'Meera & Vikram', namesId: 'couple_names',
    line: 'Join us for a joyful evening\nto celebrate our engagement',
    date: 'Sunday, 8th November 2026', time: '6:00 PM onwards', venue: 'Lakeview Gardens', address: 'Udaipur, Rajasthan',
  },
  birthday: {
    label: "You're invited", names: 'Aarav turns 5!', namesId: 'person_name',
    line: 'Come and celebrate with\ncake, games and lots of fun',
    date: 'Saturday, 21st March 2026', time: '4:00 PM to 7:00 PM', venue: 'Sunshine Play Park', address: 'Bengaluru, Karnataka',
  },
  baby: {
    label: 'Baby shower', names: 'Neha & Rohan', namesId: 'couple_names',
    line: 'are expecting a little one\nplease join us to shower them with love',
    date: 'Sunday, 12th July 2026', time: '11:00 AM', venue: 'The Garden Terrace', address: 'Pune, Maharashtra',
  },
  anniversary: {
    label: '25 years of love', names: 'Sunita & Raj', namesId: 'couple_names',
    line: 'Join us as we celebrate\na quarter century together',
    date: 'Friday, 5th February 2027', time: '7:00 PM', venue: 'Royal Orchid Banquet', address: 'Ahmedabad, Gujarat',
  },
  corporate: {
    label: "You're invited", names: 'Annual Meet 2026', namesId: 'event_title',
    line: 'An evening of ideas, food\nand good company',
    date: 'Thursday, 10th September 2026', time: '6:30 PM', venue: 'The Convention Centre', address: 'Mumbai, Maharashtra',
  },
  housewarming: {
    label: 'Housewarming', names: 'The Mehta Family', namesId: 'person_name',
    line: 'invite you to bless our new home\nand share a meal with us',
    date: 'Sunday, 2nd August 2026', time: '10:30 AM', venue: '14, Rose Residency', address: 'Hyderabad, Telangana',
  },
  graduation: {
    label: 'Graduation party', names: 'Ananya Rao', namesId: 'person_name',
    line: 'has graduated!\nCome and celebrate this milestone',
    date: 'Saturday, 20th June 2026', time: '5:00 PM', venue: 'Rooftop Lounge', address: 'Chennai, Tamil Nadu',
  },
  other: {
    label: 'Celebrate with us', names: 'Our Get-together', namesId: 'event_title',
    line: 'We would love to have you\njoin us for a happy day',
    date: 'Saturday, 3rd October 2026', time: '5:00 PM', venue: 'The Garden Hall', address: 'Kolkata, West Bengal',
  },
};

// ----------------------------------------------------------------------------
// The text block shared by every layout
// ----------------------------------------------------------------------------
interface Ys {
  label: number;
  names: number;
  line: number;
  date: number;
  time: number;
  venue: number;
  address: number;
}

function textBlock(p: Palette, c: Copy, ys: Ys, namesSize = 62, lineWidth = 420): Obj[] {
  return [
    text(c.label.toUpperCase(), ys.label, { size: 14, font: 'Karla', fill: p.main, weight: 'bold', spacing: 320, id: 'label', width: 460 }),
    text(c.names, ys.names, { size: namesSize, font: 'Caveat', fill: p.ink, weight: 'bold', id: c.namesId, width: 500, lineHeight: 1.05 }),
    text(c.line, ys.line, { size: 17, font: 'Fraunces', fill: p.soft, id: 'invitation_text', width: lineWidth, lineHeight: 1.35 }),
    text(c.date, ys.date, { size: 24, font: 'Fraunces', fill: p.ink, weight: '600', id: 'event_date', width: 500 }),
    text(c.time, ys.time, { size: 16, font: 'Karla', fill: p.soft, id: 'event_time', width: 440 }),
    text(c.venue, ys.venue, { size: 22, font: 'Fraunces', fill: p.ink, weight: '700', id: 'venue_name', width: 460 }),
    text(c.address, ys.address, { size: 15, font: 'Karla', fill: p.soft, id: 'venue_address', width: 440 }),
  ];
}

// ----------------------------------------------------------------------------
// Layouts
// ----------------------------------------------------------------------------
type Layout = 'bunting' | 'mandala' | 'arch' | 'wreath' | 'garland' | 'vinebor';

function buildLayout(layout: Layout, p: Palette, c: Copy): Obj[] {
  const bg: Obj[] = [rect(CX, H / 2, W, H, p.paper)];

  if (layout === 'bunting') {
    return [
      ...bg,
      ...washes(p, [[60, 330, 120, 'wash'], [560, 520, 110, 'gold'], [140, 690, 100, 'leafLight']]),
      ...mandalaCorner(p, 0, H, 1, -1, 0.82),
      ...mandalaCorner(p, W, H, -1, -1, 0.82),
      ...bunting(p, 24, 52, 576, 52, 54, 12, 36, 30),
      brush(p, CX, 292, 470, 92, 5, p.wash, 0.55),
      ...textBlock(p, c, { label: 182, names: 292, line: 398, date: 492, time: 530, venue: 596, address: 630 }),
      ...dots(p, 190, 410, 452),
      ...garland(p, 70, 748, 530, 748, 30, 24),
    ];
  }

  if (layout === 'mandala') {
    const frame1 = wobbleRect(24, 24, W - 48, H - 48, 1.6, 7);
    const frame2 = wobbleRect(38, 38, W - 76, H - 76, 1.4, 9);
    return [
      ...bg,
      ...washes(p, [[300, 380, 170, 'wash'], [90, 120, 80, 'gold'], [520, 700, 90, 'rose']]),
      poly(frame1, { stroke: p.gold, sw: 3, opacity: 0.95 }),
      poly(frame2, { stroke: p.ink, sw: 1.2, opacity: 0.55 }),
      ...mandalaCorner(p, 0, 0, 1, 1, 0.88),
      ...mandalaCorner(p, W, 0, -1, 1, 0.88),
      ...mandalaCorner(p, 0, H, 1, -1, 0.62),
      ...mandalaCorner(p, W, H, -1, -1, 0.62),
      brush(p, CX, 300, 430, 86, 13, p.gold, 0.4),
      ...textBlock(p, c, { label: 205, names: 300, line: 402, date: 500, time: 538, venue: 602, address: 636 }, 62, 380),
      ...dots(p, 200, 400, 456, p.rose),
    ];
  }

  if (layout === 'arch') {
    return [
      ...bg,
      ...washes(p, [[80, 560, 110, 'wash'], [540, 640, 100, 'leafLight']]),
      ...paintedArch(p, CX, 46, 470, 420, true),
      ...textBlock(p, c, { label: 214, names: 296, line: 584, date: 632, time: 666, venue: 712, address: 744 }, 58, 440),
      ...dots(p, 210, 390, 520),
    ];
  }

  if (layout === 'garland') {
    return [
      ...bg,
      ...washes(p, [[70, 360, 110, 'wash'], [550, 560, 120, 'leafLight'], [300, 780, 110, 'rose']]),
      ...garland(p, -10, 34, 610, 34, 46, 30),
      ...garland(p, -10, 34, 610, 34, 88, 30),
      ...vine(p, [26, 796], [70, 700], [34, 610], 9, 32),
      ...vine(p, [574, 796], [530, 700], [566, 610], 9, 32),
      brush(p, CX, 300, 450, 90, 21, p.wash, 0.5),
      ...textBlock(p, c, { label: 206, names: 300, line: 402, date: 502, time: 540, venue: 606, address: 640 }),
      ...dots(p, 200, 400, 460),
    ];
  }

  if (layout === 'vinebor') {
    return [
      ...bg,
      ...washes(p, [[300, 400, 190, 'wash'], [70, 130, 80, 'gold'], [540, 690, 90, 'rose']]),
      ...vine(p, [46, 772], [-26, 420], [46, 38], 17, 36),
      ...vine(p, [554, 772], [626, 420], [554, 38], 17, 36),
      ...dots(p, 236, 364, 96),
      brush(p, CX, 292, 360, 88, 29, p.gold, 0.4),
      ...textBlock(p, c, { label: 178, names: 292, line: 392, date: 494, time: 532, venue: 598, address: 632 }, 56, 340),
      ...dots(p, 200, 400, 452, p.rose),
    ];
  }

  // wreath
  return [
    ...bg,
    ...washes(p, [[60, 80, 100, 'wash'], [550, 180, 90, 'gold'], [300, 720, 130, 'leafLight']]),
    ...wreath(p, CX, 285, 240, 168, 30),
    brush(p, CX, 286, 330, 84, 17, p.wash, 0.5),
    ...textBlock(p, c, { label: 222, names: 286, line: 352, date: 530, time: 566, venue: 628, address: 662 }, 56, 340),
    ...dots(p, 200, 400, 494),
    ...vine(p, [60, 760], [300, 700], [540, 760], 14, 36),
  ];
}

// ----------------------------------------------------------------------------
// Template list
// ----------------------------------------------------------------------------
interface TemplateDefinition {
  name: string;
  category: EInviteCategory;
  layout: Layout;
  palette: keyof typeof PALETTES;
  copy: keyof typeof COPY;
  isPremium: boolean;
}

const DEFINITIONS: TemplateDefinition[] = [
  // Weddings
  { name: 'Cobalt Bunting', category: EInviteCategory.WEDDING, layout: 'bunting', palette: 'cobalt', copy: 'wedding', isPremium: false },
  { name: 'Marigold Mandala', category: EInviteCategory.WEDDING, layout: 'mandala', palette: 'marigold', copy: 'wedding', isPremium: false },
  { name: 'Painted Arch', category: EInviteCategory.WEDDING, layout: 'arch', palette: 'cobalt', copy: 'wedding', isPremium: false },
  { name: 'Leaf Wreath', category: EInviteCategory.WEDDING, layout: 'wreath', palette: 'sage', copy: 'wedding', isPremium: false },
  { name: 'Blush Garden', category: EInviteCategory.WEDDING, layout: 'bunting', palette: 'blush', copy: 'wedding', isPremium: true },
  { name: 'Midnight Mandala', category: EInviteCategory.WEDDING, layout: 'mandala', palette: 'midnight', copy: 'wedding', isPremium: true },
  { name: 'Marigold Garland', category: EInviteCategory.WEDDING, layout: 'garland', palette: 'marigold', copy: 'wedding', isPremium: false },
  { name: 'Sage Vine Border', category: EInviteCategory.WEDDING, layout: 'vinebor', palette: 'sage', copy: 'wedding', isPremium: false },
  { name: 'Cobalt Vines', category: EInviteCategory.WEDDING, layout: 'vinebor', palette: 'cobalt', copy: 'wedding', isPremium: false },
  // Engagement
  { name: 'Rose Arch', category: EInviteCategory.ENGAGEMENT, layout: 'arch', palette: 'blush', copy: 'engagement', isPremium: false },
  { name: 'Garden Bunting', category: EInviteCategory.ENGAGEMENT, layout: 'bunting', palette: 'sage', copy: 'engagement', isPremium: false },
  { name: 'Marigold Wreath', category: EInviteCategory.ENGAGEMENT, layout: 'wreath', palette: 'marigold', copy: 'engagement', isPremium: false },
  // Birthday
  { name: 'Party Bunting', category: EInviteCategory.BIRTHDAY, layout: 'bunting', palette: 'marigold', copy: 'birthday', isPremium: false },
  { name: 'Birthday Wreath', category: EInviteCategory.BIRTHDAY, layout: 'wreath', palette: 'cobalt', copy: 'birthday', isPremium: false },
  { name: 'Birthday Garland', category: EInviteCategory.BIRTHDAY, layout: 'garland', palette: 'blush', copy: 'birthday', isPremium: false },
  { name: 'Sunny Vines', category: EInviteCategory.BIRTHDAY, layout: 'vinebor', palette: 'marigold', copy: 'birthday', isPremium: false },
  // Baby shower
  { name: 'Little One Wreath', category: EInviteCategory.BABY_SHOWER, layout: 'wreath', palette: 'blush', copy: 'baby', isPremium: false },
  { name: 'Baby Bunting', category: EInviteCategory.BABY_SHOWER, layout: 'bunting', palette: 'cobalt', copy: 'baby', isPremium: false },
  // Anniversary
  { name: 'Golden Years Mandala', category: EInviteCategory.ANNIVERSARY, layout: 'mandala', palette: 'marigold', copy: 'anniversary', isPremium: false },
  { name: 'Midnight Garland', category: EInviteCategory.ANNIVERSARY, layout: 'garland', palette: 'midnight', copy: 'anniversary', isPremium: true },
  // Corporate
  { name: 'Midnight Arch', category: EInviteCategory.CORPORATE, layout: 'arch', palette: 'midnight', copy: 'corporate', isPremium: false },
  { name: 'Greenroom Vines', category: EInviteCategory.CORPORATE, layout: 'vinebor', palette: 'sage', copy: 'corporate', isPremium: false },
  // Housewarming
  { name: 'New Home Bunting', category: EInviteCategory.HOUSEWARMING, layout: 'bunting', palette: 'sage', copy: 'housewarming', isPremium: false },
  { name: 'Home Wreath', category: EInviteCategory.HOUSEWARMING, layout: 'wreath', palette: 'marigold', copy: 'housewarming', isPremium: false },
  // Graduation
  { name: 'Graduate Arch', category: EInviteCategory.GRADUATION, layout: 'arch', palette: 'cobalt', copy: 'graduation', isPremium: false },
  { name: 'Graduate Bunting', category: EInviteCategory.GRADUATION, layout: 'bunting', palette: 'cobalt', copy: 'graduation', isPremium: false },
  // Other
  { name: 'Celebration Mandala', category: EInviteCategory.OTHER, layout: 'mandala', palette: 'cobalt', copy: 'other', isPremium: false },
  { name: 'Festival Garland', category: EInviteCategory.OTHER, layout: 'garland', palette: 'marigold', copy: 'other', isPremium: false },
];

function buildTemplate(def: TemplateDefinition, index: number) {
  const p = PALETTES[def.palette];
  const objects = buildLayout(def.layout, p, COPY[def.copy]);
  return {
    name: def.name,
    category: def.category,
    canvasJson: { version: '5.3.0', objects, background: p.paper },
    defaultColors: { primary: p.main, secondary: p.paper, accent: p.gold },
    isPremium: def.isPremium,
    sortOrder: index + 1,
  };
}

// ============================================================================
// SEED
// ============================================================================

export async function seedEInviteTemplates(prisma: PrismaClient) {
  console.log('Seeding e-invite templates (sketchbook design)...');

  // Remove every existing template. Invitations already made keep their own canvas;
  // they only lose the link to the template they started from.
  await prisma.eInvite.updateMany({ where: { templateId: { not: null } }, data: { templateId: null } });
  const removed = await prisma.eInviteTemplate.deleteMany({});
  console.log(`  Removed ${removed.count} old template(s)`);

  const templates = DEFINITIONS.map(buildTemplate);
  for (const t of templates) {
    await prisma.eInviteTemplate.create({
      data: {
        name: t.name,
        category: t.category,
        canvasJson: t.canvasJson as object,
        defaultColors: t.defaultColors,
        isPremium: t.isPremium,
        sortOrder: t.sortOrder,
        isActive: true,
      },
    });
    console.log(`  Created: ${t.name}`);
  }

  console.log(`\nE-invite templates seeded! Total: ${templates.length}`);
  for (const cat of Object.values(EInviteCategory)) {
    const n = templates.filter((t) => t.category === cat).length;
    if (n) console.log(`  - ${cat}: ${n}`);
  }
}

// Exposed so the designs can be previewed without a database (see scripts/preview-einvites).
export const einviteTemplateDefinitions = () => DEFINITIONS.map(buildTemplate);

// ============================================================================
// STANDALONE EXECUTION
// ============================================================================

if (require.main === module) {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  const isAccelerate = connectionString?.startsWith('prisma://');

  const prisma = isAccelerate
    ? new PrismaClient({ log: ['info', 'warn', 'error'] })
    : new PrismaClient({
        adapter: new PrismaPg(new Pool({ connectionString })),
        log: ['info', 'warn', 'error'],
      });

  seedEInviteTemplates(prisma)
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
