'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { trackContent } from '@/lib/analytics/umami'
import {
  usePublicBlogCategories,
  usePublicInfiniteBlogPosts,
} from '@/hooks/queries/use-public-blog'
import { Brush, PaintedScene, SketchButton, SkContainer, Stamp, skPaper } from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'
import { cn } from '@/lib/utils'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { useInView } from 'react-intersection-observer'

type BlogSortOption = 'latest' | 'mostViewed'

const COVER_RADIUS = 'rounded-[18px_240px_20px_220px/230px_18px_250px_16px]'

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
    <SkContainer className="pb-16">
      <PageHead
        eyebrow="Omnicassion Journal"
        title={
          <>
            Planning insights crafted for modern <Brush gold>celebrations</Brush>.
          </>
        }
        sub="Deep dives, trend reports, and vendor spotlights to help you design unforgettable events with confidence."
      />

      <form
        role="search"
        className={skPaper({
          className:
            'mt-[26px] grid grid-cols-[1fr_200px_200px_auto] items-end gap-3.5 px-5 py-4 max-[900px]:grid-cols-2 max-[720px]:grid-cols-1',
        })}
        onSubmit={(event) => {
          event.preventDefault()
          handleSearch()
        }}
      >
        <div className="sk-field !mb-0">
          <label htmlFor="blog-search">Search</label>
          <input
            id="blog-search"
            type="search"
            placeholder="Search inspiration, styles, themes..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="sk-field !mb-0">
          <label htmlFor="blog-sort">Sort</label>
          <select id="blog-sort" value={sortBy} onChange={(event) => setSortBy(event.target.value as BlogSortOption)}>
            <option value="latest">Latest</option>
            <option value="mostViewed">Most viewed</option>
          </select>
        </div>
        <div className="sk-field !mb-0">
          <label htmlFor="blog-category">Category</label>
          <select id="blog-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="all">All categories</option>
            {(Array.isArray(categories) ? categories : []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <SketchButton type="submit" size="sm" className="max-[900px]:col-span-2 max-[720px]:col-span-1">
          Search
        </SketchButton>
      </form>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-7" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className={skPaper({ className: 'h-64 animate-pulse' })} />
            ))}
          </div>
        ) : displayPosts.length ? (
          <>
            <section className="grid grid-cols-[repeat(auto-fill,minmax(min(270px,100%),1fr))] gap-7">
              {displayPosts.map((post, i) => (
                <PostCard key={post.id} post={post} index={i} big={i === 0} />
              ))}
            </section>

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} className="flex w-full justify-center py-6 sm:py-8">
              {isFetchingNextPage && (
                <div className="flex items-center gap-3">
                  <div className="border-blue h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
                  <span className="text-ink-soft text-sm">Loading more...</span>
                </div>
              )}
              {!hasNextPage && !isFetching && displayPosts.length > 0 && (
                <span className="text-ink-soft text-sm">You have reached the end.</span>
              )}
            </div>
          </>
        ) : (
          <div className={skPaper({ className: 'mx-auto max-w-md p-8 text-center' })}>
            <h3 className="font-display text-[1.4rem] font-semibold">
              {keyword || categoryId !== 'all' ? 'No articles found' : 'No blog posts published yet.'}
            </h3>
            {keyword || categoryId !== 'all' ? (
              <p className="text-ink-soft mt-1">Try another search or category.</p>
            ) : null}
          </div>
        )}
      </div>
    </SkContainer>
  )
}

type PostItem = NonNullable<ReturnType<typeof usePublicInfiniteBlogPosts>['data']>['pages'][number]['data'][number]

function PostCard({ post, index, big }: { post: PostItem; index: number; big: boolean }) {
  const image = getMinioViewUrl(post.featuredImage) || post.featuredImage
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={cn(
        skPaper({ alt: index % 2 === 1 }),
        'grid gap-2 p-2.5 pb-[18px] text-left',
        big && 'col-[1/-1] items-center gap-6 min-[761px]:grid-cols-[1.2fr_1fr]',
      )}
    >
      <div className={cn('bg-sky1 relative aspect-[16/10] overflow-hidden', COVER_RADIUS)}>
        {image ? (
          <NextImage
            src={image}
            alt={post.featuredImageAlt || post.title}
            width={1600}
            height={900}
            unoptimized={true}
            priority={index < 2}
            className="h-full w-full object-cover"
          />
        ) : (
          <PaintedScene seed={(index + 1) * 7} />
        )}
      </div>
      <div className="grid gap-2 px-2">
        <div className="text-ink-soft flex flex-wrap items-center gap-2.5 text-sm">
          <Stamp className="!text-blue">{post.category?.name ?? 'Insights'}</Stamp>
          <span>{formatDate(post.publishedAt ?? post.updatedAt)}</span>
          {post.readingTime ? <span>{post.readingTime} min read</span> : null}
        </div>
        <h3
          className={cn(
            'font-display line-clamp-3 leading-tight font-semibold',
            big ? 'text-[clamp(1.6rem,3vw,2.3rem)]' : 'text-[1.3rem]',
          )}
        >
          {post.title}
        </h3>
        <p className={cn('text-ink-soft text-[0.92rem]', big ? 'line-clamp-4' : 'line-clamp-2')}>
          {post.excerpt || 'Read the full story on Omnicassion Journal.'}
        </p>
        <span className="text-blue text-sm font-bold">Read more →</span>
      </div>
    </Link>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
