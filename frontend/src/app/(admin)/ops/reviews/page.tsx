'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
import {
  ConfirmDialog,
  DataTable,
  FilterSelect,
  PageHeader,
  StatCard,
  StatGrid,
  StatusBadge,
  TwoLineCell,
  UserCell,
  type DataColumn,
} from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useOpsActiveEvents } from '@/hooks/queries/use-ops'

const RATING_OPTIONS = [
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  )
}

// Mock reviews data - in production this would come from an API
const mockReviews = [
  {
    id: '1',
    eventId: 'evt-1',
    eventName: 'Sharma Wedding',
    clientName: 'Rahul Sharma',
    vendorName: 'Grand Celebrations',
    rating: 5,
    review: 'Excellent service! Everything was perfect and the team was very professional.',
    createdAt: new Date().toISOString(),
    status: 'APPROVED',
  },
  {
    id: '2',
    eventId: 'evt-2',
    eventName: 'Patel Anniversary',
    clientName: 'Priya Patel',
    vendorName: 'Event Masters',
    rating: 4,
    review: 'Great experience overall. Minor issues with timing but resolved quickly.',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: 'PENDING',
  },
  {
    id: '3',
    eventId: 'evt-3',
    eventName: 'Kumar Birthday',
    clientName: 'Anil Kumar',
    vendorName: 'Party Planners',
    rating: 3,
    review: 'Average service. Expected better decoration quality.',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    status: 'APPROVED',
  },
]

