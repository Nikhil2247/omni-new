import 'dotenv/config';
import { PrismaClient, EInviteCategory } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ALL_TEMPLATES } from './einvite';

// ============================================================================
// E-INVITE TEMPLATES SEED
// ============================================================================
// A library of illustrated invitations. Every template has its own concept (temple towers, palaces, elephants,
// peacocks, swans, lotus mandalas, characters, animals...), palette, layout and typography.
//
// Every template is a Fabric.js 5 canvas (600 x 800). Text boxes keep the ids the editor and the guest flow rely on
// (couple_names, person_name, event_title, event_date, event_time, venue_name, venue_address, invitation_text, label).
// Fonts used on the canvas are loaded by frontend/src/lib/einvite-fonts.ts.
//
// The artwork lives in ./einvite (kit = drawing toolkit, motifs = ornaments, creatures / people = illustrations,
// wedding / family / events = the templates). To see the designs without a database run `npm run einvite:preview`.
//
// Running the seed REPLACES the whole template library: all existing templates are removed (invitations that used
// one keep their own design and just lose the link to the template) and the new set is created.
// ============================================================================

function buildTemplate(def: (typeof ALL_TEMPLATES)[number], index: number) {
  const p = def.palette;
  // Round coordinates to 2 decimals: invisible on the canvas, but it cuts the stored JSON size a lot.
  const objects = JSON.parse(
    JSON.stringify(def.build(), (_k, v) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 100) / 100 : v)),
  );
  // The first object of every template is its full-page background.
  const bg = (objects[0] as { fill?: unknown })?.fill;
  return {
    name: def.name,
    category: def.category,
    canvasJson: { version: '5.3.0', objects, background: typeof bg === 'string' ? bg : p.paper },
    defaultColors: { primary: p.main, secondary: p.paper, accent: p.gold },
    isPremium: def.isPremium,
    sortOrder: index + 1,
  };
}

export async function seedEInviteTemplates(prisma: PrismaClient) {
  console.log('Seeding e-invite templates...');

  // Remove every existing template. Invitations already made keep their own canvas;
  // they only lose the link to the template they started from.
  await prisma.eInvite.updateMany({ where: { templateId: { not: null } }, data: { templateId: null } });
  const removed = await prisma.eInviteTemplate.deleteMany({});
  console.log(`  Removed ${removed.count} old template(s)`);

  const templates = ALL_TEMPLATES.map(buildTemplate);
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
export const einviteTemplateDefinitions = () => ALL_TEMPLATES.map(buildTemplate);

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
