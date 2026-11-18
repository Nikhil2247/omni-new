'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  useAdminRoles,
  useAdminUser,
  useAssignUserRole,
  useUpdateUserStatus,
} from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog, PageHeader } from '@/components/dashboard'
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

  const { data: user, isLoading, refetch: refetchUser } = useAdminUser(userId ?? '')
  const { data: roles } = useAdminRoles()
  const updateStatus = useUpdateUserStatus(userId ?? '')
  const assignRole = useAssignUserRole(userId ?? '')

  const [status, setStatus] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)

  // Sync local status state with server value (backend returns uppercase enum)
  useEffect(() => {
    if (user?.status) {
      setStatus(user.status)
    }
  }, [user?.status])

  const currentRole = user?.userRoles?.[0] ?? null

  const handleRoleSave = async () => {
    if (!selectedRole) return
    try {
      // Backend atomically removes all existing roles and assigns the new one
      await assignRole.mutateAsync(selectedRole)
      await refetchUser()
      toast.success('Role updated successfully')
      setSelectedRole('')
      setIsChangingRole(false)
    } catch {
      // individual errors are toasted in the hooks
    }
  }

  const isSavingRole = assignRole.isPending

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full rounded-lg" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-50 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive">User not found.</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/admin/users"><ArrowLeft className="mr-1 h-4 w-4" />Back to users</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title={formatName(user)}
        leading={
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/admin/users"><ArrowLeft className="mr-1 h-4 w-4" />Users</Link>
          </Button>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Status card */}
        <Card>
          <CardHeader>
            <CardTitle>Account status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Status select uses uppercase values matching Prisma UserStatus enum */}
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() =>
                status === 'SUSPENDED' || status === 'DELETED'
                  ? setConfirmStatusOpen(true)
                  : updateStatus.mutate(status)
              }
              disabled={!status || updateStatus.isPending || status === user.status}
              className="w-full"
            >
              {updateStatus.isPending ? 'Saving...' : 'Update status'}
            </Button>
          </CardContent>
        </Card>

        {/* Role card — single role enforced */}
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Current role display */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Current role</p>
              {currentRole ? (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {currentRole.role.displayName}
                </Badge>
              ) : (
                <span className="text-sm text-muted-foreground">No role assigned</span>
              )}
            </div>

            {/* Change / assign role */}
            {isChangingRole || !currentRole ? (
              <div className="space-y-2">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder={currentRole ? 'Select new role' : 'Assign a role'} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles
                      ?.filter((r) => r.id !== currentRole?.role.id)
                      .map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button
                    onClick={handleRoleSave}
                    disabled={!selectedRole || isSavingRole}
                    className="flex-1"
                  >
                    {isSavingRole ? 'Saving...' : currentRole ? 'Change role' : 'Assign role'}
                  </Button>
                  {currentRole && (
                    <Button
                      variant="outline"
                      onClick={() => { setIsChangingRole(false); setSelectedRole('') }}
                      disabled={isSavingRole}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsChangingRole(true)}
              >
                Change role
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Account details card */}
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={statusVariant(user.status)} className="text-xs">{formatStatus(user.status)}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email verified</span>
              <span>{user.emailVerified ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">2FA enabled</span>
              <span>{user.twoFactorEnabled ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last login</span>
              <span>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Onboarding</span>
              <span>{user.hasCompletedOnboarding ? 'Complete' : 'Pending'}</span>
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

      <ConfirmDialog
        {...{ open: confirmStatusOpen, onOpenChange: setConfirmStatusOpen }}
        title={status === 'DELETED' ? 'Delete this account?' : 'Suspend this account?'}
        description={`This will set the account status to ${formatStatus(status)}.`}
        confirmLabel={status === 'DELETED' ? 'Delete' : 'Suspend'}
        loading={updateStatus.isPending}
        onConfirm={() => updateStatus.mutateAsync(status)}
      />
    </div>
  )
}

function formatName(user: { firstName: string | null; lastName: string | null; email: string }) {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return name || user.email
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

function statusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  if (status === 'ACTIVE') return 'default'
  if (status === 'SUSPENDED' || status === 'DELETED') return 'destructive'
  return 'secondary'
}