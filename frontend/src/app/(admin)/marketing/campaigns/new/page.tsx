'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/dash'

export default function MarketingCampaignNewPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Create campaign" />

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Campaign setup</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm text-muted-foreground">
          Campaign creation endpoints will be wired once the marketing gateway adds create/update routes.
        </CardContent>
      </Card>
    </div>
  )
}
