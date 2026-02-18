'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Clock, Eye, Search } from 'lucide-react'
import { usePublicBlogCategories, usePublicBlogPosts, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getMinioViewUrl } from '@/lib/utils/minio'

export default function BlogPage() {
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [tagId, setTagId] = useState('all')

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      tagId: tagId === 'all' ? undefined : tagId,
      page: 1,
      limit: 12,
    }),
    [keyword, categoryId, tagId]
  )

  const { data, isLoading } = usePublicBlogPosts(params)
  const { data: categories } = usePublicBlogCategories()
  const { data: tags } = usePublicBlogTags()

  const categoryOptions = Array.isArray(categories)
    ? categories
    : categories && Array.isArray((categories as { data?: unknown })?.data)
      ? ((categories as { data: unknown[] }).data as typeof categories)
      : []

  const tagOptions = Array.isArray(tags)
    ? tags
    : tags && Array.isArray((tags as { data?: unknown })?.data)
      ? ((tags as { data: unknown[] }).data as typeof tags)
      : []

  return (
    <main className="mx-auto flex w-full max-w-8xl flex-col gap-5 px-6 py-12">
      <section className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-xl md:p-8">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(255,255,255,0.25), transparent 60%)' }} />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-200">Omnicassion Journal</p>
          <h1 className="text-3xl font-semibold leading-tight md:text-4xl">Planning insights crafted for modern celebrations.</h1>
          <p className="max-w-2xl text-sm text-slate-200">
        Deep dives, trend reports, and vendor spotlights to help you design unforgettable events with confidence.
          </p>
        </div>
      </section>

      <div className="flex w-full flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categoryOptions.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={tagId} onValueChange={setTagId}>
          <SelectTrigger className="w-full md:w-56">
            <SelectValue placeholder="Tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {tagOptions.map((tag) => (
              <SelectItem key={tag.id} value={tag.id}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : data?.data?.length ? (
        <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {data.data.map((post) => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group">
              <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-lg">
                <CardContent className="p-0">
                  <AspectRatio ratio={16 / 9} className="bg-muted">
                    {(getMinioViewUrl(post.featuredImage) || post.featuredImage) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getMinioViewUrl(post.featuredImage) || post.featuredImage || ''}
                        alt={post.featuredImageAlt || post.title}
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
