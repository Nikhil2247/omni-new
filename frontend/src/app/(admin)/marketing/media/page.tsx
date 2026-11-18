'use client'

import { useEffect } from 'react'
import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useMarketingMedia } from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { DataTable, PageHeader, TwoLineCell, type DataColumn } from '@/components/dash'

type Asset = NonNullable<ReturnType<typeof useMarketingMedia>['data']>[number]

const columns: DataColumn<Asset>[] = [
  {
    id: 'name',
    header: 'Name',
    cell: (a) => <TwoLineCell title={a.name || 'Untitled asset'} subtitle={a.url || 'No URL provided'} />,
    sortValue: (a) => a.name,
    exportValue: (a) => a.name,
  },
  { id: 'type', header: 'Type', cell: (a) => a.type || 'Unknown type', sortValue: (a) => a.type },
]

export default function MarketingMediaPage() {
  const { data, isLoading } = useMarketingMedia()
  const { track } = useUmami()

  useEffect(() => {
    track('marketing:media:page_view', { totalMedia: data?.length || 0 })
  }, [data, track])

  return (
    <RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true}>
    <div className="space-y-3">
      <PageHeader title="Media library" />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(a) => a.id}
        isLoading={isLoading}
        exportFilename="media"
        emptyTitle="No media assets available"
      />
    </div>
    </RoleGuard>
  )
}
