'use client'

import { useEffect, useMemo, useState } from 'react'
import { Eye, Trash2, Users } from 'lucide-react'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { useDeleteUser } from '@/hooks/queries/use-admin-catalog'
import { useUmami } from '@/hooks/use-umami'
import {
  DataTable,
  FilterSelect,
  PageHeader,
  StatusBadge,
  UserCell,
  type DataColumn,
} from '@/components/dash'

export default function SystemUsersPage() {
  const { track } = useUmami()
  const deleteUser = useDeleteUser()
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
              <StatusBadge key={role.id} tone="neutral">
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
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'DELETED', label: 'Deleted' },
            ]}
          />
        }
        rowActions={(user) => [
          { label: 'View user', icon: Eye, href: `/system/users/${user.id}` },
          {
            label: 'Delete user',
            icon: Trash2,
            danger: true,
            visible:
              user.status !== 'DELETED' && !user.userRoles?.some((entry) => entry.role.name === 'ADMIN_SYSTEM'),
            confirm: {
              title: `Delete ${formatName(user)}?`,
              description:
                'The account is disabled and signed out everywhere. Their records are kept for compliance.',
              confirmLabel: 'Delete user',
            },
            onClick: () => deleteUser.mutateAsync(user.id),
          },
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
