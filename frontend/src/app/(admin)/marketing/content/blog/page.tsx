'use client'

import { useState } from 'react'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function MarketingBlogPostsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading } = useBlogPosts({ status: 'PUBLISHED', page: currentPage, limit: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Blog posts</h1>
        <p className="text-muted-foreground">Published marketing articles.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Published posts</CardTitle>
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
                      <Badge>{post.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.readingTime} min</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{post.viewCount}</TableCell>
                    <TableCell>{formatDate(post.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No published posts yet.</p>
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
