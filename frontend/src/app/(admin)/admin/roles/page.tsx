'use client'

import { useEffect, useState } from 'react'
import { Plus, ShieldOff, Trash2 } from 'lucide-react'
import { useAdminRoles, useCreateRole, useDeleteRole } from '@/hooks/queries/use-admin'
import { trackDashboard } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dashboard'

export default function AdminRolesPage() {
  const { data, isLoading } = useAdminRoles()
  const createRole = useCreateRole()
  const deleteRole = useDeleteRole()

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    trackDashboard.sectionView('admin-roles', 'admin')
  }, [])

  const handleCreate = () => {
    if (!name || !displayName) return
    createRole.mutate({ name, displayName, description })
    setName('')
    setDisplayName('')
    setDescription('')
  }

  const columns: DataColumn<NonNullable<typeof data>[number]>[] = [
    {
      id: 'name',
      header: 'Name',
      label: 'Name',
      cell: (role) => <span className="font-mono text-sm font-medium">{role.name}</span>,
      sortValue: (role) => role.name,
    },
    {
      id: 'displayName',
      header: 'Display name',
      label: 'Display name',
      cell: (role) => role.displayName,
      sortValue: (role) => role.displayName,
    },
    {
      id: 'level',
      header: 'Level',
      label: 'Level',
      cell: (role) => <span className="text-muted-foreground">{role.level}</span>,
      sortValue: (role) => role.level,
    },
    {
      id: 'type',
      header: 'Type',
      label: 'Type',
      cell: (role) => (
        <StatusBadge tone={role.isSystem ? 'info' : 'neutral'}>
          {role.isSystem ? 'System' : 'Custom'}
        </StatusBadge>
      ),
      exportValue: (role) => (role.isSystem ? 'System' : 'Custom'),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Roles" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create new role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Role name (e.g. vendor)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              placeholder="Display name (e.g. Vendor)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-2">
            <Button onClick={handleCreate} disabled={!name || !displayName || createRole.isPending}>
              {createRole.isPending ? 'Creating...' : 'Create role'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <DataTable
        data={data}
        columns={columns}
        rowKey={(role) => role.id}
        isLoading={isLoading}
        rowActions={(role) => [
          {
            label: 'Delete role',
            icon: Trash2,
            danger: true,
            disabled: deleteRole.isPending || role.isSystem,
            onClick: () => deleteRole.mutate(role.id),
            confirm: {
              title: 'Delete role?',
              description: `"${role.displayName}" will be permanently removed. This cannot be undone.`,
            },
          },
        ]}
        emptyTitle="No roles defined"
        emptyIcon={ShieldOff}
      />
    </div>
  )
}
