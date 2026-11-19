'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, Ban, ExternalLink, RotateCcw, Store, Trash2 } from 'lucide-react'
import {
  useAdminCategories,
  useAdminVendorStats,
  useAdminVendors,
  useDeleteVendor,
  useUpdateVendorStatus,
} from '@/hooks/queries/use-admin-catalog'
import { DataTable, FilterSelect, PageHeader, StatusBadge, TwoLineCell, type DataColumn } from '@/components/dash'
import { cn } from '@/lib/utils'
import type { AdminVendor } from '@/lib/api/types/admin.types'

const PAGE_SIZE = 20

const STATUS_CHIPS: Array<{ value: string; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'UNCLAIMED', label: 'Unclaimed' },
  { value: 'SUSPENDED', label: 'Suspended' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export default function SystemVendorsPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [categoryId, setCategoryId] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [query, status, categoryId])

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      status: status === 'all' ? undefined : status,
      categoryId: categoryId === 'all' ? undefined : categoryId,
      page,
      limit: PAGE_SIZE,
    }),
    [query, status, categoryId, page],
  )

  const { data, isLoading, isError, refetch } = useAdminVendors(params)
  const { data: stats } = useAdminVendorStats()
  const { data: categories } = useAdminCategories()
  const updateStatus = useUpdateVendorStatus()
  const deleteVendor = useDeleteVendor()

  const rows = data?.data ?? []

  const columns: DataColumn<AdminVendor>[] = [
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      cell: (vendor) => <TwoLineCell title={vendor.businessName} subtitle={`/${vendor.slug}`} />,
      sortValue: (vendor) => vendor.businessName.toLowerCase(),
      exportValue: (vendor) => vendor.businessName,
    },
    {
      id: 'category',
      header: 'Category',
      label: 'Category',
      cell: (vendor) => <span className="text-sm">{vendor.category?.name ?? '-'}</span>,
      exportValue: (vendor) => vendor.category?.name ?? '',
    },
    {
      id: 'city',
      header: 'City',
      label: 'City',
      cell: (vendor) => <span className="text-sm">{vendor.cityName ?? '-'}</span>,
      exportValue: (vendor) => vendor.cityName ?? '',
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (vendor) => <StatusBadge status={vendor.status} />,
      exportValue: (vendor) => vendor.status,
    },
    {
      id: 'owner',
      header: 'Owner',
      label: 'Owner',
      cell: (vendor) =>
        vendor.user ? (
          <span className="text-sm">{vendor.user.email}</span>
        ) : (
          <span className="text-sm text-muted-foreground">Unclaimed listing</span>
        ),
      exportValue: (vendor) => vendor.user?.email ?? 'Unclaimed',
    },
    {
      id: 'activity',
      header: 'Leads / views',
      label: 'Leads / views',
      cell: (vendor) => (
        <span className="text-sm text-muted-foreground">
          {vendor.leadCount} / {vendor.viewCount}
        </span>
      ),
      exportValue: (vendor) => `${vendor.leadCount}/${vendor.viewCount}`,
    },
    {
      id: 'joined',
      header: 'Added',
      label: 'Added',
      cell: (vendor) => <span className="text-sm text-muted-foreground">{formatDate(vendor.createdAt)}</span>,
      exportValue: (vendor) => formatDate(vendor.createdAt),
    },
  ]

  const counts = stats?.byStatus ?? {}

  return (
    <div className="space-y-3">
      <PageHeader title="Vendors" />

      {/* Status chips with live counts */}
      <div className="flex flex-wrap gap-2">
        {STATUS_CHIPS.map((chip) => {
          const count = chip.value === 'all' ? stats?.total : counts[chip.value]
          const active = status === chip.value
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => setStatus(chip.value)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                active ? 'border-primary bg-primary/10 font-medium text-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {chip.label}
              {count !== undefined ? <span className="ml-1.5 text-xs opacity-70">{count}</span> : null}
            </button>
          )
        })}
      </div>

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(vendor) => vendor.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        search={{ value: query, onChange: setQuery, placeholder: 'Search name, slug, email or phone' }}
        filters={
          <FilterSelect
            label="Category"
            value={categoryId}
            onChange={setCategoryId}
            options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
          />
        }
        rowActions={(vendor) => {
          const hidden = vendor.status === 'SUSPENDED' || vendor.status === 'ARCHIVED'
          const visibleOnSite = vendor.status === 'ACTIVE' || vendor.status === 'UNCLAIMED'
          return [
            {
              label: 'Open public page',
              icon: ExternalLink,
              href: `/vendors/${vendor.slug}`,
              visible: visibleOnSite,
            },
            {
              label: 'Suspend (hide from site)',
              icon: Ban,
              visible: visibleOnSite,
              confirm: {
                title: `Suspend ${vendor.businessName}?`,
                description: 'The listing is hidden from the site and from search. You can restore it at any time.',
                confirmLabel: 'Suspend',
                tone: 'primary',
              },
              onClick: () => updateStatus.mutateAsync({ id: vendor.id, status: 'SUSPENDED' }),
            },
            {
              label: 'Restore to site',
              icon: RotateCcw,
              visible: hidden,
              confirm: {
                title: `Restore ${vendor.businessName}?`,
                description: 'The listing becomes visible on the site and in search again.',
                confirmLabel: 'Restore',
                tone: 'primary',
              },
              onClick: () =>
                updateStatus.mutateAsync({ id: vendor.id, status: vendor.claimed ? 'ACTIVE' : 'UNCLAIMED' }),
            },
            {
              label: 'Delete vendor',
              icon: Trash2,
              danger: true,
              visible: vendor.status !== 'ARCHIVED',
              confirm: {
                title: `Delete ${vendor.businessName}?`,
                description:
                  'The vendor is removed from the site and from search. Its data is kept, so you can bring it back later from the Archived filter.',
                confirmLabel: 'Delete vendor',
              },
              onClick: () => deleteVendor.mutateAsync({ id: vendor.id, permanent: false }),
            },
            {
              label: 'Delete permanently',
              icon: Archive,
              danger: true,
              visible: vendor.status === 'ARCHIVED',
              confirm: {
                title: `Permanently delete ${vendor.businessName}?`,
                description:
                  'This cannot be undone. It only works for vendors with no leads, reviews, payments or subscription; otherwise the vendor stays archived.',
                confirmLabel: 'Delete permanently',
              },
              onClick: () => deleteVendor.mutateAsync({ id: vendor.id, permanent: true }),
            },
          ]
        }}
        serverPagination={{
          page: data?.meta?.page ?? page,
          pageSize: PAGE_SIZE,
          total: data?.meta?.total ?? rows.length,
          onPageChange: setPage,
        }}
        emptyTitle="No vendors found"
        emptyIcon={Store}
        exportFilename="vendors"
      />
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(date)
}
