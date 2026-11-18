'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/dashboard'

export default function MarketingContentCalendarPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Content calendar" />

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Schedule overview</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm text-muted-foreground">
          Calendar data is not yet exposed in the marketing gateway.
        </CardContent>
      </Card>
    </div>
  )
}
