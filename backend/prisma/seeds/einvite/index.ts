import { EVENT_TEMPLATES } from './events';
import { FAMILY_TEMPLATES } from './family';
import type { TemplateDef } from './types';
import { WEDDING_TEMPLATES } from './wedding';

export const ALL_TEMPLATES: TemplateDef[] = [...WEDDING_TEMPLATES, ...FAMILY_TEMPLATES, ...EVENT_TEMPLATES];
