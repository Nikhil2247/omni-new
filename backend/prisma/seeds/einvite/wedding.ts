// ============================================================================
// Wedding templates (14): the original sketchbook designs, Cherry Blossom Moon, Boho Eucalyptus, and new botanical
// and celestial variations.
// ============================================================================
import { EInviteCategory } from '@prisma/client';
import { COPY, CX, H, W, dot, dotRow, grad, page, pal, petalD, poly, shape, textBlock, type Obj } from './kit';
import { bigLeaf, blossom, eucalyptus, palm, quadPts, sparkle, sprig } from './motifs';
import { archOutline, blossomBranch, daisy, hexA, lavender, moon, oliveBranch, peony, softBlob, starField } from './botanical';
import { sketchLayout } from './sketch';
import { SKETCH } from './palettes';
import type { TemplateDef } from './types';

const wedding = COPY.wedding;
const sk = (layout: Parameters<typeof sketchLayout>[0], key: keyof typeof SKETCH, copy = wedding) => () => sketchLayout(layout, SKETCH[key], copy);

// ---------------------------------------------------------------------------------------------
const cherryBlossomMoon = (): Obj[] => {
  const branch = quadPts([-20, 150], [200, 70], [420, 90], 80);
  const blossoms: Obj[] = [];
  for (let i = 4; i < 80; i += 6) {
    const [x, y] = branch[i];
    blossoms.push(...blossom(x + (i % 12 ? 6 : -6), y - 12 + (i % 3) * 8, 12 + (i % 4), '#f7c4d2', '#f2c14e', i * 7));
  }
  return [
    page(grad([[0, '#0f1a44'], [1, '#243a86']])),
    softBlob(470, 130, 200, '#3a4ea8', 0.5),
    ...moon(470, 130, 66, '#fff1cc', '#fff4d6'),
    ...starField(4, 40, 20, 20, 580, 360, '#fff1cc'),
    poly(branch, { stroke: '#4a2f3a', sw: 4, closed: false }),
    poly(quadPts([300, 76], [330, 40], [380, 20], 20), { stroke: '#4a2f3a', sw: 3, closed: false }),
    ...blossoms,
    ...Array.from({ length: 16 }, (_, i) => shape(petalD(12, 6), { x: 60 + ((i * 83) % 480), y: 200 + ((i * 107) % 560), rot: (i * 47) % 360 }, { fill: '#f7c4d2', opacity: 0.55 })),
    ...textBlock(wedding, { label: 316, names: 392, line: 468, date: 540, time: 574, venue: 622, address: 652 }, {
      ink: '#fdf0f3', soft: '#c9d2f2', main: '#f2c14e', nameFont: 'Great Vibes', nameSize: 74, nameWeight: 'normal',
      labelFont: 'Cinzel', labelSize: 12, labelSpacing: 380, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 20,
      dateFont: 'Cinzel', dateSize: 20, dateWeight: '700', dateSpacing: 90, venueFont: 'Playfair Display', venueSize: 20, venueStyle: 'italic', timeFont: 'Cormorant Garamond',
    }),
    ...dotRow(200, 400, 500, '#f2c14e'),
  ];
};

