'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { DataTable, PageHeader, StatusBadge, UserCell, type DataColumn } from '@/components/dashboard'

export default function SystemVendorUsersPage() {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      role: 'BUSINESS_ADMIN',
      page: currentPage,
      limit: 50,
    }),
    [query, currentPage]
  )

  const { data, isLoading } = useAdminUsers(params)
  const rows = data?.data ?? []

  const columns: DataColumn<(typeof rows)[number]>[] = [
    {
      id: 'user',
      header: 'User',
      label: 'User',
      cell: (user) => <UserCell name={formatName(user)} subtitle={user.email} />,
      exportValue: (user) => `${formatName(user)} <${user.email}>`,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (user) => <StatusBadge status={user.status} />,
      exportValue: (user) => user.status,
    },
    {
      id: 'joined',
      header: 'Joined',
      label: 'Joined',
      cell: (user) => <span className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</span>,
      exportValue: (user) => formatDate(user.createdAt),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Vendors" />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        search={{ value: query, onChange: setQuery, placeholder: 'Search vendors' }}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 50,
          total: data?.meta?.total ?? rows.length,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No vendors found"
        emptyIcon={Users}
        exportFilename="system-vendors"
      />
    </div>
  )
}

function formatName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
