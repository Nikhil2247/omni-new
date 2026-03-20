'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileSearch, Mail, Phone, RefreshCw } from 'lucide-react'
import { useOnboarding } from '../onboarding-context'
import { useQueryClient } from '@tanstack/react-query'
import { businessKeys } from '@/hooks/queries/use-business'
import { formatDistanceToNow } from 'date-fns'

export function KycPendingStep() {
  const { kyc } = useOnboarding()
  const queryClient = useQueryClient()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: businessKeys.kyc() })
  }

  const submittedAt = kyc?.submittedAt
    ? formatDistanceToNow(new Date(kyc.submittedAt), { addSuffix: true })
    : 'recently'

  return (
    <Card>
      <CardContent className="py-12">
        <div className="text-center max-w-md mx-auto">
          {/* Animated Icon */}
          <div className="relative inline-flex mb-6">
            <div className="absolute inset-0 rounded-full bg-yellow-100 animate-ping opacity-25" />
            <div className="relative p-4 rounded-full bg-yellow-100">
              <FileSearch className="h-12 w-12 text-yellow-600" />
            </div>
          </div>

          <h2 className="text-xl font-semibold mb-2">KYC Under Review</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;re reviewing your verification documents. This usually takes 1-2 business days.
          </p>

          {/* Status Badge */}
          <Badge variant="outline" className="mb-6 gap-2 px-4 py-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Submitted {submittedAt}
          </Badge>

          {/* Timeline */}
          <div className="text-left space-y-4 my-8 p-4 rounded-lg bg-muted">
            <h3 className="font-semibold text-sm">What happens next?</h3>
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs font-semibold shrink-0">
                  1
                </span>
                <span>Our team verifies your documents</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0 animate-pulse">
                  2
                </span>
                <span className="font-medium">Review in progress...</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-muted-foreground/20 text-muted-foreground text-xs font-semibold shrink-0">
                  3
                </span>
                <span className="text-muted-foreground">You&apos;ll be notified of the result</span>
              </li>
            </ol>
          </div>

          {/* Refresh Button */}
          <Button variant="outline" onClick={handleRefresh} className="mb-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Check Status
          </Button>

          {/* Contact Info */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>Have questions about your verification?</p>
            <div className="flex items-center justify-center gap-4">
              <a
                href="mailto:support@omnicassion.com"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Mail className="h-4 w-4" />
                Email Support
              </a>
              <a
                href="tel:+919876543210"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <Phone className="h-4 w-4" />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
