'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useMarketingCampaigns } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MarketingCampaignDetailPage() {
  const params = useParams()
  const campaignId = useMemo(() => {
    const value = params?.campaignId
    return Array.isArray(value) ? value[0] : value
  }, [params])

  const { data, isLoading } = useMarketingCampaigns()
  const campaign = data?.find((item) => item.id === campaignId)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  if (!campaign) {
    return <div className="text-sm text-muted-foreground">Campaign not found.</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{campaign.name}</h1>
        <p className="text-muted-foreground">Campaign detail view.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {campaign.status || 'UNKNOWN'}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Start date</span>
            <span>{campaign.startsAt ? formatDate(campaign.startsAt) : '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">End date</span>
            <span>{campaign.endsAt ? formatDate(campaign.endsAt) : '—'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date)
}
