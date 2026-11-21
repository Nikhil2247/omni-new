import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import BlogPostClient from './blog-post-client'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { publicService } from '@/lib/api/services/public.service'
import { NotFoundError, withRetry } from '@/lib/seo/server-api'
import { getMinioViewUrl } from '@/lib/utils/minio'
import type { BlogPost } from '@/lib/api/types/marketing.types'
import type { JsonLdSchema } from '@/lib/seo/types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

/**
 * A 404 means the post does not exist (null -> real 404). Any other failure (429, 5xx, network) is retried and then
 * thrown: it must never be treated as "not found", or valid posts render as noindex pages and drop out of Google.
 */
const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    return (await withRetry(() => publicService.getBlogPostBySlug(slug))) ?? null
  } catch (error) {
    if (error instanceof NotFoundError) return null
    throw error
  }
})

/** Links in post content sometimes end with a stray "}" (e.g. /blog/some-post}); strip it so they resolve. */
function cleanSlug(slug: string): string {
  let decoded = slug
  try {
    decoded = decodeURIComponent(slug)
  } catch {
    // keep the raw value
  }
  return decoded.replace(/[}\])>.,;:!?]+$/, '').trim()
}

function toAbsoluteHttpUrl(value?: string | null): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null
    return parsed.toString()
  } catch {
    return null
  }
}

function collectPostImages(post: BlogPost): string[] {
  const candidates: Array<string | null | undefined> = [
    getMinioViewUrl(post.ogImage) || post.ogImage,
    getMinioViewUrl(post.featuredImage) || post.featuredImage,
  ]

  const unique = new Set<string>()
  for (const image of candidates) {
    const safe = toAbsoluteHttpUrl(image)
    if (!safe) continue
    unique.add(safe)
  }

  if (unique.size === 0) {
    unique.add(`${SITE_URL}/images/og-image.png`)
  }

  return Array.from(unique)
}

function buildDescription(post: BlogPost): string {
  const raw = post.metaDescription || post.excerpt || ''
  const withCategory = post.category?.name ? `${raw} ${post.category.name} insights by Omnicassion.` : raw
  if (withCategory.length <= 158) return withCategory
  return `${withCategory.slice(0, 155)}...`
}

function buildKeywords(post: BlogPost): string[] {
  const tagKeywords = (post.tags || []).map((tagLink) => tagLink.tag?.name).filter(Boolean) as string[]
  const seeds = [
    post.focusKeyword,
    post.category?.name,
    ...post.keywords,
    ...tagKeywords,
    'Omnicassion blog',
    'event planning insights',
  ].filter(Boolean) as string[]

  return Array.from(new Set(seeds))
}

function buildArticleJsonLd(post: BlogPost, slug: string): JsonLdSchema[] {
  const canonicalUrl = `${SITE_URL}/blog/${slug}`
  const description = buildDescription(post)
  const images = collectPostImages(post)
  const publishedAt = post.publishedAt || post.createdAt || new Date().toISOString()

  const authorName =
    [post.author?.firstName, post.author?.lastName].filter(Boolean).join(' ').trim() || 'Omnicassion Editorial Team'

  const articleSchema = {
    '@context': 'https://schema.org' as const,
    '@type': 'Article' as const,
    headline: post.title,
    description,
    image: images,
    datePublished: publishedAt,
    ...(post.updatedAt && { dateModified: post.updatedAt }),
    author: {
      '@type': 'Person' as const,
      name: authorName,
    },
    publisher: {
      '@type': 'Organization' as const,
      name: 'Omnicassion',
      url: SITE_URL,
    },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org' as const,
    '@type': 'BreadcrumbList' as const,
    itemListElement: [
      {
        '@type': 'ListItem' as const,
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem' as const,
        position: 2,
        name: 'Blog',
        item: `${SITE_URL}/blog`,
      },
      {
        '@type': 'ListItem' as const,
        position: 3,
        name: post.title,
        item: canonicalUrl,
      },
    ],
  }

  const webPageSchema = {
    '@context': 'https://schema.org' as const,
    '@type': 'WebPage' as const,
    name: post.metaTitle || post.title,
    description,
    url: canonicalUrl,
    breadcrumb: {
      '@type': 'BreadcrumbList' as const,
      itemListElement: breadcrumbSchema.itemListElement,
    },
  }

  return [articleSchema, breadcrumbSchema, webPageSchema] as JsonLdSchema[]
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug: rawSlug } = await params
  const slug = cleanSlug(rawSlug)
  if (slug !== rawSlug) permanentRedirect(`/blog/${slug}`)
  const post = await getBlogPostBySlug(slug)
  const canonicalPath = `/blog/${slug}`

  // Real 404 status instead of a 200 page marked noindex ("soft 404").
  if (!post) notFound()

  const title = post.metaTitle || post.title
  const description = buildDescription(post) || 'Read the latest insights from Omnicassion.'
  const images = collectPostImages(post)
  const image = images[0] || undefined
  const keywords = buildKeywords(post)

  return pageMetadata(title, description, {
    path: canonicalPath,
    image,
    keywords,
    type: 'article',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug: rawSlug } = await params
  const slug = cleanSlug(rawSlug)
  if (slug !== rawSlug) permanentRedirect(`/blog/${slug}`)
  const post = await getBlogPostBySlug(slug)
  if (!post) notFound()

  const jsonLd = generateJsonLd(buildArticleJsonLd(post, slug))

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <BlogPostClient slug={slug} initialPost={post} />
    </>
  )
}
