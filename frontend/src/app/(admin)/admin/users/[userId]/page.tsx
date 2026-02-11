'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  useAdminRoles,
  useAdminUser,
  useAssignUserRole,
  useRemoveUserRole,
  useUpdateUserStatus,
} from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminUserDetailPage() {
  const params = useParams()
  const userId = useMemo(() => {
    const value = params?.userId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data: user, isLoading } = useAdminUser(userId ?? '')
  const { data: roles } = useAdminRoles()
  const updateStatus = useUpdateUserStatus(userId ?? '')
  const assignRole = useAssignUserRole(userId ?? '')
  const removeRole = useRemoveUserRole(userId ?? '')

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