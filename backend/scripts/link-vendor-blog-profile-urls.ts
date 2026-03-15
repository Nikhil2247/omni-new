import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

type Mode = 'audit' | 'apply'

interface VendorBlog {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  metaTitle: string | null
  metaDescription: string | null
  focusKeyword: string | null
  keywords: string[]
  vendorId: string | null
  vendorProfile: {
    id: string
    slug: string
    businessName: string
    category: { name: string } | null
  } | null
}

interface VendorProfileLookup {
  id: string
  slug: string
  businessName: string
  category: { name: string } | null
}

interface ApplyStats {
  scanned: number
  updated: number
  skippedNoProfile: number
  addedContentLinks: number
  updatedMetaTitle: number
  updatedMetaDescription: number
  updatedFocusKeyword: number
  updatedKeywords: number
}

const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || process.env.PUBLIC_APP_URL || 'https://omnicassion.com').replace(/\/$/, '')

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL or DIRECT_DATABASE_URL environment variable is required')
  }

  if (connectionString.startsWith('prisma://')) {
    return new PrismaClient({ log: ['warn', 'error'] })
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter, log: ['warn', 'error'] })
}

function parseMode(arg?: string): Mode {
  if (arg === 'apply') return 'apply'
  return 'audit'
}

function ensureLength(value: string, max: number): string {
  if (value.length <= max) return value
  return value.slice(0, max - 3).trimEnd() + '...'
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildVendorProfileUrl(blog: VendorBlog): string | null {
  const slug = blog.vendorProfile?.slug?.trim()
  if (!slug) return null
  return `${SITE_URL}/vendors/${slug}`
}

function buildVendorProfileBlock(vendorName: string, profileUrl: string): string {
  const safeVendorName = escapeHtml(vendorName)
  const safeProfileUrl = escapeHtml(profileUrl)

  return [
    '<section class="vendor-profile-link" data-omni-vendor-profile-link="true">',
    '  <h3>Vendor Profile</h3>',
    `  <p>Explore ${safeVendorName} on Omnicassion: <a href="${safeProfileUrl}" target="_blank" rel="noopener noreferrer">${safeVendorName} public profile</a></p>`,
    '</section>',
  ].join('\n')
}

function injectProfileUrlIntoContent(content: string, vendorName: string, profileUrl: string): { content: string; added: boolean } {
  const block = buildVendorProfileBlock(vendorName, profileUrl)

  const hasHtmlBlock = /<section[^>]*data-omni-vendor-profile-link=["']true["'][^>]*>/i.test(content)

  if (hasHtmlBlock) {
    if (content.includes(profileUrl)) {
      return { content, added: false }
    }

    const replacedHtmlBlock = content.replace(
      /<section[^>]*data-omni-vendor-profile-link=["']true["'][\s\S]*?<\/section>/i,
      block,
    )
    return { content: replacedHtmlBlock, added: true }
  }

  const legacyMarkdownBlockRegex = /(?:^|\n)---\s*\n###\s*Vendor\s*Profile\s*\n[^\n]*\[[^\]]+\]\(([^)]+)\)\s*(?=\n|$)/i
  if (legacyMarkdownBlockRegex.test(content)) {
    const replacedLegacyBlock = content.replace(legacyMarkdownBlockRegex, `\n${block}`)
    return { content: replacedLegacyBlock.trimEnd() + '\n', added: true }
  }

  if (content.includes(profileUrl)) {
    return { content, added: false }
  }

  const trimmed = content.trimEnd()
  const updated = `${trimmed}\n\n${block}\n`
  return { content: updated, added: true }
}

function buildMetaTitle(blog: VendorBlog): string {
  const vendorName = blog.vendorProfile?.businessName || 'Vendor'
  const base = blog.metaTitle?.trim() || blog.title
  if (base.toLowerCase().includes(vendorName.toLowerCase())) {
    return ensureLength(base, 70)
  }
  return ensureLength(`${base} | ${vendorName}`, 70)
}

function buildMetaDescription(blog: VendorBlog, profileUrl: string): string {
  const source =
    blog.metaDescription?.trim() ||
    blog.excerpt?.trim() ||
    ensureLength(stripHtmlTags(blog.content), 110)

  const baseDescription = source.replace(/\s+/g, ' ').trim()

  if (baseDescription.includes(profileUrl)) {
    return ensureLength(baseDescription, 160)
  }

  const withLinkHint = `${baseDescription} View vendor profile: ${profileUrl}`
  return ensureLength(withLinkHint, 160)
}

function buildFocusKeyword(blog: VendorBlog): string {
  const vendorName = blog.vendorProfile?.businessName || 'vendor'
  const categoryName = blog.vendorProfile?.category?.name || 'event services'
  const candidate = `${vendorName} ${categoryName} profile`
  return ensureLength(candidate, 100)
}

function buildKeywords(blog: VendorBlog): string[] {
  const vendorName = blog.vendorProfile?.businessName || ''
  const categoryName = blog.vendorProfile?.category?.name || ''
  const profileUrl = buildVendorProfileUrl(blog)

  const merged = [
    ...(blog.keywords || []),
    vendorName,
    vendorName ? `${vendorName} profile` : '',
    categoryName ? `${categoryName} vendor` : '',
    categoryName ? `${categoryName} services` : '',
    blog.vendorProfile?.slug || '',
    profileUrl || '',
    'omnicassion vendor profile',
  ]
    .map((entry) => entry.trim())
    .filter(Boolean)

  return Array.from(new Set(merged)).slice(0, 20)
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
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
      excerpt: true,
      metaTitle: true,
      metaDescription: true,
      focusKeyword: true,
      keywords: true,
      vendorId: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  const vendorIds = Array.from(new Set(blogs.map((blog) => blog.vendorId).filter(Boolean))) as string[]
  const profiles = vendorIds.length
    ? await prisma.vendorProfile.findMany({
        where: {
          id: { in: vendorIds },
        },
        select: {
          id: true,
          slug: true,
          businessName: true,
          category: {
            select: {
              name: true,
            },
          },
        },
      })
    : []

  const profileById = new Map<string, VendorProfileLookup>(profiles.map((profile) => [profile.id, profile]))

  return blogs.map((blog) => ({
    ...blog,
    vendorProfile: blog.vendorId ? profileById.get(blog.vendorId) ?? null : null,
  }))
}

function runAudit(blogs: VendorBlog[]): void {
  let missingProfileUrl = 0
  let missingContentLink = 0
  let missingMetaTitleVendorHint = 0
  let missingMetaDescriptionLinkHint = 0

  for (const blog of blogs) {
    const profileUrl = buildVendorProfileUrl(blog)
    if (!profileUrl) {
      missingProfileUrl += 1
      continue
    }

    if (!blog.content.includes(profileUrl)) {
      missingContentLink += 1
    }

    const vendorName = blog.vendorProfile?.businessName?.toLowerCase() || ''
    const currentMetaTitle = (blog.metaTitle || '').toLowerCase()
    if (vendorName && !currentMetaTitle.includes(vendorName)) {
      missingMetaTitleVendorHint += 1
    }

    const currentMetaDescription = blog.metaDescription || ''
    if (!currentMetaDescription.includes(profileUrl)) {
      missingMetaDescriptionLinkHint += 1
    }
  }

  console.log('=== VENDOR BLOG PROFILE URL AUDIT ===')
  console.log(`Total vendor blogs: ${blogs.length}`)
  console.log(`Blogs missing vendor profile slug/url: ${missingProfileUrl}`)
  console.log(`Blogs missing profile URL in content: ${missingContentLink}`)
  console.log(`Blogs with weak metaTitle vendor hint: ${missingMetaTitleVendorHint}`)
  console.log(`Blogs missing profile URL in metaDescription: ${missingMetaDescriptionLinkHint}`)
}

async function runApply(prisma: PrismaClient, blogs: VendorBlog[]): Promise<void> {
  const stats: ApplyStats = {
    scanned: blogs.length,
    updated: 0,
    skippedNoProfile: 0,
    addedContentLinks: 0,
    updatedMetaTitle: 0,
    updatedMetaDescription: 0,
    updatedFocusKeyword: 0,
    updatedKeywords: 0,
  }

  for (const blog of blogs) {
    const profileUrl = buildVendorProfileUrl(blog)
    const vendorName = blog.vendorProfile?.businessName || 'Vendor'

    if (!profileUrl) {
      stats.skippedNoProfile += 1
      continue
    }

    const injected = injectProfileUrlIntoContent(blog.content, vendorName, profileUrl)
    const newMetaTitle = buildMetaTitle(blog)
    const newMetaDescription = buildMetaDescription(blog, profileUrl)
    const newFocusKeyword = buildFocusKeyword(blog)
    const newKeywords = buildKeywords(blog)

    const data: Record<string, unknown> = {}

    if (injected.added) {
      data.content = injected.content
      stats.addedContentLinks += 1
    }

    if ((blog.metaTitle || '') !== newMetaTitle) {
      data.metaTitle = newMetaTitle
      stats.updatedMetaTitle += 1
    }

    if ((blog.metaDescription || '') !== newMetaDescription) {
      data.metaDescription = newMetaDescription
      stats.updatedMetaDescription += 1
    }

    if ((blog.focusKeyword || '') !== newFocusKeyword) {
      data.focusKeyword = newFocusKeyword
      stats.updatedFocusKeyword += 1
    }

    if (!arraysEqual(blog.keywords || [], newKeywords)) {
      data.keywords = newKeywords
      stats.updatedKeywords += 1
    }

    if (Object.keys(data).length === 0) {
      continue
    }

    await prisma.blogPost.update({
      where: { id: blog.id },
      data,
    })

    stats.updated += 1
  }

  console.log('=== VENDOR BLOG PROFILE URL UPDATE COMPLETE ===')
  console.log(`Scanned vendor blogs: ${stats.scanned}`)
  console.log(`Updated vendor blogs: ${stats.updated}`)
  console.log(`Skipped (no vendor profile URL): ${stats.skippedNoProfile}`)
  console.log(`Added content profile links: ${stats.addedContentLinks}`)
  console.log(`Updated metaTitle: ${stats.updatedMetaTitle}`)
  console.log(`Updated metaDescription: ${stats.updatedMetaDescription}`)
  console.log(`Updated focusKeyword: ${stats.updatedFocusKeyword}`)
  console.log(`Updated keywords: ${stats.updatedKeywords}`)
}

async function main(): Promise<void> {
  const mode = parseMode(process.argv[2])
  const prisma = createPrismaClient()

  try {
    const blogs = await fetchVendorBlogs(prisma)

    if (blogs.length === 0) {
      console.log('No vendor blogs found (blog_posts with vendor_id not null).')
      return
    }

    runAudit(blogs)

    if (mode === 'apply') {
      console.log('\nApplying vendor profile URL updates to content and SEO fields...')
      await runApply(prisma, blogs)
    } else {
      console.log('\nAudit-only mode complete. Run with "apply" to update records.')
    }
  } finally {
    await prisma.$disconnect()
  }
}

void main().catch((error) => {
  console.error('Script failed:', error)
  process.exitCode = 1
})
