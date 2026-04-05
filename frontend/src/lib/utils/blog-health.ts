import type { BlogPost } from '@/lib/api/types/marketing.types'

export type BlogHealthResult = {
  score: number
  label: 'Excellent' | 'Good' | 'Needs work' | 'Incomplete'
  variant: 'default' | 'secondary' | 'outline' | 'destructive'
  missing: string[]
}

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

export function getBlogHealth(post: BlogPost): BlogHealthResult {
  const plainContent = stripHtml(post.content || '')

  const checks: Array<{ label: string; complete: boolean }> = [
    { label: 'Title', complete: Boolean(post.title?.trim()) },
    { label: 'Slug', complete: Boolean(post.slug?.trim()) },
    { label: 'Excerpt', complete: Boolean(post.excerpt?.trim() && post.excerpt.trim().length >= 80) },
    { label: 'Detailed content', complete: plainContent.length >= 300 },
    { label: 'Category', complete: Boolean(post.categoryId) },
    { label: 'Tags', complete: Boolean(post.tags?.length) },
    { label: 'Featured image', complete: Boolean(post.featuredImage) },
    { label: 'Image alt text', complete: Boolean(post.featuredImageAlt?.trim()) },
    {
      label: 'SEO metadata',
      complete: Boolean(post.metaTitle?.trim() && post.metaDescription?.trim() && post.focusKeyword?.trim()),
    },
    { label: 'Keywords', complete: Boolean(post.keywords?.length) },
  ]

  const completedCount = checks.filter((check) => check.complete).length
  const score = Math.round((completedCount / checks.length) * 100)
  const missing = checks.filter((check) => !check.complete).map((check) => check.label)

  if (score >= 90) {
    return { score, label: 'Excellent', variant: 'default', missing }
  }

  if (score >= 75) {
    return { score, label: 'Good', variant: 'secondary', missing }
  }

  if (score >= 55) {
    return { score, label: 'Needs work', variant: 'outline', missing }
  }

  return { score, label: 'Incomplete', variant: 'destructive', missing }
}
