'use client'

import { useState } from 'react'
import { useCreateFeatureFlag, useFeatureFlags, useUpdateFeatureFlag } from '@/hooks/queries/use-admin'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function SystemFeaturesPage() {
  const { data, isLoading } = useFeatureFlags()
  const createFlag = useCreateFeatureFlag()
  const updateFlag = useUpdateFeatureFlag()

  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')
  const [enabled, setEnabled] = useState(false)

  const handleCreate = () => {
    if (!key.trim()) return
    createFlag.mutate({
      key: key.trim(),
      description: description.trim() || undefined,
      enabled,
    })
    setKey('')
    setDescription('')
    setEnabled(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System features</h1>
        <p className="text-muted-foreground">Enable or disable platform feature flags.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create feature flag</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input placeholder="Flag key" value={key} onChange={(e) => setKey(e.target.value)} />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <span className="text-sm text-muted-foreground">Enabled</span>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="md:col-span-3">
            <Button onClick={handleCreate} disabled={!key.trim() || createFlag.isPending}>
              Create flag
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Key</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-medium">{flag.key}</TableCell>
                    <TableCell>{flag.description || '—'}</TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.enabled}
                        onCheckedChange={(value) =>
                          updateFlag.mutate({ id: flag.id, enabled: value })
                        }
                        disabled={updateFlag.isPending}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No feature flags configured.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
