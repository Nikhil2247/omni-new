'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { BgFx, Notice, NOTICE_ICONS, SketchButton } from '@/components/sketch'
import { trackError } from '@/lib/analytics/umami'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)

    // Track error with Umami
    trackError.jsError(error.message || error.toString(), error.stack)

    // TODO: Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error)
  }, [error])

  return (
    <div className="sk-root relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
      <BgFx />
      <div className="relative z-[2] w-full">
        <Notice
          icon={NOTICE_ICONS.alert}
          eyebrow="Something went wrong"
          title="Oops! That didn't work"
          actions={
            <>
              <SketchButton onClick={reset}>Try Again</SketchButton>
              <SketchButton asChild variant="line">
                <Link href="/">Go Home</Link>
              </SketchButton>
            </>
          }
        >
          <p>We hit an unexpected error. Please try again, or go back to the home page. If it keeps happening, contact our support team.</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="border-line bg-card rounded-lg border-2 border-dashed p-3 text-left">
              <p className="text-ink mb-1 text-sm font-bold">Error details (development only)</p>
              <pre className="text-rose overflow-auto text-xs whitespace-pre-wrap">{error.message || error.toString()}</pre>
              {error.digest && <p className="mt-1 text-xs">Error ID: {error.digest}</p>}
            </div>
          )}
        </Notice>
      </div>
    </div>
  )
}
