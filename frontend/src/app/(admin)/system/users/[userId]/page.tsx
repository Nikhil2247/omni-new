'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Laptop,
  LogIn,
  LogOut,
  Mail,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  UserCog,
  XCircle,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  useAdminRoles,
  useAdminUser,
  useAssignUserRole,
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
import { Separator } from '@/components/ui/separator'
import {
  ConfirmDialog,
  DataTable,
  PageHeader,
  type DataColumn,
} from '@/components/dashboard'
import { Skeleton } from '@/components/ui/skeleton'

type UserSession = NonNullable<AdminUser['sessions']>[number]

export default function SystemUserDetailPage() {
  const params = useParams()
  const userId = useMemo(() => {
    const value = params?.userId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data: user, isLoading, refetch: refetchUser } = useAdminUser(userId ?? '')
  const { data: roles } = useAdminRoles()
  const { data: sessions } = useUserSessions(userId ?? '')
  const updateStatus = useUpdateUserStatus(userId ?? '')
  const assignRole = useAssignUserRole(userId ?? '')
  const revokeSession = useRevokeSession(userId ?? '')
  const revokeAll = useRevokeAllSessions(userId ?? '')

  const [status, setStatus] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false)

  useEffect(() => {
    if (user?.status) setStatus(user.status)
  }, [user?.status])

  const currentRole = user?.userRoles?.[0] ?? null
  const isSavingRole = assignRole.isPending
  const sessionList = (sessions ?? []) as UserSession[]

  const handleRoleSave = async () => {
    if (!selectedRole) return
    try {
      await assignRole.mutateAsync(selectedRole)
      await refetchUser()
      toast.success('Role updated successfully')
      setSelectedRole('')
      setIsChangingRole(false)
    } catch {
      // individual errors toasted in hooks
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="grid gap-3 lg:grid-cols-3">
          <Skeleton className="lg:col-span-2 h-56" />
          <Skeleton className="h-56" />
        </div>
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-50 flex-col items-center justify-center gap-3">
        <ShieldAlert className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">User not found</p>
        <Button asChild variant="outline" size="sm">
          <Link href="/system/users">
            <ArrowLeft className="mr-1 h-4 w-4" />Back to users
          </Link>
        </Button>
      </div>
    )
  }

  const initials = getInitials(user)

  const sessionColumns: DataColumn<UserSession>[] = [
    {
      id: 'device',
      header: 'Device',
      label: 'Device',
      cell: (session) => (
        <div className="min-w-0 leading-tight">
          <div className="truncate text-sm font-medium">{session.deviceName || session.deviceType || 'Unknown device'}</div>
          <div className="text-xs text-muted-foreground">{session.ipAddress || '—'}</div>
        </div>
      ),
      exportValue: (session) => session.deviceName || session.deviceType || 'Unknown device',
    },
    {
      id: 'location',
      header: 'Location',
      label: 'Location',
      cell: (session) => <span className="text-sm">{session.location || '—'}</span>,
      exportValue: (session) => session.location || '',
    },
    {
      id: 'lastActive',
      header: 'Last active',
      label: 'Last active',
      cell: (session) => (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(session.lastActiveAt || session.createdAt || '')}
        </span>
      ),
      sortValue: (session) => session.lastActiveAt || session.createdAt || '',
      exportValue: (session) => formatDateTime(session.lastActiveAt || session.createdAt || ''),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader
        title={formatName(user)}
        leading={
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/system/users">
              <ArrowLeft className="mr-1 h-4 w-4" />Users
            </Link>
          </Button>
        }
      />

      {/* Profile overview card */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
              {initials}
            </div>
            {/* Name + email + badges */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                {user.email}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(user.status)} className="text-xs">
                  {formatStatus(user.status)}
                </Badge>
                {currentRole && (
                  <Badge variant="secondary" className="text-xs">
                    <Shield className="mr-1 h-3 w-3" />
                    {currentRole.role.displayName}
                  </Badge>
                )}
                {user.emailVerified ? (
                  <Badge variant="outline" className="gap-1 text-xs text-emerald-600 border-emerald-200">
                    <CheckCircle2 className="h-3 w-3" />Email verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-200">
                    <XCircle className="h-3 w-3" />Unverified
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {/* Quick stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="text-center">
              <p className="text-lg font-semibold">{sessionList.length}</p>
              <p className="text-xs text-muted-foreground">Active sessions</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{user.twoFactorEnabled ? 'On' : 'Off'}</p>
              <p className="text-xs text-muted-foreground">2FA</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold">{user.hasCompletedOnboarding ? '✓' : '–'}</p>
              <p className="text-xs text-muted-foreground">Onboarding</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Management + Details */}
      <div className="grid gap-3 lg:grid-cols-3">

        {/* Left: Status + Role management (spans 2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-4 w-4 text-muted-foreground" />
              Account management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">

            {/* Status section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Account status</p>
                </div>
                <Badge variant={statusVariant(user.status)}>{formatStatus(user.status)}</Badge>
              </div>
              <div className="flex gap-2">
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="flex-1">
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
                >
                  {updateStatus.isPending ? 'Saving...' : 'Apply'}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Role section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Assigned role</p>
                </div>
                {currentRole ? (
                  <Badge variant="secondary">
                    <Shield className="mr-1 h-3 w-3" />
                    {currentRole.role.displayName}
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">No role</span>
                )}
              </div>

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
            </div>

          </CardContent>
        </Card>

        {/* Right: Account details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Account details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 divide-y text-sm">
            <DetailRow label="Status">
              <Badge variant={statusVariant(user.status)} className="text-xs">{formatStatus(user.status)}</Badge>
            </DetailRow>
            <DetailRow label="Email verified">
              {user.emailVerified
                ? <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Yes</span>
                : <span className="flex items-center gap-1 text-amber-600"><XCircle className="h-3.5 w-3.5" />No</span>}
            </DetailRow>
            <DetailRow label="2FA">
              {user.twoFactorEnabled
                ? <span className="flex items-center gap-1 text-emerald-600"><ShieldCheck className="h-3.5 w-3.5" />Enabled</span>
                : <span className="flex items-center gap-1 text-muted-foreground"><ShieldOff className="h-3.5 w-3.5" />Disabled</span>}
            </DetailRow>
            <DetailRow label="Onboarding">
              <span className={user.hasCompletedOnboarding ? 'text-emerald-600' : 'text-amber-600'}>
                {user.hasCompletedOnboarding ? 'Complete' : 'Pending'}
              </span>
            </DetailRow>
            <DetailRow label="Last login">
              <span className="flex items-center gap-1">
                <LogIn className="h-3.5 w-3.5 text-muted-foreground" />
                {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}
              </span>
            </DetailRow>
            <DetailRow label="Created">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDateTime(user.createdAt)}
              </span>
            </DetailRow>
            <DetailRow label="Updated">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {formatDateTime(user.updatedAt)}
              </span>
            </DetailRow>
          </CardContent>
        </Card>
      </div>

      {/* Sessions */}
      <DataTable
        data={sessionList}
        columns={sessionColumns}
        rowKey={(session) => session.id}
        toolbarRight={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmRevokeAllOpen(true)}
            disabled={revokeAll.isPending || sessionList.length === 0}
            className="text-destructive hover:text-destructive"
          >
            {revokeAll.isPending ? 'Revoking...' : 'Revoke all sessions'}
          </Button>
        }
        rowActions={(session) => [
          {
            label: 'Revoke session',
            icon: LogOut,
            danger: true,
            disabled: revokeSession.isPending,
            onClick: () => revokeSession.mutate(session.id),
            confirm: {
              title: 'Revoke this session?',
              description: 'The device will be signed out immediately.',
              confirmLabel: 'Revoke',
            },
          },
        ]}
        emptyTitle="No active sessions"
        emptyIcon={Laptop}
      />

      <ConfirmDialog
        open={confirmStatusOpen}
        onOpenChange={setConfirmStatusOpen}
        title={status === 'DELETED' ? 'Delete this account?' : 'Suspend this account?'}
        description={`This will set the account status to ${formatStatus(status)}.`}
        confirmLabel={status === 'DELETED' ? 'Delete' : 'Suspend'}
        loading={updateStatus.isPending}
        onConfirm={() => updateStatus.mutateAsync(status)}
      />
      <ConfirmDialog
        open={confirmRevokeAllOpen}
        onOpenChange={setConfirmRevokeAllOpen}
        title="Revoke all sessions?"
        description="Every device signed in as this user will be signed out."
        confirmLabel="Revoke all"
        loading={revokeAll.isPending}
        onConfirm={() => revokeAll.mutateAsync()}
      />
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  )
}

function getInitials(user: { firstName: string | null; lastName: string | null; email: string }) {
  if (user.firstName && user.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  if (user.firstName) return user.firstName.slice(0, 2).toUpperCase()
  return user.email.slice(0, 2).toUpperCase()
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
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
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
