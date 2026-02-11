'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { ROLE_GROUPS } from '@/config/roles'
import { useAdminUsers } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { AdminUser } from '@/lib/api/types/admin.types'

export default function SystemStaffUsersPage() {
  const [query, setQuery] = useState('')

  const params = useMemo(
    () => ({
      query: query.trim() || undefined,
      page: 1,
      limit: 100,
    }),
    [query]
  )

  const { data, isLoading } = useAdminUsers(params)
  const staffUsers = useMemo(() => filterStaff(data?.data ?? []), [data])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Staff</h1>
        <p className="text-muted-foreground">Internal team accounts across departments.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle>Staff users</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : staffUsers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Roles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{formatName(user)}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(user.status)}>{user.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.userRoles?.length
                          ? user.userRoles.map((role) => (
                              <Badge key={role.id} variant="secondary">
                                {role.role.displayName}
                              </Badge>
                            ))
                          : '—'}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No staff users found.</p>
          )}
        </CardContent>
      </Card>
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

function statusVariant(status: string) {
  if (status === 'active') return 'default'
  if (status === 'suspended') return 'destructive'
  return 'secondary'
}
