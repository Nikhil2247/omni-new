'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { BlogHealthIndicator } from '@/components/marketing/blog-health-indicator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, PageHeader, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dashboard'
import type { BlogStatus } from '@/lib/api/types/marketing.types'

type StatusFilter = Extract<BlogStatus, 'DRAFT' | 'PUBLISHED'>

export default function MarketingBlogPostsPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [status, setStatus] = useState<StatusFilter>('PUBLISHED')

  useEffect(() => {
    setCurrentPage(1)
  }, [status])

  const { data, isLoading } = useBlogPosts({ status, page: currentPage, limit: 20 })
  type Post = NonNullable<typeof data>['data'][number]

  const columns: DataColumn<Post>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (p) => <TwoLineCell title={p.title} subtitle={p.category?.name ?? 'Uncategorized'} />,
      exportValue: (p) => p.title,
    },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, exportValue: (p) => p.status },
    { id: 'health', header: 'Health', cell: (p) => <BlogHealthIndicator post={p} />, hideBelow: 'lg' },
    { id: 'read', header: 'Read time', cell: (p) => `${p.readingTime} min`, hideBelow: 'md' },
    { id: 'views', header: 'Views', cell: (p) => p.viewCount, hideBelow: 'md' },
    { id: 'updated', header: 'Updated', cell: (p) => formatDate(p.updatedAt), exportValue: (p) => formatDate(p.updatedAt) },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Blog posts" />
      <DataTable
        data={data?.data}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        filters={
          <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
            <SelectTrigger size="sm" className="h-8 gap-1.5 text-[13px]">
              <span className="text-muted-foreground">Status:</span>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="PUBLISHED">Published</SelectItem>
            </SelectContent>
          </Select>
        }
        rowActions={(p) => [
          { label: 'Edit', icon: Pencil, href: `/marketing/content/${p.id}` },
        ]}
        exportFilename="blog-posts"
        emptyTitle="No published posts yet"
        serverPagination={{
          page: currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? data?.data?.length ?? 0,
          onPageChange: setCurrentPage,
        }}
      />
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

