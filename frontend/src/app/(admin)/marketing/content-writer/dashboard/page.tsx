'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CheckCircle2, FilePen, Archive, Pencil, PenLine } from 'lucide-react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useAuth } from '@/hooks/use-auth'
import { useBlogPosts } from '@/hooks/queries/use-marketing'
import { Button } from '@/components/ui/button'
import { DashboardHero, DataTable, HeroChip, KpiCard, KpiGrid, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dash'

export default function ContentWriterDashboardPage() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading } = useBlogPosts({ status: 'DRAFT', page: currentPage, limit: 20 })
  // Totals come from server-side counts.
  const { data: archived, isLoading: archivedLoading } = useBlogPosts({ status: 'ARCHIVED', page: 1, limit: 1 })
  const { data: published, isLoading: publishedLoading } = useBlogPosts({ status: 'PUBLISHED', page: 1, limit: 1 })
  type Post = NonNullable<typeof data>['data'][number]

  const draftCount = data?.meta?.total ?? data?.data?.length ?? 0
  const archivedCount = archived?.meta?.total ?? archived?.data?.length ?? 0
  const publishedCount = published?.meta?.total ?? published?.data?.length ?? 0

  const firstName = user?.name?.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const columns: DataColumn<Post>[] = [
    {
      id: 'title',
      header: 'Title',
      cell: (p) => <TwoLineCell title={p.title} subtitle={`Updated ${formatDate(p.updatedAt)}`} />,
      exportValue: (p) => p.title,
    },
    { id: 'status', header: 'Status', cell: (p) => <StatusBadge status={p.status} />, exportValue: (p) => p.status },
  ]

  return (
    <RoleGuard allowedRoles={[ROLES.CONTENT_WRITER]} redirectOnFail={true} exactMatch>
      <div className="space-y-4">
        <DashboardHero
          eyebrow="Content writer"
          title={firstName ? `${greeting}, ${firstName}` : greeting}
          subtitle="Pick up a draft or start something new."
          actions={
            <Button asChild size="sm">
              <Link href="/marketing/content/new"><PenLine className="size-3.5" /> Write new draft</Link>
            </Button>
          }
          aside={<HeroChip icon={FilePen} label="Drafts" value={isLoading ? '…' : draftCount} />}
        />

        <KpiGrid cols={3}>
          <KpiCard label="Drafts" value={draftCount} icon={FilePen} loading={isLoading} href="/marketing/content/drafts" />
          <KpiCard label="Archived" value={archivedCount} icon={Archive} loading={archivedLoading} />
          <KpiCard label="Published" value={publishedCount} icon={CheckCircle2} loading={publishedLoading} href="/marketing/content" />
        </KpiGrid>

        <DataTable
          data={data?.data}
          columns={columns}
          rowKey={(p) => p.id}
          isLoading={isLoading}
          rowActions={(p) => [{ label: 'Edit draft', icon: Pencil, href: `/marketing/content/${p.id}` }]}
          emptyTitle="No drafts yet. Start writing your first draft."
          serverPagination={{
            page: currentPage,
            pageSize: 20,
            total: data?.meta?.total ?? data?.data?.length ?? 0,
            onPageChange: setCurrentPage,
          }}
        />
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
