'use client'

import Link from 'next/link'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function ContentWriterDashboardPage() {
  const { data, isLoading } = useBlogPosts({ status: 'DRAFT', page: 1, limit: 20 })

  return (
    <RoleGuard allowedRoles={[ROLES.CONTENT_WRITER]} redirectOnFail={true} exactMatch>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Content Writer Dashboard</h1>
            <p className="text-muted-foreground">Create and edit your draft blog posts. Publishing is handled by Marketing Admin.</p>
          </div>
          <Button asChild>
            <Link href="/marketing/content/new">Write New Draft</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>My Draft Posts</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40" />
            ) : data?.data?.length ? (
              <div className="space-y-3">
                {data.data.map((post) => (
                  <div key={post.id} className="flex items-center justify-between rounded-md border p-4">
                    <div>
                      <p className="font-medium">{post.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {formatDate(post.updatedAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{post.status}</Badge>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/marketing/content/${post.id}`}>Edit Draft</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No drafts yet. Start writing your first draft.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
