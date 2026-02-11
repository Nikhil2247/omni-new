'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarketingCampaignNewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create campaign</h1>
        <p className="text-muted-foreground">Campaign creation is coming next in the marketing gateway.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign setup</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Campaign creation endpoints will be wired once the marketing gateway adds create/update routes.
        </CardContent>
      </Card>
    </div>
  )
}
