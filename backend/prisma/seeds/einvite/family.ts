// ============================================================================
// Engagement (4), birthday (4), baby shower (3) and anniversary (3) templates.
// ============================================================================
import { EInviteCategory } from '@prisma/client';
import { COPY, CX, H, W, dot, dotRow, grad, page, pal, petalD, poly, shape, textBlock, type Obj } from './kit';
import { balloon, bigLeaf, blossom, bunting, cloud, confetti, fairyLights, frame, palm, rose, sparkle, sprig, star } from './motifs';
import { hexA, lavender, moon, peony, softBlob, starField } from './botanical';
import { sketchLayout } from './sketch';
import { SKETCH } from './palettes';
import type { TemplateDef } from './types';

const sk = (layout: Parameters<typeof sketchLayout>[0], key: keyof typeof SKETCH, copy: keyof typeof COPY) => () => sketchLayout(layout, SKETCH[key], COPY[copy]);
const rnd = (s: number) => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);

// ---------------------------------------------------------------------------------------------
const roseGarlandFrame = (): Obj[] => {
  const c = COPY.engagement;
  const deep = '#a3203f';
  const r = rnd(5);
  const out: Obj[] = [page(grad([[0, '#fffaf6'], [1, '#fbe9e6']])), softBlob(CX, 400, 280, '#fbd9d9', 0.55)];
  const spots: Array<[number, number]> = [];
  for (let x = 44; x <= 556; x += 56) spots.push([x, 44], [x, 756]);
  for (let y = 100; y <= 700; y += 56) spots.push([44, y], [556, y]);
  for (const [x, y] of spots) out.push(...sprig([x - 18, y + 6], [x, y - 20], [x + 18, y + 6], 3, 18, '#6f9a6a', '#a8c8a0', '#3f6a4a'));
  spots.forEach(([x, y], i) => {
    const big = i % 3 === 0;
    out.push(...peony(x, y, big ? 27 : 21, big ? '#e0566e' : '#ec8696', big ? '#f0a1ae' : '#f6bcc4', deep, '#8a1c36', i * 23));
  });
  void r;
  out.push(...textBlock(c, { label: 214, names: 296, line: 376, date: 452, time: 488, venue: 540, address: 570 }, {
    ink: deep, soft: '#7a4a5a', main: '#c9a36a', nameFont: 'Great Vibes', nameSize: 76, nameWeight: 'normal',
    labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
    dateFont: 'Playfair Display', dateSize: 24, dateWeight: '700', venueFont: 'Cormorant Garamond', venueSize: 23, venueStyle: 'italic', timeFont: 'Montserrat', addressFont: 'Montserrat',
  }));
  out.push(...dotRow(220, 380, 412, '#c9a36a'));
  return out;
};

const fairyLightGarden = (): Obj[] => {
  const c = COPY.engagement;
  const warm = ['#ffd66b', '#ff9bb0', '#fff1b8', '#9fe0d6'];
  return [
    page(grad([[0, '#0a2a36'], [1, '#14596b']])),
    softBlob(CX, 700, 300, '#2fa3a8', 0.35),
    ...starField(8, 36, 10, 10, 590, 380, '#fff1cc'),
    ...fairyLights(-10, 40, 610, 40, 60, 16, warm),
    ...fairyLights(-10, 110, 610, 110, 46, 14, warm),
    ...sprig([-10, 800], [70, 640], [30, 500], 9, 34, '#4f9a76', '#8fd0a8', '#1f5a46'),
    ...sprig([610, 800], [530, 640], [570, 500], 9, 34, '#4f9a76', '#8fd0a8', '#1f5a46'),
    ...blossom(60, 640, 20, '#ffd9e0', '#f2c14e', 10), ...blossom(110, 700, 15, '#ffffff', '#f2c14e', 40), ...blossom(30, 560, 13, '#ffd9e0', '#f2c14e', 70),
    ...blossom(540, 640, 20, '#ffd9e0', '#f2c14e', 30), ...blossom(490, 700, 15, '#ffffff', '#f2c14e', 60), ...blossom(570, 560, 13, '#ffd9e0', '#f2c14e', 20),
    ...textBlock(c, { label: 250, names: 328, line: 408, date: 484, time: 518, venue: 568, address: 598 }, {
      ink: '#fff8ea', soft: '#bfe3e0', main: '#ffd66b', nameFont: 'Dancing Script', nameSize: 70, nameWeight: '700',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Playfair Display', dateSize: 23, dateWeight: '700', venueFont: 'Playfair Display', venueSize: 21, venueStyle: 'italic', timeFont: 'Montserrat', addressFont: 'Montserrat',
    }),
    ...dotRow(220, 380, 450, '#ffd66b'),
  ];
};

