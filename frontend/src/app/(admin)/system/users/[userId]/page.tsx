'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  useAdminRoles,
  useAdminUser,
  useAssignUserRole,
  useRemoveUserRole,
  useRevokeAllSessions,
  useRevokeSession,
  useUpdateUserStatus,
  useUserSessions,
} from '@/hooks/queries/use-admin'
import type { AdminUser } from '@/lib/api/types/admin.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SystemUserDetailPage() {
  const params = useParams()
  const userId = useMemo(() => {
    const value = params?.userId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data: user, isLoading } = useAdminUser(userId ?? '')
  const { data: roles } = useAdminRoles()
  const { data: sessions } = useUserSessions(userId ?? '')
  const updateStatus = useUpdateUserStatus(userId ?? '')
  const assignRole = useAssignUserRole(userId ?? '')
  const removeRole = useRemoveUserRole(userId ?? '')
  const revokeSession = useRevokeSession(userId ?? '')
  const revokeAll = useRevokeAllSessions(userId ?? '')

  const [status, setStatus] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  useEffect(() => {
    if (user?.status) {
      setStatus(user.status)
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!user) {
    return <div className="text-sm text-destructive">User not found.</div>
  }

  const sessionList = (sessions ?? []) as UserSession[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{formatName(user)}</h1>
        <p className="text-muted-foreground">{user.email}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => updateStatus.mutate(status)}
              disabled={!status || updateStatus.isPending}
            >
              Update status
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {user.userRoles?.length ? (
                user.userRoles.map((role) => (
                  <div key={role.id} className="flex items-center gap-2">
                    <Badge variant="secondary">{role.role.displayName}</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRole.mutate(role.role.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">No roles assigned.</span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign role" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => assignRole.mutate(selectedRole)}
                disabled={!selectedRole || assignRole.isPending}
              >
                Assign role
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <span>{user.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span>{formatDateTime(user.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Updated</span>
              <span>{formatDateTime(user.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between sm:flex-row">
          <CardTitle>Active sessions</CardTitle>
          <Button variant="outline" size="sm" onClick={() => revokeAll.mutate()} disabled={revokeAll.isPending}>
            Revoke all sessions
          </Button>
        </CardHeader>
        <CardContent>
          {sessionList.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessionList.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      <div className="font-medium">{session.deviceName || session.deviceType || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">{session.ipAddress || '—'}</div>
                    </TableCell>
                    <TableCell>{session.location || '—'}</TableCell>
                    <TableCell>{formatDateTime(session.lastActiveAt || session.createdAt || '')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeSession.mutate(session.id)}
                        disabled={revokeSession.isPending}
                      >
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No active sessions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

type UserSession = NonNullable<AdminUser['sessions']>[number]
