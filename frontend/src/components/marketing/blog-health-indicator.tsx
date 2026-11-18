import type { BlogPost } from '@/lib/api/types/marketing.types'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { getBlogHealth } from '@/lib/utils/blog-health'

type BlogHealthIndicatorProps = {
  post: BlogPost
}

export function BlogHealthIndicator({ post }: BlogHealthIndicatorProps) {
  const health = getBlogHealth(post)
  const missingPreview = health.missing.slice(0, 2).join(', ')

  return (
    <div className="min-w-44 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={health.variant}>{health.label}</Badge>
        <span className="text-xs font-medium text-muted-foreground">{health.score}%</span>
      </div>
      <Progress
        value={health.score}
        className="h-1.5"
        indicatorClassName={
          health.score >= 90
            ? 'bg-success'
            : health.score >= 75
              ? 'bg-info'
              : health.score >= 55
                ? 'bg-warning'
                : 'bg-destructive'
        }
      />
      {missingPreview ? (
        <p className="line-clamp-1 text-[11px] text-muted-foreground">Missing: {missingPreview}</p>
      ) : (
        <p className="text-[11px] text-success">Ready for publishing</p>
      )}
    </div>
  )
}
