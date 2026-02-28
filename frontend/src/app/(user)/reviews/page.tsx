'use client'

import { useEffect } from 'react'
import { useMyVendorReviews } from '@/hooks/queries/use-vendor-reviews'
import { trackDashboard } from '@/lib/analytics/umami'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

export default function ReviewsPage() {
  const { data: reviews = [], isLoading } = useMyVendorReviews()

  useEffect(() => {
    trackDashboard.sectionView('reviews', 'user')
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reviews</h1>
        <p className="text-muted-foreground">Manage feedback for vendors you booked.</p>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No reviews yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Reviews will appear here after your event is completed.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{review.title || 'Your review'}</CardTitle>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {review.rating}/5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                {review.vendor?.businessName && (
                  <p className="text-xs text-muted-foreground">Vendor: {review.vendor.businessName}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
