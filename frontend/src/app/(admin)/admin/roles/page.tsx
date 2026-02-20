'use client'

import { useState } from 'react'
import { Plus, ShieldOff, Trash2 } from 'lucide-react'
import { useAdminRoles, useCreateRole, useDeleteRole } from '@/hooks/queries/use-admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function AdminRolesPage() {
  const { data, isLoading } = useAdminRoles()
  const createRole = useCreateRole()
  const deleteRole = useDeleteRole()

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">Define platform roles — each user holds exactly one role</p>
      </div>

      {/* Create role form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create new role
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
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
          <div className="mt-3">
            <Button onClick={handleCreate} disabled={!name || !displayName || createRole.isPending}>
              {createRole.isPending ? 'Creating...' : 'Create role'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roles table */}
      <Card>
        <CardHeader>
          <CardTitle>All roles</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Display name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-mono text-sm font-medium">{role.name}</TableCell>
                    <TableCell>{role.displayName}</TableCell>
                    <TableCell className="text-muted-foreground">{role.level}</TableCell>
                    <TableCell>
                      <Badge variant={role.isSystem ? 'default' : 'secondary'}>
                        {role.isSystem ? 'System' : 'Custom'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRole.mutate(role.id)}
                        disabled={deleteRole.isPending || role.isSystem}
                        className="text-destructive hover:text-destructive"
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <ShieldOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-4 text-sm font-medium">No roles defined</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first role using the form above.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}