const lavenderFields = (): Obj[] => {
  const c = COPY.engagement;
  const out: Obj[] = [page(grad([[0, '#f2ecfb'], [1, '#fdf7fb']])), softBlob(80, 120, 160, '#d9c8f2', 0.65), softBlob(540, 160, 140, '#fbd9e6', 0.6)];
  for (let i = 0; i < 9; i++) {
    const a = -18 + i * 6;
    out.push(...lavender([-6 + i * 5, 806], [10 + a, 690], [34 + i * 11, 540 + (i % 3) * 20], 12, 17, '#8e6cc8', '#b79ae6', '#6f9a5f'));
    out.push(...lavender([606 - i * 5, 806], [590 - a, 690], [566 - i * 11, 540 + (i % 3) * 20], 12, 17, '#8e6cc8', '#b79ae6', '#6f9a5f'));
  }
  out.push(...sprig([0, 60], [80, 100], [150, 40], 6, 24, '#8fb08a', '#b9d0b2', '#5f8a56'), ...sprig([600, 60], [520, 100], [450, 40], 6, 24, '#8fb08a', '#b9d0b2', '#5f8a56'));
  out.push(...textBlock(c, { label: 170, names: 248, line: 328, date: 404, time: 438, venue: 490, address: 520 }, {
    ink: '#5b3a82', soft: '#7a6a96', main: '#b08a3a', nameFont: 'Cormorant Garamond', nameSize: 64, nameWeight: '700', nameStyle: 'italic',
    labelFont: 'Cinzel', labelSize: 12, labelSpacing: 360, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
    dateFont: 'Cinzel', dateSize: 19, dateWeight: '700', dateSpacing: 80, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
  }));
  out.push(...dotRow(220, 380, 368, '#b08a3a'));
  return out;
};

// ---------------------------------------------------------------------------------------------
const balloonPop = (): Obj[] => {
  const c = COPY.birthday;
  const cols = ['#ff5c8a', '#ffc233', '#3fa7f5', '#43c59e', '#9b6bf2', '#ff8a3d'];
  const out: Obj[] = [page(grad([[0, '#fffaf0'], [1, '#ffeccc']])), softBlob(CX, 300, 280, '#ffe3b0', 0.5)];
  const cluster = (x: number, y: number, flip: number): Obj[] => [
    ...balloon(x, y + 50, 48, cols[(flip > 0 ? 0 : 3)], 220, 16 * flip),
    ...balloon(x + flip * 56, y, 42, cols[(flip > 0 ? 1 : 4)], 250, 8 * flip),
    ...balloon(x + flip * 18, y - 52, 40, cols[(flip > 0 ? 2 : 5)], 270, -6 * flip),
    ...balloon(x + flip * 92, y + 56, 34, cols[(flip > 0 ? 4 : 1)], 200, 20 * flip),
    ...balloon(x - flip * 30, y + 110, 30, cols[(flip > 0 ? 5 : 2)], 170, -10 * flip),
  ];
  out.push(...confetti(7, 90, 0, 0, 600, 800, cols, (x, y) => y > 270 && y < 690 && x > 70 && x < 530));
  out.push(...cluster(110, 150, 1), ...cluster(490, 150, -1));
  out.push(...textBlock(c, { label: 300, names: 380, line: 462, date: 536, time: 570, venue: 620, address: 650 }, {
    ink: '#e0457b', soft: '#6a5a6a', main: '#3fa7f5', nameFont: 'Fredoka', nameSize: 64, nameWeight: '700',
    labelFont: 'Fredoka', labelSize: 14, labelSpacing: 300, bodyFont: 'Fredoka', bodySize: 18, bodyStyle: 'normal',
    dateFont: 'Fredoka', dateSize: 24, dateWeight: '600', venueFont: 'Fredoka', venueSize: 22, venueWeight: '600', timeFont: 'Fredoka', addressFont: 'Fredoka',
  }));
  out.push(...bunting(pal({ ink: '#5a4a5a' }), -10, 790, 610, 790, -30, 16, -34, 30, cols).map((o) => o));
  return out;
};

