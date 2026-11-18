'use client'

import { useMarketingCategories } from '@/hooks/queries/use-marketing'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dashboard'

type Category = NonNullable<ReturnType<typeof useMarketingCategories>['data']>[number]

const columns: DataColumn<Category>[] = [
  { id: 'name', header: 'Name', cell: (c) => <span className="font-medium">{c.name}</span>, sortValue: (c) => c.name },
  { id: 'slug', header: 'Slug', cell: (c) => c.slug || '—', sortValue: (c) => c.slug },
  {
    id: 'status',
    header: 'Status',
    cell: (c) => <StatusBadge tone={c.isActive ? 'success' : 'neutral'}>{c.isActive ? 'Active' : 'Inactive'}</StatusBadge>,
    sortValue: (c) => (c.isActive ? 1 : 0),
    exportValue: (c) => (c.isActive ? 'Active' : 'Inactive'),
  },
]

export default function MarketingCategoriesPage() {
  const { data, isLoading } = useMarketingCategories()

  return (
    <div className="space-y-3">
      <PageHeader title="Categories" />
      <DataTable
        data={data}
        columns={columns}
        rowKey={(c) => c.id}
        isLoading={isLoading}
        exportFilename="categories"
        emptyTitle="No categories available"
      />
    </div>
  )
}
