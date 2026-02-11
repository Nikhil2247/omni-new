'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function MarketingMediaUploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Upload media</h1>
        <p className="text-muted-foreground">Media upload will be enabled once the backend upload endpoint is ready.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload status</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The marketing gateway currently exposes read-only media endpoints.
        </CardContent>
      </Card>
    </div>
  )
}
