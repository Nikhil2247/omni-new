'use client'

import { useMarketingPromotions } from '@/hooks/queries/use-marketing'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dashboard'

type Promotion = NonNullable<ReturnType<typeof useMarketingPromotions>['data']>[number]

const columns: DataColumn<Promotion>[] = [
  { id: 'name', header: 'Name', cell: (p) => <span className="font-medium">{p.name}</span>, sortValue: (p) => p.name },
  {
    id: 'status',
    header: 'Status',
    cell: (p) => <StatusBadge status={p.status || 'UNKNOWN'} />,
    sortValue: (p) => p.status,
    exportValue: (p) => p.status,
  },
  {
    id: 'endsAt',
    header: 'End date',
    cell: (p) => (p.endsAt ? formatDate(p.endsAt) : '—'),
    sortValue: (p) => (p.endsAt ? new Date(p.endsAt) : null),
    exportValue: (p) => (p.endsAt ? formatDate(p.endsAt) : ''),
  },
]

export default function MarketingPromotionsPage() {
  const { data, isLoading } = useMarketingPromotions()

  return (
    <div className="space-y-3">
      <PageHeader title="Promotions" />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        exportFilename="promotions"
        emptyTitle="No promotions available"
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
