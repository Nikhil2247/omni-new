'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { trackContent } from '@/lib/analytics/umami'
import { Clock, Eye, Search } from 'lucide-react'
import {
  usePublicBlogCategories,
  usePublicInfiniteBlogPosts,
} from '@/hooks/queries/use-public-blog'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { useInView } from 'react-intersection-observer'

type BlogSortOption = 'latest' | 'mostViewed'

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [sortBy, setSortBy] = useState<BlogSortOption>('latest')
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '200px',
  })
  const { data: categories } = usePublicBlogCategories()

  useEffect(() => {
    trackContent.articleView('blog-list', 'Blog')
  }, [])

  const handleSearch = useCallback(() => {
    setKeyword(searchQuery.trim())
  }, [searchQuery])

  const filters = useMemo(
    () => ({
      status: 'PUBLISHED' as const,
      keyword: keyword.trim() || undefined,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      sortBy,
    }),
    [keyword, categoryId, sortBy]
  )

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = usePublicInfiniteBlogPosts(filters, 12)

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const displayPosts = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <main className="mx-auto flex w-full max-w-8xl flex-col gap-5 px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#1370c6] via-[#1e5aa8] to-[#2d46a0] p-6 text-white shadow-xl md:p-8">
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(255,255,255,0.4), transparent 60%)' }} />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Omnicassion Journal</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Planning insights crafted for modern celebrations.</h1>
          <p className="max-w-2xl text-sm text-slate-200">
        Deep dives, trend reports, and vendor spotlights to help you design unforgettable events with confidence.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[minmax(0,1fr)_180px_220px]">
        <div className="relative flex items-center rounded-full border border-border bg-background p-1.5 shadow-sm transition-shadow hover:shadow-md focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20">
          <Input
            type="text"
            placeholder="Search inspiration, styles, themes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            className="h-9 border-0 bg-transparent px-3 text-sm shadow-none focus-visible:ring-0"
          />
          <Button
            onClick={handleSearch}
            className="h-9 w-9 shrink-0 rounded-full p-0"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-full md:w-45">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as BlogSortOption)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="mostViewed">Most viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-55">
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {(categories || []).map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : displayPosts.length ? (
        <>
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {displayPosts.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-lg">
                  <CardContent className="p-0">
                    <AspectRatio ratio={16 / 9} className="bg-muted">
                      {(getMinioViewUrl(post.featuredImage) || post.featuredImage) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <NextImage
                          src={getMinioViewUrl(post.featuredImage) || post.featuredImage || ''}
                          alt={post.featuredImageAlt || post.title}
                          width={1600}
                          height={900}
                          unoptimized={true}
                          priority={true}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
                          Omnicassion Journal
                        </div>
                      )}
                    </AspectRatio>
                  </CardContent>
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary">{post.category?.name ?? 'Insights'}</Badge>
                      <span>Updated {formatDate(post.publishedAt ?? post.updatedAt)}</span>
                    </div>
                    <CardTitle className="text-lg leading-snug">{post.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col justify-between gap-3 text-sm text-muted-foreground">
                    <p className="line-clamp-3">{post.excerpt || 'Read the full story on Omnicassion Journal.'}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {post.readingTime} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          {post.viewCount}
                        </span>
                      </div>
                      <span className="text-primary">Read more</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </section>

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="flex w-full justify-center py-8">
            {isFetchingNextPage && (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <span className="text-sm text-muted-foreground">Loading more...</span>
              </div>
            )}
            {!hasNextPage && !isFetching && displayPosts.length > 0 && (
              <span className="text-sm text-muted-foreground">You have reached the end.</span>
            )}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No blog posts published yet.</p>
      )}
    </main>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
