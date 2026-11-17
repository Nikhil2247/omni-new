'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBusinessProfile, useBusinessReviews, useRespondToReview } from '@/hooks/queries/use-business'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Star,
  Loader2,
  AlertTriangle,
  MessageSquare,
  Filter,
  Search,
  Reply,
} from 'lucide-react'
import type { BusinessReview } from '@/lib/api/types/business.types'

const ratingOptions = ['all', '5', '4', '3', '2', '1']

export default function BusinessReviewsPage() {
  useEffect(() => {
    trackDashboard.sectionView('reviews', 'vendor')
  }, [])

  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: reviews = [], isLoading: reviewsLoading } = useBusinessReviews()
  const respondToReview = useRespondToReview()

  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [showResponseDialog, setShowResponseDialog] = useState(false)
  const [selectedReview, setSelectedReview] = useState<BusinessReview | null>(null)
  const [responseText, setResponseText] = useState('')

  const openResponseDialog = (review: BusinessReview) => {
    setSelectedReview(review)
    setResponseText(review.reviewNotes || '')
    setShowResponseDialog(true)
  }

  const handleSubmitResponse = async () => {
    if (!selectedReview || !responseText.trim()) return

    await respondToReview.mutateAsync({
      id: selectedReview.id,
      response: responseText,
    })

    setShowResponseDialog(false)
    setSelectedReview(null)
    setResponseText('')
  }

  const reviewerName = (review: BusinessReview) => {
    const first = review.reviewer?.firstName || ''
    const last = review.reviewer?.lastName || ''
    return `${first} ${last}`.trim() || 'Client'
  }

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesSearch =
        !searchTerm ||
        review.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        review.body?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesRating = ratingFilter === 'all' || String(review.rating) === ratingFilter
      return matchesSearch && matchesRating
    })
  }, [reviews, ratingFilter, searchTerm])

  if (profileLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Reviews</h1>
          <p className="text-muted-foreground">Monitor feedback from your clients</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-yellow-500" />
            <h3 className="text-lg font-semibold">Profile Required</h3>
            <p className="mt-2 text-muted-foreground">
              Please create your business profile to view reviews.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Reviews</h1>
        <p className="text-muted-foreground">Monitor feedback from your clients</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-45">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All ratings' : `${option} stars`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {reviewsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">No reviews yet</h3>
            <p className="mt-2 text-muted-foreground">
              Reviews will appear here once clients leave feedback.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <Card key={review.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{review.title || 'Client feedback'}</CardTitle>
                    <CardDescription>
                      {reviewerName(review)} · {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {review.rating}/5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
                {review.reviewNotes ? (
                  <div className="rounded-lg border bg-muted/40 p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">Your response</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openResponseDialog(review)}
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-muted-foreground">{review.reviewNotes}</p>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResponseDialog(review)}
                  >
                    <Reply className="mr-2 h-4 w-4" />
                    Respond to Review
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Respond to Review</DialogTitle>
            <DialogDescription>
              Write a professional response to this client&apos;s feedback
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4 py-4">
              {/* Original Review */}
              <div className="rounded-lg bg-muted p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{reviewerName(selectedReview)}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {selectedReview.title && (
                  <p className="font-medium text-sm">{selectedReview.title}</p>
                )}
                {selectedReview.body && (
                  <p className="text-sm text-muted-foreground mt-1">{selectedReview.body}</p>
                )}
              </div>

              {/* Response Input */}
              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  placeholder="Thank you for your feedback..."
                  rows={4}
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  A professional, courteous response helps build trust with potential clients
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResponseDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={respondToReview.isPending || !responseText.trim()}
            >
              {respondToReview.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Response'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
