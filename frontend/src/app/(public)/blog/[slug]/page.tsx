import { cache } from 'react'
import type { Metadata } from 'next'
import BlogPostClient from './blog-post-client'
import { pageMetadata, generateJsonLd } from '@/lib/seo/metadata'
import { publicService } from '@/lib/api/services/public.service'
import { getMinioViewUrl } from '@/lib/utils/minio'
import type { BlogPost } from '@/lib/api/types/marketing.types'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

const getBlogPostBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  try {
    return await publicService.getBlogPostBySlug(slug)
  } catch {
    return null
  }
})

function buildArticleJsonLd(post: BlogPost, slug: string) {
  const schema = {
    '@context': 'https://schema.org' as const,
    '@type': 'Article' as const,
    headline: post.title,
    description: post.metaDescription || post.excerpt || '',
    url: `${SITE_URL}/blog/${slug}`,
    datePublished: post.publishedAt || new Date().toISOString(),
    author: {
      '@type': 'Organization' as const,
      name: 'Omnicassion',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization' as const,
      name: 'Omnicassion',
      url: SITE_URL,
    },
    mainEntityOfPage: {
      '@type': 'WebPage' as const,
      '@id': `${SITE_URL}/blog/${slug}`,
    },
  }

  // Add optional fields
  const articleImage = getMinioViewUrl(post.featuredImage) || post.featuredImage
  if (articleImage) {
    Object.assign(schema, { image: [articleImage] })
  }
  if (post.updatedAt) {
    Object.assign(schema, { dateModified: post.updatedAt })
  }

  return schema
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)
  const canonicalPath = `/blog/${slug}`

  if (!post) {
    return pageMetadata(
      'Post not found',
      'The article you are looking for could not be found.',
      {
        path: canonicalPath,
        noIndex: true,
      },
    )
  }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || 'Read the latest insights from Omnicassion.'
  const image = getMinioViewUrl(post.ogImage) || getMinioViewUrl(post.featuredImage) || post.ogImage || post.featuredImage || undefined
  const keywords = post.keywords?.length ? post.keywords : undefined

  return pageMetadata(title, description, {
    path: canonicalPath,
    image,
    keywords,
    type: 'article',
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getBlogPostBySlug(slug)

  const jsonLd = post ? generateJsonLd(buildArticleJsonLd(post, slug)) : null

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
