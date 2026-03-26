import 'dotenv/config';
import { PrismaClient, EInviteCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ============================================================================
// E-INVITE TEMPLATES SEED - 100+ Templates
// ============================================================================
// Indian Style + Western Style templates with SVG illustrations
// ============================================================================

interface TemplateDefinition {
  name: string;
  category: EInviteCategory;
  canvasJson: object;
  defaultColors: { primary: string; secondary: string; accent: string };
  isPremium: boolean;
  sortOrder: number;
}

// Canvas dimensions
const W = 600;
const H = 800;
const CX = W / 2; // Center X
const CY = H / 2; // Center Y

// Helper to create text object
const text = (
  t: string,
  left: number,
  top: number,
  opts: {
    size?: number;
    font?: string;
    fill?: string;
    weight?: string;
    align?: string;
    width?: number;
    id?: string;
    editable?: boolean;
  } = {}
) => ({
  type: 'textbox',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left,
  top,
  width: opts.width || 500,
  height: 50,
  fill: opts.fill || '#333333',
  stroke: null,
  strokeWidth: 1,
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  flipX: false,
  flipY: false,
  opacity: 1,
  shadow: null,
  visible: true,
  backgroundColor: '',
  text: t,
  fontSize: opts.size || 24,
  fontWeight: opts.weight || 'normal',
  fontFamily: opts.font || 'Playfair Display',
  fontStyle: 'normal',
  lineHeight: 1.16,
  textAlign: opts.align || 'center',
  charSpacing: 0,
  styles: {},
  id: opts.id || `text_${Math.random().toString(36).substr(2, 9)}`,
  editable: opts.editable !== false,
  selectable: true,
});

// Helper to create rectangle
const rect = (
  left: number,
  top: number,
  width: number,
  height: number,
  fill: string,
  opts: { rx?: number; opacity?: number; stroke?: string; strokeWidth?: number } = {}
) => ({
  type: 'rect',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left,
  top,
  width,
  height,
  fill,
  stroke: opts.stroke || null,
  strokeWidth: opts.strokeWidth || 0,
  rx: opts.rx || 0,
  ry: opts.rx || 0,
  opacity: opts.opacity || 1,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  selectable: false,
});

// Helper to create circle
const circle = (
  left: number,
  top: number,
  radius: number,
  fill: string,
  opts: { stroke?: string; strokeWidth?: number; opacity?: number } = {}
) => ({
  type: 'circle',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left,
  top,
  radius,
  fill,
  stroke: opts.stroke || null,
  strokeWidth: opts.strokeWidth || 0,
  opacity: opts.opacity || 1,
  angle: 0,
  scaleX: 1,
  scaleY: 1,
  selectable: false,
});

// Helper to create line
const line = (x1: number, y1: number, x2: number, y2: number, stroke: string, strokeWidth = 1) => ({
  type: 'line',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left: (x1 + x2) / 2,
  top: (y1 + y2) / 2,
  width: Math.abs(x2 - x1) || 1,
  height: Math.abs(y2 - y1) || 1,
  stroke,
  strokeWidth,
  x1: 0,
  y1: 0,
  x2: x2 - x1,
  y2: y2 - y1,
  selectable: false,
});

// Helper to create SVG path
const path = (
  d: string,
  left: number,
  top: number,
  opts: { fill?: string; stroke?: string; strokeWidth?: number; scaleX?: number; scaleY?: number; angle?: number; opacity?: number } = {}
) => ({
  type: 'path',
  version: '5.3.0',
  originX: 'center',
  originY: 'center',
  left,
  top,
  path: d,
  fill: opts.fill || null,
  stroke: opts.stroke || null,
  strokeWidth: opts.strokeWidth || 0,
  scaleX: opts.scaleX || 1,
  scaleY: opts.scaleY || 1,
  angle: opts.angle || 0,
  opacity: opts.opacity || 1,
  selectable: false,
});

// ============================================================================
// SVG PATHS LIBRARY
// ============================================================================

const SVG = {
  // Indian Motifs
  diya: 'M12,2 C12,2 8,6 8,10 C8,14 10,16 12,18 C14,16 16,14 16,10 C16,6 12,2 12,2 Z M10,20 L14,20 L14,22 L10,22 Z',
  lotus: 'M12,22 C12,22 4,16 4,10 C4,6 8,4 12,8 C16,4 20,6 20,10 C20,16 12,22 12,22 Z M12,8 C12,8 8,12 8,16 M12,8 C12,8 16,12 16,16',
  paisley: 'M15,3 C20,3 24,8 24,14 C24,20 18,26 12,26 C6,26 2,22 2,16 C2,10 6,6 10,6 C12,6 14,8 14,10 C14,12 12,14 10,14 C8,14 7,12 8,10',
  mandala: 'M12,4 L14,8 L18,8 L15,11 L16,15 L12,13 L8,15 L9,11 L6,8 L10,8 Z',
  kalash: 'M8,20 L16,20 L16,18 L18,18 L18,16 L16,14 L16,10 C16,8 14,6 12,6 C10,6 8,8 8,10 L8,14 L6,16 L6,18 L8,18 Z M10,4 L14,4 L13,6 L11,6 Z',
  om: 'M6,16 C4,14 4,10 6,8 C8,6 12,6 14,8 L14,12 M14,8 C16,10 18,10 20,8 M14,12 C14,14 16,16 18,16 C20,16 22,14 22,12 M10,18 C10,20 8,22 6,22',
  rangoli: 'M12,2 L14,6 L18,4 L16,8 L20,10 L16,12 L18,16 L14,14 L12,18 L10,14 L6,16 L8,12 L4,10 L8,8 L6,4 L10,6 Z',
  elephant: 'M4,14 C4,10 6,8 10,8 L10,6 C10,4 12,4 14,4 L18,4 C20,4 22,6 22,8 L22,16 C22,18 20,20 18,20 L8,20 C6,20 4,18 4,16 Z M8,12 L8,14 M18,10 C18,10 20,12 18,14',

  // Western Motifs
  heart: 'M12,21 L10.55,19.7 C5.4,15 2,12 2,8.5 C2,5.4 4.4,3 7.5,3 C9.2,3 10.9,3.8 12,5.1 C13.1,3.8 14.8,3 16.5,3 C19.6,3 22,5.4 22,8.5 C22,12 18.6,15 13.45,19.7 Z',
  rose: 'M12,3 C12,3 8,7 8,11 C8,15 10,17 12,17 C14,17 16,15 16,11 C16,7 12,3 12,3 Z M12,17 L12,22 M8,20 L12,17 L16,20',
  leaf: 'M12,2 C12,2 4,8 4,14 C4,18 8,22 12,22 C16,22 20,18 20,14 C20,8 12,2 12,2 Z M12,6 L12,18',
  star: 'M12,2 L14.4,8.6 L21.5,9.2 L16.2,14 L17.8,21 L12,17.3 L6.2,21 L7.8,14 L2.5,9.2 L9.6,8.6 Z',
  diamond: 'M12,2 L22,12 L12,22 L2,12 Z',
  crown: 'M3,18 L3,8 L7,12 L12,4 L17,12 L21,8 L21,18 Z',
  ring: 'M12,6 C16,6 20,10 20,14 C20,18 16,22 12,22 C8,22 4,18 4,14 C4,10 8,6 12,6 Z M12,10 C14,10 16,12 16,14 C16,16 14,18 12,18 C10,18 8,16 8,14 C8,12 10,10 12,10 Z',
  dove: 'M2,12 C2,12 6,8 12,8 C18,8 22,12 22,12 L18,14 L22,18 L14,16 L12,20 L10,16 L2,18 L6,14 Z',

  // Elegant Floral Elements (NEW - Canva Style)
  floralCorner: 'M0,40 Q0,0 40,0 M5,35 C10,25 20,20 30,25 C25,15 30,5 40,5 M10,30 Q15,20 25,22 M8,25 C12,18 18,16 24,18 M3,20 Q8,12 15,15 M15,35 C18,30 22,28 26,30 M20,38 C22,34 25,33 28,35',
  floralWreath: 'M12,2 C6,4 2,8 2,14 C2,20 6,24 12,24 C18,24 22,20 22,14 C22,8 18,4 12,2 M4,10 C6,8 8,9 10,12 M20,10 C18,8 16,9 14,12 M6,18 C8,20 10,19 12,16 M18,18 C16,20 14,19 12,16 M2,14 L4,14 M22,14 L20,14 M12,2 L12,4 M12,24 L12,22',
  roseDetailed: 'M12,4 C10,4 8,6 8,8 C8,10 9,11 10,11 C9,12 8,14 8,16 C8,19 10,21 12,21 C14,21 16,19 16,16 C16,14 15,12 14,11 C15,11 16,10 16,8 C16,6 14,4 12,4 M10,8 C10,9 11,10 12,10 C13,10 14,9 14,8 M9,14 C9,16 10,18 12,18 C14,18 15,16 15,14 M12,21 L12,26 M8,24 L12,22 L16,24',
  eucalyptus: 'M12,2 L12,26 M8,5 Q10,4 12,6 M16,5 Q14,4 12,6 M6,10 Q9,8 12,11 M18,10 Q15,8 12,11 M5,16 Q8,14 12,17 M19,16 Q16,14 12,17 M6,22 Q9,20 12,23 M18,22 Q15,20 12,23',
  botanicalBranch: 'M2,20 Q6,16 12,12 Q18,8 22,4 M5,17 Q7,14 10,13 M8,19 Q10,16 12,15 M15,10 Q17,7 19,6 M18,12 Q20,9 22,8',
  peony: 'M12,6 C8,6 5,10 5,14 C5,18 8,22 12,22 C16,22 19,18 19,14 C19,10 16,6 12,6 M8,10 Q10,8 12,10 Q14,8 16,10 M7,14 Q9,12 12,14 Q15,12 17,14 M8,18 Q10,16 12,18 Q14,16 16,18 M12,22 L12,28 M9,26 L12,24 L15,26',
  lavender: 'M12,28 L12,8 M10,6 C10,4 12,3 12,3 C12,3 14,4 14,6 M9,9 C9,7 11,6 12,6 M15,9 C15,7 13,6 12,6 M8,12 C8,10 10,9 12,9 M16,12 C16,10 14,9 12,9 M7,15 C7,13 9,12 12,12 M17,15 C17,13 15,12 12,12 M8,18 C8,16 10,15 12,15 M16,18 C16,16 14,15 12,15 M9,21 C9,19 10,18 12,18 M15,21 C15,19 14,18 12,18',

  // Wedding Couple Silhouettes (NEW)
  coupleSilhouette: 'M8,8 C8,5 10,3 12,3 C14,3 16,5 16,8 C16,10 15,12 13,13 L15,24 L12,22 L9,24 L11,13 C9,12 8,10 8,8 M18,10 C18,7 20,5 22,5 C24,5 26,7 26,10 C26,12 25,14 24,15 L26,24 L23,22 L20,24 L22,15 C21,14 18,12 18,10',
  holdingHands: 'M4,14 L6,14 C7,14 8,13 8,12 L8,10 C8,9 9,8 10,8 L14,8 C15,8 16,9 16,10 L16,12 C16,13 17,14 18,14 L20,14 M10,12 L14,12',
  weddingRings: 'M9,12 C5,12 2,15 2,19 C2,23 5,26 9,26 C13,26 16,23 16,19 C16,15 13,12 9,12 M15,8 C11,8 8,11 8,15 C8,19 11,22 15,22 C19,22 22,19 22,15 C22,11 19,8 15,8',
  weddingBells: 'M8,4 L8,6 C5,8 3,12 3,16 L13,16 C13,12 11,8 8,6 M16,4 L16,6 C19,8 21,12 21,16 L11,16 C11,12 13,8 16,6 M8,2 L8,4 M16,2 L16,4 M3,16 L3,20 L13,20 L13,16 M11,16 L11,20 L21,20 L21,16 M8,20 L8,22 M16,20 L16,22',
  weddingArch: 'M4,24 L4,8 C4,4 8,2 12,2 C16,2 20,4 20,8 L20,24 M6,24 L6,10 C6,6 9,4 12,4 C15,4 18,6 18,10 L18,24 M8,8 Q12,4 16,8 M4,12 C6,10 8,10 10,12 M14,12 C16,10 18,10 20,12',

  // Elegant Frames & Borders (NEW)
  ornateCorner: 'M0,50 L0,20 C0,8 8,0 20,0 L50,0 M5,45 C5,30 10,20 20,15 C30,10 40,10 45,5 M10,40 Q15,30 25,25 Q35,20 40,10 M8,35 C12,28 18,22 28,18 C35,15 38,12 42,8',
  artDecoCorner: 'M0,40 L0,0 L40,0 M5,35 L5,5 L35,5 M10,30 L10,10 L30,10 M15,25 L15,15 L25,15 M0,20 L20,0 M0,30 L30,0 M0,40 L40,0',
  vintageFrame: 'M20,0 L24,4 L20,8 L24,12 L20,16 M0,20 L4,24 L8,20 L12,24 L16,20 M20,40 L24,36 L20,32 L24,28 L20,24 M40,20 L36,24 L32,20 L28,24 L24,20',
  elegantDivider: 'M0,12 L8,12 C10,12 12,10 12,8 C12,6 14,4 16,4 C18,4 20,6 20,8 C20,10 22,12 24,12 L32,12 M12,12 C14,14 18,14 20,12',
  scrollDivider: 'M0,12 Q4,8 8,12 Q12,16 16,12 Q20,8 24,12 Q28,16 32,12',

  // Decorative Elements
  flourish: 'M2,12 C4,8 8,8 12,12 C16,8 20,8 22,12',
  swirl: 'M6,12 C6,8 10,6 14,8 C18,10 18,14 14,16 C10,18 8,16 10,12',
  corner: 'M4,20 L4,10 C4,6 8,4 12,4 L20,4',
  frame: 'M10,4 L14,4 M4,10 L4,14 M10,20 L14,20 M20,10 L20,14',
  dots: 'M6,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M12,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M18,12 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
  waves: 'M2,12 Q6,8 10,12 T18,12 T26,12',

  // Celebration
  balloon: 'M12,4 C8,4 5,8 5,12 C5,16 8,18 12,18 C16,18 19,16 19,12 C19,8 16,4 12,4 Z M12,18 L12,24 M10,24 L14,24',
  confetti: 'M4,4 L6,8 M10,2 L12,6 M18,4 L16,8 M20,8 L18,12 M4,16 L8,18 M16,18 L20,20',
  cake: 'M6,20 L18,20 L18,14 L6,14 Z M8,14 L8,12 M12,14 L12,10 M16,14 L16,12 M8,10 C8,8 16,8 16,10',
  gift: 'M6,12 L18,12 L18,20 L6,20 Z M4,8 L20,8 L20,12 L4,12 Z M12,8 L12,20 M8,8 C8,4 12,4 12,8 M16,8 C16,4 12,4 12,8',
  champagne: 'M10,20 L14,20 L14,14 L16,6 L16,4 L8,4 L8,6 L10,14 Z M8,22 L16,22',
  firework: 'M12,12 L12,4 M12,12 L18,6 M12,12 L18,12 M12,12 L18,18 M12,12 L12,20 M12,12 L6,18 M12,12 L6,12 M12,12 L6,6',
  sparkle: 'M12,0 L13,5 L18,6 L13,7 L12,12 L11,7 L6,6 L11,5 Z M20,10 L21,12 L24,13 L21,14 L20,16 L19,14 L16,13 L19,12 Z M4,14 L5,16 L8,17 L5,18 L4,20 L3,18 L0,17 L3,16 Z',

  // Baby themed
  baby: 'M12,8 C14,8 16,10 16,12 C16,14 14,16 12,16 C10,16 8,14 8,12 C8,10 10,8 12,8 Z M8,16 C6,18 6,22 8,24 L16,24 C18,22 18,18 16,16',
  stroller: 'M6,18 C4,18 2,16 2,14 L6,8 L18,8 L18,14 C18,16 16,18 14,18 M6,18 L6,20 M14,18 L14,20 M4,20 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0 M16,20 m-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0',
  rattle: 'M8,8 C4,8 2,12 4,16 C6,20 12,20 14,16 L18,12 C20,10 20,6 18,4 C16,2 12,2 10,4 L8,8 Z',

  // Academic
  cap: 'M12,8 L2,14 L12,20 L22,14 Z M12,20 L12,24 M8,16 L8,22 C8,24 16,24 16,22 L16,16',
  scroll: 'M6,6 C4,6 4,10 6,10 L18,10 C20,10 20,6 18,6 Z M6,10 L6,18 C6,20 8,20 8,18 L8,10 M18,10 L18,18 C18,20 16,20 16,18 L16,10',
  book: 'M4,6 L12,4 L20,6 L20,18 L12,20 L4,18 Z M12,4 L12,20',

  // Watercolor Effects (abstract shapes)
  watercolorBlob1: 'M10,5 Q15,2 20,5 Q25,10 22,18 Q18,25 10,22 Q3,18 5,10 Q7,5 10,5',
  watercolorBlob2: 'M8,8 Q14,3 20,8 Q26,15 20,22 Q12,28 6,20 Q2,12 8,8',
  watercolorSplash: 'M12,5 Q8,8 10,12 Q6,15 10,18 Q8,22 12,24 Q16,22 14,18 Q18,15 14,12 Q16,8 12,5',
};

// ============================================================================
// TEMPLATE DEFINITIONS
// ============================================================================

const templates: TemplateDefinition[] = [
  // ============================================================================
  // WEDDING TEMPLATES (25 templates)
  // ============================================================================

  // 1. Indian Traditional Gold Wedding
  {
    name: 'Royal Indian Gold',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#D4AF37', secondary: '#800020', accent: '#FFF8DC' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#800020'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#D4AF37', strokeWidth: 3 }),
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#D4AF37', strokeWidth: 1 }),
        path(SVG.mandala, CX, 80, { fill: '#D4AF37', scaleX: 3, scaleY: 3 }),
        path(SVG.diya, 80, 80, { fill: '#D4AF37', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.diya, W - 80, 80, { fill: '#D4AF37', scaleX: 1.5, scaleY: 1.5 }),
        text('शुभ विवाह', CX, 160, { size: 28, font: 'Noto Sans Devanagari', fill: '#D4AF37', id: 'hindi_label', editable: false }),
        text('Wedding Invitation', CX, 200, { size: 16, font: 'Cormorant Garamond', fill: '#FFF8DC', id: 'label' }),
        text('Priya & Arjun', CX, 300, { size: 52, font: 'Great Vibes', fill: '#D4AF37', id: 'couple_names' }),
        text('Together with their families\ninvite you to celebrate their union', CX, 400, { size: 16, font: 'Cormorant Garamond', fill: '#FFF8DC', id: 'invitation_text' }),
        text('Saturday, 15th December 2025', CX, 490, { size: 22, font: 'Cormorant Garamond', fill: '#D4AF37', weight: '600', id: 'event_date' }),
        text('Muhurat: 7:30 PM', CX, 530, { size: 16, font: 'Cormorant Garamond', fill: '#FFF8DC', id: 'event_time' }),
        text('The Grand Palace', CX, 590, { size: 20, font: 'Playfair Display', fill: '#D4AF37', weight: '600', id: 'venue_name' }),
        text('Jaipur, Rajasthan', CX, 625, { size: 14, font: 'Cormorant Garamond', fill: '#FFF8DC', id: 'venue_address' }),
        path(SVG.kalash, CX, 700, { fill: '#D4AF37', scaleX: 2, scaleY: 2 }),
        path(SVG.mandala, CX, H - 60, { fill: '#D4AF37', scaleX: 2, scaleY: 2 }),
      ],
      background: '#800020',
    },
  },

  // 2. Elegant Peacock Theme
  {
    name: 'Peacock Splendor',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#006064', secondary: '#E0F7FA', accent: '#FFD700' },
    isPremium: true,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#E0F7FA'),
        rect(CX, CY, W - 30, H - 30, 'transparent', { stroke: '#006064', strokeWidth: 2 }),
        path(SVG.paisley, 60, 100, { fill: '#006064', scaleX: 2, scaleY: 2 }),
        path(SVG.paisley, W - 60, 100, { fill: '#006064', scaleX: -2, scaleY: 2 }),
        path(SVG.paisley, 60, H - 100, { fill: '#006064', scaleX: 2, scaleY: -2 }),
        path(SVG.paisley, W - 60, H - 100, { fill: '#006064', scaleX: -2, scaleY: -2 }),
        circle(CX, 120, 40, 'transparent', { stroke: '#FFD700', strokeWidth: 2 }),
        path(SVG.mandala, CX, 120, { fill: '#FFD700', scaleX: 2, scaleY: 2 }),
        text('Wedding Celebration', CX, 200, { size: 18, font: 'Lora', fill: '#006064', id: 'label' }),
        text('Meera & Vikram', CX, 290, { size: 48, font: 'Great Vibes', fill: '#006064', id: 'couple_names' }),
        text('Request the honor of your presence', CX, 370, { size: 16, font: 'Lora', fill: '#455A64', id: 'invitation_text' }),
        text('January 20, 2026', CX, 450, { size: 24, font: 'Lora', fill: '#006064', weight: '600', id: 'event_date' }),
        text('6:00 PM onwards', CX, 490, { size: 16, font: 'Lora', fill: '#455A64', id: 'event_time' }),
        text('Taj Lake Palace', CX, 560, { size: 20, font: 'Playfair Display', fill: '#006064', weight: '600', id: 'venue_name' }),
        text('Udaipur, Rajasthan', CX, 595, { size: 14, font: 'Lora', fill: '#455A64', id: 'venue_address' }),
        path(SVG.lotus, CX, 680, { fill: '#006064', scaleX: 2, scaleY: 2 }),
      ],
      background: '#E0F7FA',
    },
  },

  // 3. Modern Minimalist White
  {
    name: 'Pure Minimalist',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#2C3E50', secondary: '#FFFFFF', accent: '#BDC3C7' },
    isPremium: false,
    sortOrder: 3,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        line(100, 150, W - 100, 150, '#2C3E50', 1),
        line(100, H - 150, W - 100, H - 150, '#2C3E50', 1),
        text('THE WEDDING OF', CX, 200, { size: 12, font: 'Montserrat', fill: '#BDC3C7', weight: '500', id: 'label' }),
        text('EMMA', CX, 280, { size: 48, font: 'Montserrat', fill: '#2C3E50', weight: '300', id: 'bride_name' }),
        text('&', CX, 340, { size: 32, font: 'Great Vibes', fill: '#BDC3C7', id: 'and_symbol' }),
        text('JAMES', CX, 400, { size: 48, font: 'Montserrat', fill: '#2C3E50', weight: '300', id: 'groom_name' }),
        text('15 . 06 . 2025', CX, 500, { size: 28, font: 'Montserrat', fill: '#2C3E50', weight: '600', id: 'event_date' }),
        text('FOUR O\'CLOCK IN THE AFTERNOON', CX, 545, { size: 11, font: 'Montserrat', fill: '#BDC3C7', id: 'event_time' }),
        text('THE MODERN GALLERY', CX, 610, { size: 14, font: 'Montserrat', fill: '#2C3E50', weight: '500', id: 'venue_name' }),
        text('123 Art Street, London', CX, 645, { size: 12, font: 'Montserrat', fill: '#BDC3C7', id: 'venue_address' }),
      ],
      background: '#FFFFFF',
    },
  },

  // 4. Rustic Garden
  {
    name: 'Rustic Garden',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#5D4037', secondary: '#FFF8E1', accent: '#8BC34A' },
    isPremium: false,
    sortOrder: 4,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        path(SVG.leaf, 80, 80, { fill: '#8BC34A', scaleX: 2, scaleY: 2 }),
        path(SVG.leaf, W - 80, 80, { fill: '#8BC34A', scaleX: -2, scaleY: 2 }),
        path(SVG.leaf, 80, H - 80, { fill: '#8BC34A', scaleX: 2, scaleY: -2 }),
        path(SVG.leaf, W - 80, H - 80, { fill: '#8BC34A', scaleX: -2, scaleY: -2 }),
        path(SVG.rose, CX, 100, { fill: '#E57373', scaleX: 2, scaleY: 2 }),
        text('Together with their families', CX, 180, { size: 14, font: 'Lora', fill: '#795548', id: 'families_text' }),
        text('Sarah & Michael', CX, 270, { size: 52, font: 'Dancing Script', fill: '#5D4037', id: 'couple_names' }),
        text('invite you to share in the joy\nof their wedding day', CX, 370, { size: 16, font: 'Lora', fill: '#795548', id: 'invitation_text' }),
        text('October 12, 2025', CX, 470, { size: 24, font: 'Lora', fill: '#5D4037', weight: '600', id: 'event_date' }),
        text('3:00 in the afternoon', CX, 510, { size: 16, font: 'Lora', fill: '#795548', id: 'event_time' }),
        text('Meadow Creek Farm', CX, 580, { size: 20, font: 'Playfair Display', fill: '#5D4037', weight: '600', id: 'venue_name' }),
        text('Vermont, USA', CX, 615, { size: 14, font: 'Lora', fill: '#795548', id: 'venue_address' }),
        path(SVG.leaf, CX - 60, 700, { fill: '#8BC34A', scaleX: 1.5, scaleY: 1.5, angle: -30 }),
        path(SVG.leaf, CX + 60, 700, { fill: '#8BC34A', scaleX: 1.5, scaleY: 1.5, angle: 30 }),
      ],
      background: '#FFF8E1',
    },
  },

  // 5. Royal Purple Indian
  {
    name: 'Royal Purple Elegance',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#6A1B9A', secondary: '#F3E5F5', accent: '#FFD700' },
    isPremium: true,
    sortOrder: 5,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#6A1B9A'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#FFD700', strokeWidth: 2 }),
        path(SVG.mandala, CX, 70, { fill: '#FFD700', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.rangoli, 50, CY, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.rangoli, W - 50, CY, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5 }),
        text('Shubh Vivah', CX, 150, { size: 20, font: 'Great Vibes', fill: '#FFD700', id: 'hindi_text' }),
        text('Aishwarya & Rajesh', CX, 260, { size: 46, font: 'Great Vibes', fill: '#FFFFFF', id: 'couple_names' }),
        text('cordially invite you to\nbless their wedding', CX, 360, { size: 16, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'invitation_text' }),
        text('February 28, 2026', CX, 460, { size: 24, font: 'Cormorant Garamond', fill: '#FFD700', weight: '600', id: 'event_date' }),
        text('Shubh Muhurat: 9:15 PM', CX, 500, { size: 16, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'event_time' }),
        text('ITC Grand Bharat', CX, 570, { size: 20, font: 'Playfair Display', fill: '#FFD700', weight: '600', id: 'venue_name' }),
        text('Gurugram, Haryana', CX, 605, { size: 14, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'venue_address' }),
        path(SVG.elephant, CX, 700, { fill: '#FFD700', scaleX: 2.5, scaleY: 2.5 }),
      ],
      background: '#6A1B9A',
    },
  },

  // 6. Classic Navy & Gold
  {
    name: 'Navy & Gold Classic',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#1A237E', secondary: '#FFFFFF', accent: '#C9B037' },
    isPremium: false,
    sortOrder: 6,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#1A237E'),
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#C9B037', strokeWidth: 1 }),
        path(SVG.crown, CX, 80, { fill: '#C9B037', scaleX: 2.5, scaleY: 2.5 }),
        text('Mr. & Mrs. Johnson', CX, 150, { size: 14, font: 'Montserrat', fill: '#C9B037', id: 'parents_text' }),
        text('request the pleasure of your company\nat the marriage of their daughter', CX, 200, { size: 14, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'request_text' }),
        text('Charlotte', CX, 290, { size: 56, font: 'Great Vibes', fill: '#C9B037', id: 'bride_name' }),
        text('to', CX, 345, { size: 18, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'to_text' }),
        text('William', CX, 410, { size: 56, font: 'Great Vibes', fill: '#C9B037', id: 'groom_name' }),
        text('Saturday, the Fifth of September', CX, 500, { size: 18, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'event_date' }),
        text('Two Thousand Twenty Five', CX, 530, { size: 14, font: 'Cormorant Garamond', fill: '#C9B037', id: 'event_year' }),
        text('at five o\'clock in the evening', CX, 570, { size: 14, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'event_time' }),
        text('The Ritz London', CX, 630, { size: 18, font: 'Playfair Display', fill: '#C9B037', weight: '600', id: 'venue_name' }),
        text('150 Piccadilly, London', CX, 665, { size: 12, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'venue_address' }),
        path(SVG.flourish, CX, 720, { stroke: '#C9B037', strokeWidth: 2, scaleX: 4, scaleY: 2 }),
      ],
      background: '#1A237E',
    },
  },

  // 7. Blush Pink Romance
  {
    name: 'Blush Romance',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#D4A5A5', secondary: '#FFF5F5', accent: '#8B7355' },
    isPremium: false,
    sortOrder: 7,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF5F5'),
        circle(CX, 100, 50, 'transparent', { stroke: '#D4A5A5', strokeWidth: 1 }),
        path(SVG.heart, CX, 100, { fill: '#D4A5A5', scaleX: 2, scaleY: 2 }),
        text('You are invited to the wedding of', CX, 190, { size: 14, font: 'Lora', fill: '#8B7355', id: 'invite_text' }),
        text('Olivia & Noah', CX, 280, { size: 52, font: 'Great Vibes', fill: '#D4A5A5', id: 'couple_names' }),
        line(150, 350, W - 150, 350, '#D4A5A5', 1),
        text('Join us as we begin our forever', CX, 400, { size: 16, font: 'Lora', fill: '#8B7355', id: 'tagline' }),
        text('April 18, 2026', CX, 480, { size: 26, font: 'Playfair Display', fill: '#D4A5A5', weight: '600', id: 'event_date' }),
        text('Half past four in the afternoon', CX, 520, { size: 14, font: 'Lora', fill: '#8B7355', id: 'event_time' }),
        text('Rose Garden Estate', CX, 590, { size: 20, font: 'Playfair Display', fill: '#D4A5A5', weight: '600', id: 'venue_name' }),
        text('Napa Valley, California', CX, 625, { size: 14, font: 'Lora', fill: '#8B7355', id: 'venue_address' }),
        text('Dinner & Dancing to Follow', CX, 700, { size: 12, font: 'Lora', fill: '#D4A5A5', id: 'reception_text' }),
        path(SVG.heart, 100, H - 80, { fill: '#D4A5A5', scaleX: 1, scaleY: 1, opacity: 0.5 }),
        path(SVG.heart, W - 100, H - 80, { fill: '#D4A5A5', scaleX: 1, scaleY: 1, opacity: 0.5 }),
      ],
      background: '#FFF5F5',
    },
  },

  // 8. South Indian Traditional
  {
    name: 'South Indian Temple',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#B71C1C', secondary: '#FFF3E0', accent: '#FFD700' },
    isPremium: true,
    sortOrder: 8,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF3E0'),
        rect(CX, 50, W - 40, 60, '#B71C1C'),
        rect(CX, H - 50, W - 40, 60, '#B71C1C'),
        path(SVG.lotus, CX, 50, { fill: '#FFD700', scaleX: 2, scaleY: 2 }),
        path(SVG.diya, 80, 130, { fill: '#B71C1C', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.diya, W - 80, 130, { fill: '#B71C1C', scaleX: 1.5, scaleY: 1.5 }),
        text('॥ श्री गणेशाय नमः ॥', CX, 130, { size: 16, font: 'Noto Sans Devanagari', fill: '#B71C1C', id: 'ganesh_text' }),
        text('Wedding Invitation', CX, 170, { size: 14, font: 'Lora', fill: '#8D6E63', id: 'label' }),
        text('Lakshmi & Karthik', CX, 260, { size: 46, font: 'Great Vibes', fill: '#B71C1C', id: 'couple_names' }),
        text('Son of Mr. & Mrs. Venkatesh\n&\nDaughter of Mr. & Mrs. Raghavan', CX, 360, { size: 13, font: 'Lora', fill: '#5D4037', id: 'parents_text' }),
        text('Muhurtham', CX, 450, { size: 12, font: 'Lora', fill: '#B71C1C', id: 'muhurtham_label' }),
        text('March 5, 2026 | 10:30 AM', CX, 485, { size: 22, font: 'Playfair Display', fill: '#B71C1C', weight: '600', id: 'event_date' }),
        text('Kapaleeshwarar Temple', CX, 550, { size: 18, font: 'Playfair Display', fill: '#B71C1C', weight: '600', id: 'venue_name' }),
        text('Mylapore, Chennai', CX, 585, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        text('Reception: 7 PM at ITC Grand Chola', CX, 650, { size: 13, font: 'Lora', fill: '#8D6E63', id: 'reception_text' }),
        path(SVG.rangoli, CX, 720, { fill: '#B71C1C', scaleX: 2, scaleY: 2 }),
      ],
      background: '#FFF3E0',
    },
  },

  // 9. Art Deco Glamour
  {
    name: 'Art Deco Glamour',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#212121', secondary: '#FAFAFA', accent: '#CFB53B' },
    isPremium: true,
    sortOrder: 9,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#212121'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#CFB53B', strokeWidth: 2 }),
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#CFB53B', strokeWidth: 1 }),
        path(SVG.diamond, CX, 70, { fill: '#CFB53B', scaleX: 1.5, scaleY: 1.5 }),
        line(100, 130, CX - 60, 130, '#CFB53B', 1),
        line(CX + 60, 130, W - 100, 130, '#CFB53B', 1),
        text('THE WEDDING OF', CX, 180, { size: 14, font: 'Montserrat', fill: '#CFB53B', weight: '500', id: 'label' }),
        text('GRACE', CX, 270, { size: 56, font: 'Playfair Display', fill: '#FAFAFA', weight: '400', id: 'bride_name' }),
        path(SVG.diamond, CX, 330, { fill: '#CFB53B', scaleX: 0.8, scaleY: 0.8 }),
        text('HENRY', CX, 400, { size: 56, font: 'Playfair Display', fill: '#FAFAFA', weight: '400', id: 'groom_name' }),
        line(150, 460, W - 150, 460, '#CFB53B', 1),
        text('DECEMBER 31, 2025', CX, 510, { size: 20, font: 'Montserrat', fill: '#CFB53B', weight: '600', id: 'event_date' }),
        text('EIGHT O\'CLOCK IN THE EVENING', CX, 545, { size: 12, font: 'Montserrat', fill: '#FAFAFA', id: 'event_time' }),
        text('THE PLAZA HOTEL', CX, 610, { size: 16, font: 'Montserrat', fill: '#CFB53B', weight: '500', id: 'venue_name' }),
        text('Fifth Avenue, New York', CX, 645, { size: 12, font: 'Montserrat', fill: '#FAFAFA', id: 'venue_address' }),
        text('BLACK TIE', CX, 710, { size: 11, font: 'Montserrat', fill: '#CFB53B', id: 'dress_code' }),
        path(SVG.diamond, CX, H - 50, { fill: '#CFB53B', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#212121',
    },
  },

  // 10. Bohemian Wildflower
  {
    name: 'Bohemian Wildflower',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#6D4C41', secondary: '#FFFDE7', accent: '#FF8A65' },
    isPremium: false,
    sortOrder: 10,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFDE7'),
        path(SVG.leaf, 60, 60, { fill: '#81C784', scaleX: 1.5, scaleY: 1.5, angle: -45 }),
        path(SVG.leaf, W - 60, 60, { fill: '#81C784', scaleX: 1.5, scaleY: 1.5, angle: 45 }),
        path(SVG.rose, 100, 120, { fill: '#FF8A65', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.rose, W - 100, 120, { fill: '#FFAB91', scaleX: 1.5, scaleY: 1.5 }),
        circle(CX, 100, 5, '#FFE082'),
        circle(CX - 30, 85, 3, '#FFE082'),
        circle(CX + 30, 85, 3, '#FFE082'),
        text('With joy in our hearts', CX, 190, { size: 14, font: 'Dancing Script', fill: '#6D4C41', id: 'joy_text' }),
        text('Luna & Felix', CX, 280, { size: 52, font: 'Dancing Script', fill: '#6D4C41', id: 'couple_names' }),
        text('invite you to celebrate their love', CX, 350, { size: 16, font: 'Lora', fill: '#8D6E63', id: 'invitation_text' }),
        path(SVG.flourish, CX, 400, { stroke: '#BCAAA4', strokeWidth: 1, scaleX: 3, scaleY: 1.5 }),
        text('August 8, 2026', CX, 470, { size: 24, font: 'Lora', fill: '#6D4C41', weight: '600', id: 'event_date' }),
        text('Sunset ceremony at 5 PM', CX, 510, { size: 14, font: 'Lora', fill: '#8D6E63', id: 'event_time' }),
        text('Wildflower Meadows', CX, 580, { size: 20, font: 'Playfair Display', fill: '#6D4C41', weight: '600', id: 'venue_name' }),
        text('Big Sur, California', CX, 615, { size: 14, font: 'Lora', fill: '#8D6E63', id: 'venue_address' }),
        path(SVG.leaf, 60, H - 60, { fill: '#81C784', scaleX: 1.5, scaleY: -1.5, angle: 45 }),
        path(SVG.leaf, W - 60, H - 60, { fill: '#81C784', scaleX: 1.5, scaleY: -1.5, angle: -45 }),
        path(SVG.rose, CX, H - 80, { fill: '#FFAB91', scaleX: 1.8, scaleY: 1.8 }),
      ],
      background: '#FFFDE7',
    },
  },

  // Continue with more wedding templates...
  // 11-15: More Indian styles

  // 11. Rajasthani Royal
  {
    name: 'Rajasthani Maharaja',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#E65100', secondary: '#FFF8E1', accent: '#1565C0' },
    isPremium: true,
    sortOrder: 11,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        rect(CX, 40, W, 80, '#E65100'),
        rect(CX, H - 40, W, 80, '#E65100'),
        path(SVG.elephant, 80, 40, { fill: '#FFF8E1', scaleX: 2, scaleY: 2 }),
        path(SVG.elephant, W - 80, 40, { fill: '#FFF8E1', scaleX: -2, scaleY: 2 }),
        path(SVG.mandala, CX, 130, { fill: '#1565C0', scaleX: 2, scaleY: 2 }),
        text('राजसी विवाह', CX, 200, { size: 22, font: 'Noto Sans Devanagari', fill: '#E65100', id: 'rajsi_text' }),
        text('Padmini & Maharaj', CX, 290, { size: 48, font: 'Great Vibes', fill: '#E65100', id: 'couple_names' }),
        text('Request your gracious presence\nat their royal wedding', CX, 380, { size: 15, font: 'Cormorant Garamond', fill: '#5D4037', id: 'invitation_text' }),
        text('November 11, 2025', CX, 470, { size: 24, font: 'Playfair Display', fill: '#E65100', weight: '600', id: 'event_date' }),
        text('Shubh Muhurat: 11:30 AM', CX, 510, { size: 14, font: 'Cormorant Garamond', fill: '#1565C0', id: 'event_time' }),
        text('City Palace', CX, 580, { size: 20, font: 'Playfair Display', fill: '#E65100', weight: '600', id: 'venue_name' }),
        text('Jaipur, Rajasthan', CX, 615, { size: 14, font: 'Cormorant Garamond', fill: '#5D4037', id: 'venue_address' }),
        path(SVG.paisley, 100, 700, { fill: '#1565C0', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.paisley, W - 100, 700, { fill: '#1565C0', scaleX: -1.5, scaleY: 1.5 }),
      ],
      background: '#FFF8E1',
    },
  },

  // 12. Bengali Traditional
  {
    name: 'Bengali Alpona',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#C62828', secondary: '#FFFFFF', accent: '#FF8F00' },
    isPremium: false,
    sortOrder: 12,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, CY, W - 30, H - 30, 'transparent', { stroke: '#C62828', strokeWidth: 3 }),
        path(SVG.rangoli, CX, 80, { fill: '#C62828', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.lotus, 60, CY, { fill: '#C62828', scaleX: 2, scaleY: 2 }),
        path(SVG.lotus, W - 60, CY, { fill: '#C62828', scaleX: 2, scaleY: 2 }),
        text('শুভ বিবাহ', CX, 150, { size: 28, font: 'Noto Sans Bengali', fill: '#C62828', id: 'bengali_text' }),
        text('Subho Bibaho', CX, 190, { size: 14, font: 'Lora', fill: '#FF8F00', id: 'english_label' }),
        text('Rani & Subhash', CX, 280, { size: 48, font: 'Great Vibes', fill: '#C62828', id: 'couple_names' }),
        text('Request the honor of your presence\nat their wedding ceremony', CX, 370, { size: 14, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('February 14, 2026', CX, 460, { size: 24, font: 'Playfair Display', fill: '#C62828', weight: '600', id: 'event_date' }),
        text('Shubho Lagna: 8:45 PM', CX, 500, { size: 14, font: 'Lora', fill: '#FF8F00', id: 'event_time' }),
        text('Rabindra Sadan', CX, 570, { size: 20, font: 'Playfair Display', fill: '#C62828', weight: '600', id: 'venue_name' }),
        text('Kolkata, West Bengal', CX, 605, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        path(SVG.rangoli, CX, H - 70, { fill: '#C62828', scaleX: 2, scaleY: 2 }),
      ],
      background: '#FFFFFF',
    },
  },

  // 13. Punjabi Celebration
  {
    name: 'Punjabi Phulkari',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#F50057', secondary: '#FFEB3B', accent: '#00BCD4' },
    isPremium: false,
    sortOrder: 13,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F50057'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#FFEB3B', strokeWidth: 3 }),
        path(SVG.star, 80, 80, { fill: '#FFEB3B', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.star, W - 80, 80, { fill: '#00BCD4', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.star, 80, H - 80, { fill: '#00BCD4', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.star, W - 80, H - 80, { fill: '#FFEB3B', scaleX: 1.5, scaleY: 1.5 }),
        text('ਸੱਤ ਸ੍ਰੀ ਅਕਾਲ', CX, 130, { size: 24, font: 'Noto Sans Gurmukhi', fill: '#FFEB3B', id: 'punjabi_text' }),
        text('Wedding Invitation', CX, 170, { size: 14, font: 'Montserrat', fill: '#FFFFFF', id: 'label' }),
        text('Simran & Gurpreet', CX, 270, { size: 46, font: 'Great Vibes', fill: '#FFEB3B', id: 'couple_names' }),
        text('You are cordially invited to\ncelebrate their wedding', CX, 370, { size: 15, font: 'Lora', fill: '#FFFFFF', id: 'invitation_text' }),
        text('December 25, 2025', CX, 470, { size: 24, font: 'Montserrat', fill: '#FFEB3B', weight: '700', id: 'event_date' }),
        text('Anand Karaj: 10:00 AM', CX, 510, { size: 14, font: 'Montserrat', fill: '#FFFFFF', id: 'event_time' }),
        text('Golden Temple', CX, 580, { size: 20, font: 'Playfair Display', fill: '#FFEB3B', weight: '600', id: 'venue_name' }),
        text('Amritsar, Punjab', CX, 615, { size: 14, font: 'Montserrat', fill: '#FFFFFF', id: 'venue_address' }),
        text('Reception: 7 PM at Radisson Blu', CX, 680, { size: 13, font: 'Montserrat', fill: '#00BCD4', id: 'reception_text' }),
      ],
      background: '#F50057',
    },
  },

  // 14. Marathi Traditional
  {
    name: 'Marathi Sobat',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#4A148C', secondary: '#FFF8E1', accent: '#FF6F00' },
    isPremium: false,
    sortOrder: 14,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#4A148C', strokeWidth: 2 }),
        path(SVG.kalash, CX, 80, { fill: '#4A148C', scaleX: 2, scaleY: 2 }),
        path(SVG.mandala, 70, 150, { fill: '#FF6F00', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.mandala, W - 70, 150, { fill: '#FF6F00', scaleX: 1.5, scaleY: 1.5 }),
        text('॥ शुभमंगल सावधान ॥', CX, 150, { size: 18, font: 'Noto Sans Devanagari', fill: '#4A148C', id: 'marathi_text' }),
        text('Wedding Invitation', CX, 185, { size: 12, font: 'Lora', fill: '#FF6F00', id: 'label' }),
        text('Shruti & Ganesh', CX, 275, { size: 48, font: 'Great Vibes', fill: '#4A148C', id: 'couple_names' }),
        text('You are cordially invited\nto their wedding ceremony', CX, 370, { size: 15, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('January 26, 2026', CX, 460, { size: 24, font: 'Playfair Display', fill: '#4A148C', weight: '600', id: 'event_date' }),
        text('Muhurat: 12:15 PM', CX, 500, { size: 14, font: 'Lora', fill: '#FF6F00', id: 'event_time' }),
        text('Shree Krishna Mangal Karyalaya', CX, 570, { size: 18, font: 'Playfair Display', fill: '#4A148C', weight: '600', id: 'venue_name' }),
        text('Pune, Maharashtra', CX, 605, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        path(SVG.diya, 150, 700, { fill: '#FF6F00', scaleX: 2, scaleY: 2 }),
        path(SVG.diya, W - 150, 700, { fill: '#FF6F00', scaleX: 2, scaleY: 2 }),
      ],
      background: '#FFF8E1',
    },
  },

  // 15. Kerala Christian Wedding
  {
    name: 'Kerala Christian',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#1B5E20', secondary: '#FFFFFF', accent: '#D4AF37' },
    isPremium: false,
    sortOrder: 15,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#1B5E20', strokeWidth: 2 }),
        path(SVG.leaf, CX - 80, 80, { fill: '#1B5E20', scaleX: 1.5, scaleY: 1.5, angle: -30 }),
        path(SVG.leaf, CX + 80, 80, { fill: '#1B5E20', scaleX: 1.5, scaleY: 1.5, angle: 30 }),
        text('✝', CX, 130, { size: 40, font: 'serif', fill: '#D4AF37', id: 'cross' }),
        text('Holy Matrimony', CX, 190, { size: 16, font: 'Cormorant Garamond', fill: '#1B5E20', id: 'label' }),
        text('Mary & Thomas', CX, 280, { size: 48, font: 'Great Vibes', fill: '#1B5E20', id: 'couple_names' }),
        text('With the blessing of their parents\ninvite you to their wedding', CX, 370, { size: 15, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('April 27, 2026', CX, 460, { size: 24, font: 'Playfair Display', fill: '#1B5E20', weight: '600', id: 'event_date' }),
        text('10:30 AM', CX, 500, { size: 14, font: 'Lora', fill: '#D4AF37', id: 'event_time' }),
        text('St. Mary\'s Basilica', CX, 570, { size: 20, font: 'Playfair Display', fill: '#1B5E20', weight: '600', id: 'venue_name' }),
        text('Ernakulam, Kerala', CX, 605, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        text('Reception: 1 PM at Le Meridien', CX, 680, { size: 13, font: 'Lora', fill: '#1B5E20', id: 'reception_text' }),
        path(SVG.dove, CX, 740, { fill: '#D4AF37', scaleX: 2, scaleY: 2 }),
      ],
      background: '#FFFFFF',
    },
  },

  // 16-25: More Western/International Wedding Styles
  {
    name: 'Sage Green Organic',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#6B8E6B', secondary: '#F5F5F0', accent: '#D4A574' },
    isPremium: false,
    sortOrder: 16,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F5F5F0'),
        path(SVG.leaf, 80, 100, { fill: '#6B8E6B', scaleX: 2, scaleY: 2, angle: -20 }),
        path(SVG.leaf, W - 80, 100, { fill: '#6B8E6B', scaleX: -2, scaleY: 2, angle: 20 }),
        text('Together with their families', CX, 180, { size: 14, font: 'Lora', fill: '#6B8E6B', id: 'families_text' }),
        text('Sophia & Ethan', CX, 280, { size: 52, font: 'Great Vibes', fill: '#5D4037', id: 'couple_names' }),
        text('invite you to their wedding', CX, 360, { size: 16, font: 'Lora', fill: '#8B7355', id: 'invitation_text' }),
        text('September 22, 2025', CX, 450, { size: 24, font: 'Lora', fill: '#6B8E6B', weight: '600', id: 'event_date' }),
        text('Four in the afternoon', CX, 490, { size: 14, font: 'Lora', fill: '#8B7355', id: 'event_time' }),
        text('Olive Grove Estate', CX, 560, { size: 20, font: 'Playfair Display', fill: '#5D4037', weight: '600', id: 'venue_name' }),
        text('Tuscany, Italy', CX, 595, { size: 14, font: 'Lora', fill: '#8B7355', id: 'venue_address' }),
        path(SVG.leaf, CX, 680, { fill: '#6B8E6B', scaleX: 2, scaleY: 2 }),
      ],
      background: '#F5F5F0',
    },
  },

  {
    name: 'Tropical Paradise',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#00838F', secondary: '#E0F7FA', accent: '#FF6F00' },
    isPremium: false,
    sortOrder: 17,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#E0F7FA'),
        path(SVG.leaf, 60, 80, { fill: '#00838F', scaleX: 2, scaleY: 2, angle: -30 }),
        path(SVG.leaf, W - 60, 80, { fill: '#00838F', scaleX: -2, scaleY: 2, angle: 30 }),
        path(SVG.leaf, 100, 150, { fill: '#4DB6AC', scaleX: 1.5, scaleY: 1.5, angle: -15 }),
        path(SVG.leaf, W - 100, 150, { fill: '#4DB6AC', scaleX: -1.5, scaleY: 1.5, angle: 15 }),
        text('DESTINATION WEDDING', CX, 200, { size: 12, font: 'Montserrat', fill: '#00838F', weight: '600', id: 'label' }),
        text('Mia & Liam', CX, 300, { size: 52, font: 'Dancing Script', fill: '#00838F', id: 'couple_names' }),
        text('Join us in paradise', CX, 380, { size: 16, font: 'Lora', fill: '#00695C', id: 'invitation_text' }),
        text('July 15, 2026', CX, 470, { size: 24, font: 'Montserrat', fill: '#FF6F00', weight: '600', id: 'event_date' }),
        text('5:00 PM | Beach Ceremony', CX, 510, { size: 14, font: 'Lora', fill: '#00838F', id: 'event_time' }),
        text('Four Seasons Resort', CX, 580, { size: 18, font: 'Playfair Display', fill: '#00838F', weight: '600', id: 'venue_name' }),
        text('Bali, Indonesia', CX, 615, { size: 14, font: 'Lora', fill: '#00695C', id: 'venue_address' }),
        path(SVG.leaf, 80, H - 80, { fill: '#00838F', scaleX: 2, scaleY: -2, angle: 30 }),
        path(SVG.leaf, W - 80, H - 80, { fill: '#00838F', scaleX: -2, scaleY: -2, angle: -30 }),
      ],
      background: '#E0F7FA',
    },
  },

  {
    name: 'Burgundy Velvet',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#722F37', secondary: '#FDF5E6', accent: '#D4AF37' },
    isPremium: true,
    sortOrder: 18,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#722F37'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#D4AF37', strokeWidth: 2 }),
        path(SVG.rose, CX, 80, { fill: '#D4AF37', scaleX: 2.5, scaleY: 2.5 }),
        text('Mr. & Mrs. Williams', CX, 160, { size: 14, font: 'Cormorant Garamond', fill: '#D4AF37', id: 'parents_text' }),
        text('request the honor of your presence', CX, 195, { size: 14, font: 'Cormorant Garamond', fill: '#FDF5E6', id: 'request_text' }),
        text('Isabella & Alexander', CX, 290, { size: 46, font: 'Great Vibes', fill: '#D4AF37', id: 'couple_names' }),
        line(150, 360, W - 150, 360, '#D4AF37', 1),
        text('November 8, 2025', CX, 420, { size: 26, font: 'Cormorant Garamond', fill: '#FDF5E6', weight: '600', id: 'event_date' }),
        text('Six o\'clock in the evening', CX, 460, { size: 14, font: 'Cormorant Garamond', fill: '#D4AF37', id: 'event_time' }),
        text('The Waldorf Astoria', CX, 530, { size: 18, font: 'Playfair Display', fill: '#FDF5E6', weight: '600', id: 'venue_name' }),
        text('Park Avenue, New York', CX, 565, { size: 14, font: 'Cormorant Garamond', fill: '#D4AF37', id: 'venue_address' }),
        text('Black Tie Optional', CX, 640, { size: 12, font: 'Cormorant Garamond', fill: '#FDF5E6', id: 'dress_code' }),
        path(SVG.rose, 100, H - 80, { fill: '#D4AF37', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.rose, W - 100, H - 80, { fill: '#D4AF37', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#722F37',
    },
  },

  {
    name: 'French Chateau',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#4A4A4A', secondary: '#F8F4E3', accent: '#9C8AA5' },
    isPremium: true,
    sortOrder: 19,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F8F4E3'),
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#9C8AA5', strokeWidth: 1 }),
        path(SVG.flourish, CX, 100, { stroke: '#9C8AA5', strokeWidth: 2, scaleX: 4, scaleY: 2 }),
        text('Vous êtes cordialement invités', CX, 170, { size: 14, font: 'Cormorant Garamond', fill: '#9C8AA5', id: 'french_text' }),
        text('Amélie & Pierre', CX, 270, { size: 52, font: 'Great Vibes', fill: '#4A4A4A', id: 'couple_names' }),
        text('at their wedding celebration', CX, 350, { size: 16, font: 'Cormorant Garamond', fill: '#6D6D6D', id: 'invitation_text' }),
        text('Le 20 Juin 2026', CX, 440, { size: 24, font: 'Cormorant Garamond', fill: '#4A4A4A', weight: '600', id: 'event_date' }),
        text('À 16 heures', CX, 480, { size: 14, font: 'Cormorant Garamond', fill: '#9C8AA5', id: 'event_time' }),
        text('Château de Versailles', CX, 550, { size: 20, font: 'Playfair Display', fill: '#4A4A4A', weight: '600', id: 'venue_name' }),
        text('Versailles, France', CX, 585, { size: 14, font: 'Cormorant Garamond', fill: '#6D6D6D', id: 'venue_address' }),
        path(SVG.flourish, CX, H - 100, { stroke: '#9C8AA5', strokeWidth: 2, scaleX: 4, scaleY: -2 }),
      ],
      background: '#F8F4E3',
    },
  },

  {
    name: 'Midnight Stars',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#0D1B2A', secondary: '#1B263B', accent: '#E0E1DD' },
    isPremium: false,
    sortOrder: 20,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#0D1B2A'),
        path(SVG.star, 80, 80, { fill: '#E0E1DD', scaleX: 0.8, scaleY: 0.8, opacity: 0.6 }),
        path(SVG.star, W - 100, 120, { fill: '#E0E1DD', scaleX: 0.5, scaleY: 0.5, opacity: 0.4 }),
        path(SVG.star, 150, 200, { fill: '#E0E1DD', scaleX: 0.4, scaleY: 0.4, opacity: 0.3 }),
        path(SVG.star, W - 80, 250, { fill: '#E0E1DD', scaleX: 0.6, scaleY: 0.6, opacity: 0.5 }),
        circle(CX, 120, 40, 'transparent', { stroke: '#E0E1DD', strokeWidth: 1 }),
        text('Under the Stars', CX, 120, { size: 14, font: 'Dancing Script', fill: '#E0E1DD', id: 'label' }),
        text('Stella & Marcus', CX, 280, { size: 52, font: 'Great Vibes', fill: '#E0E1DD', id: 'couple_names' }),
        text('invite you to celebrate their union', CX, 360, { size: 16, font: 'Cormorant Garamond', fill: '#778DA9', id: 'invitation_text' }),
        text('December 21, 2025', CX, 450, { size: 24, font: 'Cormorant Garamond', fill: '#E0E1DD', weight: '600', id: 'event_date' }),
        text('Winter Solstice | 7:00 PM', CX, 490, { size: 14, font: 'Cormorant Garamond', fill: '#778DA9', id: 'event_time' }),
        text('Observatory Hill', CX, 560, { size: 20, font: 'Playfair Display', fill: '#E0E1DD', weight: '600', id: 'venue_name' }),
        text('Edinburgh, Scotland', CX, 595, { size: 14, font: 'Cormorant Garamond', fill: '#778DA9', id: 'venue_address' }),
        path(SVG.star, 100, H - 100, { fill: '#E0E1DD', scaleX: 0.6, scaleY: 0.6, opacity: 0.4 }),
        path(SVG.star, W - 120, H - 80, { fill: '#E0E1DD', scaleX: 0.7, scaleY: 0.7, opacity: 0.5 }),
      ],
      background: '#0D1B2A',
    },
  },

  // ============================================================================
  // BIRTHDAY TEMPLATES (20 templates)
  // ============================================================================

  {
    name: 'Kids Rainbow Party',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#FF6B6B', secondary: '#FFFFFF', accent: '#4ECDC4' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, 60, W, 120, '#FF6B6B'),
        path(SVG.balloon, 100, 150, { fill: '#FF6B6B', scaleX: 2, scaleY: 2 }),
        path(SVG.balloon, 200, 180, { fill: '#4ECDC4', scaleX: 1.8, scaleY: 1.8 }),
        path(SVG.balloon, W - 100, 150, { fill: '#FFE66D', scaleX: 2, scaleY: 2 }),
        path(SVG.balloon, W - 200, 180, { fill: '#95E1D3', scaleX: 1.8, scaleY: 1.8 }),
        text("LET'S PARTY!", CX, 60, { size: 28, font: 'Poppins', fill: '#FFFFFF', weight: '800', id: 'party_label' }),
        text("ARYAN'S", CX, 260, { size: 48, font: 'Poppins', fill: '#FF6B6B', weight: '800', id: 'person_name' }),
        circle(CX, 360, 50, '#4ECDC4'),
        text('7', CX, 360, { size: 48, font: 'Poppins', fill: '#FFFFFF', weight: '800', id: 'age' }),
        text('BIRTHDAY BASH', CX, 440, { size: 24, font: 'Poppins', fill: '#FF6B6B', weight: '700', id: 'birthday_label' }),
        text('Saturday, August 15th', CX, 510, { size: 20, font: 'Poppins', fill: '#333333', weight: '600', id: 'event_date' }),
        text('3:00 PM - 6:00 PM', CX, 545, { size: 14, font: 'Poppins', fill: '#4ECDC4', id: 'event_time' }),
        text('Fun World Adventure Park', CX, 610, { size: 18, font: 'Poppins', fill: '#333333', weight: '600', id: 'venue_name' }),
        text('Sector 21, Noida', CX, 645, { size: 14, font: 'Poppins', fill: '#666666', id: 'venue_address' }),
        path(SVG.cake, CX, 720, { fill: '#FFE66D', scaleX: 2.5, scaleY: 2.5 }),
      ],
      background: '#FFFFFF',
    },
  },

  {
    name: 'Princess Theme',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#E91E8C', secondary: '#FFF0F5', accent: '#FFD700' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF0F5'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#E91E8C', strokeWidth: 2 }),
        path(SVG.crown, CX, 80, { fill: '#FFD700', scaleX: 3, scaleY: 3 }),
        path(SVG.star, 80, 120, { fill: '#FFD700', scaleX: 1, scaleY: 1, opacity: 0.6 }),
        path(SVG.star, W - 80, 120, { fill: '#FFD700', scaleX: 1, scaleY: 1, opacity: 0.6 }),
        text('Royal Invitation', CX, 160, { size: 18, font: 'Dancing Script', fill: '#E91E8C', id: 'royal_label' }),
        text('Princess Anaya', CX, 260, { size: 44, font: 'Great Vibes', fill: '#E91E8C', id: 'person_name' }),
        text('is turning', CX, 320, { size: 16, font: 'Lora', fill: '#666666', id: 'turning_text' }),
        circle(CX, 390, 45, '#E91E8C'),
        text('5', CX, 390, { size: 44, font: 'Great Vibes', fill: '#FFFFFF', id: 'age' }),
        text('Join us for a magical celebration!', CX, 470, { size: 14, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        text('Sunday, March 8th, 2026', CX, 530, { size: 20, font: 'Lora', fill: '#E91E8C', weight: '600', id: 'event_date' }),
        text('2:00 PM', CX, 565, { size: 14, font: 'Lora', fill: '#666666', id: 'event_time' }),
        text('Fairy Tale Gardens', CX, 630, { size: 18, font: 'Playfair Display', fill: '#E91E8C', weight: '600', id: 'venue_name' }),
        text('South Extension, Delhi', CX, 665, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        path(SVG.heart, 150, 730, { fill: '#E91E8C', scaleX: 1, scaleY: 1, opacity: 0.5 }),
        path(SVG.heart, W - 150, 730, { fill: '#E91E8C', scaleX: 1, scaleY: 1, opacity: 0.5 }),
      ],
      background: '#FFF0F5',
    },
  },

  {
    name: 'Superhero Theme',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#1565C0', secondary: '#FFEB3B', accent: '#D32F2F' },
    isPremium: false,
    sortOrder: 3,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#1565C0'),
        rect(CX, CY, W - 30, H - 30, 'transparent', { stroke: '#FFEB3B', strokeWidth: 4 }),
        path(SVG.star, CX, 100, { fill: '#FFEB3B', scaleX: 3, scaleY: 3 }),
        text('CALLING ALL HEROES!', CX, 180, { size: 20, font: 'Montserrat', fill: '#FFEB3B', weight: '900', id: 'hero_label' }),
        text('VIHAAN', CX, 280, { size: 56, font: 'Montserrat', fill: '#FFFFFF', weight: '900', id: 'person_name' }),
        text('IS TURNING', CX, 340, { size: 16, font: 'Montserrat', fill: '#FFEB3B', weight: '700', id: 'turning_text' }),
        circle(CX, 420, 50, '#D32F2F'),
        text('6', CX, 420, { size: 52, font: 'Montserrat', fill: '#FFFFFF', weight: '900', id: 'age' }),
        text('Join the adventure!', CX, 500, { size: 16, font: 'Montserrat', fill: '#FFEB3B', id: 'invitation_text' }),
        text('Saturday, October 10th', CX, 560, { size: 22, font: 'Montserrat', fill: '#FFFFFF', weight: '700', id: 'event_date' }),
        text('4:00 PM - 7:00 PM', CX, 595, { size: 14, font: 'Montserrat', fill: '#FFEB3B', id: 'event_time' }),
        text('Hero Arena', CX, 660, { size: 18, font: 'Montserrat', fill: '#FFFFFF', weight: '700', id: 'venue_name' }),
        text('Koramangala, Bangalore', CX, 695, { size: 14, font: 'Montserrat', fill: '#FFEB3B', id: 'venue_address' }),
        path(SVG.firework, 100, 750, { stroke: '#FFEB3B', strokeWidth: 2, scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.firework, W - 100, 750, { stroke: '#FFEB3B', strokeWidth: 2, scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#1565C0',
    },
  },

  {
    name: 'Elegant 50th Birthday',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#212121', secondary: '#FAFAFA', accent: '#C9B037' },
    isPremium: true,
    sortOrder: 4,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#212121'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#C9B037', strokeWidth: 2 }),
        path(SVG.crown, CX, 80, { fill: '#C9B037', scaleX: 2.5, scaleY: 2.5 }),
        text('YOU ARE INVITED TO', CX, 160, { size: 12, font: 'Montserrat', fill: '#C9B037', weight: '500', id: 'invite_label' }),
        text('CELEBRATING', CX, 210, { size: 16, font: 'Montserrat', fill: '#FAFAFA', id: 'celebrating_text' }),
        text('50', CX, 320, { size: 120, font: 'Playfair Display', fill: '#C9B037', weight: '700', id: 'age' }),
        text('FABULOUS YEARS', CX, 400, { size: 18, font: 'Montserrat', fill: '#FAFAFA', weight: '600', id: 'years_text' }),
        text('of', CX, 440, { size: 14, font: 'Great Vibes', fill: '#C9B037', id: 'of_text' }),
        text('RAJESH SHARMA', CX, 500, { size: 28, font: 'Playfair Display', fill: '#FAFAFA', weight: '600', id: 'person_name' }),
        line(150, 550, W - 150, 550, '#C9B037', 1),
        text('Saturday, January 15th, 2026', CX, 600, { size: 18, font: 'Montserrat', fill: '#C9B037', id: 'event_date' }),
        text('7:00 PM | Cocktails & Dinner', CX, 635, { size: 12, font: 'Montserrat', fill: '#FAFAFA', id: 'event_time' }),
        text('The Leela Palace', CX, 700, { size: 16, font: 'Playfair Display', fill: '#C9B037', weight: '600', id: 'venue_name' }),
        text('Chanakyapuri, New Delhi', CX, 735, { size: 12, font: 'Montserrat', fill: '#FAFAFA', id: 'venue_address' }),
      ],
      background: '#212121',
    },
  },

  {
    name: 'Sweet 16',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#EC407A', secondary: '#FCE4EC', accent: '#7B1FA2' },
    isPremium: false,
    sortOrder: 5,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FCE4EC'),
        path(SVG.heart, 80, 80, { fill: '#EC407A', scaleX: 1.5, scaleY: 1.5, opacity: 0.3 }),
        path(SVG.heart, W - 80, 100, { fill: '#7B1FA2', scaleX: 1.2, scaleY: 1.2, opacity: 0.3 }),
        text('Sweet', CX, 120, { size: 36, font: 'Dancing Script', fill: '#EC407A', id: 'sweet_text' }),
        text('16', CX, 220, { size: 100, font: 'Great Vibes', fill: '#7B1FA2', id: 'age' }),
        text('TANYA', CX, 320, { size: 42, font: 'Playfair Display', fill: '#EC407A', weight: '600', id: 'person_name' }),
        path(SVG.flourish, CX, 380, { stroke: '#EC407A', strokeWidth: 1, scaleX: 3, scaleY: 1.5 }),
        text('Join us to celebrate this special milestone!', CX, 440, { size: 14, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        text('Saturday, April 25th, 2026', CX, 510, { size: 20, font: 'Lora', fill: '#EC407A', weight: '600', id: 'event_date' }),
        text('6:00 PM', CX, 545, { size: 14, font: 'Lora', fill: '#7B1FA2', id: 'event_time' }),
        text('The Ballroom', CX, 610, { size: 18, font: 'Playfair Display', fill: '#EC407A', weight: '600', id: 'venue_name' }),
        text('Juhu, Mumbai', CX, 645, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        text('Dress Code: Cocktail', CX, 710, { size: 12, font: 'Lora', fill: '#7B1FA2', id: 'dress_code' }),
        path(SVG.heart, 150, 760, { fill: '#EC407A', scaleX: 1, scaleY: 1, opacity: 0.4 }),
        path(SVG.heart, W - 150, 760, { fill: '#7B1FA2', scaleX: 1, scaleY: 1, opacity: 0.4 }),
      ],
      background: '#FCE4EC',
    },
  },

  {
    name: 'Dinosaur Adventure',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#2E7D32', secondary: '#FFF8E1', accent: '#FF6F00' },
    isPremium: false,
    sortOrder: 6,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        rect(CX, 50, W, 100, '#2E7D32'),
        path(SVG.leaf, 80, 100, { fill: '#81C784', scaleX: 2, scaleY: 2, angle: -20 }),
        path(SVG.leaf, W - 80, 100, { fill: '#81C784', scaleX: -2, scaleY: 2, angle: 20 }),
        text('ROAR!', CX, 50, { size: 32, font: 'Poppins', fill: '#FFFFFF', weight: '900', id: 'roar_text' }),
        text("ARAV'S", CX, 180, { size: 48, font: 'Poppins', fill: '#2E7D32', weight: '800', id: 'person_name' }),
        text('DINO PARTY', CX, 240, { size: 28, font: 'Poppins', fill: '#FF6F00', weight: '700', id: 'dino_label' }),
        circle(CX, 340, 50, '#FF6F00'),
        text('4', CX, 340, { size: 52, font: 'Poppins', fill: '#FFFFFF', weight: '800', id: 'age' }),
        text('Join the prehistoric fun!', CX, 430, { size: 16, font: 'Poppins', fill: '#5D4037', id: 'invitation_text' }),
        text('Sunday, May 5th, 2026', CX, 500, { size: 22, font: 'Poppins', fill: '#2E7D32', weight: '600', id: 'event_date' }),
        text('11:00 AM - 2:00 PM', CX, 540, { size: 14, font: 'Poppins', fill: '#FF6F00', id: 'event_time' }),
        text('Dino Discovery Park', CX, 610, { size: 18, font: 'Poppins', fill: '#2E7D32', weight: '600', id: 'venue_name' }),
        text('Gurugram, Haryana', CX, 645, { size: 14, font: 'Poppins', fill: '#5D4037', id: 'venue_address' }),
        path(SVG.leaf, 100, 720, { fill: '#2E7D32', scaleX: 2, scaleY: 2 }),
        path(SVG.leaf, W - 100, 720, { fill: '#2E7D32', scaleX: -2, scaleY: 2 }),
      ],
      background: '#FFF8E1',
    },
  },

  {
    name: '30th Flirty & Thriving',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#D81B60', secondary: '#FFFFFF', accent: '#FFD54F' },
    isPremium: false,
    sortOrder: 7,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#D81B60', strokeWidth: 2 }),
        path(SVG.champagne, CX - 80, 100, { fill: '#FFD54F', scaleX: 2, scaleY: 2 }),
        path(SVG.champagne, CX + 80, 100, { fill: '#FFD54F', scaleX: -2, scaleY: 2 }),
        text('Dirty', CX, 180, { size: 28, font: 'Dancing Script', fill: '#D81B60', id: 'dirty_text' }),
        text('30', CX, 280, { size: 100, font: 'Playfair Display', fill: '#D81B60', weight: '700', id: 'age' }),
        text('NEHA', CX, 370, { size: 36, font: 'Playfair Display', fill: '#333333', weight: '600', id: 'person_name' }),
        text("Let's celebrate this milestone!", CX, 430, { size: 14, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        text('Friday, June 20th, 2026', CX, 500, { size: 20, font: 'Lora', fill: '#D81B60', weight: '600', id: 'event_date' }),
        text('8:00 PM | Cocktails & Dancing', CX, 540, { size: 14, font: 'Lora', fill: '#FFD54F', id: 'event_time' }),
        text('Skybar Lounge', CX, 610, { size: 18, font: 'Playfair Display', fill: '#D81B60', weight: '600', id: 'venue_name' }),
        text('Indiranagar, Bangalore', CX, 645, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        path(SVG.confetti, CX, 720, { stroke: '#D81B60', strokeWidth: 2, scaleX: 3, scaleY: 3 }),
      ],
      background: '#FFFFFF',
    },
  },

  {
    name: 'Space Explorer',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#1A237E', secondary: '#E8EAF6', accent: '#FF6F00' },
    isPremium: false,
    sortOrder: 8,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#1A237E'),
        path(SVG.star, 80, 80, { fill: '#FFFFFF', scaleX: 0.8, scaleY: 0.8, opacity: 0.6 }),
        path(SVG.star, W - 100, 120, { fill: '#FFFFFF', scaleX: 0.5, scaleY: 0.5, opacity: 0.4 }),
        path(SVG.star, 150, 200, { fill: '#FFFFFF', scaleX: 0.4, scaleY: 0.4, opacity: 0.5 }),
        path(SVG.star, W - 80, 250, { fill: '#FFFFFF', scaleX: 0.6, scaleY: 0.6, opacity: 0.3 }),
        path(SVG.star, 100, 400, { fill: '#FFFFFF', scaleX: 0.5, scaleY: 0.5, opacity: 0.4 }),
        circle(CX, 150, 60, '#FF6F00'),
        text('BLAST OFF!', CX, 150, { size: 18, font: 'Montserrat', fill: '#FFFFFF', weight: '700', id: 'blast_text' }),
        text("KRISHNA'S", CX, 270, { size: 44, font: 'Montserrat', fill: '#FFFFFF', weight: '800', id: 'person_name' }),
        text('SPACE PARTY', CX, 330, { size: 24, font: 'Montserrat', fill: '#FF6F00', weight: '700', id: 'space_label' }),
        circle(CX, 420, 45, '#E8EAF6'),
        text('8', CX, 420, { size: 44, font: 'Montserrat', fill: '#1A237E', weight: '800', id: 'age' }),
        text('Mission Date:', CX, 510, { size: 12, font: 'Montserrat', fill: '#FF6F00', id: 'mission_label' }),
        text('Saturday, July 12th, 2026', CX, 545, { size: 20, font: 'Montserrat', fill: '#FFFFFF', weight: '600', id: 'event_date' }),
        text('Launch Time: 3:00 PM', CX, 585, { size: 14, font: 'Montserrat', fill: '#E8EAF6', id: 'event_time' }),
        text('Space Station Fun Zone', CX, 650, { size: 16, font: 'Montserrat', fill: '#FFFFFF', weight: '600', id: 'venue_name' }),
        text('Powai, Mumbai', CX, 685, { size: 14, font: 'Montserrat', fill: '#E8EAF6', id: 'venue_address' }),
        path(SVG.star, CX, 750, { fill: '#FF6F00', scaleX: 2, scaleY: 2 }),
      ],
      background: '#1A237E',
    },
  },

  {
    name: '60th Diamond Jubilee',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#4A148C', secondary: '#F3E5F5', accent: '#B0BEC5' },
    isPremium: true,
    sortOrder: 9,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#4A148C'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#B0BEC5', strokeWidth: 2 }),
        path(SVG.diamond, CX, 80, { fill: '#B0BEC5', scaleX: 2, scaleY: 2 }),
        text('CELEBRATING', CX, 160, { size: 14, font: 'Montserrat', fill: '#B0BEC5', weight: '500', id: 'celebrating_text' }),
        text('60', CX, 280, { size: 120, font: 'Playfair Display', fill: '#F3E5F5', weight: '700', id: 'age' }),
        text('GLORIOUS YEARS', CX, 360, { size: 18, font: 'Montserrat', fill: '#B0BEC5', weight: '600', id: 'years_text' }),
        text('SUNITA DEVI', CX, 430, { size: 32, font: 'Playfair Display', fill: '#F3E5F5', weight: '600', id: 'person_name' }),
        line(150, 480, W - 150, 480, '#B0BEC5', 1),
        text('Your presence is requested', CX, 530, { size: 14, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'invitation_text' }),
        text('Sunday, August 17th, 2025', CX, 590, { size: 20, font: 'Cormorant Garamond', fill: '#B0BEC5', weight: '600', id: 'event_date' }),
        text('12:00 PM | Lunch', CX, 625, { size: 14, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'event_time' }),
        text('Ashoka Hotel', CX, 690, { size: 18, font: 'Playfair Display', fill: '#B0BEC5', weight: '600', id: 'venue_name' }),
        text('Chanakyapuri, New Delhi', CX, 725, { size: 14, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'venue_address' }),
      ],
      background: '#4A148C',
    },
  },

  {
    name: 'Unicorn Dreams',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#AB47BC', secondary: '#F3E5F5', accent: '#FFD54F' },
    isPremium: false,
    sortOrder: 10,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F3E5F5'),
        path(SVG.star, 60, 80, { fill: '#FFD54F', scaleX: 1.2, scaleY: 1.2, opacity: 0.7 }),
        path(SVG.star, W - 60, 100, { fill: '#AB47BC', scaleX: 1, scaleY: 1, opacity: 0.5 }),
        path(SVG.star, 100, 180, { fill: '#4FC3F7', scaleX: 0.8, scaleY: 0.8, opacity: 0.6 }),
        path(SVG.heart, CX, 100, { fill: '#AB47BC', scaleX: 2, scaleY: 2 }),
        text('Magical Unicorn Party!', CX, 180, { size: 24, font: 'Dancing Script', fill: '#AB47BC', id: 'magical_text' }),
        text("AADHYA'S", CX, 280, { size: 44, font: 'Pacifico', fill: '#AB47BC', id: 'person_name' }),
        circle(CX, 370, 45, '#FFD54F'),
        text('6', CX, 370, { size: 44, font: 'Pacifico', fill: '#AB47BC', id: 'age' }),
        text('BIRTHDAY', CX, 440, { size: 24, font: 'Poppins', fill: '#4FC3F7', weight: '600', id: 'birthday_label' }),
        text('Saturday, February 28th', CX, 510, { size: 18, font: 'Poppins', fill: '#AB47BC', weight: '600', id: 'event_date' }),
        text('3:00 PM - 6:00 PM', CX, 545, { size: 14, font: 'Poppins', fill: '#666666', id: 'event_time' }),
        text('Rainbow Dreams Venue', CX, 610, { size: 18, font: 'Poppins', fill: '#AB47BC', weight: '600', id: 'venue_name' }),
        text('Bandra, Mumbai', CX, 645, { size: 14, font: 'Poppins', fill: '#666666', id: 'venue_address' }),
        path(SVG.star, 150, 720, { fill: '#FFD54F', scaleX: 1.2, scaleY: 1.2 }),
        path(SVG.heart, CX, 720, { fill: '#4FC3F7', scaleX: 1.2, scaleY: 1.2 }),
        path(SVG.star, W - 150, 720, { fill: '#AB47BC', scaleX: 1.2, scaleY: 1.2 }),
      ],
      background: '#F3E5F5',
    },
  },

  // ============================================================================
  // ENGAGEMENT TEMPLATES (12 templates)
  // ============================================================================

  {
    name: 'Rose Gold Engagement',
    category: EInviteCategory.ENGAGEMENT,
    defaultColors: { primary: '#B76E79', secondary: '#FFF8F0', accent: '#2C3E50' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8F0'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#B76E79', strokeWidth: 2 }),
        path(SVG.ring, CX, 100, { fill: '#B76E79', scaleX: 3, scaleY: 3 }),
        text("We're Engaged!", CX, 180, { size: 36, font: 'Great Vibes', fill: '#B76E79', id: 'engaged_label' }),
        text('Ananya & Rahul', CX, 280, { size: 48, font: 'Playfair Display', fill: '#2C3E50', weight: '600', id: 'couple_names' }),
        text('Together with their parents\ninvite you to celebrate', CX, 370, { size: 14, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        text('Sunday, April 20th, 2025', CX, 460, { size: 22, font: 'Lora', fill: '#B76E79', weight: '600', id: 'event_date' }),
        text('11:00 AM - 2:00 PM', CX, 500, { size: 14, font: 'Lora', fill: '#666666', id: 'event_time' }),
        text('Hotel Oberoi', CX, 570, { size: 20, font: 'Playfair Display', fill: '#2C3E50', weight: '600', id: 'venue_name' }),
        text('MG Road, Bangalore', CX, 605, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        text('Lunch to follow', CX, 680, { size: 14, font: 'Lora', fill: '#B76E79', id: 'lunch_text' }),
        path(SVG.heart, CX, 740, { fill: '#B76E79', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#FFF8F0',
    },
  },

  {
    name: 'Indian Traditional Engagement',
    category: EInviteCategory.ENGAGEMENT,
    defaultColors: { primary: '#E65100', secondary: '#FFF3E0', accent: '#1565C0' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF3E0'),
        rect(CX, CY, W - 30, H - 30, 'transparent', { stroke: '#E65100', strokeWidth: 3 }),
        path(SVG.mandala, CX, 80, { fill: '#E65100', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.diya, 80, 100, { fill: '#1565C0', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.diya, W - 80, 100, { fill: '#1565C0', scaleX: 1.5, scaleY: 1.5 }),
        text('सगाई समारोह', CX, 160, { size: 24, font: 'Noto Sans Devanagari', fill: '#E65100', id: 'hindi_text' }),
        text('Ring Ceremony', CX, 200, { size: 14, font: 'Lora', fill: '#1565C0', id: 'english_label' }),
        text('Pooja & Amit', CX, 290, { size: 48, font: 'Great Vibes', fill: '#E65100', id: 'couple_names' }),
        text('You are cordially invited to\nbless their engagement', CX, 380, { size: 15, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('Saturday, March 22nd, 2025', CX, 470, { size: 22, font: 'Lora', fill: '#E65100', weight: '600', id: 'event_date' }),
        text('6:00 PM onwards', CX, 510, { size: 14, font: 'Lora', fill: '#1565C0', id: 'event_time' }),
        text('Radisson Blu', CX, 580, { size: 20, font: 'Playfair Display', fill: '#E65100', weight: '600', id: 'venue_name' }),
        text('Sector 18, Noida', CX, 615, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        path(SVG.ring, CX, 700, { fill: '#E65100', scaleX: 2.5, scaleY: 2.5 }),
      ],
      background: '#FFF3E0',
    },
  },

  {
    name: 'Modern Minimalist Engagement',
    category: EInviteCategory.ENGAGEMENT,
    defaultColors: { primary: '#37474F', secondary: '#FFFFFF', accent: '#FF8A65' },
    isPremium: false,
    sortOrder: 3,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        line(100, 100, W - 100, 100, '#37474F', 1),
        line(100, H - 100, W - 100, H - 100, '#37474F', 1),
        text('SHE SAID YES!', CX, 160, { size: 14, font: 'Montserrat', fill: '#FF8A65', weight: '600', id: 'yes_label' }),
        text('EMILY', CX, 250, { size: 48, font: 'Montserrat', fill: '#37474F', weight: '300', id: 'bride_name' }),
        text('&', CX, 310, { size: 28, font: 'Great Vibes', fill: '#FF8A65', id: 'and_symbol' }),
        text('DAVID', CX, 370, { size: 48, font: 'Montserrat', fill: '#37474F', weight: '300', id: 'groom_name' }),
        text('ARE ENGAGED', CX, 430, { size: 14, font: 'Montserrat', fill: '#37474F', weight: '500', id: 'engaged_text' }),
        text('May 10, 2025', CX, 510, { size: 24, font: 'Montserrat', fill: '#37474F', weight: '600', id: 'event_date' }),
        text('5:00 PM', CX, 550, { size: 14, font: 'Montserrat', fill: '#FF8A65', id: 'event_time' }),
        text('The Loft', CX, 620, { size: 18, font: 'Montserrat', fill: '#37474F', weight: '500', id: 'venue_name' }),
        text('Downtown, Chicago', CX, 655, { size: 12, font: 'Montserrat', fill: '#90A4AE', id: 'venue_address' }),
      ],
      background: '#FFFFFF',
    },
  },

  {
    name: 'Floral Engagement',
    category: EInviteCategory.ENGAGEMENT,
    defaultColors: { primary: '#C2185B', secondary: '#FCE4EC', accent: '#4CAF50' },
    isPremium: false,
    sortOrder: 4,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FCE4EC'),
        path(SVG.rose, 80, 100, { fill: '#C2185B', scaleX: 2, scaleY: 2 }),
        path(SVG.rose, W - 80, 100, { fill: '#F48FB1', scaleX: 2, scaleY: 2 }),
        path(SVG.leaf, 130, 130, { fill: '#4CAF50', scaleX: 1.5, scaleY: 1.5, angle: -30 }),
        path(SVG.leaf, W - 130, 130, { fill: '#4CAF50', scaleX: -1.5, scaleY: 1.5, angle: 30 }),
        text('Save the Date', CX, 180, { size: 18, font: 'Dancing Script', fill: '#C2185B', id: 'save_label' }),
        text('Ritika & Vikrant', CX, 280, { size: 46, font: 'Great Vibes', fill: '#C2185B', id: 'couple_names' }),
        text('are getting engaged!', CX, 350, { size: 16, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        path(SVG.ring, CX, 420, { fill: '#C2185B', scaleX: 2, scaleY: 2 }),
        text('June 15, 2025', CX, 510, { size: 24, font: 'Lora', fill: '#C2185B', weight: '600', id: 'event_date' }),
        text('4:00 PM', CX, 550, { size: 14, font: 'Lora', fill: '#666666', id: 'event_time' }),
        text('The Garden Pavilion', CX, 620, { size: 18, font: 'Playfair Display', fill: '#C2185B', weight: '600', id: 'venue_name' }),
        text('Lodhi Garden, New Delhi', CX, 655, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        path(SVG.rose, 80, H - 80, { fill: '#F48FB1', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.rose, W - 80, H - 80, { fill: '#C2185B', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#FCE4EC',
    },
  },

  // ============================================================================
  // BABY SHOWER TEMPLATES (10 templates)
  // ============================================================================

  {
    name: 'Sweet Pink Baby Shower',
    category: EInviteCategory.BABY_SHOWER,
    defaultColors: { primary: '#F48FB1', secondary: '#FFF5F8', accent: '#FFD54F' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF5F8'),
        path(SVG.heart, 80, 80, { fill: '#F48FB1', scaleX: 1.5, scaleY: 1.5, opacity: 0.5 }),
        path(SVG.heart, W - 80, 100, { fill: '#F48FB1', scaleX: 1.2, scaleY: 1.2, opacity: 0.4 }),
        text('Baby Shower', CX, 130, { size: 42, font: 'Pacifico', fill: '#F48FB1', id: 'shower_label' }),
        text('Honoring', CX, 200, { size: 16, font: 'Lora', fill: '#666666', id: 'honoring_text' }),
        text('Priya', CX, 280, { size: 56, font: 'Great Vibes', fill: '#F48FB1', id: 'mom_name' }),
        text("It's a Girl!", CX, 360, { size: 24, font: 'Poppins', fill: '#FFD54F', weight: '600', id: 'gender_text' }),
        text('Saturday, May 10th, 2025', CX, 450, { size: 20, font: 'Lora', fill: '#666666', id: 'event_date' }),
        text('2:00 PM - 5:00 PM', CX, 490, { size: 14, font: 'Lora', fill: '#F48FB1', id: 'event_time' }),
        text('Garden Terrace', CX, 560, { size: 18, font: 'Playfair Display', fill: '#F48FB1', weight: '600', id: 'venue_name' }),
        text('Bandra, Mumbai', CX, 595, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        text('Hosted by: Family & Friends', CX, 670, { size: 14, font: 'Lora', fill: '#F48FB1', id: 'hosted_by' }),
        path(SVG.heart, 150, 740, { fill: '#F48FB1', scaleX: 1, scaleY: 1, opacity: 0.4 }),
        path(SVG.heart, W - 150, 740, { fill: '#FFD54F', scaleX: 1, scaleY: 1, opacity: 0.4 }),
      ],
      background: '#FFF5F8',
    },
  },

  {
    name: 'Blue Boy Baby Shower',
    category: EInviteCategory.BABY_SHOWER,
    defaultColors: { primary: '#64B5F6', secondary: '#E3F2FD', accent: '#FFD54F' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#E3F2FD'),
        path(SVG.star, 80, 80, { fill: '#64B5F6', scaleX: 1.5, scaleY: 1.5, opacity: 0.5 }),
        path(SVG.star, W - 80, 100, { fill: '#FFD54F', scaleX: 1.2, scaleY: 1.2, opacity: 0.4 }),
        text('Baby Shower', CX, 130, { size: 42, font: 'Pacifico', fill: '#64B5F6', id: 'shower_label' }),
        text('Honoring', CX, 200, { size: 16, font: 'Lora', fill: '#666666', id: 'honoring_text' }),
        text('Sneha', CX, 280, { size: 56, font: 'Great Vibes', fill: '#64B5F6', id: 'mom_name' }),
        text("It's a Boy!", CX, 360, { size: 24, font: 'Poppins', fill: '#1976D2', weight: '600', id: 'gender_text' }),
        text('Sunday, June 22nd, 2025', CX, 450, { size: 20, font: 'Lora', fill: '#666666', id: 'event_date' }),
        text('3:00 PM - 6:00 PM', CX, 490, { size: 14, font: 'Lora', fill: '#64B5F6', id: 'event_time' }),
        text('Sunshine Hall', CX, 560, { size: 18, font: 'Playfair Display', fill: '#1976D2', weight: '600', id: 'venue_name' }),
        text('Koramangala, Bangalore', CX, 595, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        text('Hosted by: Sisters & Friends', CX, 670, { size: 14, font: 'Lora', fill: '#64B5F6', id: 'hosted_by' }),
        path(SVG.star, 150, 740, { fill: '#64B5F6', scaleX: 1, scaleY: 1, opacity: 0.4 }),
        path(SVG.star, W - 150, 740, { fill: '#FFD54F', scaleX: 1, scaleY: 1, opacity: 0.4 }),
      ],
      background: '#E3F2FD',
    },
  },

  {
    name: 'Gender Neutral Baby Shower',
    category: EInviteCategory.BABY_SHOWER,
    defaultColors: { primary: '#A5D6A7', secondary: '#F1F8E9', accent: '#FFE082' },
    isPremium: false,
    sortOrder: 3,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F1F8E9'),
        path(SVG.leaf, 80, 100, { fill: '#A5D6A7', scaleX: 2, scaleY: 2, angle: -20 }),
        path(SVG.leaf, W - 80, 100, { fill: '#A5D6A7', scaleX: -2, scaleY: 2, angle: 20 }),
        text('Baby Shower', CX, 170, { size: 42, font: 'Dancing Script', fill: '#66BB6A', id: 'shower_label' }),
        text('Celebrating', CX, 230, { size: 16, font: 'Lora', fill: '#666666', id: 'celebrating_text' }),
        text('Meera & Rohan', CX, 310, { size: 44, font: 'Great Vibes', fill: '#4CAF50', id: 'parent_names' }),
        text("A little one is on the way!", CX, 390, { size: 18, font: 'Lora', fill: '#666666', id: 'baby_text' }),
        text('Saturday, July 12th, 2025', CX, 470, { size: 20, font: 'Lora', fill: '#66BB6A', weight: '600', id: 'event_date' }),
        text('4:00 PM - 7:00 PM', CX, 510, { size: 14, font: 'Lora', fill: '#666666', id: 'event_time' }),
        text('Botanical Gardens', CX, 580, { size: 18, font: 'Playfair Display', fill: '#4CAF50', weight: '600', id: 'venue_name' }),
        text('Cubbon Park, Bangalore', CX, 615, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
        path(SVG.leaf, CX, 700, { fill: '#A5D6A7', scaleX: 2, scaleY: 2 }),
      ],
      background: '#F1F8E9',
    },
  },

  {
    name: 'Indian Godh Bharai',
    category: EInviteCategory.BABY_SHOWER,
    defaultColors: { primary: '#E91E63', secondary: '#FFF8E1', accent: '#FFD700' },
    isPremium: true,
    sortOrder: 4,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#E91E63', strokeWidth: 2 }),
        path(SVG.mandala, CX, 80, { fill: '#E91E63', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.diya, 80, 100, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.diya, W - 80, 100, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5 }),
        text('गोद भराई', CX, 150, { size: 28, font: 'Noto Sans Devanagari', fill: '#E91E63', id: 'hindi_text' }),
        text('Godh Bharai Ceremony', CX, 190, { size: 14, font: 'Lora', fill: '#5D4037', id: 'english_label' }),
        text('Kavita', CX, 280, { size: 52, font: 'Great Vibes', fill: '#E91E63', id: 'mom_name' }),
        text('Please join us to bless\nthe mother-to-be', CX, 370, { size: 15, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('Sunday, August 3rd, 2025', CX, 460, { size: 20, font: 'Lora', fill: '#E91E63', weight: '600', id: 'event_date' }),
        text('11:00 AM onwards', CX, 500, { size: 14, font: 'Lora', fill: '#FFD700', id: 'event_time' }),
        text('Family Residence', CX, 570, { size: 18, font: 'Playfair Display', fill: '#E91E63', weight: '600', id: 'venue_name' }),
        text('Rajouri Garden, Delhi', CX, 605, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        text('Lunch to follow', CX, 680, { size: 14, font: 'Lora', fill: '#E91E63', id: 'lunch_text' }),
        path(SVG.lotus, CX, 740, { fill: '#E91E63', scaleX: 2, scaleY: 2 }),
      ],
      background: '#FFF8E1',
    },
  },

  // ============================================================================
  // ANNIVERSARY TEMPLATES (10 templates)
  // ============================================================================

  {
    name: 'Golden 50th Anniversary',
    category: EInviteCategory.ANNIVERSARY,
    defaultColors: { primary: '#FFD700', secondary: '#1A1A1A', accent: '#FFFFFF' },
    isPremium: true,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#1A1A1A'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#FFD700', strokeWidth: 2 }),
        text('Celebrating', CX, 120, { size: 18, font: 'Cormorant Garamond', fill: '#FFD700', id: 'celebrating_text' }),
        text('50', CX, 240, { size: 120, font: 'Playfair Display', fill: '#FFD700', weight: '700', id: 'years' }),
        text('GOLDEN YEARS', CX, 320, { size: 20, font: 'Montserrat', fill: '#FFFFFF', weight: '600', id: 'golden_text' }),
        text('of', CX, 360, { size: 16, font: 'Great Vibes', fill: '#FFD700', id: 'of_text' }),
        text('Mr. & Mrs. Sharma', CX, 420, { size: 32, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'couple_names' }),
        line(150, 470, W - 150, 470, '#FFD700', 1),
        text('Join us to celebrate this golden milestone', CX, 520, { size: 14, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'invitation_text' }),
        text('Saturday, September 20th, 2025', CX, 580, { size: 18, font: 'Cormorant Garamond', fill: '#FFD700', weight: '600', id: 'event_date' }),
        text('6:00 PM | Dinner & Dancing', CX, 615, { size: 12, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'event_time' }),
        text('The Taj Mahal Palace', CX, 680, { size: 16, font: 'Playfair Display', fill: '#FFD700', weight: '600', id: 'venue_name' }),
        text('Mumbai', CX, 715, { size: 12, font: 'Cormorant Garamond', fill: '#FFFFFF', id: 'venue_address' }),
      ],
      background: '#1A1A1A',
    },
  },

  {
    name: 'Silver 25th Anniversary',
    category: EInviteCategory.ANNIVERSARY,
    defaultColors: { primary: '#C0C0C0', secondary: '#2C3E50', accent: '#ECEFF1' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#2C3E50'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#C0C0C0', strokeWidth: 2 }),
        path(SVG.heart, CX, 100, { fill: '#C0C0C0', scaleX: 2, scaleY: 2 }),
        text('25', CX, 220, { size: 100, font: 'Playfair Display', fill: '#C0C0C0', weight: '700', id: 'years' }),
        text('SILVER ANNIVERSARY', CX, 300, { size: 18, font: 'Montserrat', fill: '#ECEFF1', weight: '600', id: 'silver_text' }),
        text('Ashok & Sunita', CX, 380, { size: 36, font: 'Great Vibes', fill: '#C0C0C0', id: 'couple_names' }),
        text('You are invited to celebrate\ntwenty-five years of love', CX, 460, { size: 14, font: 'Lora', fill: '#ECEFF1', id: 'invitation_text' }),
        text('November 15, 2025', CX, 540, { size: 22, font: 'Lora', fill: '#C0C0C0', weight: '600', id: 'event_date' }),
        text('7:00 PM', CX, 580, { size: 14, font: 'Lora', fill: '#ECEFF1', id: 'event_time' }),
        text('The Grand Hyatt', CX, 650, { size: 18, font: 'Playfair Display', fill: '#C0C0C0', weight: '600', id: 'venue_name' }),
        text('Santacruz, Mumbai', CX, 685, { size: 14, font: 'Lora', fill: '#ECEFF1', id: 'venue_address' }),
        path(SVG.heart, 150, 750, { fill: '#C0C0C0', scaleX: 1, scaleY: 1, opacity: 0.5 }),
        path(SVG.heart, W - 150, 750, { fill: '#C0C0C0', scaleX: 1, scaleY: 1, opacity: 0.5 }),
      ],
      background: '#2C3E50',
    },
  },

  {
    name: 'Ruby 40th Anniversary',
    category: EInviteCategory.ANNIVERSARY,
    defaultColors: { primary: '#E53935', secondary: '#FFEBEE', accent: '#C62828' },
    isPremium: false,
    sortOrder: 3,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFEBEE'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#E53935', strokeWidth: 2 }),
        path(SVG.diamond, CX, 100, { fill: '#E53935', scaleX: 2.5, scaleY: 2.5 }),
        text('40', CX, 220, { size: 100, font: 'Playfair Display', fill: '#E53935', weight: '700', id: 'years' }),
        text('RUBY ANNIVERSARY', CX, 300, { size: 18, font: 'Montserrat', fill: '#C62828', weight: '600', id: 'ruby_text' }),
        text('Vinod & Kamla', CX, 380, { size: 36, font: 'Great Vibes', fill: '#E53935', id: 'couple_names' }),
        text('Join us to celebrate\nforty years of togetherness', CX, 460, { size: 14, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('December 10, 2025', CX, 540, { size: 22, font: 'Lora', fill: '#E53935', weight: '600', id: 'event_date' }),
        text('1:00 PM | Lunch', CX, 580, { size: 14, font: 'Lora', fill: '#C62828', id: 'event_time' }),
        text('India Habitat Centre', CX, 650, { size: 18, font: 'Playfair Display', fill: '#E53935', weight: '600', id: 'venue_name' }),
        text('Lodhi Road, New Delhi', CX, 685, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
      ],
      background: '#FFEBEE',
    },
  },

  // ============================================================================
  // CORPORATE TEMPLATES (8 templates)
  // ============================================================================

  {
    name: 'Professional Conference',
    category: EInviteCategory.CORPORATE,
    defaultColors: { primary: '#1976D2', secondary: '#FFFFFF', accent: '#FF9800' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, 50, W, 100, '#1976D2'),
        text('TECH INNOVATIONS', CX, 50, { size: 20, font: 'Montserrat', fill: '#FFFFFF', weight: '700', id: 'company_name' }),
        text('ANNUAL SUMMIT 2025', CX, 160, { size: 14, font: 'Montserrat', fill: '#FF9800', weight: '600', id: 'event_type' }),
        text('Future of AI', CX, 250, { size: 36, font: 'Montserrat', fill: '#1976D2', weight: '700', id: 'event_name' }),
        text('Shaping Tomorrow\'s Technology', CX, 310, { size: 16, font: 'Lora', fill: '#666666', id: 'tagline' }),
        rect(CX, 360, 100, 4, '#FF9800'),
        text('October 15-16, 2025', CX, 420, { size: 22, font: 'Montserrat', fill: '#1976D2', weight: '600', id: 'event_date' }),
        text('9:00 AM - 6:00 PM', CX, 460, { size: 14, font: 'Montserrat', fill: '#666666', id: 'event_time' }),
        text('Bangalore International\nExhibition Centre', CX, 530, { size: 18, font: 'Montserrat', fill: '#1976D2', weight: '600', id: 'venue_name' }),
        text('Tumkur Road, Bangalore', CX, 590, { size: 14, font: 'Montserrat', fill: '#666666', id: 'venue_address' }),
        text('Register: events.techinnovations.com', CX, 660, { size: 14, font: 'Montserrat', fill: '#FF9800', id: 'registration' }),
        rect(CX, H - 50, W, 100, '#1976D2'),
        text('events@techinnovations.com', CX, H - 50, { size: 12, font: 'Montserrat', fill: '#FFFFFF', id: 'contact' }),
      ],
      background: '#FFFFFF',
    },
  },

  {
    name: 'Product Launch',
    category: EInviteCategory.CORPORATE,
    defaultColors: { primary: '#212121', secondary: '#FAFAFA', accent: '#00BCD4' },
    isPremium: true,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#212121'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#00BCD4', strokeWidth: 1 }),
        text('YOU\'RE INVITED', CX, 120, { size: 14, font: 'Montserrat', fill: '#00BCD4', weight: '500', id: 'invite_label' }),
        text('EXCLUSIVE', CX, 200, { size: 18, font: 'Montserrat', fill: '#FAFAFA', weight: '300', id: 'exclusive_text' }),
        text('PRODUCT LAUNCH', CX, 280, { size: 32, font: 'Montserrat', fill: '#00BCD4', weight: '700', id: 'launch_text' }),
        text('Introducing the next generation\nof innovation', CX, 370, { size: 14, font: 'Lora', fill: '#FAFAFA', id: 'tagline' }),
        line(150, 430, W - 150, 430, '#00BCD4', 1),
        text('November 22, 2025', CX, 490, { size: 24, font: 'Montserrat', fill: '#FAFAFA', weight: '600', id: 'event_date' }),
        text('6:00 PM | Cocktails & Unveiling', CX, 530, { size: 12, font: 'Montserrat', fill: '#00BCD4', id: 'event_time' }),
        text('The Lalit', CX, 600, { size: 18, font: 'Montserrat', fill: '#FAFAFA', weight: '500', id: 'venue_name' }),
        text('Connaught Place, New Delhi', CX, 635, { size: 12, font: 'Montserrat', fill: '#FAFAFA', id: 'venue_address' }),
        text('RSVP by November 15', CX, 710, { size: 12, font: 'Montserrat', fill: '#00BCD4', id: 'rsvp_text' }),
      ],
      background: '#212121',
    },
  },

  // ============================================================================
  // HOUSEWARMING TEMPLATES (5 templates)
  // ============================================================================

  {
    name: 'Traditional Griha Pravesh',
    category: EInviteCategory.HOUSEWARMING,
    defaultColors: { primary: '#E65100', secondary: '#FFF8E1', accent: '#4CAF50' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF8E1'),
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#E65100', strokeWidth: 2 }),
        path(SVG.kalash, CX, 80, { fill: '#E65100', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.diya, 100, 100, { fill: '#E65100', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.diya, W - 100, 100, { fill: '#E65100', scaleX: 1.5, scaleY: 1.5 }),
        text('गृह प्रवेश', CX, 160, { size: 28, font: 'Noto Sans Devanagari', fill: '#E65100', id: 'hindi_text' }),
        text('Griha Pravesh', CX, 200, { size: 16, font: 'Lora', fill: '#4CAF50', id: 'english_label' }),
        text('The Verma Family', CX, 290, { size: 36, font: 'Playfair Display', fill: '#E65100', weight: '600', id: 'family_name' }),
        text('cordially invite you to\nthe housewarming of their new home', CX, 380, { size: 15, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('Sunday, January 18th, 2026', CX, 470, { size: 20, font: 'Lora', fill: '#E65100', weight: '600', id: 'event_date' }),
        text('Muhurat: 10:30 AM', CX, 510, { size: 14, font: 'Lora', fill: '#4CAF50', id: 'event_time' }),
        text('New Address:', CX, 580, { size: 14, font: 'Lora', fill: '#E65100', weight: '600', id: 'address_label' }),
        text('A-42, Green Valley Apartments\nSector 50, Gurugram', CX, 630, { size: 14, font: 'Lora', fill: '#5D4037', id: 'address' }),
        text('Your blessings are all we need!', CX, 720, { size: 14, font: 'Lora', fill: '#4CAF50', id: 'blessing_text' }),
      ],
      background: '#FFF8E1',
    },
  },

  {
    name: 'Modern Housewarming',
    category: EInviteCategory.HOUSEWARMING,
    defaultColors: { primary: '#5D4037', secondary: '#EFEBE9', accent: '#8BC34A' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#EFEBE9'),
        path(SVG.leaf, 80, 80, { fill: '#8BC34A', scaleX: 2, scaleY: 2, angle: -30 }),
        path(SVG.leaf, W - 80, 80, { fill: '#8BC34A', scaleX: -2, scaleY: 2, angle: 30 }),
        text('Welcome Home', CX, 160, { size: 36, font: 'Dancing Script', fill: '#5D4037', id: 'welcome_text' }),
        text('Join us to celebrate our new space!', CX, 220, { size: 16, font: 'Lora', fill: '#8D6E63', id: 'invitation_text' }),
        text('The Kapoor Family', CX, 310, { size: 32, font: 'Playfair Display', fill: '#5D4037', weight: '600', id: 'family_name' }),
        text('Saturday, February 8th, 2026', CX, 400, { size: 22, font: 'Lora', fill: '#5D4037', weight: '600', id: 'event_date' }),
        text('4:00 PM onwards', CX, 440, { size: 14, font: 'Lora', fill: '#8D6E63', id: 'event_time' }),
        text('New Address', CX, 510, { size: 14, font: 'Lora', fill: '#8BC34A', weight: '600', id: 'address_label' }),
        text('Villa 23, Palm Springs\nWhitefield, Bangalore', CX, 570, { size: 16, font: 'Lora', fill: '#5D4037', id: 'address' }),
        text('No gifts please, just your\nwarm wishes and company!', CX, 680, { size: 14, font: 'Lora', fill: '#8D6E63', id: 'gift_text' }),
        path(SVG.leaf, CX, 750, { fill: '#8BC34A', scaleX: 2, scaleY: 2 }),
      ],
      background: '#EFEBE9',
    },
  },

  // ============================================================================
  // GRADUATION TEMPLATES (5 templates)
  // ============================================================================

  {
    name: 'Classic Graduation',
    category: EInviteCategory.GRADUATION,
    defaultColors: { primary: '#1A237E', secondary: '#FFFFFF', accent: '#FFC107' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFFFF'),
        rect(CX, 50, W, 100, '#1A237E'),
        path(SVG.cap, CX, 50, { fill: '#FFC107', scaleX: 2.5, scaleY: 2.5 }),
        text('CLASS OF 2025', CX, 160, { size: 18, font: 'Montserrat', fill: '#1A237E', weight: '600', id: 'class_text' }),
        text('Graduation Celebration', CX, 220, { size: 28, font: 'Playfair Display', fill: '#FFC107', weight: '600', id: 'graduation_text' }),
        text('AARAV PATEL', CX, 320, { size: 40, font: 'Montserrat', fill: '#1A237E', weight: '700', id: 'graduate_name' }),
        text('Bachelor of Technology\nComputer Science', CX, 400, { size: 16, font: 'Lora', fill: '#5D4037', id: 'degree' }),
        text('IIT Delhi', CX, 460, { size: 18, font: 'Playfair Display', fill: '#1A237E', weight: '600', id: 'institution' }),
        text('Please join us to celebrate!', CX, 530, { size: 14, font: 'Lora', fill: '#666666', id: 'invitation_text' }),
        text('Saturday, May 31st, 2025', CX, 590, { size: 20, font: 'Lora', fill: '#1A237E', weight: '600', id: 'event_date' }),
        text('5:00 PM | Reception', CX, 630, { size: 14, font: 'Lora', fill: '#FFC107', id: 'event_time' }),
        text('India International Centre', CX, 700, { size: 16, font: 'Playfair Display', fill: '#1A237E', weight: '600', id: 'venue_name' }),
        text('Lodhi Road, New Delhi', CX, 735, { size: 14, font: 'Lora', fill: '#666666', id: 'venue_address' }),
      ],
      background: '#FFFFFF',
    },
  },

  {
    name: 'Modern Achievement',
    category: EInviteCategory.GRADUATION,
    defaultColors: { primary: '#4A148C', secondary: '#F3E5F5', accent: '#FFD700' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#4A148C'),
        path(SVG.star, 80, 80, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5, opacity: 0.6 }),
        path(SVG.star, W - 80, 100, { fill: '#FFD700', scaleX: 1, scaleY: 1, opacity: 0.4 }),
        path(SVG.cap, CX, 130, { fill: '#FFD700', scaleX: 3, scaleY: 3 }),
        text('SHE DID IT!', CX, 220, { size: 16, font: 'Montserrat', fill: '#FFD700', weight: '600', id: 'did_it_text' }),
        text('PRIYA SHARMA', CX, 300, { size: 36, font: 'Montserrat', fill: '#FFFFFF', weight: '700', id: 'graduate_name' }),
        text('Master of Business Administration', CX, 360, { size: 16, font: 'Lora', fill: '#F3E5F5', id: 'degree' }),
        text('ISB Hyderabad', CX, 400, { size: 18, font: 'Playfair Display', fill: '#FFD700', weight: '600', id: 'institution' }),
        text('Join us to celebrate this achievement!', CX, 480, { size: 14, font: 'Lora', fill: '#F3E5F5', id: 'invitation_text' }),
        text('June 14, 2025', CX, 550, { size: 24, font: 'Montserrat', fill: '#FFFFFF', weight: '600', id: 'event_date' }),
        text('7:00 PM | Dinner & Dancing', CX, 590, { size: 14, font: 'Montserrat', fill: '#FFD700', id: 'event_time' }),
        text('The Westin', CX, 660, { size: 18, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'venue_name' }),
        text('Gachibowli, Hyderabad', CX, 695, { size: 14, font: 'Montserrat', fill: '#F3E5F5', id: 'venue_address' }),
        path(SVG.star, CX, 760, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#4A148C',
    },
  },

  // ============================================================================
  // OTHER / GENERAL TEMPLATES (5 templates)
  // ============================================================================

  {
    name: 'General Celebration',
    category: EInviteCategory.OTHER,
    defaultColors: { primary: '#FF5722', secondary: '#FFF3E0', accent: '#4CAF50' },
    isPremium: false,
    sortOrder: 1,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF3E0'),
        path(SVG.confetti, 100, 100, { stroke: '#FF5722', strokeWidth: 2, scaleX: 2, scaleY: 2 }),
        path(SVG.confetti, W - 100, 100, { stroke: '#4CAF50', strokeWidth: 2, scaleX: 2, scaleY: 2 }),
        text("Let's Celebrate!", CX, 180, { size: 36, font: 'Dancing Script', fill: '#FF5722', id: 'celebrate_text' }),
        text('You are cordially invited', CX, 250, { size: 16, font: 'Lora', fill: '#5D4037', id: 'invitation_text' }),
        text('Event Name', CX, 330, { size: 32, font: 'Playfair Display', fill: '#FF5722', weight: '600', id: 'event_name' }),
        path(SVG.flourish, CX, 390, { stroke: '#FF5722', strokeWidth: 1, scaleX: 3, scaleY: 1.5 }),
        text('Saturday, March 15th, 2025', CX, 460, { size: 22, font: 'Lora', fill: '#FF5722', weight: '600', id: 'event_date' }),
        text('4:00 PM onwards', CX, 500, { size: 14, font: 'Lora', fill: '#5D4037', id: 'event_time' }),
        text('Venue Name', CX, 570, { size: 20, font: 'Playfair Display', fill: '#FF5722', weight: '600', id: 'venue_name' }),
        text('Address Line', CX, 605, { size: 14, font: 'Lora', fill: '#5D4037', id: 'venue_address' }),
        text('We look forward to seeing you!', CX, 700, { size: 14, font: 'Lora', fill: '#4CAF50', id: 'looking_forward' }),
      ],
      background: '#FFF3E0',
    },
  },

  {
    name: 'Elegant Party',
    category: EInviteCategory.OTHER,
    defaultColors: { primary: '#7B1FA2', secondary: '#F3E5F5', accent: '#FFD700' },
    isPremium: false,
    sortOrder: 2,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#7B1FA2'),
        rect(CX, CY, W - 50, H - 50, 'transparent', { stroke: '#FFD700', strokeWidth: 2 }),
        path(SVG.star, 80, 80, { fill: '#FFD700', scaleX: 1.5, scaleY: 1.5, opacity: 0.6 }),
        path(SVG.star, W - 80, 100, { fill: '#FFD700', scaleX: 1.2, scaleY: 1.2, opacity: 0.5 }),
        text("YOU'RE INVITED", CX, 140, { size: 18, font: 'Montserrat', fill: '#FFD700', weight: '600', id: 'invited_text' }),
        text('Special Event', CX, 240, { size: 40, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'event_name' }),
        text('Join us for an unforgettable evening', CX, 320, { size: 16, font: 'Lora', fill: '#F3E5F5', id: 'tagline' }),
        line(150, 380, W - 150, 380, '#FFD700', 1),
        text('Friday, April 25th, 2025', CX, 440, { size: 24, font: 'Cormorant Garamond', fill: '#FFFFFF', weight: '600', id: 'event_date' }),
        text('8:00 PM | Cocktails & Entertainment', CX, 480, { size: 14, font: 'Cormorant Garamond', fill: '#FFD700', id: 'event_time' }),
        text('The Grand Ballroom', CX, 550, { size: 20, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'venue_name' }),
        text('Connaught Place, New Delhi', CX, 585, { size: 14, font: 'Cormorant Garamond', fill: '#F3E5F5', id: 'venue_address' }),
        text('Dress Code: Formal', CX, 660, { size: 14, font: 'Cormorant Garamond', fill: '#FFD700', id: 'dress_code' }),
        path(SVG.star, CX, 730, { fill: '#FFD700', scaleX: 2, scaleY: 2 }),
      ],
      background: '#7B1FA2',
    },
  },

  // ============================================================================
  // ELEGANT CANVA-STYLE TEMPLATES (NEW)
  // ============================================================================

  // Watercolor Floral Wedding
  {
    name: 'Watercolor Blossom',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#D4A5A5', secondary: '#FFF9F9', accent: '#8B7355' },
    isPremium: true,
    sortOrder: 21,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF9F9'),
        // Watercolor blobs (soft background accents)
        path(SVG.watercolorBlob1, 100, 120, { fill: '#D4A5A5', scaleX: 4, scaleY: 4, opacity: 0.15 }),
        path(SVG.watercolorBlob2, W - 80, 180, { fill: '#E8D4D4', scaleX: 3, scaleY: 3, opacity: 0.2 }),
        path(SVG.watercolorBlob1, 80, H - 150, { fill: '#D4A5A5', scaleX: 3.5, scaleY: 3.5, opacity: 0.12 }),
        path(SVG.watercolorBlob2, W - 100, H - 180, { fill: '#E8D4D4', scaleX: 4, scaleY: 4, opacity: 0.18 }),
        // Floral corners
        path(SVG.floralCorner, 30, 50, { stroke: '#D4A5A5', strokeWidth: 1.5, scaleX: 1.8, scaleY: 1.8 }),
        path(SVG.floralCorner, W - 30, 50, { stroke: '#D4A5A5', strokeWidth: 1.5, scaleX: -1.8, scaleY: 1.8 }),
        path(SVG.floralCorner, 30, H - 50, { stroke: '#D4A5A5', strokeWidth: 1.5, scaleX: 1.8, scaleY: -1.8 }),
        path(SVG.floralCorner, W - 30, H - 50, { stroke: '#D4A5A5', strokeWidth: 1.5, scaleX: -1.8, scaleY: -1.8 }),
        // Detailed roses
        path(SVG.roseDetailed, 100, 100, { fill: '#D4A5A5', scaleX: 2, scaleY: 2 }),
        path(SVG.roseDetailed, W - 100, 110, { fill: '#C9A0A0', scaleX: 1.8, scaleY: 1.8, angle: 15 }),
        path(SVG.roseDetailed, 90, H - 120, { fill: '#D4A5A5', scaleX: 1.8, scaleY: 1.8, angle: -10 }),
        path(SVG.roseDetailed, W - 90, H - 100, { fill: '#C9A0A0', scaleX: 2, scaleY: 2, angle: 10 }),
        // Eucalyptus leaves
        path(SVG.eucalyptus, 60, 220, { stroke: '#8B9A7B', strokeWidth: 1, scaleX: 1.2, scaleY: 1.2, angle: -30 }),
        path(SVG.eucalyptus, W - 60, 200, { stroke: '#8B9A7B', strokeWidth: 1, scaleX: 1.2, scaleY: 1.2, angle: 30 }),
        // Content
        text('Together with their families', CX, 200, { size: 14, font: 'Cormorant Garamond', fill: '#8B7355', id: 'families' }),
        text('Olivia & William', CX, 300, { size: 52, font: 'Great Vibes', fill: '#8B7355', id: 'couple_names' }),
        text('invite you to celebrate their wedding', CX, 380, { size: 16, font: 'Cormorant Garamond', fill: '#8B7355', id: 'invitation' }),
        path(SVG.elegantDivider, CX, 430, { stroke: '#D4A5A5', strokeWidth: 1, scaleX: 6, scaleY: 1 }),
        text('Saturday, June 15th, 2025', CX, 490, { size: 24, font: 'Cormorant Garamond', fill: '#8B7355', weight: '600', id: 'event_date' }),
        text('at four o\'clock in the afternoon', CX, 530, { size: 14, font: 'Cormorant Garamond', fill: '#A08B7B', id: 'event_time' }),
        text('Rosewood Garden Estate', CX, 600, { size: 20, font: 'Playfair Display', fill: '#8B7355', weight: '600', id: 'venue_name' }),
        text('Napa Valley, California', CX, 635, { size: 14, font: 'Cormorant Garamond', fill: '#A08B7B', id: 'venue_address' }),
        path(SVG.heart, CX, 720, { fill: '#D4A5A5', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#FFF9F9',
    },
  },

  // Modern Eucalyptus Greenery
  {
    name: 'Eucalyptus Dreams',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#4A6741', secondary: '#F5F7F2', accent: '#8B7355' },
    isPremium: true,
    sortOrder: 22,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F5F7F2'),
        // Eucalyptus branches all around
        path(SVG.eucalyptus, 80, 100, { stroke: '#4A6741', strokeWidth: 1.5, scaleX: 2, scaleY: 2, angle: -20 }),
        path(SVG.eucalyptus, W - 80, 120, { stroke: '#5A7751', strokeWidth: 1.5, scaleX: 2, scaleY: 2, angle: 25 }),
        path(SVG.botanicalBranch, 60, 200, { stroke: '#4A6741', strokeWidth: 1, scaleX: 2, scaleY: 2 }),
        path(SVG.botanicalBranch, W - 60, 180, { stroke: '#5A7751', strokeWidth: 1, scaleX: -2, scaleY: 2 }),
        path(SVG.eucalyptus, 70, H - 150, { stroke: '#4A6741', strokeWidth: 1.5, scaleX: 1.8, scaleY: -1.8, angle: 15 }),
        path(SVG.eucalyptus, W - 70, H - 130, { stroke: '#5A7751', strokeWidth: 1.5, scaleX: 1.8, scaleY: -1.8, angle: -20 }),
        path(SVG.leaf, 50, 350, { fill: '#4A6741', scaleX: 1.2, scaleY: 1.2, opacity: 0.3 }),
        path(SVG.leaf, W - 50, 380, { fill: '#5A7751', scaleX: 1.2, scaleY: 1.2, opacity: 0.25 }),
        // Geometric frame
        rect(CX, CY, 420, 560, 'transparent', { stroke: '#4A6741', strokeWidth: 1 }),
        // Content
        text('THE WEDDING OF', CX, 180, { size: 12, font: 'Montserrat', fill: '#8B7355', weight: '600', id: 'label' }),
        text('Charlotte', CX, 270, { size: 48, font: 'Great Vibes', fill: '#4A6741', id: 'bride_name' }),
        text('&', CX, 330, { size: 28, font: 'Great Vibes', fill: '#8B7355', id: 'and_symbol' }),
        text('Benjamin', CX, 390, { size: 48, font: 'Great Vibes', fill: '#4A6741', id: 'groom_name' }),
        line(180, 450, W - 180, 450, '#4A6741', 0.5),
        text('May 20, 2025', CX, 500, { size: 24, font: 'Cormorant Garamond', fill: '#4A6741', weight: '600', id: 'event_date' }),
        text('Five o\'clock in the evening', CX, 540, { size: 14, font: 'Cormorant Garamond', fill: '#8B7355', id: 'event_time' }),
        text('Botanical Gardens', CX, 600, { size: 18, font: 'Montserrat', fill: '#4A6741', weight: '500', id: 'venue_name' }),
        text('Melbourne, Australia', CX, 635, { size: 13, font: 'Cormorant Garamond', fill: '#8B7355', id: 'venue_address' }),
      ],
      background: '#F5F7F2',
    },
  },

  // Luxury Indian Mandala
  {
    name: 'Mandala Luxe',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#C9A227', secondary: '#1A1A2E', accent: '#E8D5B7' },
    isPremium: true,
    sortOrder: 23,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#1A1A2E'),
        // Large decorative mandala background
        path(SVG.mandala, CX, CY, { fill: '#C9A227', scaleX: 20, scaleY: 20, opacity: 0.08 }),
        // Ornate corners
        path(SVG.ornateCorner, 25, 40, { stroke: '#C9A227', strokeWidth: 1, scaleX: 1.2, scaleY: 1.2 }),
        path(SVG.ornateCorner, W - 25, 40, { stroke: '#C9A227', strokeWidth: 1, scaleX: -1.2, scaleY: 1.2 }),
        path(SVG.ornateCorner, 25, H - 40, { stroke: '#C9A227', strokeWidth: 1, scaleX: 1.2, scaleY: -1.2 }),
        path(SVG.ornateCorner, W - 25, H - 40, { stroke: '#C9A227', strokeWidth: 1, scaleX: -1.2, scaleY: -1.2 }),
        // Double border
        rect(CX, CY, W - 40, H - 40, 'transparent', { stroke: '#C9A227', strokeWidth: 2 }),
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#C9A227', strokeWidth: 0.5 }),
        // Decorative elements
        path(SVG.paisley, 80, 200, { fill: '#C9A227', scaleX: 1.5, scaleY: 1.5 }),
        path(SVG.paisley, W - 80, 200, { fill: '#C9A227', scaleX: -1.5, scaleY: 1.5 }),
        path(SVG.lotus, CX, 100, { fill: '#C9A227', scaleX: 2.5, scaleY: 2.5 }),
        // Content
        text('॥ शुभ विवाह ॥', CX, 170, { size: 20, font: 'Noto Sans Devanagari', fill: '#C9A227', id: 'hindi_title', editable: false }),
        text('Wedding Ceremony', CX, 210, { size: 14, font: 'Cormorant Garamond', fill: '#E8D5B7', id: 'english_title' }),
        text('Aisha & Kabir', CX, 310, { size: 52, font: 'Great Vibes', fill: '#C9A227', id: 'couple_names' }),
        path(SVG.elegantDivider, CX, 380, { stroke: '#C9A227', strokeWidth: 1, scaleX: 5, scaleY: 1 }),
        text('Request your gracious presence', CX, 420, { size: 14, font: 'Cormorant Garamond', fill: '#E8D5B7', id: 'invitation' }),
        text('Saturday, 22nd February 2025', CX, 490, { size: 24, font: 'Cormorant Garamond', fill: '#C9A227', weight: '600', id: 'event_date' }),
        text('Auspicious Muhurat: 10:30 AM', CX, 530, { size: 14, font: 'Cormorant Garamond', fill: '#E8D5B7', id: 'event_time' }),
        text('The Leela Palace', CX, 590, { size: 20, font: 'Playfair Display', fill: '#C9A227', weight: '600', id: 'venue_name' }),
        text('New Delhi, India', CX, 625, { size: 14, font: 'Cormorant Garamond', fill: '#E8D5B7', id: 'venue_address' }),
        path(SVG.kalash, CX, 710, { fill: '#C9A227', scaleX: 2.5, scaleY: 2.5 }),
      ],
      background: '#1A1A2E',
    },
  },

  // Art Deco Glamour Wedding
  {
    name: 'Art Deco Noir',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#D4AF37', secondary: '#0D0D0D', accent: '#FFFFFF' },
    isPremium: true,
    sortOrder: 24,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#0D0D0D'),
        // Art deco geometric patterns
        path(SVG.artDecoCorner, 20, 30, { stroke: '#D4AF37', strokeWidth: 1, scaleX: 2, scaleY: 2 }),
        path(SVG.artDecoCorner, W - 20, 30, { stroke: '#D4AF37', strokeWidth: 1, scaleX: -2, scaleY: 2 }),
        path(SVG.artDecoCorner, 20, H - 30, { stroke: '#D4AF37', strokeWidth: 1, scaleX: 2, scaleY: -2 }),
        path(SVG.artDecoCorner, W - 20, H - 30, { stroke: '#D4AF37', strokeWidth: 1, scaleX: -2, scaleY: -2 }),
        // Central frame
        rect(CX, CY, 440, 600, 'transparent', { stroke: '#D4AF37', strokeWidth: 2 }),
        rect(CX, CY, 420, 580, 'transparent', { stroke: '#D4AF37', strokeWidth: 0.5 }),
        // Sunburst top
        line(CX - 100, 100, CX, 60, '#D4AF37', 1),
        line(CX - 60, 90, CX, 60, '#D4AF37', 1),
        line(CX, 100, CX, 60, '#D4AF37', 1),
        line(CX + 60, 90, CX, 60, '#D4AF37', 1),
        line(CX + 100, 100, CX, 60, '#D4AF37', 1),
        circle(CX, 60, 15, 'transparent', { stroke: '#D4AF37', strokeWidth: 1 }),
        // Content
        text('THE MARRIAGE OF', CX, 160, { size: 14, font: 'Montserrat', fill: '#D4AF37', weight: '600', id: 'label' }),
        text('VICTORIA', CX, 250, { size: 44, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'bride_name' }),
        text('AND', CX, 300, { size: 16, font: 'Montserrat', fill: '#D4AF37', id: 'and_text' }),
        text('ALEXANDER', CX, 350, { size: 44, font: 'Playfair Display', fill: '#FFFFFF', weight: '600', id: 'groom_name' }),
        path(SVG.diamond, CX, 420, { fill: '#D4AF37', scaleX: 1, scaleY: 1 }),
        text('DECEMBER 31ST, 2025', CX, 490, { size: 20, font: 'Montserrat', fill: '#D4AF37', weight: '600', id: 'event_date' }),
        text('EIGHT O\'CLOCK IN THE EVENING', CX, 530, { size: 12, font: 'Montserrat', fill: '#FFFFFF', id: 'event_time' }),
        text('THE PLAZA HOTEL', CX, 590, { size: 18, font: 'Montserrat', fill: '#D4AF37', weight: '500', id: 'venue_name' }),
        text('Fifth Avenue, New York', CX, 625, { size: 12, font: 'Montserrat', fill: '#FFFFFF', id: 'venue_address' }),
        text('BLACK TIE', CX, 700, { size: 12, font: 'Montserrat', fill: '#D4AF37', weight: '600', id: 'dress_code' }),
      ],
      background: '#0D0D0D',
    },
  },

  // Romantic Blush Pink
  {
    name: 'Romantic Blush',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#E8B4B8', secondary: '#FDF6F6', accent: '#5C4033' },
    isPremium: false,
    sortOrder: 25,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FDF6F6'),
        // Soft watercolor background
        path(SVG.watercolorBlob1, CX, 150, { fill: '#E8B4B8', scaleX: 8, scaleY: 6, opacity: 0.1 }),
        path(SVG.watercolorBlob2, CX, H - 150, { fill: '#E8B4B8', scaleX: 8, scaleY: 6, opacity: 0.1 }),
        // Peony flowers
        path(SVG.peony, 100, 120, { fill: '#E8B4B8', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.peony, W - 100, 140, { fill: '#DBA5A9', scaleX: 2, scaleY: 2, angle: 15 }),
        path(SVG.peony, 80, H - 140, { fill: '#E8B4B8', scaleX: 2, scaleY: 2, angle: -10 }),
        path(SVG.peony, W - 90, H - 120, { fill: '#DBA5A9', scaleX: 2.5, scaleY: 2.5 }),
        // Eucalyptus accents
        path(SVG.eucalyptus, 150, 180, { stroke: '#9CAF88', strokeWidth: 1, scaleX: 1.2, scaleY: 1.2 }),
        path(SVG.eucalyptus, W - 150, 160, { stroke: '#9CAF88', strokeWidth: 1, scaleX: -1.2, scaleY: 1.2 }),
        // Content
        text('You are cordially invited to', CX, 220, { size: 14, font: 'Lora', fill: '#5C4033', id: 'invited' }),
        text('THE WEDDING OF', CX, 260, { size: 12, font: 'Montserrat', fill: '#E8B4B8', weight: '600', id: 'label' }),
        text('Grace & Thomas', CX, 350, { size: 50, font: 'Great Vibes', fill: '#5C4033', id: 'couple_names' }),
        path(SVG.heart, CX, 420, { fill: '#E8B4B8', scaleX: 1.2, scaleY: 1.2 }),
        text('September 8, 2025', CX, 490, { size: 26, font: 'Cormorant Garamond', fill: '#5C4033', weight: '600', id: 'event_date' }),
        text('Half past three in the afternoon', CX, 530, { size: 14, font: 'Lora', fill: '#8B7355', id: 'event_time' }),
        text('Château de Fleurs', CX, 590, { size: 20, font: 'Playfair Display', fill: '#5C4033', weight: '600', id: 'venue_name' }),
        text('Provence, France', CX, 625, { size: 14, font: 'Lora', fill: '#8B7355', id: 'venue_address' }),
        text('Reception to follow', CX, 700, { size: 13, font: 'Lora', fill: '#5C4033', id: 'reception' }),
      ],
      background: '#FDF6F6',
    },
  },

  // Lavender Field Wedding
  {
    name: 'Lavender Romance',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#7B68A6', secondary: '#F8F5FF', accent: '#E6E0F3' },
    isPremium: true,
    sortOrder: 26,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F8F5FF'),
        // Lavender sprigs
        path(SVG.lavender, 80, 100, { stroke: '#7B68A6', fill: '#9B8BBF', strokeWidth: 1, scaleX: 2, scaleY: 2 }),
        path(SVG.lavender, W - 80, 120, { stroke: '#7B68A6', fill: '#9B8BBF', strokeWidth: 1, scaleX: 2, scaleY: 2, angle: 10 }),
        path(SVG.lavender, 100, H - 130, { stroke: '#7B68A6', fill: '#9B8BBF', strokeWidth: 1, scaleX: 1.8, scaleY: 1.8, angle: -15 }),
        path(SVG.lavender, W - 100, H - 110, { stroke: '#7B68A6', fill: '#9B8BBF', strokeWidth: 1, scaleX: 1.8, scaleY: 1.8, angle: 20 }),
        // Additional lavender
        path(SVG.lavender, 60, 220, { stroke: '#8B7BA6', fill: '#A69BBF', strokeWidth: 0.8, scaleX: 1.5, scaleY: 1.5, angle: -25 }),
        path(SVG.lavender, W - 60, 240, { stroke: '#8B7BA6', fill: '#A69BBF', strokeWidth: 0.8, scaleX: 1.5, scaleY: 1.5, angle: 30 }),
        // Decorative border
        rect(CX, CY, W - 80, H - 80, 'transparent', { stroke: '#7B68A6', strokeWidth: 1, rx: 10 }),
        // Content
        text('Together with their families', CX, 200, { size: 13, font: 'Cormorant Garamond', fill: '#6B5B8C', id: 'families' }),
        text('Violet & Henry', CX, 300, { size: 52, font: 'Great Vibes', fill: '#7B68A6', id: 'couple_names' }),
        text('invite you to share in their joy', CX, 380, { size: 14, font: 'Cormorant Garamond', fill: '#6B5B8C', id: 'invitation' }),
        path(SVG.scrollDivider, CX, 430, { stroke: '#7B68A6', strokeWidth: 1, scaleX: 5, scaleY: 1 }),
        text('Saturday, July 19th, 2025', CX, 490, { size: 24, font: 'Cormorant Garamond', fill: '#7B68A6', weight: '600', id: 'event_date' }),
        text('at five o\'clock in the evening', CX, 530, { size: 14, font: 'Cormorant Garamond', fill: '#8B7BA6', id: 'event_time' }),
        text('Lavender Hill Vineyard', CX, 590, { size: 20, font: 'Playfair Display', fill: '#7B68A6', weight: '600', id: 'venue_name' }),
        text('Tuscany, Italy', CX, 625, { size: 14, font: 'Cormorant Garamond', fill: '#8B7BA6', id: 'venue_address' }),
      ],
      background: '#F8F5FF',
    },
  },

  // Wedding Rings Elegant
  {
    name: 'Forever Rings',
    category: EInviteCategory.WEDDING,
    defaultColors: { primary: '#B8860B', secondary: '#FFFEF7', accent: '#333333' },
    isPremium: false,
    sortOrder: 27,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFFEF7'),
        // Subtle texture
        rect(CX, CY, W - 60, H - 60, 'transparent', { stroke: '#B8860B', strokeWidth: 1 }),
        // Wedding rings centerpiece
        path(SVG.weddingRings, CX, 120, { stroke: '#B8860B', fill: 'transparent', strokeWidth: 2, scaleX: 3, scaleY: 3 }),
        // Sparkles around rings
        path(SVG.sparkle, CX - 80, 80, { fill: '#B8860B', scaleX: 0.8, scaleY: 0.8, opacity: 0.6 }),
        path(SVG.sparkle, CX + 80, 100, { fill: '#B8860B', scaleX: 0.6, scaleY: 0.6, opacity: 0.5 }),
        path(SVG.sparkle, CX, 180, { fill: '#B8860B', scaleX: 0.5, scaleY: 0.5, opacity: 0.4 }),
        // Content
        text('We\'re Getting Married!', CX, 220, { size: 16, font: 'Great Vibes', fill: '#B8860B', id: 'announcement' }),
        text('Isabella & Matthew', CX, 310, { size: 48, font: 'Great Vibes', fill: '#333333', id: 'couple_names' }),
        text('request the pleasure of your company', CX, 390, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'invitation' }),
        text('at the celebration of their marriage', CX, 420, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'celebration' }),
        line(150, 470, W - 150, 470, '#B8860B', 1),
        text('October 25, 2025', CX, 520, { size: 26, font: 'Cormorant Garamond', fill: '#333333', weight: '600', id: 'event_date' }),
        text('at three o\'clock in the afternoon', CX, 560, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'event_time' }),
        text('The Grand Chapel', CX, 620, { size: 20, font: 'Playfair Display', fill: '#333333', weight: '600', id: 'venue_name' }),
        text('London, United Kingdom', CX, 655, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'venue_address' }),
        path(SVG.heart, CX, 730, { fill: '#B8860B', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#FFFEF7',
    },
  },

  // Classic Floral Birthday
  {
    name: 'Floral Birthday Bash',
    category: EInviteCategory.BIRTHDAY,
    defaultColors: { primary: '#FF6B8A', secondary: '#FFF5F7', accent: '#4A4A4A' },
    isPremium: false,
    sortOrder: 11,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FFF5F7'),
        // Floral corners
        path(SVG.peony, 80, 100, { fill: '#FF6B8A', scaleX: 2.5, scaleY: 2.5 }),
        path(SVG.peony, W - 80, 120, { fill: '#FF8FAB', scaleX: 2, scaleY: 2 }),
        path(SVG.peony, 100, H - 130, { fill: '#FF8FAB', scaleX: 2, scaleY: 2 }),
        path(SVG.peony, W - 100, H - 100, { fill: '#FF6B8A', scaleX: 2.5, scaleY: 2.5 }),
        // Eucalyptus
        path(SVG.eucalyptus, 140, 150, { stroke: '#7FB069', strokeWidth: 1, scaleX: 1.2, scaleY: 1.2, angle: 15 }),
        path(SVG.eucalyptus, W - 140, 140, { stroke: '#7FB069', strokeWidth: 1, scaleX: -1.2, scaleY: 1.2, angle: -15 }),
        // Content
        text("YOU'RE INVITED TO", CX, 200, { size: 14, font: 'Montserrat', fill: '#FF6B8A', weight: '600', id: 'label' }),
        text('Sophie\'s', CX, 280, { size: 52, font: 'Great Vibes', fill: '#4A4A4A', id: 'person_name' }),
        text('Birthday Celebration', CX, 350, { size: 24, font: 'Playfair Display', fill: '#FF6B8A', id: 'title' }),
        path(SVG.cake, CX, 420, { fill: '#FF6B8A', scaleX: 2.5, scaleY: 2.5 }),
        text('Saturday, March 15th, 2025', CX, 500, { size: 22, font: 'Cormorant Garamond', fill: '#4A4A4A', weight: '600', id: 'event_date' }),
        text('2:00 PM - 6:00 PM', CX, 540, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'event_time' }),
        text('Rose Garden Café', CX, 600, { size: 18, font: 'Playfair Display', fill: '#4A4A4A', weight: '600', id: 'venue_name' }),
        text('123 Blossom Street, Sydney', CX, 635, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'venue_address' }),
        text('RSVP by March 10th', CX, 710, { size: 12, font: 'Montserrat', fill: '#FF6B8A', id: 'rsvp' }),
      ],
      background: '#FFF5F7',
    },
  },

  // Elegant Engagement
  {
    name: 'Engaged in Love',
    category: EInviteCategory.ENGAGEMENT,
    defaultColors: { primary: '#C9A227', secondary: '#FAF7F2', accent: '#5C4033' },
    isPremium: true,
    sortOrder: 5,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#FAF7F2'),
        // Wedding rings centerpiece
        path(SVG.weddingRings, CX, 130, { stroke: '#C9A227', fill: 'transparent', strokeWidth: 2, scaleX: 4, scaleY: 4 }),
        // Sparkles
        path(SVG.sparkle, CX - 100, 80, { fill: '#C9A227', scaleX: 1, scaleY: 1, opacity: 0.7 }),
        path(SVG.sparkle, CX + 100, 100, { fill: '#C9A227', scaleX: 0.8, scaleY: 0.8, opacity: 0.6 }),
        // Floral accents
        path(SVG.roseDetailed, 80, 250, { fill: '#D4A5A5', scaleX: 2, scaleY: 2 }),
        path(SVG.roseDetailed, W - 80, 270, { fill: '#C9A0A0', scaleX: 2, scaleY: 2 }),
        path(SVG.eucalyptus, 50, 350, { stroke: '#7B9B6B', strokeWidth: 1, scaleX: 1.5, scaleY: 1.5, angle: -20 }),
        path(SVG.eucalyptus, W - 50, 370, { stroke: '#7B9B6B', strokeWidth: 1, scaleX: -1.5, scaleY: 1.5, angle: 20 }),
        // Content
        text('SHE SAID YES!', CX, 210, { size: 14, font: 'Montserrat', fill: '#C9A227', weight: '600', id: 'announcement' }),
        text('Emma & Lucas', CX, 310, { size: 52, font: 'Great Vibes', fill: '#5C4033', id: 'couple_names' }),
        text('are engaged!', CX, 380, { size: 20, font: 'Cormorant Garamond', fill: '#8B7355', id: 'engaged' }),
        path(SVG.elegantDivider, CX, 430, { stroke: '#C9A227', strokeWidth: 1, scaleX: 5, scaleY: 1 }),
        text('Join us for the Engagement Celebration', CX, 480, { size: 14, font: 'Cormorant Garamond', fill: '#5C4033', id: 'invitation' }),
        text('Saturday, April 5th, 2025', CX, 540, { size: 24, font: 'Cormorant Garamond', fill: '#5C4033', weight: '600', id: 'event_date' }),
        text('6:00 PM Onwards', CX, 580, { size: 14, font: 'Cormorant Garamond', fill: '#8B7355', id: 'event_time' }),
        text('The Grand Ballroom', CX, 640, { size: 18, font: 'Playfair Display', fill: '#5C4033', weight: '600', id: 'venue_name' }),
        text('Mumbai, India', CX, 675, { size: 14, font: 'Cormorant Garamond', fill: '#8B7355', id: 'venue_address' }),
        path(SVG.heart, CX, 745, { fill: '#C9A227', scaleX: 1.5, scaleY: 1.5 }),
      ],
      background: '#FAF7F2',
    },
  },

  // Modern Baby Shower
  {
    name: 'Sweet Arrival',
    category: EInviteCategory.BABY_SHOWER,
    defaultColors: { primary: '#7BAFD4', secondary: '#F5FAFD', accent: '#4A4A4A' },
    isPremium: false,
    sortOrder: 5,
    canvasJson: {
      version: '5.3.0',
      objects: [
        rect(CX, CY, W, H, '#F5FAFD'),
        // Watercolor background
        path(SVG.watercolorBlob1, CX - 100, 200, { fill: '#7BAFD4', scaleX: 5, scaleY: 4, opacity: 0.1 }),
        path(SVG.watercolorBlob2, CX + 100, H - 200, { fill: '#A5C9E4', scaleX: 5, scaleY: 4, opacity: 0.1 }),
        // Eucalyptus
        path(SVG.eucalyptus, 80, 100, { stroke: '#8BB8A8', strokeWidth: 1.5, scaleX: 2, scaleY: 2 }),
        path(SVG.eucalyptus, W - 80, 120, { stroke: '#8BB8A8', strokeWidth: 1.5, scaleX: -2, scaleY: 2 }),
        path(SVG.eucalyptus, 60, H - 150, { stroke: '#8BB8A8', strokeWidth: 1.5, scaleX: 1.8, scaleY: -1.8 }),
        path(SVG.eucalyptus, W - 60, H - 130, { stroke: '#8BB8A8', strokeWidth: 1.5, scaleX: -1.8, scaleY: -1.8 }),
        // Content
        text('OH BABY!', CX, 190, { size: 16, font: 'Montserrat', fill: '#7BAFD4', weight: '600', id: 'label' }),
        text('Baby Shower', CX, 260, { size: 44, font: 'Great Vibes', fill: '#4A4A4A', id: 'title' }),
        text('Honoring Mom-to-be', CX, 320, { size: 14, font: 'Cormorant Garamond', fill: '#7BAFD4', id: 'honoring' }),
        text('Sarah Mitchell', CX, 380, { size: 36, font: 'Playfair Display', fill: '#4A4A4A', weight: '600', id: 'mom_name' }),
        path(SVG.baby, CX, 460, { fill: '#7BAFD4', scaleX: 2.5, scaleY: 2.5 }),
        text('Saturday, June 20th, 2025', CX, 540, { size: 22, font: 'Cormorant Garamond', fill: '#4A4A4A', weight: '600', id: 'event_date' }),
        text('2:00 PM - 5:00 PM', CX, 580, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'event_time' }),
        text('The Garden Terrace', CX, 640, { size: 18, font: 'Playfair Display', fill: '#4A4A4A', weight: '600', id: 'venue_name' }),
        text('456 Bloom Lane, Portland', CX, 675, { size: 14, font: 'Cormorant Garamond', fill: '#666666', id: 'venue_address' }),
        text('Please RSVP by June 15th', CX, 740, { size: 12, font: 'Montserrat', fill: '#7BAFD4', id: 'rsvp' }),
      ],
      background: '#F5FAFD',
    },
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