const confettiBurst = (): Obj[] => {
  const c = COPY.birthday;
  const cols = ['#ff5c8a', '#ffc233', '#3fa7f5', '#43c59e', '#9b6bf2', '#ff8a3d'];
  const out: Obj[] = [page(grad([[0, '#fff1f6'], [1, '#ffe9cc']]))];
  const r = rnd(33);
  for (let i = 0; i < 70; i++) {
    const a = r() * Math.PI * 2;
    const d = 270 + r() * 300;
    const x = CX + Math.cos(a) * d * 0.95;
    const y = 400 + Math.sin(a) * d * 1.05;
    if (x < 6 || x > 594 || y < 6 || y > 794) continue;
    const col = cols[Math.floor(r() * cols.length)];
    const k = r();
    if (k < 0.3) out.push(poly([[x, y - 11], [x + 3, y - 3], [x + 11, y], [x + 3, y + 3], [x, y + 11], [x - 3, y + 3], [x - 11, y], [x - 3, y - 3]], { fill: col, opacity: 0.95 }));
    else if (k < 0.62) out.push(dot(x, y, 4 + r() * 6, col, 0.9));
    else out.push(shape('M-9 -3 L9 -3 L9 3 L-9 3 Z', { x, y, rot: r() * 180 }, { fill: col, opacity: 0.92 }));
  }
  out.push(...confetti(91, 70, 0, 0, 600, 800, cols, (x, y) => Math.hypot((x - CX) / 270, (y - 430) / 215) < 1));
  out.push(...textBlock(c, { label: 250, names: 332, line: 412, date: 488, time: 522, venue: 574, address: 604 }, {
    ink: '#e0457b', soft: '#6a5a6a', main: '#3fa7f5', nameFont: 'Pacifico', nameSize: 56, nameWeight: 'normal',
    labelFont: 'Montserrat', labelSize: 12, labelSpacing: 380, labelWeight: '700', bodyFont: 'Fredoka', bodySize: 18, bodyStyle: 'normal',
    dateFont: 'Pacifico', dateSize: 22, dateWeight: 'normal', venueFont: 'Fredoka', venueSize: 22, venueWeight: '600', timeFont: 'Fredoka', addressFont: 'Fredoka',
  }));
  return out;
};

