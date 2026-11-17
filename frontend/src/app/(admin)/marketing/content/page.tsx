'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ExternalLink, Search, Send, Trash2 } from 'lucide-react'
import { useUmami } from '@/hooks/use-umami'
import { useBlogPosts, useDeleteBlogPost, usePublishBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/config/roles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogHealthIndicator } from '@/components/marketing/blog-health-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { BlogStatus } from '@/lib/api/types/marketing.types'

export default function MarketingContentPage() {
  const { user } = useAuthStore()
  const isContentWriter = user?.role === ROLES.CONTENT_WRITER
  const { track } = useUmami()
  const [keyword, setKeyword] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const publishMutation = usePublishBlogPost()
  const deleteMutation = useDeleteBlogPost()
  const [status, setStatus] = useState<BlogStatus | 'all'>('all')
  const [categoryId, setCategoryId] = useState('all')
  const [tagId, setTagId] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [keyword, status, categoryId, tagId])

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      status: status === 'all' ? undefined : status,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      tagId: tagId === 'all' ? undefined : tagId,
      page: currentPage,
      limit: 20,
    }),
    [keyword, status, categoryId, tagId, currentPage]
  )

  const { data, isLoading } = useBlogPosts(params)
  const { data: categories } = usePublicBlogCategories()
  const { data: tags } = usePublicBlogTags()

  useEffect(() => {
    track('marketing:content:page_view', { totalPosts: data?.data?.length || 0 })
  }, [data, track])

  const categoryOptions = Array.isArray(categories)
    ? categories
    : categories && typeof categories === 'object' && 'data' in categories && Array.isArray((categories as { data: unknown[] }).data)
      ? ((categories as { data: unknown[] }).data as typeof categories)
      : []

  const tagOptions = Array.isArray(tags)
    ? tags
    : tags && typeof tags === 'object' && 'data' in tags && Array.isArray((tags as { data: unknown[] }).data)
      ? ((tags as { data: unknown[] }).data as typeof tags)
      : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">{isContentWriter ? 'My Drafts' : 'Content manager'}</h1>
          <p className="text-muted-foreground">
            {isContentWriter
              ? 'Write and update your drafts for marketing admin review.'
              : 'Manage blog posts and editorial updates.'}
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/content/new">{isContentWriter ? 'Write draft' : 'Create post'}</Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <CardTitle className="shrink-0">All content</CardTitle>
          <div className="grid w-full grid-cols-1 gap-2 xs:grid-cols-2 sm:flex sm:flex-wrap sm:items-center md:w-auto">
            <div className="relative col-span-full xs:col-span-2 sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full sm:w-36">
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
              <SelectTrigger className="w-full sm:w-32">
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
            {isContentWriter ? (
              <Badge variant="secondary" className="h-10 justify-center px-3 uppercase">
                Draft only
              </Badge>
            ) : (
              <Select value={status} onValueChange={(value) => setStatus(value as BlogStatus | 'all')}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PUBLISHED">Published</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="ARCHIVED">Archived</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.data?.length ? (
            <div className="-mx-4 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Title</TableHead>
                  <TableHead className="hidden sm:table-cell">Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Health</TableHead>
                  <TableHead className="hidden md:table-cell">Read time</TableHead>
                  <TableHead className="hidden md:table-cell">Views</TableHead>
                  <TableHead className="hidden sm:table-cell">Updated</TableHead>
                  <TableHead className="sticky right-0 z-20 min-w-[100px] bg-background text-right sm:min-w-[140px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="min-w-[200px]">
                      <div className="max-w-[200px] truncate font-medium sm:max-w-none">{post.title}</div>
                      <div className="max-w-[200px] truncate text-xs text-muted-foreground sm:max-w-none">{post.slug}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-muted-foreground sm:hidden">
                        <span>{post.category?.name ?? 'Uncategorized'}</span>
                        <span>•</span>
                        <span>{formatDate(post.updatedAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                      {post.category?.name ?? 'Uncategorized'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'DRAFT' ? 'secondary' : 'outline'}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <BlogHealthIndicator post={post} />
                    </TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{post.readingTime} min</TableCell>
                    <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{post.viewCount}</TableCell>
                    <TableCell className="hidden sm:table-cell">{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="sticky right-0 z-10 bg-background text-right">
                      <div className="flex items-center justify-end gap-1 sm:gap-2">
                        {!isContentWriter && post.status !== 'PUBLISHED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                            disabled={publishingId === post.id}
                            aria-label={publishingId === post.id ? 'Publishing blog post' : 'Publish blog post'}
                            title={publishingId === post.id ? 'Publishing...' : 'Publish'}
                            onClick={async () => {
                              setPublishingId(post.id)
                              try {
                                await publishMutation.mutateAsync(post.id)
                              } finally {
                                setPublishingId(null)
                              }
                            }}
                          >
                            <Send className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                        {!isContentWriter && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-7 p-0 sm:h-8 sm:w-8"
                            disabled={deletingId === post.id}
                            aria-label={deletingId === post.id ? 'Deleting blog post' : 'Delete blog post'}
                            title={deletingId === post.id ? 'Deleting...' : 'Delete'}
                            onClick={async () => {
                              if (!window.confirm('Delete this blog post? This action cannot be undone.')) {
                                return
                              }

                              setDeletingId(post.id)
                              try {
                                await deleteMutation.mutateAsync(post.id)
                              } finally {
                                setDeletingId(null)
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm" className="h-7 w-7 p-0 sm:h-8 sm:w-8" aria-label="Open blog post" title="Open">
                          <Link href={`/marketing/content/${post.id}`} aria-label="Open blog post" title="Open">
                            <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No content found.</p>
          )}

          {data?.meta?.totalPages && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
              <p className="text-center text-sm text-muted-foreground sm:text-left">
                Page {data.meta.page} of {data.meta.totalPages} <span className="hidden xs:inline">•</span> <span className="block xs:inline">{data.meta.total} items</span>
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasPreviousPage || isLoading}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.hasNextPage || isLoading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
