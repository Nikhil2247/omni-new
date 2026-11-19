// ============================================================================
// E-invite design kit: Fabric.js 5 object builders, a tiny SVG-path drawing DSL, palettes and text blocks.
// Every template is a 600 x 800 Fabric canvas. Text boxes keep the ids the editor and guest flow rely on
// (couple_names, person_name, event_title, event_date, event_time, venue_name, venue_address, invitation_text, label).
// ============================================================================

export const W = 600;
export const H = 800;
export const CX = W / 2;

export type Pt = [number, number];
export type Obj = Record<string, unknown>;

export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic random numbers, so re-seeding gives identical designs. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// ----------------------------------------------------------------------------
// Palette
// ----------------------------------------------------------------------------
export interface Palette {
  paper: string; // page background
  paper2: string; // secondary background / panels
  main: string; // headline accent
  main2: string; // second accent
  wash: string; // soft painted wash
  sky: string; // pale fill (arch interior, panels)
  ink: string; // primary text
  soft: string; // secondary text
  gold: string;
  rose: string;
  leaf: string;
  leafDeep: string;
  leafLight: string;
  a: string; // free accent colours for motifs
  b: string;
  c: string;
  d: string;
}

const BASE: Palette = {
  paper: '#f7f6f1', paper2: '#ece9df', main: '#2748c4', main2: '#e48a8a', wash: '#a9bbf0', sky: '#d6e0fb', ink: '#1c2757', soft: '#4b5684',
  gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  a: '#f2a516', b: '#e48a8a', c: '#6b9a62', d: '#2748c4',
};

export const pal = (o: Partial<Palette>): Palette => ({ ...BASE, ...o });

// ----------------------------------------------------------------------------
// Fills
// ----------------------------------------------------------------------------
export type Fill = string | null | Obj;

/** Linear gradient that fits the shape it fills. dir: 'down' (top to bottom), 'right', 'diag'. */
export function grad(stops: Array<[number, string]>, dir: 'down' | 'right' | 'diag' | 'up' = 'down'): Obj {
  const coords =
    dir === 'down' ? { x1: 0, y1: 0, x2: 0, y2: 1 }
    : dir === 'up' ? { x1: 0, y1: 1, x2: 0, y2: 0 }
    : dir === 'right' ? { x1: 0, y1: 0, x2: 1, y2: 0 }
    : { x1: 0, y1: 0, x2: 1, y2: 1 };
  return {
    type: 'linear',
    gradientUnits: 'percentage',
    coords,
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  };
}

/** Round gradient: first colour in the centre, last at the edge. */
export function radial(stops: Array<[number, string]>): Obj {
  return {
    type: 'radial',
    gradientUnits: 'percentage',
    coords: { x1: 0.5, y1: 0.5, r1: 0, x2: 0.5, y2: 0.5, r2: 0.5 },
    colorStops: stops.map(([offset, color]) => ({ offset, color })),
  };
}

// ----------------------------------------------------------------------------
// Basic objects
// ----------------------------------------------------------------------------
export interface TextOpts {
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
  x?: number;
  align?: 'left' | 'center' | 'right';
  opacity?: number;
}

export const text = (t: string, top: number, o: TextOpts = {}): Obj => {
  const align = o.align ?? 'center';
  const x = o.x ?? CX;
  const width = o.width ?? 440;
  // Centre-anchored boxes keep the text where it was drawn when the user edits it; left/right ones anchor on the edge.
  const origin = align === 'center' ? 'center' : align;
  return {
    type: 'textbox',
    version: '5.3.0',
    originX: origin,
    originY: 'center',
    left: align === 'center' ? x : x,
    top,
    width,
    height: 50,
    fill: o.fill ?? '#1c2757',
    stroke: null,
    strokeWidth: 0,
    scaleX: 1,
    scaleY: 1,
    angle: o.angle ?? 0,
    opacity: o.opacity ?? 1,
    text: t,
    fontSize: o.size ?? 22,
    fontWeight: o.weight ?? 'normal',
    fontFamily: o.font ?? 'Fraunces',
    fontStyle: o.style ?? 'normal',
    lineHeight: o.lineHeight ?? 1.2,
    textAlign: align,
    charSpacing: o.spacing ?? 0,
    styles: {},
    id: o.id,
    editable: o.editable !== false,
    selectable: true,
  };
};

export const rect = (left: number, top: number, width: number, height: number, fill: Fill, opacity = 1): Obj => ({
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
  opacity,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  selectable: false,
  evented: false,
});

/** Full-page background. */
export const page = (fill: Fill): Obj => rect(CX, H / 2, W, H, fill);

