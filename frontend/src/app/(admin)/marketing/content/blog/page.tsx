'use client'

import { useEffect, useState } from 'react'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogHealthIndicator } from '@/components/marketing/blog-health-indicator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BlogStatus } from '@/lib/api/types/marketing.types'

export default function MarketingBlogPostsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [status, setStatus] = useState<Extract<BlogStatus, 'PUBLISHED' | 'DRAFT'>>('PUBLISHED')

  useEffect(() => {
    setCurrentPage(1)
  }, [status])

  const { data, isLoading } = useBlogPosts({ status, page: currentPage, limit: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blog posts</h1>
        <p className="text-muted-foreground">Published marketing articles.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{status === 'PUBLISHED' ? 'Published posts' : 'Draft posts'}</CardTitle>
          <Select value={status} onValueChange={(value) => setStatus(value as Extract<BlogStatus, 'PUBLISHED' | 'DRAFT'>)}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PUBLISHED">Published</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
            </SelectContent>
          </Select>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.data.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="min-w-[200px]">
                        <div className="max-w-[200px] truncate font-medium sm:max-w-none">{post.title}</div>
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
                        <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'secondary'}>{post.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <BlogHealthIndicator post={post} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{post.readingTime} min</TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">{post.viewCount}</TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(post.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No published posts yet.</p>
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
