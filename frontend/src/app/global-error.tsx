'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { trackError } from '@/lib/analytics/umami'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)

    // Track global error with Umami
    trackError.global(error.message || error.toString(), {
      digest: error.digest,
      stack: error.stack,
      fatal: true,
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
          <div className="w-full max-w-md rounded-lg border bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-gray-900">
                Application Error
              </h1>
              <p className="mb-6 text-gray-600">
                A critical error occurred. Please refresh the page to continue.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 rounded-lg bg-gray-100 p-4 text-left">
                  <p className="mb-2 text-sm font-semibold text-gray-700">
                    Error Details (Development Only):
                  </p>
                  <pre className="overflow-auto text-xs text-red-600">
                    {error.message || error.toString()}
                  </pre>
                </div>
              )}
              
              <button
                onClick={reset}
                className="inline-flex items-center rounded-md bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