export default function OpsReviewsPage() {
  const [ratingFilter, setRatingFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedReview, setSelectedReview] = useState<typeof mockReviews[0] | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [showRejectConfirm, setShowRejectConfirm] = useState(false)

  // Fetch completed events
  const { data: eventsData, isLoading } = useOpsActiveEvents()

  // Filter completed events
  const completedEvents = useMemo(() => {
    return eventsData?.filter((e) => e.status === 'COMPLETED') || []
  }, [eventsData])

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let reviews = mockReviews

    if (ratingFilter !== 'all') {
      reviews = reviews.filter((r) => r.rating === parseInt(ratingFilter))
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      reviews = reviews.filter(
        (r) =>
          r.eventName.toLowerCase().includes(query) ||
          r.clientName.toLowerCase().includes(query) ||
          r.vendorName.toLowerCase().includes(query) ||
          r.review.toLowerCase().includes(query)
      )
    }

    return reviews
  }, [ratingFilter, searchQuery])

  // Stats
  const stats = useMemo(() => {
    const total = mockReviews.length
    const avgRating = mockReviews.reduce((acc, r) => acc + r.rating, 0) / total || 0
    const pending = mockReviews.filter((r) => r.status === 'PENDING').length
    const positive = mockReviews.filter((r) => r.rating >= 4).length

    return { total, avgRating, pending, positive, completedEvents: completedEvents.length }
  }, [completedEvents])

  const openDetailsDialog = (review: typeof mockReviews[0]) => {
    setSelectedReview(review)
    setShowDetailsDialog(true)
  }

  type Review = (typeof mockReviews)[0]

  const reviewColumns: DataColumn<Review>[] = [
    {
      id: 'event',
      header: 'Event',
      label: 'Event',
      cell: (r) => <TwoLineCell title={r.eventName} subtitle={r.vendorName} />,
      sortValue: (r) => r.eventName,
      exportValue: (r) => r.eventName,
    },
    {
      id: 'client',
      header: 'Client',
      label: 'Client',
      cell: (r) => <UserCell name={r.clientName} />,
      sortValue: (r) => r.clientName,
      exportValue: (r) => r.clientName,
    },
    {
      id: 'vendor',
      header: 'Vendor',
      label: 'Vendor',
      hideBelow: 'md',
      cell: (r) => r.vendorName,
      sortValue: (r) => r.vendorName,
    },
    {
      id: 'rating',
      header: 'Rating',
      label: 'Rating',
      cell: (r) => <StarRating rating={r.rating} />,
      sortValue: (r) => r.rating,
      exportValue: (r) => r.rating,
    },
    {
      id: 'status',
      header: 'Status',
      label: 'Status',
      cell: (r) => <StatusBadge status={r.status} />,
      sortValue: (r) => r.status,
      exportValue: (r) => r.status,
    },
    {
      id: 'date',
      header: 'Date',
      label: 'Date',
      hideBelow: 'md',
      cell: (r) => format(new Date(r.createdAt), 'MMM d, yyyy'),
      sortValue: (r) => new Date(r.createdAt),
    },
  ]

  const eventColumns: DataColumn<NonNullable<typeof eventsData>[number]>[] = [
    {
      id: 'client',
      header: 'Event',
      label: 'Event',
      cell: (e) => <TwoLineCell title={e.clientName} subtitle={e.eventType} />,
      sortValue: (e) => e.clientName,
      exportValue: (e) => e.clientName,
    },
    {
      id: 'date',
      header: 'Event date',
      label: 'Event date',
      cell: (e) => (e.eventDate ? format(new Date(e.eventDate), 'MMM d, yyyy') : 'Date TBD'),
      sortValue: (e) => (e.eventDate ? new Date(e.eventDate) : null),
    },
  ]

  return (
    <div className="space-y-3">
      <PageHeader title="Reviews & Feedback" />

      <StatGrid className="lg:grid-cols-5">
        <StatCard label="Completed Events" value={stats.completedEvents} icon={CheckCircle} accent="text-purple-600" />
        <StatCard label="Total Reviews" value={stats.total} icon={MessageSquare} accent="text-blue-600" />
        <StatCard label="Avg Rating" value={stats.avgRating.toFixed(1)} icon={Star} accent="text-yellow-600" />
        <StatCard label="Positive (4-5★)" value={stats.positive} icon={ThumbsUp} accent="text-green-600" />
        <StatCard label="Pending Review" value={stats.pending} icon={AlertCircle} accent="text-orange-600" />
      </StatGrid>

      {/* Completed Events Pending Review */}
      {(completedEvents.length > 0 || isLoading) && (
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold">Completed Events Awaiting Review</h2>
          <DataTable
            data={completedEvents}
            columns={eventColumns}
            rowKey={(e) => e.id}
            isLoading={isLoading}
            defaultPageSize={10}
            pageSizeOptions={[10, 20]}
            maxHeight="40dvh"
            rowActions={(e) => [{ label: 'View event', icon: Eye, href: `/ops/events/${e.id}` }]}
          />
        </div>
      )}

      {/* Reviews Table */}
      <DataTable
        data={filteredReviews}
        columns={reviewColumns}
        rowKey={(r) => r.id}
        search={{ value: searchQuery, onChange: setSearchQuery, placeholder: 'Search event, client, vendor...' }}
        filters={
          <FilterSelect
            label="Rating"
            value={ratingFilter}
            onChange={setRatingFilter}
            options={RATING_OPTIONS}
          />
        }
        exportFilename="reviews"
        emptyTitle="No reviews found"
        emptyIcon={MessageSquare}
        rowActions={(r) => [{ label: 'View review', icon: Eye, onClick: () => openDetailsDialog(r) }]}
      />

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>{selectedReview?.eventName}</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Client</p>
                  <p className="font-medium">{selectedReview.clientName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendor</p>
                  <p className="font-medium">{selectedReview.vendorName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <StarRating rating={selectedReview.rating} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={selectedReview.status} />
                </div>
              </div>

              <div className="border-t pt-3">
                <p className="text-sm text-muted-foreground mb-2">Review</p>
                <p className="text-sm">{selectedReview.review}</p>
              </div>

              <div className="border-t pt-3 flex gap-2">
                {selectedReview.status === 'PENDING' && (
                  <>
                    <Button className="flex-1" variant="default">
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button className="flex-1" variant="outline" onClick={() => setShowRejectConfirm(true)}>
                      <ThumbsDown className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedReview.status === 'APPROVED' && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    This review has been approved and is visible to users
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showRejectConfirm}
        onOpenChange={setShowRejectConfirm}
        title="Reject this review?"
        description="The review will not be shown to users."
        confirmLabel="Reject"
        onConfirm={() => setShowDetailsDialog(false)}
      />
    </div>
  )
}
