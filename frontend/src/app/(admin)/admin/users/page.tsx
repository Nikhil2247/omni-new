'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserCog, UserX } from 'lucide-react'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { trackDashboard } from '@/lib/analytics/umami'
import {
  DataTable,
  FilterSelect,
  PageHeader,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dash'

export default function AdminUsersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    trackDashboard.sectionView('admin-users', 'admin')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, status])

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      status: status === 'all' ? undefined : status,
      page: currentPage,
      limit: 20,
    }),
    [query, status, currentPage]
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
      cell: (user) => <StatusBadge status={user.status}>{formatStatus(user.status)}</StatusBadge>,
      exportValue: (user) => formatStatus(user.status),
    },
    {
      id: 'role',
      header: 'Role',
      label: 'Role',
      cell: (user) =>
        user.userRoles?.[0] ? (
          <StatusBadge tone="purple">{user.userRoles[0].role.displayName}</StatusBadge>
        ) : (
          <span className="text-xs text-muted-foreground">No role</span>
        ),
      exportValue: (user) => user.userRoles?.[0]?.role.displayName ?? '',
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
      <PageHeader title="Users" />

      <DataTable
        data={rows}
        columns={columns}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        search={{ value: query, onChange: setQuery, placeholder: 'Search users' }}
        filters={
          <FilterSelect
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
          />
        }
        rowActions={(user) => [
          { label: 'Manage user', icon: UserCog, href: `/admin/users/${user.id}` },
        ]}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? rows.length,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No users found"
        emptyIcon={UserX}
        exportFilename="admin-users"
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

function formatStatus(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    SUSPENDED: 'Suspended',
    DELETED: 'Deleted',
  }
  return map[status] ?? status
}
