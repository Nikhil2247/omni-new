/**
 * Lists users who can be the author of generated blog posts, with the ID the blog generators ask for.
 * Read-only: nothing is changed.
 *
 *   npm run blogs:authors
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required');
  if (connectionString.startsWith('prisma://')) return new PrismaClient({ log: ['error'] });
  return new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })), log: ['error'] });
}

const AUTHOR_ROLES = ['ADMIN_SYSTEM', 'ADMIN', 'MARKETING_SERVICES_ADMIN', 'CONTENT_WRITER'];

async function main() {
  const prisma = createPrismaClient();
  try {
    const users = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        userRoles: { some: { role: { name: { in: AUTHOR_ROLES } } } },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userRoles: { select: { role: { select: { name: true } } } },
      },
      orderBy: { email: 'asc' },
    });

    if (!users.length) {
      console.log('No active users with a blog-capable role were found.');
      return;
    }

    console.log('\nPossible blog authors (use the id, or the email, with --author):\n');
    for (const user of users) {
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || '(no name)';
      const roles = user.userRoles.map((r) => r.role.name).join(', ');
      console.log(`  ${user.id}  ${user.email}  ${name}  [${roles}]`);
    }
    console.log('');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
