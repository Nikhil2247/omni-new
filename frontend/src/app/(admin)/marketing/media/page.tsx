'use client'

import { RoleGuard } from '@/components/auth'
import { ROLES } from '@/config/roles'
import { useMarketingMedia } from '@/hooks/queries/use-marketing'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MarketingMediaPage() {
  const { data, isLoading } = useMarketingMedia()

  return (
    <RoleGuard allowedRoles={[ROLES.ADMIN_SYSTEM, ROLES.MARKETING_SERVICES_ADMIN, ROLES.MULTI_MEDIA_MANAGER]} redirectOnFail={true}>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media library</h1>
        <p className="text-muted-foreground">Manage uploaded images and media assets.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {data.map((asset) => (
                <div key={asset.id} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">{asset.name || 'Untitled asset'}</p>
                  <p className="text-xs text-muted-foreground">{asset.type || 'Unknown type'}</p>
                  <p className="text-xs text-muted-foreground">{asset.url || 'No URL provided'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No media assets available.</p>
          )}
        </CardContent>
      </Card>
    </div>
    </RoleGuard>
  )
}