export async function seedEInviteTemplates(prisma: PrismaClient) {
  console.log('Seeding e-invite templates...');

  // Delete existing templates that are not in use
  await prisma.eInviteTemplate.deleteMany({
    where: {
      einvites: { none: {} },
    },
  });

  for (const template of templates) {
    const existing = await prisma.eInviteTemplate.findFirst({
      where: { name: template.name },
    });

    const data = {
      category: template.category,
      canvasJson: template.canvasJson,
      defaultColors: template.defaultColors,
      isPremium: template.isPremium,
      sortOrder: template.sortOrder,
      isActive: true,
    };

    if (existing) {
      await prisma.eInviteTemplate.update({
        where: { id: existing.id },
        data,
      });
      console.log(`  Updated: ${template.name}`);
    } else {
      await prisma.eInviteTemplate.create({
        data: {
          name: template.name,
          ...data,
        },
      });
      console.log(`  Created: ${template.name}`);
    }
  }

  console.log(`\nE-invite templates seeded! Total: ${templates.length} templates`);
  console.log(`  - WEDDING: ${templates.filter(t => t.category === EInviteCategory.WEDDING).length}`);
  console.log(`  - BIRTHDAY: ${templates.filter(t => t.category === EInviteCategory.BIRTHDAY).length}`);
  console.log(`  - ENGAGEMENT: ${templates.filter(t => t.category === EInviteCategory.ENGAGEMENT).length}`);
  console.log(`  - BABY_SHOWER: ${templates.filter(t => t.category === EInviteCategory.BABY_SHOWER).length}`);
  console.log(`  - ANNIVERSARY: ${templates.filter(t => t.category === EInviteCategory.ANNIVERSARY).length}`);
  console.log(`  - CORPORATE: ${templates.filter(t => t.category === EInviteCategory.CORPORATE).length}`);
  console.log(`  - HOUSEWARMING: ${templates.filter(t => t.category === EInviteCategory.HOUSEWARMING).length}`);
  console.log(`  - GRADUATION: ${templates.filter(t => t.category === EInviteCategory.GRADUATION).length}`);
  console.log(`  - OTHER: ${templates.filter(t => t.category === EInviteCategory.OTHER).length}`);
}

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
