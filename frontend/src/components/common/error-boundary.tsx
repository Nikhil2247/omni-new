'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { BgFx, Notice, NOTICE_ICONS, SketchButton } from '@/components/sketch'

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
        <div className="sk-root relative grid min-h-screen place-items-center overflow-hidden px-4 py-12">
          <BgFx />
          <div className="relative z-[2] w-full">
            <Notice
              icon={NOTICE_ICONS.alert}
              eyebrow="Something went wrong"
              title="Oops! That didn't work"
              actions={
                <>
                  <SketchButton onClick={this.handleReset}>Try Again</SketchButton>
                  <SketchButton variant="line" onClick={this.handleGoHome}>
                    Go Home
                  </SketchButton>
                </>
              }
            >
              <p>We hit an unexpected error. Try refreshing the page or go back to the home page. If it keeps happening, please contact support.</p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="border-line bg-card rounded-lg border-2 border-dashed p-3 text-left">
                  <p className="text-ink mb-1 text-sm font-bold">Error details (development only)</p>
                  <pre className="text-rose overflow-auto text-xs whitespace-pre-wrap">{this.state.error.toString()}</pre>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs">Component stack</summary>
                      <pre className="mt-2 overflow-auto text-xs whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                    </details>
                  )}
                </div>
              )}
            </Notice>
          </div>
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
