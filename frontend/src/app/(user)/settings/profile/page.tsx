'use client'

import { useUserProfile } from '@/hooks/queries/use-user-profile'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function UserProfileSettingsPage() {
  const { data, isLoading, error } = useUserProfile()

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error || !data) {
    return <div className="text-sm text-destructive">Unable to load profile.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-muted-foreground">Your account details from the platform.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Name:</span>{' '}
            {data.firstName || data.lastName
              ? `${data.firstName ?? ''} ${data.lastName ?? ''}`.trim()
              : 'Not set'}
          </div>
          <div>
            <span className="font-medium">Email:</span> {data.email}
          </div>
          <div>
            <span className="font-medium">Role:</span> {data.role ?? data.roles?.[0] ?? 'User'}
          </div>
          <div>
            <span className="font-medium">Email verified:</span>{' '}
            {data.emailVerified ? 'Yes' : 'No'}
          </div>
          <div>
            <span className="font-medium">Two-factor enabled:</span>{' '}
            {data.twoFactorEnabled ? 'Yes' : 'No'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
