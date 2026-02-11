'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

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
    
    // TODO: Send to error tracking service (e.g., Sentry)
    // Sentry.captureException(error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
          <CardDescription>
            We encountered an unexpected error. Don't worry, our team has been notified.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
              <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Error Details (Development Only):
              </p>
              <pre className="overflow-auto text-xs text-red-600 dark:text-red-400">
                {error.message || error.toString()}
              </pre>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You can try again or return to the home page. If the problem persists,
            please contact our support team.
          </p>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset} className="w-full sm:w-auto" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button onClick={() => window.location.href = '/'} className="w-full sm:w-auto" variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