const bohoEucalyptus = (): Obj[] => {
  const p = pal({ main: '#6b7f62', ink: '#38443a', soft: '#6a7468', gold: '#b88a4a', leaf: '#8fa486', leafDeep: '#4f6048', leafLight: '#c5d3bb' });
  return [
    page('#f6f4ec'),
    softBlob(120, 150, 150, '#dbe4d0', 0.8), softBlob(500, 690, 160, '#f0d5c4', 0.8),
    ...eucalyptus([-10, 10], [140, 160], [250, 40], 12, 28, p.leaf, p.leafLight, p.leafDeep),
    ...eucalyptus([-10, 120], [70, 200], [150, 250], 9, 24, p.leafLight, p.leaf, p.leafDeep),
    ...eucalyptus([610, 810], [460, 640], [350, 770], 12, 28, p.leaf, p.leafLight, p.leafDeep),
    ...eucalyptus([610, 690], [530, 600], [450, 560], 9, 24, p.leafLight, p.leaf, p.leafDeep),
    ...blossom(170, 214, 16, '#f0c7b8', '#b88a4a', 10), ...blossom(440, 590, 16, '#f0c7b8', '#b88a4a', 30), ...blossom(500, 640, 11, '#f7ddd2', '#b88a4a', 50),
    poly([[70, 70], [530, 70], [530, 730], [70, 730]], { stroke: p.gold, sw: 1.2, opacity: 0.7 }),
    ...textBlock(wedding, { label: 200, names: 288, line: 372, date: 458, time: 494, venue: 546, address: 576 }, {
      ink: p.ink, soft: p.soft, main: p.main, nameFont: 'Great Vibes', nameSize: 78, nameWeight: 'normal',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 440, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 20,
      dateFont: 'Montserrat', dateSize: 17, dateWeight: '600', dateSpacing: 160, dateUpper: true, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700',
      timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    ...dotRow(230, 370, 420, p.gold),
  ];
};

const blushPeonies = (): Obj[] => {
  const line = '#b5475f';
  const leaves = (x: number, y: number, flip: number): Obj[] => [
    ...bigLeaf(x + flip * 70, y + 30, 120, 44, flip > 0 ? 20 : 160, '#7fa081', '#4d6f55', 0.95),
    ...bigLeaf(x + flip * 20, y + 90, 110, 40, flip > 0 ? 60 : 120, '#93b393', '#4d6f55', 0.9),
    ...bigLeaf(x + flip * 100, y - 20, 100, 36, flip > 0 ? -10 : 190, '#6f9573', '#4d6f55', 0.9),
  ];
  const cluster = (x: number, y: number, s: number, flip: number): Obj[] => [
    ...leaves(x, y, flip),
    ...peony(x, y, 64 * s, '#f4b6c2', '#f9d3da', '#e58fa3', line, 0),
    ...peony(x + flip * 92 * s, y + 38 * s, 46 * s, '#fbd9de', '#f4b6c2', '#e58fa3', line, 20),
    ...peony(x + flip * 20 * s, y + 104 * s, 40 * s, '#f9c4ce', '#fde4e8', '#e58fa3', line, 40),
    ...blossom(x + flip * 150 * s, y - 20 * s, 14 * s, '#ffffff', '#f2c14e', 12, '#e6d9c8'),
  ];
  return [
    page(grad([[0, '#fffaf8'], [1, '#fbe6e4']])),
    softBlob(60, 80, 180, '#f9c9d1', 0.7), softBlob(550, 740, 190, '#f9c9d1', 0.7), softBlob(520, 120, 120, '#fde9c6', 0.6),
    ...cluster(76, 92, 1, 1),
    ...cluster(524, 708, 1, -1),
    poly([[40, 40], [560, 40], [560, 760], [40, 760]], { stroke: '#c9a36a', sw: 1.2, opacity: 0.65 }),
    ...textBlock(wedding, { label: 250, names: 326, line: 408, date: 484, time: 520, venue: 574, address: 604 }, {
      ink: line, soft: '#7a4a5a', main: '#c9a36a', nameFont: 'Great Vibes', nameSize: 80, nameWeight: 'normal',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Cormorant Garamond', dateSize: 27, dateWeight: '700', venueFont: 'Cormorant Garamond', venueSize: 23, venueStyle: 'italic', timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    ...dotRow(220, 380, 450, '#c9a36a'),
  ];
};

const oliveBranchArch = (): Obj[] => {
  const gold = '#b99654';
  const leaf = '#7f9468', leaf2 = '#a8b88f', stem = '#5d6e4a';
  return [
    page('#fbfaf3'),
    softBlob(CX, 400, 260, '#eef1e0', 0.9),
    archOutline(CX, 64, 742, 410, gold, 1.8),
    archOutline(CX, 80, 742, 380, gold, 0.8, 0.7),
    ...oliveBranch([130, 760], [70, 560], [150, 270], 15, 40, leaf, leaf2, stem, '#5b5a3a'),
    ...oliveBranch([470, 760], [530, 560], [450, 270], 15, 40, leaf, leaf2, stem, '#5b5a3a'),
    ...oliveBranch([160, 90], [230, 70], [300, 90], 9, 30, leaf, leaf2, stem, '#5b5a3a'),
    ...oliveBranch([440, 90], [370, 70], [300, 90], 9, 30, leaf, leaf2, stem, '#5b5a3a'),
    ...textBlock(wedding, { label: 226, names: 304, line: 384, date: 462, time: 498, venue: 552, address: 582 }, {
      width: 300, lineWidth: 290, ink: '#3f4a34', soft: '#6c7660', main: gold, nameFont: 'Cormorant Garamond', nameSize: 46, nameWeight: '700', nameStyle: 'italic',
      labelFont: 'Cinzel', labelSize: 11, labelSpacing: 340, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 19,
      dateFont: 'Cinzel', dateSize: 17, dateWeight: '700', dateSpacing: 70, venueFont: 'Cormorant Garamond', venueSize: 22, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(230, 370, 420, gold),
  ];
};

const magnoliaDusk = (): Obj[] => {
  return [
    page(grad([[0, '#35264f'], [0.5, '#a05a86'], [1, '#f4b98a']])),
    softBlob(CX, 760, 340, '#ffd9a8', 0.8),
    softBlob(90, 120, 170, '#c58bb8', 0.5),
    ...starField(21, 34, 20, 20, 580, 330, '#fff3dd'),
    ...blossomBranch([-20, 70], [160, 30], [380, 150], 6, 34, '#fffaf4', '#f2c14e', '#3a2a34', 9, false),
    ...blossomBranch([620, 740], [470, 780], [300, 700], 5, 30, '#fffaf4', '#f2c14e', '#3a2a34', 3, false),
    ...Array.from({ length: 14 }, (_, i) => shape(petalD(14, 7), { x: 40 + ((i * 97) % 520), y: 190 + ((i * 113) % 520), rot: (i * 53) % 360 }, { fill: '#fffaf4', opacity: 0.5 })),
    ...textBlock(wedding, { label: 290, names: 368, line: 448, date: 522, time: 556, venue: 606, address: 636 }, {
      ink: '#fffaf4', soft: '#f6dfe6', main: '#ffd9a8', nameFont: 'Playfair Display', nameSize: 56, nameWeight: '700', nameStyle: 'italic',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Montserrat', dateSize: 17, dateWeight: '600', dateSpacing: 150, dateUpper: true, venueFont: 'Playfair Display', venueSize: 21, venueStyle: 'italic', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(210, 390, 484, '#ffd9a8'),
  ];
};

const wildflowerMeadow = (): Obj[] => {
  const out: Obj[] = [page(grad([[0, '#dcebfa'], [0.55, '#fdf9ee'], [1, '#f3ecd4']])), softBlob(110, 110, 130, '#fbe3a6', 0.6), softBlob(520, 150, 120, '#cfe3f7', 0.7)];
  const rnd = ((s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296))(11);
  const heads: Obj[] = [];
  for (let i = 0; i < 34; i++) {
    const x = 6 + (i / 33) * 588 + (rnd() - 0.5) * 12;
    const top = 640 + rnd() * 110 - (i % 5 === 0 ? 40 : 0);
    out.push(shape(`M${x} 810 C${x + (rnd() - 0.5) * 24} ${(810 + top) / 2} ${x + (rnd() - 0.5) * 24} ${top + 30} ${x} ${top}`, {}, { stroke: '#5f8a4e', sw: 2, closed: false, opacity: 0.9 }));
    out.push(shape(petalD(26, 9, 0.9), { x, y: top + 40 + rnd() * 50, rot: rnd() > 0.5 ? -35 : 215 }, { fill: '#79a35f', opacity: 0.9 }));
    const k = i % 4;
    if (k === 0) heads.push(...daisy(x, top, 15 + rnd() * 5));
    else if (k === 1) heads.push(...blossom(x, top, 12 + rnd() * 4, '#6f8fe0', '#f2c14e', rnd() * 72));
    else if (k === 2) heads.push(...blossom(x, top, 13 + rnd() * 4, '#f08a8a', '#4a2a2a', rnd() * 72));
    else heads.push(...blossom(x, top, 11 + rnd() * 3, '#f7d86a', '#a8741a', rnd() * 72));
  }
  out.push(...lavender([30, 800], [20, 700], [50, 600], 11, 16, '#9a7ad0', '#b79ae6', '#5f8a4e'));
  out.push(...lavender([570, 800], [580, 700], [550, 600], 11, 16, '#9a7ad0', '#b79ae6', '#5f8a4e'));
  out.push(...heads);
  out.push(...textBlock(wedding, { label: 120, names: 196, line: 274, date: 348, time: 382, venue: 432, address: 462 }, {
    ink: '#3b5a8a', soft: '#5d6f8a', main: '#c08a2a', nameFont: 'Dancing Script', nameSize: 72, nameWeight: '700',
    labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
    dateFont: 'Playfair Display', dateSize: 24, dateWeight: '700', venueFont: 'Cormorant Garamond', venueSize: 23, venueStyle: 'italic', venueWeight: '700', timeFont: 'Montserrat', addressFont: 'Montserrat',
  }));
  return out;
};

const goldenHourPalms = (): Obj[] => {
  const g1 = '#3d7a52', g2 = '#6aa874', rib = '#2c5a3c';
  return [
    page(grad([[0, '#fff6e4'], [0.6, '#ffe2b4'], [1, '#ffc88a']])),
    softBlob(CX, 590, 330, '#ffb35e', 0.75),
    dot(CX, 590, 92, '#ffc468', 0.9), dot(CX, 590, 64, '#ffd98a', 0.95),
    ...palm(-8, 30, 250, 55, 34, g1, g2, rib),
    ...palm(608, 30, 250, 55, 146, g1, g2, rib),
    ...palm(-10, 800, 300, 60, -36, g1, g2, rib),
    ...palm(610, 800, 300, 60, 216, g1, g2, rib),
    poly([[44, 44], [556, 44], [556, 756], [44, 756]], { stroke: '#a9742a', sw: 1.1, opacity: 0.55 }),
    ...textBlock(wedding, { label: 232, names: 304, line: 376, date: 444, time: 478, venue: 526, address: 556 }, {
      ink: '#6e3f12', soft: '#8a5a2a', main: '#a9742a', nameFont: 'Cinzel', nameSize: 46, nameWeight: '700', nameSpacing: 140,
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 440, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Montserrat', dateSize: 16, dateWeight: '600', dateSpacing: 170, dateUpper: true, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    ...dotRow(220, 380, 408, '#a9742a'),
  ];
};

export const WEDDING_TEMPLATES: TemplateDef[] = [
  { name: 'Cobalt Bunting', category: EInviteCategory.WEDDING, palette: SKETCH.cobalt, build: sk('bunting', 'cobalt'), isPremium: false },
  { name: 'Marigold Mandala', category: EInviteCategory.WEDDING, palette: SKETCH.marigold, build: sk('mandala', 'marigold'), isPremium: false },
  { name: 'Painted Arch', category: EInviteCategory.WEDDING, palette: SKETCH.cobalt, build: sk('arch', 'cobalt'), isPremium: false },
  { name: 'Leaf Wreath', category: EInviteCategory.WEDDING, palette: SKETCH.sage, build: sk('wreath', 'sage'), isPremium: false },
  { name: 'Marigold Garland', category: EInviteCategory.WEDDING, palette: SKETCH.marigold, build: sk('garland', 'marigold'), isPremium: false },
  { name: 'Sage Vine Border', category: EInviteCategory.WEDDING, palette: SKETCH.sage, build: sk('vinebor', 'sage'), isPremium: false },
  { name: 'Cherry Blossom Moon', category: EInviteCategory.WEDDING, palette: pal({ main: '#f5c6d2', paper: '#14214f', gold: '#f2c14e' }), build: cherryBlossomMoon, isPremium: true },
  { name: 'Boho Eucalyptus', category: EInviteCategory.WEDDING, palette: pal({ main: '#6b7f62', paper: '#f6f4ec', gold: '#b88a4a' }), build: bohoEucalyptus, isPremium: false },
  { name: 'Blush Peonies', category: EInviteCategory.WEDDING, palette: pal({ main: '#b5475f', paper: '#fffaf8', gold: '#c9a36a' }), build: blushPeonies, isPremium: true },
  { name: 'Olive Branch Arch', category: EInviteCategory.WEDDING, palette: pal({ main: '#6c7660', paper: '#fbfaf3', gold: '#b99654' }), build: oliveBranchArch, isPremium: false },
  { name: 'Magnolia Dusk', category: EInviteCategory.WEDDING, palette: pal({ main: '#ffd9a8', paper: '#35264f', gold: '#ffd9a8' }), build: magnoliaDusk, isPremium: true },
  { name: 'Wildflower Meadow', category: EInviteCategory.WEDDING, palette: pal({ main: '#3b5a8a', paper: '#fdf9ee', gold: '#c08a2a' }), build: wildflowerMeadow, isPremium: false },
  { name: 'Golden Hour Palms', category: EInviteCategory.WEDDING, palette: pal({ main: '#a9742a', paper: '#fff6e4', gold: '#a9742a' }), build: goldenHourPalms, isPremium: false },
  { name: 'Midnight Garland', category: EInviteCategory.WEDDING, palette: SKETCH.midnight, build: sk('garland', 'midnight'), isPremium: true },
];

void [H, W, hexA, sparkle, sprig];
