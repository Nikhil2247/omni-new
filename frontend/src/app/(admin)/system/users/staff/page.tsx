'use client'

import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { ROLE_GROUPS } from '@/config/roles'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { DataTable, PageHeader, StatusBadge, UserCell, type DataColumn } from '@/components/dash'
import type { AdminUser } from '@/lib/api/types/admin.types'

export default function SystemStaffUsersPage() {
  const [query, setQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [query])

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      page: currentPage,
      limit: 100,
    }),
    [query, currentPage]
  )

  const { data, isLoading } = useAdminUsers(params)
  const staffUsers = useMemo(() => filterStaff(data?.data ?? []), [data])

  const columns: DataColumn<AdminUser>[] = [
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
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Staff" />

      <DataTable
        data={staffUsers}
        columns={columns}
        rowKey={(user) => user.id}
        isLoading={isLoading}
        search={{ value: query, onChange: setQuery, placeholder: 'Search staff' }}
        serverPagination={{
          page: data?.meta?.page ?? currentPage,
          pageSize: 100,
          total: data?.meta?.total ?? staffUsers.length,
          onPageChange: setCurrentPage,
        }}
        emptyTitle="No staff users found"
        emptyIcon={Users}
        exportFilename="system-staff"
      />
    </div>
  )
}

function filterStaff(users: AdminUser[]) {
  const staffRoles = new Set<string>(ROLE_GROUPS.STAFF)
  return users.filter((user) =>
    user.userRoles?.some((assignment) => staffRoles.has(String(assignment.role.name)))
  )
}

function formatName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}
