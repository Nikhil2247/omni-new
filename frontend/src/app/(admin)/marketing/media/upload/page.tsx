'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/dashboard'

export default function MarketingMediaUploadPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Upload media" />

      <Card>
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm">Upload status</CardTitle>
        </CardHeader>
        <CardContent className="p-3 text-sm text-muted-foreground">
          The marketing gateway currently exposes read-only media endpoints.
        </CardContent>
      </Card>
    </div>
  )
}
