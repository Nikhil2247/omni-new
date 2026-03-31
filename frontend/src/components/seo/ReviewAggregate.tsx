'use client';

import { Star, StarHalf, ThumbsUp, MessageSquare, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  helpful?: number;
  verified?: boolean;
}

interface ReviewAggregateProps {
  totalReviews: number;
  averageRating: number;
  ratingDistribution?: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  reviews?: Review[];
  showDistribution?: boolean;
  showRecentReviews?: boolean;
  reviewLimit?: number;
  variant?: 'default' | 'compact' | 'full';
  className?: string;
}

function StarRating({ rating, size = 'default' }: { rating: number; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: fullStars }).map((_, i) => (
        <Star key={`full-${i}`} className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
      ))}
      {hasHalfStar && (
        <StarHalf className={cn(sizeClasses[size], 'fill-yellow-400 text-yellow-400')} />
      )}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <Star key={`empty-${i}`} className={cn(sizeClasses[size], 'text-gray-300')} />
      ))}
    </div>
  );
}

function RatingBar({
  stars,
  count,
  total,
}: {
  stars: number;
  count: number;
  total: number;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-3 text-muted-foreground">{stars}</span>
      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-400 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="border-b last:border-0 py-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{review.author}</span>
            {review.verified && (
              <span className="flex items-center gap-0.5 text-xs text-green-600">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-muted-foreground">
              {new Date(review.date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{review.text}</p>
      {review.helpful !== undefined && review.helpful > 0 && (
        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3" />
          {review.helpful} found this helpful
        </div>
      )}
    </div>
  );
}

export function ReviewAggregate({
  totalReviews,
  averageRating,
  ratingDistribution,
  reviews = [],
  showDistribution = true,
  showRecentReviews = true,
  reviewLimit = 3,
  variant = 'default',
  className,
}: ReviewAggregateProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <StarRating rating={averageRating} size="sm" />
        <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
        <span className="text-sm text-muted-foreground">({totalReviews} reviews)</span>
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={cn('space-y-6', className)}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="text-center sm:text-left">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <StarRating rating={averageRating} size="lg" />
            <p className="text-sm text-muted-foreground mt-1">
              Based on {totalReviews.toLocaleString()} reviews
            </p>
          </div>

          {showDistribution && ratingDistribution && (
            <div className="flex-1 space-y-1.5">
              {[5, 4, 3, 2, 1].map((stars) => (
                <RatingBar
                  key={stars}
                  stars={stars}
                  count={ratingDistribution[stars as keyof typeof ratingDistribution]}
                  total={totalReviews}
                />
              ))}
            </div>
          )}
        </div>

        {/* Recent Reviews */}
        {showRecentReviews && reviews.length > 0 && (
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
              <MessageSquare className="h-4 w-4" />
              Recent Reviews
            </h3>
            <div className="space-y-0">
              {reviews.slice(0, reviewLimit).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={cn('rounded-xl border bg-card p-6', className)}>
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold">{averageRating.toFixed(1)}</div>
          <StarRating rating={averageRating} />
          <p className="text-xs text-muted-foreground mt-1">
            {totalReviews.toLocaleString()} reviews
          </p>
        </div>

        {showDistribution && ratingDistribution && (
          <div className="flex-1 space-y-1">
            {[5, 4, 3, 2, 1].map((stars) => (
              <RatingBar
                key={stars}
                stars={stars}
                count={ratingDistribution[stars as keyof typeof ratingDistribution]}
                total={totalReviews}
              />
            ))}
          </div>
        )}
      </div>

      {showRecentReviews && reviews.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-semibold mb-3">Recent Reviews</h4>
          {reviews.slice(0, reviewLimit).map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
