'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { useAdminRoles, useCreateRole, useDeleteRole } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Roles</h1>
        <p className="text-muted-foreground">Manage system roles and hierarchy.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create role</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
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

      <Card>
        <CardHeader>
          <CardTitle>Role list</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>System</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.displayName}</TableCell>
                    <TableCell>{role.level}</TableCell>
                    <TableCell>{role.isSystem ? 'Yes' : 'No'}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRole.mutate(role.id)}
                        disabled={deleteRole.isPending || role.isSystem}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No roles found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
