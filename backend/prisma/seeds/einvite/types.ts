import type { EInviteCategory } from '@prisma/client';
import type { Obj, Palette } from './kit';

export interface TemplateDef {
  name: string;
  category: EInviteCategory;
  /** Only `main`, `paper` and `gold` are stored, as the template's default colours. */
  palette: Palette;
  build: () => Obj[];
  isPremium: boolean;
}
