import { PageLoader } from '@/components/common/page-loader'

// Also acts as the Suspense boundary for public pages that read search params.
// Delayed, so quick navigations show nothing and only slow ones show a small spinner (never a card skeleton).
export default function Loading() {
  return (
    <div className="page-loader-delayed">
      <PageLoader />
    </div>
  )
}
