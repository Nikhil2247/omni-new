'use client'

import { useLogout } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function UserSecuritySettingsPage() {
  const logout = useLogout()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-muted-foreground">Manage sessions and security settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Session control</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>Use this option if you need to sign out of all devices.</p>
          <Button type="button" variant="destructive" onClick={() => logout.mutate()} disabled={logout.isPending}>
            {logout.isPending ? 'Signing out...' : 'Sign out of this session'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
