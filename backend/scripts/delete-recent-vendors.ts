import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

async function deleteOrphanedVendorUsers() {
  console.log('Starting orphaned vendor user cleanup...');

  // Find users with @omnicassion.com email who don't have vendor profiles
  // These are migrated vendor accounts that no longer have profiles
  const orphanedUsers = await prisma.user.findMany({
    where: {
      email: { endsWith: '@omnicassion.com' },
      vendorProfile: null,
    },
    select: { id: true, email: true, firstName: true, lastName: true }
  });

  console.log(`Found ${orphanedUsers.length} orphaned users with @omnicassion.com email without vendor profiles`);

  if (orphanedUsers.length > 0) {
    console.log('Users to delete:');
    orphanedUsers.forEach(u => console.log(`  - ${u.email} (${u.firstName} ${u.lastName})`));

    const userIds = orphanedUsers.map(u => u.id);

    // Delete related user data first
    const sessions = await prisma.userSession.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`  Deleted ${sessions.count} sessions`);

    const roleAssignments = await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: userIds } } });
    console.log(`  Deleted ${roleAssignments.count} role assignments`);

    // Delete messages first (before conversation participants)
    try {
      const messages = await prisma.message.deleteMany({ where: { senderId: { in: userIds } } });
      console.log(`  Deleted ${messages.count} messages`);
    } catch (e) { /* table may not exist */ }

    // Delete conversation participants
    try {
      const conversationParticipants = await prisma.conversationParticipant.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${conversationParticipants.count} conversation participants`);
    } catch (e) { /* table may not exist */ }

    // Delete wishlists (need to delete wishlist items first)
    try {
      // Get wishlist IDs
      const wishlists = await prisma.wishlist.findMany({ where: { userId: { in: userIds } }, select: { id: true } });
      const wishlistIds = wishlists.map(w => w.id);
      if (wishlistIds.length > 0) {
        const wishlistItems = await prisma.wishlistItem.deleteMany({ where: { wishlistId: { in: wishlistIds } } });
        console.log(`  Deleted ${wishlistItems.count} wishlist items`);
      }
      const deletedWishlists = await prisma.wishlist.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${deletedWishlists.count} wishlists`);
    } catch (e) { /* table may not exist */ }

    // Delete events
    try {
      const events = await prisma.event.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${events.count} events`);
    } catch (e) { /* table may not exist */ }

    // Delete user consents
    try {
      const consents = await prisma.userConsent.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${consents.count} user consents`);
    } catch (e) { /* table may not exist */ }

    // Delete API keys
    try {
      const apiKeys = await prisma.apiKey.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${apiKeys.count} API keys`);
    } catch (e) { /* table may not exist */ }

    // Delete blog posts
    try {
      const blogPosts = await prisma.blogPost.deleteMany({ where: { authorId: { in: userIds } } });
      console.log(`  Deleted ${blogPosts.count} blog posts`);
    } catch (e) { /* table may not exist */ }

    // Delete vendor reviews (as reviewer)
    try {
      const reviews = await prisma.vendorReview.deleteMany({ where: { reviewerId: { in: userIds } } });
      console.log(`  Deleted ${reviews.count} vendor reviews`);
    } catch (e) { /* table may not exist */ }

    // Delete followers
    try {
      const followers = await prisma.vendorFollow.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${followers.count} vendor followers`);
    } catch (e) { /* table may not exist */ }

    // Delete user engagements
    try {
      const engagements = await prisma.userEngagement.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${engagements.count} user engagements`);
    } catch (e) { /* table may not exist */ }

    // Delete notifications
    try {
      const notifications = await prisma.notification.deleteMany({ where: { userId: { in: userIds } } });
      console.log(`  Deleted ${notifications.count} notifications`);
    } catch (e) { /* table may not exist */ }

    // Delete users
    const deletedUsers = await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    console.log(`  Deleted ${deletedUsers.count} users`);
  }

  // Count remaining users with @omnicassion.com email
  const remainingOmnicassionUsers = await prisma.user.count({
    where: { email: { endsWith: '@omnicassion.com' } }
  });
  console.log(`Remaining users with @omnicassion.com email: ${remainingOmnicassionUsers}`);
  console.log('Orphaned user cleanup complete!');
}

async function deleteRecentVendors() {
  console.log('Starting cleanup...');

  const total = await prisma.vendorProfile.count();
  console.log(`Total vendors in database: ${total}`);

  // Find ACTIVE vendors excluding omnicassion, ramola catering, and og retreat
  const vendors = await prisma.vendorProfile.findMany({
    where: {
      status: 'ACTIVE',
      NOT: {
        OR: [
          { businessName: { contains: 'omnicassion', mode: 'insensitive' } },
          { businessName: { contains: 'ramola', mode: 'insensitive' } },
          { businessName: { contains: 'og retreat', mode: 'insensitive' } },
        ]
      }
    },
    select: { id: true, businessName: true }
  });

  console.log(`Found ${vendors.length} ACTIVE vendors to delete (excluding protected ones)`);

  if (vendors.length > 0) {
    console.log('Vendors to delete:');
    vendors.forEach(v => console.log(`  - ${v.businessName}`));

    const ids = vendors.map(v => v.id);
    console.log(`Deleting ${ids.length} vendor profiles...`);

    // Delete all related data first

    // Subscriptions
    const subscriptions = await prisma.subscription.deleteMany({ where: { vendorProfileId: { in: ids } } });
    console.log(`  Deleted ${subscriptions.count} subscriptions`);

    // Vendor reviews
    const reviews = await prisma.vendorReview.deleteMany({ where: { vendorProfileId: { in: ids } } });
    console.log(`  Deleted ${reviews.count} reviews`);

    // Services
    const services = await prisma.service.deleteMany({ where: { vendorProfileId: { in: ids } } });
    console.log(`  Deleted ${services.count} services`);

    // Vendor tags
    const tags = await prisma.vendorTag.deleteMany({ where: { vendorProfileId: { in: ids } } });
    console.log(`  Deleted ${tags.count} vendor tags`);


    // Vendor contracts
    try {
      const contracts = await prisma.vendorContract.deleteMany({ where: { vendorProfileId: { in: ids } } });
      console.log(`  Deleted ${contracts.count} vendor contracts`);
    } catch (e) { /* table may not exist */ }

    // Vendor claims
    try {
      const claims = await prisma.vendorClaim.deleteMany({ where: { vendorProfileId: { in: ids } } });
      console.log(`  Deleted ${claims.count} vendor claims`);
    } catch (e) { /* table may not exist */ }


    // Wishlist items referencing these vendors
    try {
      const wishlistItems = await prisma.wishlistItem.deleteMany({ where: { vendorProfileId: { in: ids } } });
      console.log(`  Deleted ${wishlistItems.count} wishlist items`);
    } catch (e) { /* table may not exist */ }

    // Get and delete portfolios/media
    const portfolios = await prisma.portfolio.findMany({
      where: { vendorProfileId: { in: ids } },
      select: { id: true }
    });

    if (portfolios.length > 0) {
      const portfolioIds = portfolios.map(p => p.id);
      const media = await prisma.mediaItem.deleteMany({ where: { portfolioId: { in: portfolioIds } } });
      console.log(`  Deleted ${media.count} media items`);

      const deletedPortfolios = await prisma.portfolio.deleteMany({ where: { vendorProfileId: { in: ids } } });
      console.log(`  Deleted ${deletedPortfolios.count} portfolios`);
    }

    // Delete vendor profiles
    const result = await prisma.vendorProfile.deleteMany({ where: { id: { in: ids } } });
    console.log(`  Deleted ${result.count} vendor profiles`);
  }

  // Show remaining count
  const remaining = await prisma.vendorProfile.count();
  console.log(`Remaining vendors in database: ${remaining}`);

  console.log('Cleanup complete!');
}

deleteOrphanedVendorUsers()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
