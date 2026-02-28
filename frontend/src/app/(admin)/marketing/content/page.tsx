'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Search, Send } from 'lucide-react'
import { useBlogPosts, usePublishBlogPost } from '@/hooks/queries/use-marketing'
import { usePublicBlogCategories, usePublicBlogTags } from '@/hooks/queries/use-public-blog'
import { useAuthStore } from '@/store/auth-store'
import { ROLES } from '@/config/roles'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  const [keyword, setKeyword] = useState('')
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const publishMutation = usePublishBlogPost()
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{isContentWriter ? 'My Drafts' : 'Content manager'}</h1>
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
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>All content</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search content"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full sm:w-40">
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
              <SelectTrigger className="w-full sm:w-40">
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
            <Select value={status} onValueChange={(value) => setStatus(value as BlogStatus | 'all')}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Read time</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell>
                      <div className="font-medium">{post.title}</div>
                      <div className="text-xs text-muted-foreground">{post.slug}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.category?.name ?? 'Uncategorized'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'PUBLISHED' ? 'default' : post.status === 'DRAFT' ? 'secondary' : 'outline'}>
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.readingTime} min</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.viewCount}</TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isContentWriter && post.status !== 'PUBLISHED' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={publishingId === post.id}
                            onClick={async () => {
                              setPublishingId(post.id)
                              try {
                                await publishMutation.mutateAsync(post.id)
                              } finally {
                                setPublishingId(null)
                              }
                            }}
                          >
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {publishingId === post.id ? 'Publishing…' : 'Publish'}
                          </Button>
                        )}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/marketing/content/${post.id}`}>Open</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No content found.</p>
          )}

          {data?.meta?.totalPages && data.meta.totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3 border-t pt-4">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} • {data.meta.total} items
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
