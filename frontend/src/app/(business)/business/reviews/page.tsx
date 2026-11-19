'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { trackDashboard } from '@/lib/analytics/umami'
import { useBusinessProfile, useBusinessReviews, useRespondToReview } from '@/hooks/queries/use-business'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader, DataTable, FilterSelect, StatusBadge, UserCell, TwoLineCell, KpiCard, KpiGrid } from '@/components/dash'
import { Button } from '@/components/ui/button'
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
  Pencil,
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
  const [responseText, setResponseText] = useState('')
  const [selectedReview, setSelectedReview] = useState<BusinessReview | null>(null)

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
      <div className="space-y-3">
        <PageHeader title="Reviews" />
        <Card>
          <CardContent className="py-6 text-center">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Profile Required</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Please create your business profile to view reviews.
            </p>
            <Button size="sm" className="mt-3" onClick={() => window.location.href = '/business/profile'}>
              Create Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Reviews" />

      <KpiGrid cols={3}>
        <KpiCard label="Total reviews" value={reviews.length} icon={MessageSquare} loading={reviewsLoading} />
        <KpiCard
          label="Average rating"
          value={reviews.length ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '-'}
          icon={Star}
          hint="out of 5"
          loading={reviewsLoading}
        />
        <KpiCard
          label="Awaiting response"
          value={reviews.filter((r) => !r.reviewNotes).length}
          icon={Reply}
          loading={reviewsLoading}
        />
      </KpiGrid>

      <DataTable<BusinessReview>
        data={filteredReviews}
        isLoading={reviewsLoading}
        rowKey={(r) => r.id}
        search={{ value: searchTerm, onChange: setSearchTerm, placeholder: 'Search reviews...' }}
        filters={
          <FilterSelect
            label="Rating"
            value={ratingFilter}
            onChange={setRatingFilter}
            allLabel="All ratings"
            options={ratingOptions.filter((o) => o !== 'all').map((o) => ({ value: o, label: `${o} stars` }))}
          />
        }
        exportFilename="reviews"
        emptyTitle="No reviews yet"
        emptyIcon={MessageSquare}
        columns={[
          {
            id: 'reviewer',
            header: 'Client',
            label: 'Client',
            sortValue: (r) => reviewerName(r),
            exportValue: (r) => reviewerName(r),
            cell: (r) => <UserCell name={reviewerName(r)} subtitle={format(new Date(r.createdAt), 'MMM d, yyyy')} />,
          },
          {
            id: 'rating',
            header: 'Rating',
            label: 'Rating',
            sortValue: (r) => r.rating,
            exportValue: (r) => r.rating,
            cell: (r) => (
              <span className="inline-flex items-center gap-1 text-sm">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {r.rating}/5
              </span>
            ),
          },
          {
            id: 'review',
            header: 'Review',
            label: 'Review',
            exportValue: (r) => `${r.title ?? ''} ${r.body ?? ''}`.trim(),
            cell: (r) => (
              <TwoLineCell
                title={r.title || 'Client feedback'}
                subtitle={r.body}
              />
            ),
            className: 'max-w-[360px]',
          },
          {
            id: 'response',
            header: 'Response',
            label: 'Response',
            sortValue: (r) => (r.reviewNotes ? 1 : 0),
            exportValue: (r) => r.reviewNotes ?? '',
            cell: (r) => (
              <StatusBadge tone={r.reviewNotes ? 'success' : 'warning'}>
                {r.reviewNotes ? 'Responded' : 'Awaiting'}
              </StatusBadge>
            ),
          },
        ]}
        rowActions={(r) => [
          {
            label: r.reviewNotes ? 'Edit response' : 'Respond',
            icon: r.reviewNotes ? Pencil : Reply,
            onClick: () => openResponseDialog(r),
          },
        ]}
      />

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
            <div className="space-y-3 py-2">
              {/* Original Review */}
              <div className="rounded-lg bg-muted p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{reviewerName(selectedReview)}</p>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedReview.rating
                            ? 'text-primary fill-primary'
                            : 'text-muted-foreground'
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
