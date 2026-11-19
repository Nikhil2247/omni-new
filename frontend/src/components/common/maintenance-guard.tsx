'use client'

import { useEffect, useMemo } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BgFx, Notice, NOTICE_ICONS, SketchButton } from '@/components/sketch'
import { useAuthStore } from '@/store/auth-store'
import { useSystemStatus } from '@/hooks/queries/use-public'
import { ROLES } from '@/config/roles'
import { Wrench } from 'lucide-react'

interface MaintenanceGuardProps {
  children: React.ReactNode
}

export function MaintenanceGuard({ children }: MaintenanceGuardProps) {
  const { user, logout } = useAuthStore()
  const { data } = useSystemStatus()

  const userRoles = useMemo(() => {
    if (!user) return []
    return user.roles?.length ? user.roles : user.role ? [user.role] : []
  }, [user])

  const isSystemAdmin = userRoles.includes(ROLES.ADMIN_SYSTEM)
  const maintenanceMode = Boolean(data?.maintenanceMode)

  useEffect(() => {
    if (!maintenanceMode || isSystemAdmin) return
    if (user) {
      logout()
    }
  }, [isSystemAdmin, logout, maintenanceMode, user])

  // Render the page immediately: it is server-rendered, so it paints without waiting on JS or this API call.
  // Only swap in the maintenance screen once the status confirms it.
  if (!maintenanceMode) {
    return children
  }

  if (isSystemAdmin) {
    return (
      <div className="flex min-h-screen flex-col">
        <div className="px-4 py-3">
          <Alert className="border-gold bg-gold/15 text-ink">
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

  return <MaintenanceScreen supportEmail={data?.supportEmail ?? undefined} />
}

function MaintenanceScreen({ supportEmail }: { supportEmail?: string }) {
  return (
    <div className="sk-root relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <BgFx />
      <div className="relative z-[2] w-full">
        <Notice
          icon={NOTICE_ICONS.wrench}
          eyebrow="Back shortly"
          title="We're tidying up"
          actions={
            <SketchButton variant="line" onClick={() => window.location.reload()}>
              Check again
            </SketchButton>
          }
        >
          <p>Omnicassion is undergoing maintenance and is temporarily unavailable. Thanks for your patience. We&apos;ll be back soon.</p>
          {supportEmail ? (
            <p className="sk-hand text-ink text-xl">
              Need help? Write to <span className="font-bold">{supportEmail}</span>
            </p>
          ) : null}
        </Notice>
      </div>
    </div>
  )
}
