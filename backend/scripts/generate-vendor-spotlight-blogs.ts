/**
 * Omnicassion Vendor Spotlight Blog Generator
 *
 * Writes one blog post per vendor, built ONLY from that vendor's real data (category, city, description, services,
 * prices, portfolio photos, reviews). Nothing is invented: if a vendor has too little real content for a useful
 * article, it is skipped (thin pages hurt SEO more than they help).
 *
 * Safe by default:
 *   - preview mode unless you pass --save (nothing is written)
 *   - posts are saved as DRAFT unless you pass --publish
 *   - re-running skips vendors that already have a spotlight (use --update to rewrite them)
 *   - refuses to write to a non-local database unless you also pass --yes
 *
 * Usage:
 *   npx ts-node scripts/generate-vendor-spotlight-blogs.ts preview [filters]
 *   npx ts-node scripts/generate-vendor-spotlight-blogs.ts generate --author <userId|email> [filters] [options] --save --yes
 *
 * Filters:   --limit <n>   --vendor <slug>   --category <slug>   --city <name>
 * Options:   --publish            publish now (default: DRAFT)
 *            --drip-per-day <n>   with --publish: schedule n posts per day (future dates stay hidden until then)
 *            --update             rewrite existing spotlight posts instead of skipping them
 *            --min-description <n> minimum description length when a vendor has fewer than 2 services (default 150)
 *
 * The author can also come from the BLOG_AUTHOR_ID environment variable.
 */

