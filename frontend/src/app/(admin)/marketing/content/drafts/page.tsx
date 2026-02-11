'use client'

import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function MarketingDraftsPage() {
  const { data, isLoading } = useBlogPosts({ status: 'DRAFT', page: 1, limit: 20 })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Drafts</h1>
        <p className="text-muted-foreground">Content in progress and awaiting review.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft posts</CardTitle>
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
                      <Badge variant="secondary">{post.status}</Badge>
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
