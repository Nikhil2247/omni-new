'use client'

import NextImage from 'next/image'
import { Clock, Eye, Calendar, ArrowLeft, Share2, BookOpen, User } from 'lucide-react'
import { usePublicBlogPost } from '@/hooks/queries/use-public-blog'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEffect, useMemo, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'
import type { BlogPost } from '@/lib/api/types/marketing.types'
import { trackContent } from '@/lib/analytics/umami'
import { usePageEngagement } from '@/hooks/use-umami'

type BlogPostClientProps = {
  slug: string
  initialPost?: BlogPost | null
}

type Heading = {
  id: string
  text: string
  level: number
}

const toHeadingSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

const getScrollParent = (element: HTMLElement): HTMLElement | null => {
  let parent = element.parentElement

  while (parent && parent !== document.body) {
    const style = window.getComputedStyle(parent)
    const canScroll = /(auto|scroll)/.test(style.overflowY)
    if (canScroll && parent.scrollHeight > parent.clientHeight) {
      return parent
    }
    parent = parent.parentElement
  }

  return null
}

export default function BlogPostClient({ slug, initialPost }: BlogPostClientProps) {
  const [activeId, setActiveId] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: post, isLoading } = usePublicBlogPost(slug ?? '', {
    enabled: !initialPost,
    initialData: initialPost ?? undefined,
  })

  // Page engagement (scroll depth + time on page)
  usePageEngagement(`blog:${slug}`)

  // Track article view when post loads
  useEffect(() => {
    if (post?.slug) {
      trackContent.articleView(post.slug, post.category?.name)
    }
  }, [post?.slug])

  const { processedContent, headings } = useMemo(() => {
    const rawContent = post?.content || ''
    if (!rawContent) {
      return { processedContent: rawContent, headings: [] as Heading[] }
    }

    if (typeof window === 'undefined') {
      return { processedContent: rawContent, headings: [] as Heading[] }
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(rawContent, 'text/html')
    const headingElements = doc.querySelectorAll('h1, h2, h3')
    const extractedHeadings: Heading[] = []
    const idCounter = new Map<string, number>()

    headingElements.forEach((heading, index) => {
      const headingText = (heading.textContent || '').trim()
      const baseId = toHeadingSlug(headingText) || `heading-${index + 1}`
      const seen = idCounter.get(baseId) ?? 0
      const id = seen === 0 ? baseId : `${baseId}-${seen + 1}`
      idCounter.set(baseId, seen + 1)

      heading.id = id
      heading.classList.add('scroll-mt-24')

      extractedHeadings.push({
        id,
        text: headingText,
        level: parseInt(heading.tagName[1]),
      })
    })

    return {
      processedContent: doc.body.innerHTML,
      headings: extractedHeadings,
    }
  }, [post?.content])

  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id)
    if (!element) return

    const scrollParent = getScrollParent(element)
    if (scrollParent) {
      const parentRect = scrollParent.getBoundingClientRect()
      const elementRect = element.getBoundingClientRect()
      const top = elementRect.top - parentRect.top + scrollParent.scrollTop - 24
      scrollParent.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
      return
    }

    const top = element.getBoundingClientRect().top + window.scrollY - 96
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
  }

  const handleTocClick = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    scrollToHeading(id)
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `#${id}`)
    }
  }

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { 
        rootMargin: '-100px 0px -66% 0px',
        threshold: 0.5
      }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [headings])

  useEffect(() => {
    if (!headings.length || typeof window === 'undefined') return

    const hash = window.location.hash.replace('#', '')
    if (!hash) return

    const timer = setTimeout(() => {
      scrollToHeading(hash)
    }, 50)

    return () => clearTimeout(timer)
  }, [headings])

  const handleShare = async () => {
    if (typeof window === 'undefined') return

    const url = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.excerpt ?? 'Check out this article',
          url,
        })
        trackContent.articleShare(slug, 'native')
        toast.success('Share dialog opened.')
        return
      } catch (error: any) {
        if (error?.name === 'AbortError') return
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
        trackContent.articleShare(slug, 'clipboard')
        toast.success('Link copied to clipboard.')
      } catch {
        toast.error('Failed to copy link.')
      }
      return
    }

    toast.error('Sharing is not supported on this device.')
  }

  if (isLoading) {
    return (
      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="mt-4 h-64" />
      </main>
    )
  }

  if (!post) {
    return (
      <main className="w-full px-6 py-12">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Post not found.</p>
          <Button asChild variant="outline">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Blog
            </Link>
          </Button>
        </div>
      </main>
    )
  }

  const featuredImageUrl = getMinioViewUrl(post.featuredImage) || post.featuredImage

  return (
    <div className="overflow-x-hidden">
    <>
      {/* Hero Section */}
      <div className="relative border-b bg-linear-to-b from-muted/40 via-muted/20 to-background overflow-hidden">
        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 h-96 w-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 h-96 w-96 bg-sky-500/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative mx-auto w-full max-w-8xl px-6 py-12 lg:py-16">
          <div className="mb-8">
            <Button asChild variant="ghost" size="sm" className="-ml-3 hover:bg-muted/50">
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>

          <div className="space-y-5">
            {/* Category Badge */}
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-xs font-semibold px-3 py-1">
                {post.category?.name ?? 'Uncategorized'}
              </Badge>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{post.readingTime} min read</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl md:text-5xl font-bold leading-[1.15] tracking-tight lg:text-6xl max-w-4xl">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {post.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              {(post.author?.firstName || post.author?.lastName) && (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{[post.author.firstName, post.author.lastName].filter(Boolean).join(' ')}</span>
                  </div>
                  <Separator orientation="vertical" className="h-4" />
                </>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>{post.viewCount} views</span>
              </div>
              <div className="ml-auto">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShare}
                  className="rounded-full"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-8xl px-6 py-12 overflow-x-hidden">
        <div className="flex gap-12">
          {/* Article Content */}
          <div className="flex-1 min-w-0">
            {/* Featured Image */}
            {featuredImageUrl && (
              <div className="mb-12 overflow-hidden rounded-2xl border shadow-lg">
                <AspectRatio ratio={16 / 9}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <NextImage
                    src={featuredImageUrl}
                    alt={post.featuredImageAlt || post.title}
                    width={1600}
                    height={900}
                    unoptimized={true}
                    priority={true}
                    className="h-full w-full object-cover"
                  />
                </AspectRatio>
              </div>
            )}

            {/* Tags */}
            {post.tags?.length ? (
              <div className="mb-8 flex flex-wrap gap-2">
                {post.tags.map((entry) => (
                  <Badge key={entry.tagId} variant="outline" className="rounded-full">
                    {entry.tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            {/* Mobile TOC */}
            {headings.length > 0 && (
              <div className="hidden md:block xl:hidden mb-8 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Table of Contents</h3>
                </div>
                <nav className="space-y-1">
                  {headings.map((heading) => (
                    <a
                      key={heading.id}
                      href={`#${heading.id}`}
                      onClick={handleTocClick(heading.id)}
                      className={cn(
                        'block py-1.5 text-sm transition-colors rounded-lg px-2 cursor-pointer',
                        heading.level === 1 && 'pl-2 font-semibold',
                        heading.level === 2 && 'pl-4',
                        heading.level === 3 && 'pl-6 text-xs',
                        activeId === heading.id
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {heading.text}
                    </a>
                  ))}
                </nav>
              </div>
            )}

            {/* Article Content - Renders TipTap HTML */}
            <article
              ref={contentRef}
              className="blog-content max-w-3xl lg:max-w-none mx-auto lg:mx-0 text-base md:text-lg"
              dangerouslySetInnerHTML={{ __html: processedContent }}
            />

            {/* Footer */}
            <div className="mt-16 pt-8 border-t">
              <div className="flex items-center justify-between">
                <Button asChild variant="outline">
                  <Link href="/blog">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    More Articles
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Article
                </Button>
              </div>
            </div>
          </div>

          {/* Table of Contents Sidebar */}
          {headings.length > 0 && (
            <aside className="hidden xl:block w-72 shrink-0">
              <div className="sticky top-24 flex flex-col gap-4" style={{ maxHeight: 'calc(100vh - 7rem)' }}>
                {/* TOC card — fills remaining space, nav scrolls */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm flex flex-col min-h-0 flex-1">
                  <div className="flex items-center gap-2 mb-4 shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide">Table of Contents</h3>
                  </div>
                  <nav className="space-y-1 overflow-y-auto flex-1 pr-1">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={handleTocClick(heading.id)}
                        className={cn(
                          'block py-2 text-sm transition-colors rounded-lg px-3 cursor-pointer',
                          heading.level === 1 && 'pl-2 font-semibold',
                          heading.level === 2 && 'pl-4',
                          heading.level === 3 && 'pl-6 text-xs',
                          activeId === heading.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        )}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>

                {/* Share + Stats — pinned at bottom, don't grow */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm shrink-0">
                  <h4 className="font-semibold text-sm mb-3">Share this article</h4>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleShare}
                    className="w-full"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </Button>
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reading time</span>
                      <span className="font-medium">{post.readingTime} min</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Views</span>
                      <span className="font-medium">{post.viewCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
    </div>
  )
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
