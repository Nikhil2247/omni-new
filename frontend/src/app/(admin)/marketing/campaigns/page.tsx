'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useMarketingCampaigns } from '@/hooks/queries/use-marketing'
import { useUmami } from '@/hooks/use-umami'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function MarketingCampaignsPage() {
  const { data, isLoading } = useMarketingCampaigns()
  const { track } = useUmami()

  useEffect(() => {
    track('marketing:campaigns:page_view', { totalCampaigns: data?.length || 0 })
  }, [data, track])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <p className="text-muted-foreground">Manage marketing campaigns and performance windows.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign list</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : data?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>End date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      <Badge variant={campaign.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {campaign.status || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell>{campaign.endsAt ? formatDate(campaign.endsAt) : '—'}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/marketing/campaigns/${campaign.id}`} className="text-sm text-primary hover:underline">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No campaigns available.</p>
          )}
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
