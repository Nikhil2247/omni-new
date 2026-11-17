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

export default function MarketingDraftsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [status, setStatus] = useState<Extract<BlogStatus, 'DRAFT' | 'PUBLISHED'>>('DRAFT')

  useEffect(() => {
    setCurrentPage(1)
  }, [status])

  const { data, isLoading } = useBlogPosts({ status, page: currentPage, limit: 20 })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Drafts</h1>
        <p className="text-muted-foreground">Content in progress and awaiting review.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>{status === 'DRAFT' ? 'Draft posts' : 'Published posts'}</CardTitle>
          <Select value={status} onValueChange={(value) => setStatus(value as Extract<BlogStatus, 'DRAFT' | 'PUBLISHED'>)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead>Health</TableHead>
                  <TableHead>Read time</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {post.category?.name ?? 'Uncategorized'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={post.status === 'DRAFT' ? 'secondary' : 'default'}>{post.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <BlogHealthIndicator post={post} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.readingTime} min</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.viewCount}</TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No drafts found.</p>
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
