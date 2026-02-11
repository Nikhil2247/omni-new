'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarketingContentCalendarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Content calendar</h1>
        <p className="text-muted-foreground">Scheduling view will appear once calendar data is available.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Calendar data is not yet exposed in the marketing gateway.
        </CardContent>
      </Card>
    </div>
  )
}
