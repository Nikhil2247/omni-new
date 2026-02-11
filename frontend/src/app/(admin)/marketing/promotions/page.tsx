'use client'

import { useMarketingPromotions } from '@/hooks/queries/use-marketing'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function MarketingPromotionsPage() {
  const { data, isLoading } = useMarketingPromotions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Promotions</h1>
        <p className="text-muted-foreground">Track featured vendor promotions and offers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Promotion list</CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.name}</TableCell>
                    <TableCell>
                      <Badge variant={promotion.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {promotion.status || 'UNKNOWN'}
                      </Badge>
                    </TableCell>
                    <TableCell>{promotion.endsAt ? formatDate(promotion.endsAt) : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No promotions available.</p>
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
