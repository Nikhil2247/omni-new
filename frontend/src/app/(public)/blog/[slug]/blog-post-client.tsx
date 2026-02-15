'use client'

import { Clock, Eye, Calendar, ArrowLeft, Share2, BookOpen } from 'lucide-react'
import { usePublicBlogPost } from '@/hooks/queries/use-public-blog'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@/lib/utils'
import type { BlogPost } from '@/lib/api/types/marketing.types'

type BlogPostClientProps = {
  slug: string
  initialPost?: BlogPost | null
}

type Heading = {
  id: string
  text: string
  level: number
}

export default function BlogPostClient({ slug, initialPost }: BlogPostClientProps) {
  const [headings, setHeadings] = useState<Heading[]>([])
  const [activeId, setActiveId] = useState<string>('')
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: post, isLoading } = usePublicBlogPost(slug ?? '', {
    enabled: !initialPost,
    initialData: initialPost ?? undefined,
  })

  // Extract headings from content
  useEffect(() => {
    if (!contentRef.current || !post?.content) return

    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      if (!contentRef.current) return

      const headingElements = contentRef.current.querySelectorAll('h1, h2, h3')
      const extractedHeadings: Heading[] = []

      headingElements.forEach((heading, index) => {
        const id = heading.id || `heading-${index}`
        if (!heading.id) {
          heading.id = id
        }
        // Add scroll-mt class for smooth scrolling offset
        heading.classList.add('scroll-mt-24')
        
        extractedHeadings.push({
          id,
          text: heading.textContent || '',
          level: parseInt(heading.tagName[1]),
        })
      })

      setHeadings(extractedHeadings)
    }, 100)

    return () => clearTimeout(timer)
  }, [post?.content])

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
        toast.success('Share dialog opened.')
        return
      } catch (error: any) {
        if (error?.name === 'AbortError') return
      }
    }

    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url)
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

  return (
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
            <h1 className="font-serif text-4xl font-bold leading-[1.15] tracking-tight md:text-5xl lg:text-6xl max-w-4xl">
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
      <main className="mx-auto w-full max-w-8xl px-6 py-12">
        <div className="flex gap-12">
          {/* Article Content */}
          <div className="flex-1 min-w-0">
            {/* Featured Image */}
            {post.featuredImage && (
              <div className="mb-12 overflow-hidden rounded-2xl border shadow-lg">
                <AspectRatio ratio={16 / 9}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.featuredImage}
                    alt={post.featuredImageAlt || post.title}
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
                      onClick={(e) => {
                        e.preventDefault()
                        const element = document.getElementById(heading.id)
                        if (element) {
                          const yOffset = -100
                          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                          window.scrollTo({ top: y, behavior: 'smooth' })
                        }
                      }}
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
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: post.content }}
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
              <div className="sticky top-24 space-y-4">
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-sm uppercase tracking-wide">Table of Contents</h3>
                  </div>
                  <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                    {headings.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        onClick={(e) => {
                          e.preventDefault()
                          const element = document.getElementById(heading.id)
                          if (element) {
                            const yOffset = -100 // Offset for sticky header
                            const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
                            window.scrollTo({ top: y, behavior: 'smooth' })
                          }
                        }}
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

                {/* Share Card */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
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
                </div>

                {/* Reading Progress */}
                <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Reading time</span>
                    <span className="font-medium">{post.readingTime} min</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Views</span>
                    <span className="font-medium">{post.viewCount}</span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </>
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
