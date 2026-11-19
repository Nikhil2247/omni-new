import { pal, type Palette } from './kit';

/** The five original sketchbook palettes (unchanged). */
export const SKETCH: Record<'cobalt' | 'marigold' | 'blush' | 'sage' | 'midnight', Palette> = {
  cobalt: pal({
    paper: '#f7f6f1', main: '#2748c4', wash: '#a9bbf0', sky: '#d6e0fb', ink: '#1c2757', soft: '#4b5684',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  }),
  marigold: pal({
    paper: '#fbf3e1', main: '#c2540a', wash: '#f6d58a', sky: '#fde7b8', ink: '#4a2a12', soft: '#7a5434',
    gold: '#f2a516', rose: '#e0707a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  }),
  blush: pal({
    paper: '#fbf1ee', main: '#c4566b', wash: '#f4c3c8', sky: '#f9dcdc', ink: '#4a2433', soft: '#7a4a5a',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  }),
  sage: pal({
    paper: '#f4f6ee', main: '#2f6048', wash: '#b6d1a0', sky: '#dcebd0', ink: '#1f3a2c', soft: '#4a6a56',
    gold: '#f2a516', rose: '#e48a8a', leaf: '#6b9a62', leafDeep: '#2f6048', leafLight: '#b6d1a0',
  }),
  midnight: pal({
    paper: '#141c4d', main: '#f2a516', wash: '#33489a', sky: '#223070', ink: '#f3f5ff', soft: '#c1c9ee',
    gold: '#f5b53a', rose: '#d98d95', leaf: '#78a86f', leafDeep: '#a8d3a0', leafLight: '#3f6b50',
  }),
};
