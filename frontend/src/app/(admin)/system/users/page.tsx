'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Users } from 'lucide-react'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import {
  DataTable,
  FilterSelect,
  PageHeader,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dashboard'

export default function SystemUsersPage() {
  const { track } = useUmami()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

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

  useEffect(() => {
    track('system:users:page_view', { totalUsers: data?.data?.length || 0 })
  }, [data, track])

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
      id: 'roles',
      header: 'Roles',
      label: 'Roles',
      cell: (user) => (
        <div className="flex flex-wrap gap-1">
          {user.userRoles?.length ? (
            user.userRoles.map((role) => (
              <StatusBadge key={role.id} tone="purple">
                {role.role.displayName}
              </StatusBadge>
            ))
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
      exportValue: (user) => user.userRoles?.map((r) => r.role.displayName).join(', ') ?? '',
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
          { label: 'View user', icon: Eye, href: `/system/users/${user.id}` },
        ]}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 20,
          total: data?.meta?.total ?? rows.length,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No users found"
        emptyIcon={Users}
        exportFilename="system-users"
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
