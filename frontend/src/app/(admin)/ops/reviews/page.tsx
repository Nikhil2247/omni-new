'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Star,
  Search,
  Calendar,
  User,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { useOpsActiveEvents } from '@/hooks/queries/use-ops'

const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews & Feedback</h1>
          <p className="text-muted-foreground">
            Manage post-event reviews and client feedback
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedEvents}</p>
                <p className="text-xs text-muted-foreground">Completed Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.positive}</p>
                <p className="text-xs text-muted-foreground">Positive (4-5★)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by event, client, or vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                {RATING_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Completed Events Pending Review */}
      {completedEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Completed Events Awaiting Review</CardTitle>
            <CardDescription>Events that have been completed but need client feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : completedEvents.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No completed events yet</p>
            ) : (
              <div className="space-y-3">
                {completedEvents.slice(0, 5).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{event.clientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.eventType} • {event.eventDate ? format(new Date(event.eventDate), 'MMM d, yyyy') : 'Date TBD'}
                        </p>
                      </div>
                    </div>
                    <Link href={`/ops/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        View Event
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Reviews</CardTitle>
          <CardDescription>Client feedback and ratings</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredReviews.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No reviews found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell className="font-medium">{review.eventName}</TableCell>
                    <TableCell>{review.clientName}</TableCell>
                    <TableCell>{review.vendorName}</TableCell>
                    <TableCell>
                      <StarRating rating={review.rating} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          review.status === 'APPROVED'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {review.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDetailsDialog(review)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Details</DialogTitle>
            <DialogDescription>{selectedReview?.eventName}</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                  <Badge
                    variant="outline"
                    className={
                      selectedReview.status === 'APPROVED'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {selectedReview.status}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Review</p>
                <p className="text-sm">{selectedReview.review}</p>
              </div>

              <div className="border-t pt-4 flex gap-2">
                {selectedReview.status === 'PENDING' && (
                  <>
                    <Button className="flex-1" variant="default">
                      <ThumbsUp className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button className="flex-1" variant="outline">
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
    </div>
  )
}