export const dot = (x: number, y: number, r: number, fill: Fill, opacity = 1, stroke?: string, sw = 0): Obj => ({
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

// ----------------------------------------------------------------------------
// Path DSL
// ----------------------------------------------------------------------------
interface Sub {
  pts: Pt[];
  closed: boolean;
}

/**
 * Parses an SVG-style path (M L H V C Q Z, absolute or relative) and flattens curves into points.
 * Shapes are drawn as dense polylines, so Fabric's bounding box always matches ours exactly.
 */
export function parsePath(d: string): Sub[] {
  const tokens = d.match(/[MmLlHhVvCcQqSsZz]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  const subs: Sub[] = [];
  // `as` keeps TypeScript from narrowing this to `null`: it is reassigned inside start() below.
  let cur = null as Sub | null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let cmd = 'M';
  let lastC: Pt | null = null;
  let i = 0;
  const num = () => parseFloat(tokens[i++]);
  const isCmd = (t: string) => /^[A-Za-z]$/.test(t);

  const start = (px: number, py: number) => {
    cur = { pts: [[px, py]], closed: false };
    subs.push(cur);
    sx = px;
    sy = py;
  };

  while (i < tokens.length) {
    if (isCmd(tokens[i])) cmd = tokens[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();
    if (C === 'Z') {
      if (cur) cur.closed = true;
      x = sx;
      y = sy;
      lastC = null;
      continue;
    }
    if (C === 'M') {
      const nx = num() + (rel ? x : 0);
      const ny = num() + (rel ? y : 0);
      x = nx;
      y = ny;
      start(x, y);
      cmd = rel ? 'l' : 'L';
      lastC = null;
    } else if (C === 'L') {
      x = num() + (rel ? x : 0);
      y = num() + (rel ? y : 0);
      if (!cur) start(x, y);
      else cur.pts.push([x, y]);
      lastC = null;
    } else if (C === 'H') {
      x = num() + (rel ? x : 0);
      cur?.pts.push([x, y]);
      lastC = null;
    } else if (C === 'V') {
      y = num() + (rel ? y : 0);
      cur?.pts.push([x, y]);
      lastC = null;
    } else if (C === 'C' || C === 'S') {
      let x1: number;
      let y1: number;
      if (C === 'C') {
        x1 = num() + (rel ? x : 0);
        y1 = num() + (rel ? y : 0);
      } else {
        x1 = lastC ? 2 * x - lastC[0] : x;
        y1 = lastC ? 2 * y - lastC[1] : y;
      }
      const x2 = num() + (rel ? x : 0);
      const y2 = num() + (rel ? y : 0);
      const ex = num() + (rel ? x : 0);
      const ey = num() + (rel ? y : 0);
      const n = 18;
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        cur?.pts.push([
          u * u * u * x + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * ex,
          u * u * u * y + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * ey,
        ]);
      }
      lastC = [x2, y2];
      x = ex;
      y = ey;
    } else if (C === 'Q') {
      const x1 = num() + (rel ? x : 0);
      const y1 = num() + (rel ? y : 0);
      const ex = num() + (rel ? x : 0);
      const ey = num() + (rel ? y : 0);
      const n = 14;
      for (let k = 1; k <= n; k++) {
        const t = k / n;
        const u = 1 - t;
        cur?.pts.push([u * u * x + 2 * u * t * x1 + t * t * ex, u * u * y + 2 * u * t * y1 + t * t * ey]);
      }
      lastC = null;
      x = ex;
      y = ey;
    } else {
      i++; // unknown command: skip it rather than loop forever
    }
  }
  return subs;
}

export interface Tf {
  x?: number; // translate
  y?: number;
  s?: number; // uniform scale
  sx?: number; // extra horizontal scale
  sy?: number;
  flip?: boolean; // mirror left-right (before rotation)
  rot?: number; // degrees, clockwise
}

export function tfPoint(p: Pt, t: Tf): Pt {
  const s = t.s ?? 1;
  let px = p[0] * s * (t.sx ?? 1) * (t.flip ? -1 : 1);
  let py = p[1] * s * (t.sy ?? 1);
  if (t.rot) {
    const a = (t.rot * Math.PI) / 180;
    const c = Math.cos(a);
    const sn = Math.sin(a);
    [px, py] = [px * c - py * sn, px * sn + py * c];
  }
  return [px + (t.x ?? 0), py + (t.y ?? 0)];
}

export interface ShapeOpts {
  fill?: Fill;
  stroke?: string | null;
  sw?: number;
  opacity?: number;
  closed?: boolean; // force open/closed; default follows Z in the path
  eo?: boolean; // even-odd fill (rings, holes)
  cap?: 'round' | 'butt';
  dash?: number[];
}

/** Builds a Fabric path from flattened sub-paths. Position is the exact centre of all the points. */
export function pathObj(subs: Sub[], o: ShapeOpts = {}): Obj {
  const all = subs.flatMap((s) => s.pts);
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const d = subs
    .map((s) => {
      const closed = o.closed ?? s.closed;
      return 'M' + s.pts.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L') + (closed ? ' Z' : '');
    })
    .join(' ');
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
    strokeLineCap: o.cap ?? 'round',
    strokeLineJoin: 'round',
    ...(o.dash ? { strokeDashArray: o.dash } : {}),
    ...(o.eo ? { fillRule: 'evenodd' } : {}),
    opacity: o.opacity ?? 1,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    selectable: false,
    evented: false,
  };
}

/** One shape from a path string, placed with a transform. */
export function shape(d: string, t: Tf = {}, o: ShapeOpts = {}): Obj {
  const subs = parsePath(d).map((s) => ({ ...s, pts: s.pts.map((p) => tfPoint(p, t)) }));
  return pathObj(subs, o);
}

/** A shape straight from absolute points (no transform), e.g. computed outlines. */
export function poly(pts: Pt[], o: ShapeOpts = {}): Obj {
  return pathObj([{ pts, closed: o.closed !== false }], o);
}

// ----------------------------------------------------------------------------
// Illustration "art": a list of layers drawn in a local coordinate space, then placed with a transform.
// ----------------------------------------------------------------------------
export interface Layer {
  d: string;
  f?: Fill; // fill (colour key, hex or gradient)
  s?: string; // stroke
  w?: number; // stroke width
  o?: number; // opacity
  eo?: boolean;
  closed?: boolean;
}

export type Colors = Record<string, string>;

const resolve = (c: Fill | undefined, colors: Colors): Fill => {
  if (typeof c === 'string') return colors[c] ?? c;
  return c ?? null;
};

/** Draws layers in order. Colour keys are looked up in `colors`; anything else is used as-is (hex). */
export function art(layers: Layer[], colors: Colors, t: Tf = {}): Obj[] {
  return layers.map((l) =>
    shape(l.d, t, {
      fill: resolve(l.f, colors),
      stroke: l.s ? (resolve(l.s, colors) as string) : null,
      sw: l.w ?? (l.s ? 1.4 : 0),
      opacity: l.o ?? 1,
      eo: l.eo,
      closed: l.closed,
    }),
  );
}

// ----------------------------------------------------------------------------
// Path-string helpers (local coordinates)
// ----------------------------------------------------------------------------
export const ellD = (cx: number, cy: number, rx: number, ry = rx) => {
  const k = 0.5523;
  return (
    `M${cx - rx} ${cy} C${cx - rx} ${cy - ry * k} ${cx - rx * k} ${cy - ry} ${cx} ${cy - ry} ` +
    `C${cx + rx * k} ${cy - ry} ${cx + rx} ${cy - ry * k} ${cx + rx} ${cy} ` +
    `C${cx + rx} ${cy + ry * k} ${cx + rx * k} ${cy + ry} ${cx} ${cy + ry} ` +
    `C${cx - rx * k} ${cy + ry} ${cx - rx} ${cy + ry * k} ${cx - rx} ${cy} Z`
  );
};

/** A petal / leaf from (0,0) pointing along +x. */
export const petalD = (len: number, wid: number, tip = 0.5) =>
  `M0 0 C${len * 0.28} ${-wid * 0.62} ${len * (0.78 + tip * 0.1)} ${-wid * 0.5} ${len} 0 ` +
  `C${len * (0.78 + tip * 0.1)} ${wid * 0.5} ${len * 0.28} ${wid * 0.62} 0 0 Z`;

/** A teardrop (paisley body) pointing up, base at (0,0). */
export const dropD = (h: number, w: number) =>
  `M0 0 C${-w} ${-h * 0.2} ${-w * 0.9} ${-h * 0.75} 0 ${-h} C${w * 0.9} ${-h * 0.75} ${w} ${-h * 0.2} 0 0 Z`;

/** Mirrors a half-shape written for x >= 0 around x = 0. Input and output are path strings of absolute M/L/C/Q. */
export function mirrorD(d: string): string {
  const subs = parsePath(d);
  const half = subs[0].pts;
  const full = [...half, ...half.slice().reverse().map((p): Pt => [-p[0], p[1]])];
  return 'M' + full.map((p) => `${r1(p[0])} ${r1(p[1])}`).join(' L') + ' Z';
}

// ----------------------------------------------------------------------------
// Text blocks
// ----------------------------------------------------------------------------
export interface Copy {
  label: string;
  names: string;
  namesId: string;
  line: string;
  date: string;
  time: string;
  venue: string;
  address: string;
}

export const COPY: Record<string, Copy> = {
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
  festival: {
    label: 'Festival of lights', names: 'Diwali Dinner', namesId: 'event_title',
    line: 'Light a diya and join us\nfor sweets, music and laughter',
    date: 'Saturday, 8th November 2026', time: '7:00 PM', venue: 'The Sharma Residence', address: 'New Delhi',
  },
  other: {
    label: 'Celebrate with us', names: 'Our Get-together', namesId: 'event_title',
    line: 'We would love to have you\njoin us for a happy day',
    date: 'Saturday, 3rd October 2026', time: '5:00 PM', venue: 'The Garden Hall', address: 'Kolkata, West Bengal',
  },
};

export interface Ys {
  label: number;
  names: number;
  line: number;
  date: number;
  time: number;
  venue: number;
  address: number;
}

export interface BlockStyle {
  x?: number; // centre (or edge when aligned left/right)
  align?: 'left' | 'center' | 'right';
  width?: number;
  lineWidth?: number;
  ink?: string; // names + date + venue
  soft?: string; // line, time, address
  main?: string; // label
  nameFont?: string;
  nameSize?: number;
  nameWeight?: string;
  nameStyle?: string;
  nameLine?: number;
  nameSpacing?: number;
  labelFont?: string;
  labelSize?: number;
  labelSpacing?: number;
  labelUpper?: boolean;
  labelWeight?: string;
  bodyFont?: string;
  bodyStyle?: string;
  bodySize?: number;
  dateFont?: string;
  dateSize?: number;
  dateWeight?: string;
  dateStyle?: string;
  dateUpper?: boolean;
  dateSpacing?: number;
  timeFont?: string;
  venueFont?: string;
  venueSize?: number;
  venueWeight?: string;
  venueStyle?: string;
  addressFont?: string;
}

/** The seven editable text lines, styled per template. Positions are given per layout. */
export function textBlock(c: Copy, ys: Ys, st: BlockStyle): Obj[] {
  const align = st.align ?? 'center';
  const x = st.x ?? CX;
  const w = st.width ?? 480;
  const ink = st.ink ?? '#1c2757';
  const soft = st.soft ?? '#4b5684';
  const main = st.main ?? ink;
  const common = { x, align };
  return [
    text(st.labelUpper === false ? c.label : c.label.toUpperCase(), ys.label, {
      ...common, size: st.labelSize ?? 14, font: st.labelFont ?? 'Karla', fill: main,
      weight: st.labelWeight ?? 'bold', spacing: st.labelSpacing ?? 320, id: 'label', width: w,
    }),
    text(c.names, ys.names, {
      ...common, size: st.nameSize ?? 60, font: st.nameFont ?? 'Caveat', fill: ink,
      weight: st.nameWeight ?? 'bold', style: st.nameStyle, id: c.namesId, width: w + 20,
      lineHeight: st.nameLine ?? 1.05, spacing: st.nameSpacing,
    }),
    text(c.line, ys.line, {
      ...common, size: st.bodySize ?? 17, font: st.bodyFont ?? 'Fraunces', fill: soft, style: st.bodyStyle,
      id: 'invitation_text', width: st.lineWidth ?? 420, lineHeight: 1.35,
    }),
    text(st.dateUpper ? c.date.toUpperCase() : c.date, ys.date, {
      ...common, size: st.dateSize ?? 24, font: st.dateFont ?? 'Fraunces', fill: ink,
      weight: st.dateWeight ?? '600', style: st.dateStyle, id: 'event_date', width: w + 20, spacing: st.dateSpacing,
    }),
    text(c.time, ys.time, { ...common, size: 16, font: st.timeFont ?? 'Karla', fill: soft, id: 'event_time', width: w - 40 }),
    text(c.venue, ys.venue, {
      ...common, size: st.venueSize ?? 22, font: st.venueFont ?? 'Fraunces', fill: ink,
      weight: st.venueWeight ?? '700', style: st.venueStyle, id: 'venue_name', width: w,
    }),
    text(c.address, ys.address, { ...common, size: 15, font: st.addressFont ?? 'Karla', fill: soft, id: 'venue_address', width: w - 40 }),
  ];
}

/** A row of small dots with a diamond in the middle, used as a divider. */
export function dotRow(x0: number, x1: number, y: number, colour: string, mid = CX, gap = 14): Obj[] {
  const out: Obj[] = [];
  for (let x = x0; x <= x1; x += gap) out.push(dot(x, y, 2.2, colour, 0.9));
  out.push(poly([[mid, y - 6], [mid + 6, y], [mid, y + 6], [mid - 6, y]], { fill: colour }));
  return out;
}
