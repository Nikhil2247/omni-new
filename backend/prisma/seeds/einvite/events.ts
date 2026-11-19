// ============================================================================
// Corporate (3), housewarming (3), graduation (2) and other / festival (4) templates.
// ============================================================================
import { EInviteCategory } from '@prisma/client';
import { COPY, CX, H, W, dot, dotRow, grad, page, pal, poly, shape, textBlock, type Obj } from './kit';
import { bigLeaf, frame, garland, laurel, lantern, sparkle, sprig } from './motifs';
import { hexA, moon, softBlob, starField } from './botanical';
import { sketchLayout } from './sketch';
import { SKETCH } from './palettes';
import type { TemplateDef } from './types';

const sk = (layout: Parameters<typeof sketchLayout>[0], key: keyof typeof SKETCH, copy: keyof typeof COPY) => () => sketchLayout(layout, SKETCH[key], COPY[copy]);
const rnd = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------------------------------------------------------------------------------------------
const geometricGala = (): Obj[] => {
  const c = COPY.corporate;
  const navy = '#14284b', teal = '#1fa7a0', coral = '#ff6b57';
  return [
    page('#f4f6fa'),
    poly([[0, 0], [380, 0], [0, 380]], { fill: navy }),
    poly([[0, 0], [250, 0], [0, 250]], { fill: teal, opacity: 0.9 }),
    poly([[0, 0], [120, 0], [0, 120]], { fill: coral }),
    poly([[600, 800], [600, 560], [360, 800]], { fill: navy }),
    poly([[600, 800], [600, 680], [480, 800]], { fill: teal, opacity: 0.9 }),
    dot(520, 120, 54, 'rgba(0,0,0,0)', 1, navy, 1.6), dot(520, 120, 34, 'rgba(0,0,0,0)', 1, teal, 1.6), dot(520, 120, 6, coral, 1),
    shape('M60 430 L540 430', {}, { stroke: navy, sw: 1.2, closed: false, opacity: 0.3 }),
    ...textBlock(c, { label: 330, names: 396, line: 458, date: 528, time: 560, venue: 612, address: 640 }, {
      align: 'left', x: 60, width: 440, lineWidth: 400, ink: navy, soft: '#5a6a85', main: teal,
      nameFont: 'Montserrat', nameSize: 38, nameWeight: '700', nameSpacing: 20, nameLine: 1.1,
      labelFont: 'Montserrat', labelSize: 12, labelSpacing: 320, bodyFont: 'Montserrat', bodySize: 15, bodyStyle: 'normal',
      dateFont: 'Montserrat', dateSize: 20, dateWeight: '700', venueFont: 'Montserrat', venueSize: 18, venueWeight: '700', timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    shape('M60 430 L110 430', {}, { stroke: coral, sw: 3, closed: false }),
  ];
};

const laurelGold = (): Obj[] => {
  const c = COPY.corporate;
  const gold = '#b88f3a', green = '#173d2c';
  return [
    page(grad([[0, '#faf8f0'], [1, '#efeadb']])),
    frame(28, gold, 1.6), frame(38, gold, 0.7, 0.7),
    softBlob(CX, 400, 260, '#e9e2c6', 0.7),
    ...laurel(CX, 330, 470, '#4f7a58', '#7aa583', '#2f5a3c'),
    poly([[CX, 78], [CX + 7, 94], [CX + 24, 94], [CX + 10, 104], [CX + 15, 120], [CX, 110], [CX - 15, 120], [CX - 10, 104], [CX - 24, 94], [CX - 7, 94]], { fill: gold }),
    ...textBlock(c, { label: 252, names: 322, line: 388, date: 612, time: 646, venue: 694, address: 724 }, {
      width: 240, lineWidth: 230, ink: green, soft: '#5a6a58', main: gold, nameFont: 'Cinzel', nameSize: 26, nameWeight: '700', nameSpacing: 80, nameLine: 1.2,
      labelFont: 'Cinzel', labelSize: 10, labelSpacing: 300, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 17,
      dateFont: 'Cinzel', dateSize: 19, dateWeight: '700', dateSpacing: 80, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(220, 380, 574, gold),
  ];
};

// ---------------------------------------------------------------------------------------------
const monsteraHome = (): Obj[] => {
  const c = COPY.housewarming;
  const dark = '#2f5a45', mid = '#4f8466', light = '#7fae8a', terra = '#c8744a';
  const leaves = (x: number, y: number, f: number): Obj[] => [
    ...bigLeaf(x, y, 250, 120, f > 0 ? 38 : 142, dark, '#1d3a2c', 0.95),
    ...bigLeaf(x + f * 40, y + 30, 210, 100, f > 0 ? 8 : 172, mid, '#1d3a2c', 0.95),
    ...bigLeaf(x + f * 10, y + 70, 190, 90, f > 0 ? 68 : 112, light, '#2f5a45', 0.92),
    ...bigLeaf(x + f * 80, y - 20, 150, 70, f > 0 ? -22 : 202, mid, '#1d3a2c', 0.9),
  ];
  return [
    page(grad([[0, '#fcf5ea'], [1, '#f6e6d2']])),
    softBlob(520, 150, 200, '#f0cdb0', 0.7), softBlob(80, 700, 220, '#e9c9a8', 0.7),
    ...leaves(-10, -10, 1),
    ...leaves(610, 810, -1),
    poly([[56, 56], [544, 56], [544, 744], [56, 744]], { stroke: terra, sw: 1.2, opacity: 0.6 }),
    ...textBlock(c, { label: 250, names: 322, line: 398, date: 478, time: 512, venue: 564, address: 594 }, {
      ink: '#5a2f1c', soft: '#8a6a56', main: terra, nameFont: 'Playfair Display', nameSize: 50, nameWeight: '700', nameStyle: 'italic',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Montserrat', dateSize: 17, dateWeight: '600', dateSpacing: 150, dateUpper: true, venueFont: 'Playfair Display', venueSize: 21, venueStyle: 'italic', timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    ...dotRow(220, 380, 440, terra),
  ];
};

// ---------------------------------------------------------------------------------------------
const holiColours = (): Obj[] => {
  const c = COPY.other;
  const cols = ['#ff2d87', '#ffd400', '#00b8c8', '#5cd65c', '#ff7a1a', '#8e3dc4'];
  const out: Obj[] = [page('#fffdf8')];
  const spots: Array<[number, number, number, number]> = [
    [60, 70, 150, 0], [210, 30, 100, 1], [420, 60, 120, 2], [560, 150, 130, 4], [20, 260, 90, 3],
    [560, 740, 150, 1], [400, 790, 110, 5], [90, 740, 140, 2], [250, 800, 100, 0], [575, 560, 90, 3], [30, 540, 80, 5],
  ];
  for (const [x, y, r, k] of spots) out.push(softBlob(x, y, r, cols[k], 0.85), dot(x, y, r * 0.38, hexA(cols[k], 0.6), 1));
  const r = rnd(8);
  for (let i = 0; i < 110; i++) {
    const x = r() * 600;
    const y = r() * 800;
    if (Math.hypot((x - CX) / 250, (y - 400) / 270) < 1) continue;
    out.push(dot(x, y, 1.6 + r() * 4.4, cols[Math.floor(r() * cols.length)], 0.8));
  }
  out.push(...textBlock({ ...c, label: 'Festival of colours', names: 'Holi Milan', line: 'Wear white, bring a smile\nand get ready to be coloured', date: 'Sunday, 8th March 2026', time: '11:00 AM onwards', venue: 'The Community Park', address: 'Chandigarh' }, { label: 250, names: 330, line: 410, date: 484, time: 518, venue: 568, address: 598 }, {
    ink: '#3a2a5a', soft: '#6a5a7a', main: '#ff2d87', nameFont: 'Fredoka', nameSize: 70, nameWeight: '700',
    labelFont: 'Fredoka', labelSize: 14, labelSpacing: 300, bodyFont: 'Fredoka', bodySize: 18, bodyStyle: 'normal',
    dateFont: 'Fredoka', dateSize: 24, dateWeight: '600', venueFont: 'Fredoka', venueSize: 22, venueWeight: '600', timeFont: 'Fredoka', addressFont: 'Fredoka',
  }));
  return out;
};

const festivalLanterns = (): Obj[] => {
  const c = COPY.festival;
  const p = pal({ gold: '#f2a516', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0' });
  const lanterns: Array<[number, number, number, string, string]> = [
    [50, 90, 1.0, '#ff8a3d', '#f2c14e'], [140, 170, 1.15, '#ff5c8a', '#f2c14e'], [235, 80, 0.95, '#ffc233', '#e8892e'],
    [365, 80, 0.95, '#ffc233', '#e8892e'], [460, 170, 1.15, '#ff5c8a', '#f2c14e'], [550, 90, 1.0, '#ff8a3d', '#f2c14e'],
  ];
  return [
    page(grad([[0, '#2a1650'], [0.55, '#7a2a6a'], [1, '#f2924a']])),
    softBlob(CX, 780, 340, '#ffc16a', 0.75),
    ...starField(17, 40, 10, 10, 590, 420, '#fff1cc'),
    ...lanterns.flatMap(([x, y, s, c1, c2]) => [shape(`M0 0 L0 ${y - 60 * s}`, { x, y: 0 }, { stroke: '#e8b84a', sw: 1.4, closed: false, opacity: 0.8 }), ...lantern(x, y, s, c1, c2, '#4a2a1a')]),
    ...garland(p, -10, 770, 610, 770, 26, 28, 4),
    ...textBlock(c, { label: 290, names: 366, line: 446, date: 520, time: 554, venue: 604, address: 634 }, {
      ink: '#ffe9b0', soft: '#f3d9e6', main: '#ffb35e', nameFont: 'Playfair Display', nameSize: 54, nameWeight: '700', nameStyle: 'italic',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Cinzel', dateSize: 20, dateWeight: '700', dateSpacing: 80, venueFont: 'Playfair Display', venueSize: 21, venueStyle: 'italic', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(210, 390, 484, '#ffb35e'),
  ];
};

const crescentStars = (): Obj[] => {
  const c = COPY.other;
  const gold = '#e6c26a';
  return [
    page(grad([[0, '#0e1a4a'], [1, '#1f2f78']])),
    softBlob(CX, 150, 240, '#4a5cc0', 0.45),
    ...starField(19, 60, 10, 10, 590, 760, '#ffffff'),
    frame(26, gold, 1.4, 0.9), frame(36, gold, 0.6, 0.6),
    // crescent moon
    shape('M0 -70 C-52 -70 -92 -34 -92 14 C-92 62 -52 98 0 98 C22 98 42 92 58 80 C-6 84 -44 46 -44 14 C-44 -18 -8 -56 58 -58 C42 -66 22 -70 0 -70 Z', { x: CX - 6, y: 150 }, { fill: gold }),
    poly([[CX + 56, 132], [CX + 61, 144], [CX + 74, 144], [CX + 64, 152], [CX + 68, 165], [CX + 56, 157], [CX + 44, 165], [CX + 48, 152], [CX + 38, 144], [CX + 51, 144]], { fill: gold }),
    ...textBlock(c, { label: 316, names: 392, line: 470, date: 544, time: 578, venue: 626, address: 656 }, {
      ink: gold, soft: '#cdd6f6', main: '#f2e2b0', nameFont: 'Cinzel', nameSize: 38, nameWeight: '700', nameSpacing: 100,
      labelFont: 'Cinzel', labelSize: 12, labelSpacing: 400, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Cinzel', dateSize: 19, dateWeight: '700', dateSpacing: 90, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(210, 390, 506, gold),
  ];
};

export const EVENT_TEMPLATES: TemplateDef[] = [
  { name: 'Midnight Arch', category: EInviteCategory.CORPORATE, palette: SKETCH.midnight, build: sk('arch', 'midnight', 'corporate'), isPremium: false },
  { name: 'Geometric Gala', category: EInviteCategory.CORPORATE, palette: pal({ main: '#1fa7a0', paper: '#f4f6fa', gold: '#ff6b57' }), build: geometricGala, isPremium: false },
  { name: 'Laurel and Gold', category: EInviteCategory.CORPORATE, palette: pal({ main: '#173d2c', paper: '#faf8f0', gold: '#b88f3a' }), build: laurelGold, isPremium: true },
  { name: 'New Home Bunting', category: EInviteCategory.HOUSEWARMING, palette: SKETCH.sage, build: sk('bunting', 'sage', 'housewarming'), isPremium: false },
  { name: 'Monstera Home', category: EInviteCategory.HOUSEWARMING, palette: pal({ main: '#c8744a', paper: '#fcf5ea', gold: '#c8744a' }), build: monsteraHome, isPremium: false },
  { name: 'Home Wreath', category: EInviteCategory.HOUSEWARMING, palette: SKETCH.marigold, build: sk('wreath', 'marigold', 'housewarming'), isPremium: false },
  { name: 'Graduate Arch', category: EInviteCategory.GRADUATION, palette: SKETCH.sage, build: sk('arch', 'sage', 'graduation'), isPremium: false },
  { name: 'Graduate Bunting', category: EInviteCategory.GRADUATION, palette: SKETCH.midnight, build: sk('bunting', 'midnight', 'graduation'), isPremium: false },
  { name: 'Celebration Mandala', category: EInviteCategory.OTHER, palette: SKETCH.cobalt, build: sk('mandala', 'cobalt', 'other'), isPremium: false },
  { name: 'Festival Lanterns', category: EInviteCategory.OTHER, palette: pal({ main: '#ffb35e', paper: '#2a1650', gold: '#f2a516' }), build: festivalLanterns, isPremium: true },
  { name: 'Holi Colours', category: EInviteCategory.OTHER, palette: pal({ main: '#ff2d87', paper: '#fffdf8', gold: '#ffd400' }), build: holiColours, isPremium: false },
  { name: 'Crescent and Stars', category: EInviteCategory.OTHER, palette: pal({ main: '#e6c26a', paper: '#0e1a4a', gold: '#e6c26a' }), build: crescentStars, isPremium: true },
];

void [H, W, moon, sparkle, sprig];
