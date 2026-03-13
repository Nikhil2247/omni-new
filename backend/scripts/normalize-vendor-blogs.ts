import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import slugify from 'slugify';

type Mode = 'audit' | 'apply';

interface VendorBlog {
  id: string;
  title: string;
  slug: string;
  content: string;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  ogImage: string | null;
  vendorId: string | null;
  vendorProfile: {
    id: string;
    businessName: string;
    profilePhotoUrl: string | null;
    bannerImageUrl: string | null;
    category: { name: string };
  } | null;
}

interface VendorProfileLookup {
  id: string;
  businessName: string;
  profilePhotoUrl: string | null;
  bannerImageUrl: string | null;
  category: { name: string };
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required');
  }

  if (connectionString.startsWith('prisma://')) {
    return new PrismaClient({ log: ['warn', 'error'] });
  }

  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter, log: ['warn', 'error'] });
}

function parseMode(arg?: string): Mode {
  if (arg === 'apply') return 'apply';
  return 'audit';
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleKey(title: string): string {
  return stripHtmlTags(title)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImageUrls(content: string): string[] {
  const urls: string[] = [];

  const htmlImageRegex = /<img\b[^>]*?src=["']([^"']+)["'][^>]*>/gi;
  let htmlMatch: RegExpExecArray | null;
  while ((htmlMatch = htmlImageRegex.exec(content)) !== null) {
    if (htmlMatch[1]) urls.push(htmlMatch[1]);
  }

  const markdownImageRegex = /!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  let mdMatch: RegExpExecArray | null;
  while ((mdMatch = markdownImageRegex.exec(content)) !== null) {
    if (mdMatch[1]) urls.push(mdMatch[1]);
  }

  return urls;
}

function removeAllInlineImages(content: string): string {
  const withoutHtmlImages = content.replace(/<img\b[^>]*>/gi, '');
  const withoutMarkdownImages = withoutHtmlImages.replace(/!\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g, '');
  return withoutMarkdownImages.replace(/\n{3,}/g, '\n\n').trim();
}

function choosePreferredImage(blog: VendorBlog, contentImageUrls: string[]): string | null {
  return (
    blog.featuredImage ||
    blog.ogImage ||
    contentImageUrls[0] ||
    blog.vendorProfile?.profilePhotoUrl ||
    blog.vendorProfile?.bannerImageUrl ||
    null
  );
}

function ensureLength(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 3).trimEnd() + '...';
}

function randomItem<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function buildRandomizedTitle(blog: VendorBlog): string {
  const cleanTitle = stripHtmlTags(blog.title);
  const vendorName = blog.vendorProfile?.businessName || 'Top Vendor';
  const category = blog.vendorProfile?.category.name || 'Event Services';

  const hooks = [
    'Ultimate Guide',
    'Pro Tips',
    'Expert Playbook',
    'Smart Planning Guide',
    'What Actually Works',
    '2026 Edition',
    'Insider Strategy',
    'Field-Tested Ideas',
  ];

  const formats = [
    `${vendorName}: ${cleanTitle} - ${randomItem(hooks)}`,
    `${cleanTitle} by ${vendorName} (${randomItem(hooks)})`,
    `${randomItem(hooks)} for ${category}: ${cleanTitle}`,
    `${vendorName} on ${cleanTitle} | ${randomItem(hooks)}`,
    `${cleanTitle} - ${vendorName} ${randomItem(['Checklist', 'Blueprint', 'Masterclass', 'Approach'])}`,
  ];

  return ensureLength(randomItem(formats), 200);
}

function buildSlug(title: string): string {
  return slugify(title, {
    lower: true,
    strict: true,
    trim: true,
  }).slice(0, 240);
}

function makeUniqueSlug(baseSlug: string, usedSlugs: Set<string>): string {
  let candidate = baseSlug || `vendor-blog-${Math.random().toString(36).slice(2, 8)}`;
  let counter = 2;

  while (usedSlugs.has(candidate)) {
    const suffix = `-${counter}`;
    const maxBaseLength = 250 - suffix.length;
    candidate = `${baseSlug.slice(0, maxBaseLength)}${suffix}`;
    counter += 1;
  }

  usedSlugs.add(candidate);
  return candidate;
}

function buildFeaturedAlt(blog: VendorBlog): string {
  if (blog.featuredImageAlt && blog.featuredImageAlt.trim().length > 0) {
    return ensureLength(blog.featuredImageAlt.trim(), 125);
  }
  const vendorName = blog.vendorProfile?.businessName || 'Vendor';
  return ensureLength(`${vendorName} featured blog image`, 125);
}

async function fetchVendorBlogs(prisma: PrismaClient): Promise<VendorBlog[]> {
  const blogs = await prisma.blogPost.findMany({
    where: {
      vendorId: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      content: true,
      featuredImage: true,
      featuredImageAlt: true,
      ogImage: true,
      vendorId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  const vendorIds = Array.from(new Set(blogs.map(blog => blog.vendorId).filter(Boolean))) as string[];
  const profiles = vendorIds.length
    ? await prisma.vendorProfile.findMany({
        where: {
          id: { in: vendorIds },
        },
        select: {
          id: true,
          businessName: true,
          profilePhotoUrl: true,
          bannerImageUrl: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      })
    : [];

  const profileById = new Map<string, VendorProfileLookup>(profiles.map(profile => [profile.id, profile]));

  return blogs.map(blog => ({
    ...blog,
    vendorProfile: blog.vendorId ? profileById.get(blog.vendorId) ?? null : null,
  }));
}

function runAudit(blogs: VendorBlog[]): void {
  const byTitle = new Map<string, VendorBlog[]>();
  let blogsWithInlineImages = 0;
  let blogsWithNoPreferredImage = 0;

  for (const blog of blogs) {
    const key = titleKey(blog.title);
    if (!byTitle.has(key)) byTitle.set(key, []);
    byTitle.get(key)!.push(blog);

    const inlineImages = extractImageUrls(blog.content);
    if (inlineImages.length > 0) blogsWithInlineImages += 1;
    const preferred = choosePreferredImage(blog, inlineImages);
    if (!preferred) blogsWithNoPreferredImage += 1;
  }

  const duplicateGroups = Array.from(byTitle.values()).filter(group => group.length > 1);
  const totalDuplicates = duplicateGroups.reduce((acc, group) => acc + group.length, 0);

  console.log('=== VENDOR BLOG AUDIT ===');
  console.log(`Total vendor blogs: ${blogs.length}`);
  console.log(`Blogs with duplicate/same normalized title: ${totalDuplicates}`);
  console.log(`Duplicate title groups: ${duplicateGroups.length}`);
  console.log(`Blogs containing inline images: ${blogsWithInlineImages}`);
  console.log(`Blogs missing any candidate featured image: ${blogsWithNoPreferredImage}`);

  if (duplicateGroups.length > 0) {
    console.log('\nTop duplicate title groups:');
    const top = duplicateGroups
      .sort((a, b) => b.length - a.length)
      .slice(0, 10);

    for (const group of top) {
      console.log(`- "${group[0].title}" -> ${group.length} posts`);
    }
  }
}

async function runApply(prisma: PrismaClient, blogs: VendorBlog[]): Promise<void> {
  const usedSlugs = new Set<string>();

  // Preload all current slugs so generated slugs stay globally unique.
  const allSlugs = await prisma.blogPost.findMany({ select: { slug: true } });
  for (const row of allSlugs) usedSlugs.add(row.slug);

  let updatedCount = 0;
  let removedInlineImageCount = 0;

  for (const blog of blogs) {
    usedSlugs.delete(blog.slug);

    const contentImageUrls = extractImageUrls(blog.content);
    const preferredImage = choosePreferredImage(blog, contentImageUrls);

    if (contentImageUrls.length > 0) {
      removedInlineImageCount += contentImageUrls.length;
    }

    const newTitle = buildRandomizedTitle(blog);
    const newSlugBase = buildSlug(newTitle);
    const newSlug = makeUniqueSlug(newSlugBase, usedSlugs);

    const cleanedContent = removeAllInlineImages(blog.content);
    const newFeaturedAlt = buildFeaturedAlt(blog);

    await prisma.blogPost.update({
      where: { id: blog.id },
      data: {
        title: newTitle,
        slug: newSlug,
        content: cleanedContent,
        featuredImage: preferredImage,
        ogImage: preferredImage,
        featuredImageAlt: newFeaturedAlt,
      },
    });

    updatedCount += 1;
  }

  console.log('=== VENDOR BLOG NORMALIZATION COMPLETE ===');
  console.log(`Updated vendor blogs: ${updatedCount}`);
  console.log(`Removed inline images: ${removedInlineImageCount}`);
  console.log('Each vendor blog now has a randomized title/slug and only one featured image source.');
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv[2]);
  const prisma = createPrismaClient();

  try {
    const blogs = await fetchVendorBlogs(prisma);

    if (blogs.length === 0) {
      console.log('No vendor blogs found (blog_posts with vendor_id not null).');
      return;
    }

    runAudit(blogs);

    if (mode === 'apply') {
      console.log('\nApplying title randomization and image cleanup...');
      await runApply(prisma, blogs);
    } else {
      console.log('\nAudit-only mode complete. Run with "apply" to update records.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch(error => {
  console.error('Script failed:', error);
  process.exitCode = 1;
});
