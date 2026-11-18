'use client'

import { useState, useEffect } from 'react'
import { ShieldOff, Trash2 } from 'lucide-react'
import { useAdminRoles, useCreateRole, useDeleteRole } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DataTable, PageHeader, StatusBadge, type DataColumn } from '@/components/dash'

export default function SystemRolesPage() {
  const { data, isLoading } = useAdminRoles()
  const createRole = useCreateRole()
  const deleteRole = useDeleteRole()
  const { track } = useUmami()

  useEffect(() => {
    track('system:roles:page_view', { totalRoles: data?.length || 0 })
  }, [data, track])

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')

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
      cell: (role) => <span className="font-medium">{role.name}</span>,
      sortValue: (role) => role.name,
    },
    {
      id: 'display',
      header: 'Display',
      label: 'Display',
      cell: (role) => role.displayName,
      sortValue: (role) => role.displayName,
    },
    {
      id: 'level',
      header: 'Level',
      label: 'Level',
      cell: (role) => role.level,
      sortValue: (role) => role.level,
    },
    {
      id: 'system',
      header: 'System',
      label: 'System',
      cell: (role) => (
        <StatusBadge tone={role.isSystem ? 'info' : 'neutral'}>{role.isSystem ? 'Yes' : 'No'}</StatusBadge>
      ),
      exportValue: (role) => (role.isSystem ? 'Yes' : 'No'),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Roles" />

      <Card>
        <CardHeader>
          <CardTitle>Create role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-3">
          <Input placeholder="Role name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Display name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="md:col-span-3">
            <Button onClick={handleCreate} disabled={!name || !displayName || createRole.isPending}>
              Create role
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
        emptyTitle="No roles found"
        emptyIcon={ShieldOff}
      />
    </div>
  )
}
