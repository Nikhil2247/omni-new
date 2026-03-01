'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Track error with Umami
    if (typeof window !== 'undefined') {
      import('@/lib/analytics/umami').then(({ trackError }) => {
        trackError.jsError(error.message || error.toString(), errorInfo.componentStack ?? undefined)
      })
    }

    // TODO: Send to error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined') {
    //   Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!, this.handleReset)
      }

      // Default error UI
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
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 rounded-lg bg-gray-100 p-4 dark:bg-gray-800">
                  <p className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Error Details (Development Only):
                  </p>
                  <pre className="overflow-auto text-xs text-red-600 dark:text-red-400">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                        Component Stack
                      </summary>
                      <pre className="mt-2 overflow-auto text-xs text-gray-600 dark:text-gray-400">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You can try refreshing the page or return to the home page. If the problem persists,
                please contact support.
              </p>
            </CardContent>
            
            <CardFooter className="flex flex-col gap-2 sm:flex-row">
              <Button onClick={this.handleReset} className="w-full sm:w-auto" variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={this.handleGoHome} className="w-full sm:w-auto" variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use with hooks
export function ErrorBoundaryWrapper({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode 
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>
}