import 'dotenv/config';
import { PrismaClient, BlogStatus, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// ============================================================================
// PRISMA CLIENT
// ============================================================================

function databaseUrl(): string {
  const url = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required');
  return url;
}

function createPrismaClient(): PrismaClient {
  const connectionString = databaseUrl();
  if (connectionString.startsWith('prisma://')) {
    return new PrismaClient({ log: ['warn', 'error'] });
  }
  const adapter = new PrismaPg(new Pool({ connectionString }));
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

/** Host and database name only (never the credentials), for the safety check and for logging. */
function describeTarget(): { host: string; database: string; local: boolean } {
  try {
    const url = new URL(databaseUrl().replace(/^prisma\+?/, ''));
    const host = url.hostname || 'unknown';
    return {
      host,
      database: url.pathname.replace(/^\//, '') || 'unknown',
      local: ['localhost', '127.0.0.1', '::1', 'postgres', 'host.docker.internal'].includes(host),
    };
  } catch {
    return { host: 'unknown', database: 'unknown', local: false };
  }
}

// ============================================================================
// TEXT HELPERS
// ============================================================================

const SITE_CATEGORY_SLUG = 'vendor-spotlights';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function stripHtml(value?: string | null): string {
  return (value || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:–-]+$/, '')}…`;
}

/** Splits long prose into readable paragraphs of whole sentences. */
function toParagraphs(text: string, maxLength = 420): string[] {
  const blocks = text.split(/\n{2,}/).map((b) => b.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out: string[] = [];
  for (const block of blocks) {
    const sentences = block.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) ?? [block];
    let current = '';
    for (const sentence of sentences) {
      if (current && (current + sentence).length > maxLength) {
        out.push(current.trim());
        current = '';
      }
      current += sentence;
    }
    if (current.trim()) out.push(current.trim());
  }
  return out;
}

function readingTime(html: string): number {
  const words = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

const inr = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

function priceText(service: {
  pricingType: string;
  startingPrice: Prisma.Decimal | null;
  maxPrice: Prisma.Decimal | null;
  currency: string;
}): string {
  if (service.currency && service.currency !== 'INR') return '';
  const min = service.startingPrice ? Number(service.startingPrice) : 0;
  const max = service.maxPrice ? Number(service.maxPrice) : 0;
  if (service.pricingType === 'STARTING_AT' && min > 0) return `starting at ${inr(min)}`;
  if (service.pricingType === 'FIXED' && min > 0) return inr(min);
  if (service.pricingType === 'RANGE' && min > 0 && max > min) return `${inr(min)} to ${inr(max)}`;
  return '';
}

const httpUrl = (value?: string | null): string | null => {
  if (!value) return null;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : null;
  } catch {
    return null;
  }
};

// ============================================================================
// DATA
// ============================================================================

const vendorInclude = {
  category: { select: { id: true, name: true, slug: true } },
  address: { select: { addressLine1: true, cityId: true } },
  services: {
    where: { isActive: true },
    select: {
      name: true,
      description: true,
      pricingType: true,
      startingPrice: true,
      maxPrice: true,
      currency: true,
    },
    take: 8,
  },
  portfolios: {
    orderBy: [{ isFeatured: 'desc' as const }, { sortOrder: 'asc' as const }],
    take: 2,
    select: {
      mediaItems: {
        where: { type: 'IMAGE' as const },
        orderBy: { sortOrder: 'asc' as const },
        take: 6,
        select: { url: true, cdnUrl: true, altText: true },
      },
    },
  },
} satisfies Prisma.VendorProfileInclude;

type VendorRow = Prisma.VendorProfileGetPayload<{ include: typeof vendorInclude }>;

interface Place {
  city: string;
  state: string | null;
}

interface SpotlightPost {
  vendorId: string;
  vendorSlug: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  keywords: string[];
  featuredImage: string | null;
  featuredImageAlt: string | null;
  readingTime: number;
}

// ============================================================================
// CONTENT
// ============================================================================

/** Returns null (with a reason) when the vendor has too little real content for a useful article. */
function buildPost(
  vendor: VendorRow,
  place: Place | null,
  minDescription: number,
  reviews: { rating: number; count: number } | null,
): { post: SpotlightPost } | { skip: string } {
  const name = vendor.businessName.trim();
  const category = vendor.category.name;
  const categoryLower = category.toLowerCase();
  const city = place?.city ?? null;
  const where = city ? ` in ${city}` : '';

  const tagline = stripHtml(vendor.tagline);
  const description = stripHtml(vendor.description);
  const services = vendor.services;

  if (services.length < 2 && description.length < minDescription) {
    return { skip: 'not enough real content (short description and fewer than 2 services)' };
  }

  const images = vendor.portfolios
    .flatMap((p) => p.mediaItems)
    .map((m) => ({ src: httpUrl(m.cdnUrl) || httpUrl(m.url), alt: m.altText?.trim() || '' }))
    .filter((m): m is { src: string; alt: string } => Boolean(m.src))
    .slice(0, 6);
  const heroImage = httpUrl(vendor.profilePhotoUrl) || httpUrl(vendor.bannerImageUrl) || images[0]?.src || null;

  const profilePath = `/vendors/${vendor.slug}`;
  const categoryPath = `/vendors/category/${vendor.category.slug}`;
  const cityPath = place ? `/vendors/${vendor.category.slug}/${slugify(place.city)}` : null;

  const parts: string[] = [];

  // Intro
  const locationSentence = city
    ? `${escapeHtml(name)} is a ${escapeHtml(categoryLower)} based in ${escapeHtml(city)}${place?.state ? `, ${escapeHtml(place.state)}` : ''}.`
    : `${escapeHtml(name)} is a ${escapeHtml(categoryLower)} listed on Omnicassion.`;
  // Many vendors' tagline is just the first sentence of their description; do not say it twice.
  const taglineRepeatsDescription =
    !!tagline && description.toLowerCase().replace(/\s+/g, ' ').startsWith(tagline.toLowerCase().replace(/\s+/g, ' ').slice(0, 60));
  const introTagline = tagline && !taglineRepeatsDescription ? ` ${escapeHtml(truncate(tagline, 260))}` : '';
  parts.push(`<p>${locationSentence}${introTagline}</p>`);

  if (reviews && reviews.count > 0) {
    parts.push(
      `<p>Customers have rated ${escapeHtml(name)} ${reviews.rating.toFixed(1)} out of 5 across ${reviews.count} ${
        reviews.count === 1 ? 'review' : 'reviews'
      } on Omnicassion.</p>`,
    );
  }

  // About
  if (description) {
    parts.push(`<h2>About ${escapeHtml(name)}</h2>`);
    for (const paragraph of toParagraphs(truncate(description, 2200)).slice(0, 5)) {
      parts.push(`<p>${escapeHtml(paragraph)}</p>`);
    }
  }

  // Services
  if (services.length > 0) {
    parts.push(`<h2>Services${services.some((s) => priceText(s)) ? ' and pricing' : ''}</h2>`);
    parts.push('<ul>');
    for (const service of services) {
      const price = priceText(service);
      const detail = stripHtml(service.description);
      parts.push(
        `  <li><strong>${escapeHtml(service.name)}</strong>${price ? ` (${escapeHtml(price)})` : ''}${
          detail ? `: ${escapeHtml(truncate(detail, 160))}` : ''
        }</li>`,
      );
    }
    parts.push('</ul>');
    if (services.some((s) => priceText(s))) {
      parts.push('<p>Prices are the ones listed by the vendor and can change, so confirm them when you request a quote.</p>');
    }
  }

  // Photos
  if (images.length > 0) {
    parts.push(`<h2>Photos from ${escapeHtml(name)}</h2>`);
    for (const image of images) {
      const alt = image.alt || `${name} – ${category}${where}`;
      parts.push(
        `<figure class="blog-image">\n  <img src="${escapeHtml(image.src)}" alt="${escapeHtml(alt)}" loading="lazy" />\n</figure>`,
      );
    }
  }

  // How to book
  parts.push(`<h2>How to book ${escapeHtml(name)}</h2>`);
  parts.push('<ol>');
  parts.push(`  <li>Open <a href="${profilePath}" title="${escapeHtml(name)} on Omnicassion">${escapeHtml(name)}'s profile</a> to see the full portfolio and services.</li>`);
  parts.push('  <li>Choose Get Quote and share your date, guest count and requirements.</li>');
  parts.push('  <li>The vendor replies through Omnicassion, so you can compare responses in one place before you decide.</li>');
  parts.push('</ol>');

  // FAQ (answers use real data only)
  parts.push(`<h2>Frequently asked questions about ${escapeHtml(name)}</h2>`);
  if (city) {
    const address = vendor.address?.addressLine1?.trim();
    parts.push(`<h3>Where is ${escapeHtml(name)} located?</h3>`);
    parts.push(`<p>${escapeHtml(name)} is in ${escapeHtml(city)}${place?.state ? `, ${escapeHtml(place.state)}` : ''}${address ? `. Listed address: ${escapeHtml(address)}` : ''}.</p>`);
  }
  if (services.length > 0) {
    parts.push(`<h3>What does ${escapeHtml(name)} offer?</h3>`);
    parts.push(`<p>Listed services include ${escapeHtml(services.map((s) => s.name).slice(0, 5).join(', '))}.</p>`);
  }
  parts.push(`<h3>How do I get a quote from ${escapeHtml(name)}?</h3>`);
  parts.push(`<p>Open the <a href="${profilePath}">${escapeHtml(name)} profile</a> on Omnicassion and choose Get Quote.</p>`);

  // Related links
  const related: string[] = [];
  if (cityPath) related.push(`<a href="${cityPath}" title="${escapeHtml(category)} in ${escapeHtml(city!)}">More ${escapeHtml(categoryLower)} vendors in ${escapeHtml(city!)}</a>`);
  related.push(`<a href="${categoryPath}" title="${escapeHtml(category)} vendors">Browse all ${escapeHtml(categoryLower)} vendors</a>`);
  parts.push(`<h2>Keep exploring</h2>`);
  parts.push(`<p>${related.join(' | ')}</p>`);

  const content = parts.join('\n');
  const title = truncate(`${name}${city ? `, ${city}` : ''}: ${category} Guide, Photos & How to Book`, 200);
  const slug = truncate(`${vendor.slug}-${vendor.category.slug}${city ? `-in-${slugify(city)}` : ''}`, 250);
  const lead = tagline || description;
  // A clean, complete sentence (never cut mid-sentence): who they are, what the page offers, and the action.
  const metaDescription = truncate(
    `${name}${city ? ` in ${city}` : ''}: ${categoryLower} with photos, services and booking details. Request a free quote on Omnicassion.`,
    160,
  );

  return {
    post: {
      vendorId: vendor.id,
      vendorSlug: vendor.slug,
      title,
      slug,
      excerpt: truncate(`${stripHtml(locationSentence)}${lead ? ' ' + truncate(lead, 180) : ''}`, 300),
      content,
      metaTitle: truncate(`${name}${city ? ` in ${city}` : ''} – ${category} Photos & Booking`, 70),
      metaDescription,
      focusKeyword: truncate(`${name}${city ? ` ${city}` : ''}`, 100),
      keywords: Array.from(
        new Set([name, city ? `${name} ${city}` : '', city ? `${categoryLower} in ${city}` : '', `${categoryLower} vendors`, 'Omnicassion'].filter(Boolean)),
      ).slice(0, 8),
      featuredImage: heroImage,
      featuredImageAlt: heroImage ? truncate(`${name} – ${category}${where}`, 125) : null,
      readingTime: readingTime(content),
    },
  };
}

// ============================================================================
// CLI
// ============================================================================

function flag(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

function option(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
}

function printHelp() {
  console.log(`
Omnicassion Vendor Spotlight Blog Generator
===========================================
One article per vendor, built only from the vendor's real data.

  preview  [filters]                          Show what would be created (no database writes)
  generate --author <userId|email> [filters] [options] --save --yes

Filters:  --limit <n>  --vendor <slug>  --category <slug>  --city <name>
Options:  --publish  --drip-per-day <n>  --update  --min-description <n>
Safety:   without --save nothing is written; without --publish posts are DRAFT;
          a non-local database also needs --yes.
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  if (!command || !['preview', 'generate'].includes(command)) return printHelp();

  const save = command === 'generate' && flag(args, 'save');
  const publish = flag(args, 'publish');
  const update = flag(args, 'update');
  const limit = Number.parseInt(option(args, 'limit') ?? '', 10) || undefined;
  const dripPerDay = Number.parseInt(option(args, 'drip-per-day') ?? '', 10) || 0;
  const minDescription = Number.parseInt(option(args, 'min-description') ?? '', 10) || 150;
  const vendorSlug = option(args, 'vendor');
  const categorySlug = option(args, 'category');
  const cityFilter = option(args, 'city')?.toLowerCase();

  const target = describeTarget();
  console.log(`Database: ${target.host}/${target.database}${target.local ? ' (local)' : ''}`);

  if (save && !target.local && !flag(args, 'yes')) {
    console.error(
      `\nRefusing to write to a non-local database (${target.host}) without --yes.\n` +
        'Run the same command with --yes if you really mean to write to it.',
    );
    process.exit(1);
  }

  const prisma = createPrismaClient();
  try {
    // Author (only needed when saving)
    let authorId: string | null = null;
    if (save) {
      const author = option(args, 'author') || process.env.BLOG_AUTHOR_ID;
      if (!author) {
        console.error('Missing author: pass --author <userId|email> (or set BLOG_AUTHOR_ID). Run `npm run blogs:authors` to list candidates.');
        process.exit(1);
      }
      const user = await prisma.user.findFirst({
        where: author.includes('@') ? { email: author } : { id: author },
        select: { id: true, email: true },
      });
      if (!user) {
        console.error(`No user found for "${author}".`);
        process.exit(1);
      }
      authorId = user.id;
      console.log(`Author: ${user.email}`);
    }

    // Vendors
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        status: { in: ['ACTIVE', 'UNCLAIMED'] },
        ...(vendorSlug && { slug: vendorSlug }),
        ...(categorySlug && { category: { slug: categorySlug } }),
      },
      include: vendorInclude,
      orderBy: [{ viewCount: 'desc' }, { createdAt: 'asc' }],
    });

    // City names (the profile stores only a cityId)
    const cityIds = Array.from(new Set(vendors.map((v) => v.address?.cityId).filter((id): id is string => Boolean(id))));
    const cities = await prisma.city.findMany({
      where: { id: { in: cityIds } },
      select: { id: true, name: true, state: { select: { name: true } } },
    });
    const placeById = new Map<string, Place>(cities.map((c) => [c.id, { city: c.name, state: c.state?.name ?? null }]));

    // Review summary per vendor (approved reviews only)
    const reviewGroups = await prisma.vendorReview.groupBy({
      by: ['vendorProfileId'],
      where: { status: 'APPROVED' },
      _avg: { rating: true },
      _count: { _all: true },
    });
    const reviewByVendor = new Map(
      reviewGroups.map((g) => [g.vendorProfileId, { rating: Number(g._avg.rating ?? 0), count: g._count._all }]),
    );

    // Existing spotlight posts
    const existing = await prisma.blogPost.findMany({
      where: { vendorId: { in: vendors.map((v) => v.id) } },
      select: { id: true, vendorId: true, slug: true, status: true },
    });
    const existingByVendor = new Map(existing.map((p) => [p.vendorId as string, p]));
    const takenSlugs = new Set((await prisma.blogPost.findMany({ select: { slug: true } })).map((p) => p.slug));

    // Build
    const built: Array<{ post: SpotlightPost; existingId?: string }> = [];
    const skipped: Array<{ vendor: string; reason: string }> = [];

    for (const vendor of vendors) {
      const place = vendor.address?.cityId ? (placeById.get(vendor.address.cityId) ?? null) : null;
      if (cityFilter && place?.city.toLowerCase() !== cityFilter) continue;

      const prior = existingByVendor.get(vendor.id);
      if (prior && !update) {
        skipped.push({ vendor: vendor.businessName, reason: 'already has a spotlight post' });
        continue;
      }

      const result = buildPost(vendor, place, minDescription, reviewByVendor.get(vendor.id) ?? null);
      if ('skip' in result) {
        skipped.push({ vendor: vendor.businessName, reason: result.skip });
        continue;
      }

      let { slug } = result.post;
      if (!prior && takenSlugs.has(slug)) slug = truncate(`${slug}-${vendor.id.slice(0, 6)}`, 250);
      if (!prior) takenSlugs.add(slug);
      built.push({ post: { ...result.post, slug: prior ? prior.slug : slug }, existingId: prior?.id });

      if (limit && built.length >= limit) break;
    }

    // Report
    console.log(`\nVendors considered: ${vendors.length}`);
    console.log(`Posts to ${update ? 'create or update' : 'create'}: ${built.length}`);
    console.log(`Skipped: ${skipped.length}`);
    const reasons = new Map<string, number>();
    skipped.forEach((s) => reasons.set(s.reason, (reasons.get(s.reason) ?? 0) + 1));
    reasons.forEach((count, reason) => console.log(`  - ${count} x ${reason}`));

    for (const { post } of built.slice(0, 2)) {
      console.log('\n' + '='.repeat(70));
      console.log(`Title:    ${post.title}`);
      console.log(`Slug:     ${post.slug}`);
      console.log(`Meta:     ${post.metaTitle}  |  ${post.metaDescription}`);
      console.log(`Words:    ~${post.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length}  (${post.readingTime} min)`);
      console.log(`Image:    ${post.featuredImage ?? 'none'}`);
      console.log('Preview:  ' + post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 420) + '...');
    }

    if (!save) {
      console.log('\nPreview only. Nothing was written. Add --save (and --author) to create the posts.');
      return;
    }

    // Save
    let category = await prisma.blogCategory.findUnique({ where: { slug: SITE_CATEGORY_SLUG } });
    if (!category) {
      category = await prisma.blogCategory.create({
        data: {
          name: 'Vendor Spotlights',
          slug: SITE_CATEGORY_SLUG,
          description: 'Featured vendors and their stories',
          isActive: true,
        },
      });
    }

    const now = Date.now();
    let created = 0;
    let updated = 0;
    let failed = 0;

    for (let i = 0; i < built.length; i++) {
      const { post, existingId } = built[i];
      // Publishing: now, or dripped over days (a future publishedAt stays hidden until it arrives).
      const publishedAt = publish ? new Date(now + (dripPerDay > 0 ? Math.floor(i / dripPerDay) * 86_400_000 : 0)) : null;
      const data = {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
        focusKeyword: post.focusKeyword,
        keywords: post.keywords,
        featuredImage: post.featuredImage,
        featuredImageAlt: post.featuredImageAlt,
        readingTime: post.readingTime,
        categoryId: category.id,
        vendorId: post.vendorId,
      };
      try {
        if (existingId) {
          // --update rewrites the content; adding --publish also publishes a draft saved earlier.
          await prisma.blogPost.update({
            where: { id: existingId },
            data: publish ? { ...data, status: BlogStatus.PUBLISHED, publishedAt } : data,
          });
          updated++;
        } else {
          await prisma.blogPost.create({
            data: {
              ...data,
              slug: post.slug,
              authorId: authorId!,
              status: publish ? BlogStatus.PUBLISHED : BlogStatus.DRAFT,
              publishedAt,
            },
          });
          created++;
        }
      } catch (error) {
        failed++;
        console.error(`  Failed for ${post.vendorSlug}: ${(error as Error).message.split('\n').pop()}`);
      }
    }

    console.log(
      `\nDone. Created ${created}, updated ${updated}, failed ${failed}. ` +
        (publish ? (dripPerDay > 0 ? `Published, ${dripPerDay} per day.` : 'Published.') : 'Saved as DRAFT: review them in the admin, then publish.'),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