// ---------------------------------------------------------------------------------------------
const moonAndStars = (): Obj[] => {
  const c = COPY.baby;
  const soft = '#f6f0e0';
  return [
    page(grad([[0, '#1c2860'], [1, '#3e4c94']])),
    softBlob(CX, 160, 260, '#6a7cc8', 0.5),
    ...moon(CX, 150, 70, '#fff2cf', '#fff2cf'),
    ...starField(14, 50, 10, 10, 590, 520, '#fff2cf'),
    ...cloud(110, 740, 1.7, '#e9eeff', 0.9), ...cloud(300, 780, 2.1, '#dfe6fb', 0.92), ...cloud(500, 735, 1.8, '#e9eeff', 0.9),
    ...textBlock(c, { label: 288, names: 366, line: 446, date: 520, time: 554, venue: 602, address: 632 }, {
      ink: soft, soft: '#cfd6f2', main: '#ffd98a', nameFont: 'Dancing Script', nameSize: 66, nameWeight: '700',
      labelFont: 'Montserrat', labelSize: 11, labelSpacing: 420, labelWeight: '600', bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Playfair Display', dateSize: 23, dateWeight: '700', venueFont: 'Playfair Display', venueSize: 20, venueStyle: 'italic', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(220, 380, 484, '#ffd98a'),
  ];
};

const cloudNursery = (): Obj[] => {
  const c = COPY.baby;
  const cols = ['#9ccbf0', '#f7b9c9', '#ffe08a'];
  return [
    page(grad([[0, '#dcecfa'], [1, '#fdf9ef']])),
    ...cloud(100, 120, 1.5, '#ffffff', 0.95), ...cloud(500, 90, 1.9, '#ffffff', 0.95), ...cloud(330, 40, 1.1, '#ffffff', 0.9),
    ...balloon(90, 250, 34, cols[0], 150, 10), ...balloon(150, 220, 30, cols[1], 170, -8), ...balloon(510, 240, 34, cols[2], 160, -10), ...balloon(455, 210, 30, cols[0], 180, 8),
    ...starField(5, 24, 10, 280, 590, 780, '#f3c96a'),
    ...cloud(120, 770, 2.0, '#ffffff', 0.98), ...cloud(330, 800, 2.4, '#ffffff', 0.98), ...cloud(540, 765, 1.9, '#ffffff', 0.98),
    ...textBlock(c, { label: 262, names: 342, line: 420, date: 494, time: 528, venue: 578, address: 608 }, {
      ink: '#4a86b8', soft: '#6f8aa4', main: '#e08aa6', nameFont: 'Dancing Script', nameSize: 70, nameWeight: '700',
      labelFont: 'Fredoka', labelSize: 13, labelSpacing: 340, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Fredoka', dateSize: 23, dateWeight: '600', venueFont: 'Fredoka', venueSize: 21, venueWeight: '600', timeFont: 'Fredoka', addressFont: 'Fredoka',
    }),
    ...dotRow(220, 380, 458, '#e08aa6'),
  ];
};

// ---------------------------------------------------------------------------------------------
const goldenFernFrame = (): Obj[] => {
  const c = COPY.anniversary;
  const gold = '#d9b25a';
  const g1 = '#2f7a56', g2 = '#58a07a', rib = '#1f5a3c';
  return [
    page(grad([[0, '#12301f'], [1, '#0b1f14']])),
    softBlob(CX, 400, 280, '#1f5a3c', 0.5),
    ...palm(-6, 30, 230, 45, 42, g1, g2, rib), ...palm(606, 30, 230, 45, 138, g1, g2, rib),
    ...palm(-6, 800, 230, 45, -42, g1, g2, rib), ...palm(606, 800, 230, 45, 222, g1, g2, rib),
    frame(36, gold, 1.6), frame(46, gold, 0.7, 0.7),
    ...starField(3, 20, 60, 60, 540, 740, '#f5e2a8'),
    ...textBlock(c, { label: 226, names: 312, line: 396, date: 472, time: 506, venue: 556, address: 586 }, {
      ink: gold, soft: '#cfe3d3', main: '#f1e4be', nameFont: 'Cormorant Garamond', nameSize: 66, nameWeight: '700', nameStyle: 'italic',
      labelFont: 'Cinzel', labelSize: 12, labelSpacing: 380, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Cinzel', dateSize: 19, dateWeight: '700', dateSpacing: 90, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(210, 390, 436, gold),
  ];
};

const silverStars = (): Obj[] => {
  const c = COPY.anniversary;
  const silver = '#dfe6f5';
  return [
    page(grad([[0, '#141c4d'], [1, '#070b26']])),
    softBlob(CX, 140, 260, '#3a4aa0', 0.45),
    frame(24, silver, 1.4, 0.9), frame(34, silver, 0.6, 0.6),
    ...starField(12, 70, 20, 20, 580, 780, '#ffffff'),
    poly(star(CX, 120, 40, 16, 5), { fill: silver, opacity: 0.95 }),
    poly(star(CX - 90, 160, 18, 7, 5), { fill: silver, opacity: 0.8 }),
    poly(star(CX + 90, 160, 18, 7, 5), { fill: silver, opacity: 0.8 }),
    ...textBlock(c, { label: 250, names: 330, line: 410, date: 486, time: 520, venue: 572, address: 602 }, {
      ink: silver, soft: '#aab4d8', main: '#b9c6ee', nameFont: 'Cinzel', nameSize: 44, nameWeight: '700', nameSpacing: 120,
      labelFont: 'Cinzel', labelSize: 12, labelSpacing: 400, bodyFont: 'Cormorant Garamond', bodyStyle: 'italic', bodySize: 21,
      dateFont: 'Cinzel', dateSize: 19, dateWeight: '700', dateSpacing: 100, venueFont: 'Cormorant Garamond', venueSize: 24, venueStyle: 'italic', venueWeight: '700', timeFont: 'Cormorant Garamond', addressFont: 'Cormorant Garamond',
    }),
    ...dotRow(210, 390, 450, silver),
  ];
};

export const FAMILY_TEMPLATES: TemplateDef[] = [
  { name: 'Blush Garden', category: EInviteCategory.ENGAGEMENT, palette: SKETCH.blush, build: sk('bunting', 'blush', 'engagement'), isPremium: false },
  { name: 'Rose Garland Frame', category: EInviteCategory.ENGAGEMENT, palette: pal({ main: '#a3203f', paper: '#fffaf6', gold: '#c9a36a' }), build: roseGarlandFrame, isPremium: true },
  { name: 'Fairy Light Garden', category: EInviteCategory.ENGAGEMENT, palette: pal({ main: '#ffd66b', paper: '#0a2a36', gold: '#ffd66b' }), build: fairyLightGarden, isPremium: true },
  { name: 'Lavender Fields', category: EInviteCategory.ENGAGEMENT, palette: pal({ main: '#5b3a82', paper: '#f2ecfb', gold: '#b08a3a' }), build: lavenderFields, isPremium: false },
  { name: 'Party Bunting', category: EInviteCategory.BIRTHDAY, palette: SKETCH.marigold, build: sk('bunting', 'marigold', 'birthday'), isPremium: false },
  { name: 'Balloon Pop', category: EInviteCategory.BIRTHDAY, palette: pal({ main: '#e0457b', paper: '#fffaf0', gold: '#ffc233' }), build: balloonPop, isPremium: false },
  { name: 'Confetti Burst', category: EInviteCategory.BIRTHDAY, palette: pal({ main: '#e0457b', paper: '#fff1f6', gold: '#ffc233' }), build: confettiBurst, isPremium: false },
  { name: 'Sunny Vines', category: EInviteCategory.BIRTHDAY, palette: SKETCH.marigold, build: sk('vinebor', 'marigold', 'birthday'), isPremium: false },
  { name: 'Little One Wreath', category: EInviteCategory.BABY_SHOWER, palette: SKETCH.blush, build: sk('wreath', 'blush', 'baby'), isPremium: false },
  { name: 'Moon and Stars', category: EInviteCategory.BABY_SHOWER, palette: pal({ main: '#ffd98a', paper: '#1c2860', gold: '#ffd98a' }), build: moonAndStars, isPremium: false },
  { name: 'Cloud Nursery', category: EInviteCategory.BABY_SHOWER, palette: pal({ main: '#4a86b8', paper: '#dcecfa', gold: '#e08aa6' }), build: cloudNursery, isPremium: false },
  { name: 'Rose Gold Mandala', category: EInviteCategory.ANNIVERSARY, palette: SKETCH.blush, build: sk('mandala', 'blush', 'anniversary'), isPremium: false },
  { name: 'Golden Fern Frame', category: EInviteCategory.ANNIVERSARY, palette: pal({ main: '#d9b25a', paper: '#12301f', gold: '#d9b25a' }), build: goldenFernFrame, isPremium: true },
  { name: 'Silver Stars', category: EInviteCategory.ANNIVERSARY, palette: pal({ main: '#dfe6f5', paper: '#141c4d', gold: '#b9c6ee' }), build: silverStars, isPremium: true },
];

void [H, W, bigLeaf, hexA, moon, palm, petalD, sparkle];
