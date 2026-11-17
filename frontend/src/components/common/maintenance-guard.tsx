'use client'

import { useEffect, useMemo } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth-store'
import { useSystemStatus } from '@/hooks/queries/use-public'
import { ROLES } from '@/config/roles'
import { Wrench } from 'lucide-react'
import { SplashScreen } from '@/components/common/splash-screen'

interface MaintenanceGuardProps {
  children: React.ReactNode
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { user, hasHydrated, logout } = useAuthStore()
  const { data, isLoading } = useSystemStatus()

  const userRoles = useMemo(() => {
    if (!user) return []
    return user.roles?.length ? user.roles : user.role ? [user.role] : []
  }, [user])

  const isSystemAdmin = userRoles.includes(ROLES.ADMIN_SYSTEM)
  const maintenanceMode = Boolean(data?.maintenanceMode)

  if (!hasHydrated || (isLoading && !data)) {
    return <MaintenanceLoading />
  }

  if (!maintenanceMode) {
    return children
  }

  if (isSystemAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="px-4 py-3">
          <Alert className="border-amber-200 bg-amber-50 text-amber-900">
            <Wrench />
            <AlertTitle>Maintenance mode is active</AlertTitle>
            <AlertDescription>
              The platform is currently restricted to system administrators.
            </AlertDescription>
          </Alert>
        </div>
        <div className="flex-1">{children}</div>
      </div>
    )
  }

  useEffect(() => {
    if (!maintenanceMode || isSystemAdmin) return
    if (user) {
      logout()
    }
  }, [isSystemAdmin, logout, maintenanceMode, user])

  return <MaintenanceScreen supportEmail={data?.supportEmail ?? undefined} />
}

function MaintenanceScreen({ supportEmail }: { supportEmail?: string }) {
  return (
    <div className="relative min-h-screen">
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto w-full max-w-lg rounded-2xl border bg-card p-8 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Wrench className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">System in maintenance</h1>
              <p className="text-sm text-muted-foreground">
                We’ll be back shortly. Thanks for your patience.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm text-muted-foreground">
            <p>
              The platform is currently undergoing maintenance and is temporarily unavailable.
              System administrators can still access the control panel.
            </p>
            {supportEmail ? (
              <Alert className="bg-muted/40">
                <AlertTitle>Need help?</AlertTitle>
                <AlertDescription>
                  Contact support at <span className="font-medium text-foreground">{supportEmail}</span>.
                </AlertDescription>
              </Alert>
            ) : null}
          </div>

          <div className="mt-6">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Check again
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MaintenanceLoading() {
  return <SplashScreen />
}
