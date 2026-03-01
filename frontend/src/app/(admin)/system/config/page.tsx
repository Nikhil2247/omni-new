'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSystemConfig, useUpdateSystemConfig } from '@/hooks/queries/use-admin'
import { useUmami } from '@/hooks/use-umami'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function SystemConfigPage() {
  const { data, isLoading } = useSystemConfig()
  const updateConfig = useUpdateSystemConfig()
  const { track } = useUmami()

  useEffect(() => {
    track('system:config:page_view', { section: 'system_configuration' })
  }, [track])

  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationEnabled, setRegistrationEnabled] = useState(false)
  const [allowVendorOnboarding, setAllowVendorOnboarding] = useState(false)
  const [supportEmail, setSupportEmail] = useState('')
  const [environment, setEnvironment] = useState('')

  useEffect(() => {
    if (!data) return
    setMaintenanceMode(Boolean(data.maintenanceMode))
    setRegistrationEnabled(Boolean(data.registrationEnabled))
    setAllowVendorOnboarding(Boolean(data.allowVendorOnboarding))
    setSupportEmail(data.supportEmail || '')
    setEnvironment(data.environment || '')
  }, [data])

  const isDirty = useMemo(() => {
    if (!data) return false
    return (
      maintenanceMode !== Boolean(data.maintenanceMode) ||
      registrationEnabled !== Boolean(data.registrationEnabled) ||
      allowVendorOnboarding !== Boolean(data.allowVendorOnboarding) ||
      supportEmail !== (data.supportEmail || '')
    )
  }, [allowVendorOnboarding, data, maintenanceMode, registrationEnabled, supportEmail])

  const updateSetting = (payload: {
    maintenanceMode?: boolean
    registrationEnabled?: boolean
    allowVendorOnboarding?: boolean
    supportEmail?: string
  }) => {
    updateConfig.mutate(payload, {
      onSuccess: (updated) => {
        toast.success('System configuration updated.')
        if (updated) {
          setMaintenanceMode(Boolean(updated.maintenanceMode))
          setRegistrationEnabled(Boolean(updated.registrationEnabled))
          setAllowVendorOnboarding(Boolean(updated.allowVendorOnboarding))
          setSupportEmail(updated.supportEmail || '')
        }
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to update system configuration.')
        if (!data) return
        setMaintenanceMode(Boolean(data.maintenanceMode))
        setRegistrationEnabled(Boolean(data.registrationEnabled))
        setAllowVendorOnboarding(Boolean(data.allowVendorOnboarding))
        setSupportEmail(data.supportEmail || '')
      },
    })
  }

  const handleSave = () => {
    updateSetting({
      maintenanceMode,
      registrationEnabled,
      allowVendorOnboarding,
      supportEmail: supportEmail || undefined,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">System configuration</h1>
        <p className="text-muted-foreground">Toggle platform settings and maintenance mode.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Maintenance mode</p>
              <p className="text-sm text-muted-foreground">Temporarily disable platform access.</p>
            </div>
            <Switch
              checked={maintenanceMode}
              disabled={updateConfig.isPending}
              onCheckedChange={(value) => {
                setMaintenanceMode(value)
                updateSetting({ maintenanceMode: value })
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Registration enabled</p>
              <p className="text-sm text-muted-foreground">Allow new users to sign up.</p>
            </div>
            <Switch
              checked={registrationEnabled}
              disabled={updateConfig.isPending}
              onCheckedChange={(value) => {
                setRegistrationEnabled(value)
                updateSetting({ registrationEnabled: value })
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Vendor onboarding</p>
              <p className="text-sm text-muted-foreground">Accept new vendor applications.</p>
            </div>
            <Switch
              checked={allowVendorOnboarding}
              disabled={updateConfig.isPending}
              onCheckedChange={(value) => {
                setAllowVendorOnboarding(value)
                updateSetting({ allowVendorOnboarding: value })
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Support details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Input
            placeholder="Support email"
            value={supportEmail}
            onChange={(event) => setSupportEmail(event.target.value)}
          />
          <Input placeholder="Environment" value={environment} disabled />
          <div className="md:col-span-2">
            <Button onClick={handleSave} disabled={updateConfig.isPending || !isDirty}>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
