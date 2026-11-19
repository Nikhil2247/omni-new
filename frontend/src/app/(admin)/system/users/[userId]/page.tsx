'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Laptop, LogOut, Mail, Shield, ShieldAlert, ShieldCheck, UserCog } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useDeleteUser } from '@/hooks/queries/use-admin-catalog'
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
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ConfirmDialog,
  DataTable,
  PageHeader,
  Panel,
  StatusBadge,
  type DataColumn,
} from '@/components/dash'
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
  const deleteUser = useDeleteUser()
  const router = useRouter()

  const [status, setStatus] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [isChangingRole, setIsChangingRole] = useState(false)
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false)
  const [confirmRevokeAllOpen, setConfirmRevokeAllOpen] = useState(false)
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

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

  const isProtectedAdmin = Boolean(user.userRoles?.some((r) => r.role.name === 'ADMIN_SYSTEM'))

  return (
    <div className="space-y-4">
      <PageHeader
        title="User details"
        leading={
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/system/users">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Users
            </Link>
          </Button>
        }
      />

      {/* Identity card */}
      <section className="bg-card rounded-xl border p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-primary/10 text-primary flex size-14 shrink-0 items-center justify-center rounded-full text-lg font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-tight">{formatName(user)}</h2>
              <StatusBadge status={user.status}>{formatStatus(user.status)}</StatusBadge>
            </div>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Mail className="size-3.5" aria-hidden />
              <span className="truncate">{user.email}</span>
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
              <Shield className="size-3.5" aria-hidden />
              {currentRole ? currentRole.role.displayName : 'No role assigned'}
            </p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-4 sm:grid-cols-3 lg:grid-cols-6">
          <Fact label="Joined" value={formatDateTime(user.createdAt)} />
          <Fact label="Last login" value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'} />
          <Fact label="Email" value={user.emailVerified ? 'Verified' : 'Unverified'} />
          <Fact label="Two-factor" value={user.twoFactorEnabled ? 'Enabled' : 'Disabled'} />
          <Fact label="Onboarding" value={user.hasCompletedOnboarding ? 'Complete' : 'Pending'} />
          <Fact label="Active sessions" value={String(sessionList.length)} />
        </dl>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Roles and access */}
          <Panel title="Role and access" icon={UserCog} description="Controls what this user can do">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label className="text-sm font-medium">Assigned role</Label>
                  {currentRole ? (
                    <span className="text-sm">{currentRole.role.displayName}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">No role</span>
                  )}
                </div>
                {isChangingRole || !currentRole ? (
                  <div className="space-y-2">
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-full">
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
                      <Button onClick={handleRoleSave} disabled={!selectedRole || isSavingRole} className="flex-1">
                        {isSavingRole ? 'Saving...' : currentRole ? 'Change role' : 'Assign role'}
                      </Button>
                      {currentRole && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangingRole(false)
                            setSelectedRole('')
                          }}
                          disabled={isSavingRole}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsChangingRole(true)}>
                    Change role
                  </Button>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Account status</Label>
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
                <p className="text-muted-foreground text-xs">Suspending or deleting asks for confirmation first.</p>
              </div>
            </div>
          </Panel>

          {/* Sessions / activity */}
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
        </div>

        <div className="space-y-4">
          <Panel title="Account details" icon={ShieldCheck}>
            <dl className="divide-border/60 divide-y text-sm">
              <DetailRow label="Status">
                <StatusBadge status={user.status}>{formatStatus(user.status)}</StatusBadge>
              </DetailRow>
              <DetailRow label="Email verified">{user.emailVerified ? 'Yes' : 'No'}</DetailRow>
              <DetailRow label="Two-factor">{user.twoFactorEnabled ? 'Enabled' : 'Disabled'}</DetailRow>
              <DetailRow label="Onboarding">{user.hasCompletedOnboarding ? 'Complete' : 'Pending'}</DetailRow>
              <DetailRow label="Last login">{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '—'}</DetailRow>
              <DetailRow label="Created">{formatDateTime(user.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(user.updatedAt)}</DetailRow>
            </dl>
          </Panel>

          <section className="border-destructive/40 bg-card rounded-xl border p-3.5 shadow-xs">
            <h2 className="text-destructive text-sm font-semibold">Danger zone</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Deleting disables this account and signs the user out everywhere. Their records are kept for
              compliance. System administrators cannot be deleted.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="mt-3 w-full"
              disabled={user.status === 'DELETED' || isProtectedAdmin}
              onClick={() => setConfirmDeleteOpen(true)}
            >
              {user.status === 'DELETED' ? 'Already deleted' : 'Delete user'}
            </Button>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title="Delete this user?"
        description="The account is disabled and signed out on every device. This cannot be undone from here."
        confirmLabel="Delete user"
        loading={deleteUser.isPending}
        onConfirm={async () => {
          await deleteUser.mutateAsync(user.id)
          router.push('/system/users')
        }}
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="truncate text-sm font-medium">{value}</dd>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
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
