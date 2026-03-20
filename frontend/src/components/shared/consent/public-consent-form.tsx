'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  ShieldCheck,
  FileText,
  Mail,
  MessageSquare,
  Bell,
  Cookie,
  BarChart3,
  Target,
  Building2,
  ExternalLink,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import type { ConsentDefinition, ConsentType } from '@/lib/api/types/business.types'
import ReactMarkdown from 'react-markdown'

// Icon mapping for consent types
const consentIcons: Record<ConsentType, React.ElementType> = {
  TERMS_OF_SERVICE: FileText,
  PRIVACY_POLICY: ShieldCheck,
  MARKETING_EMAIL: Mail,
  MARKETING_SMS: MessageSquare,
  MARKETING_PUSH: Bell,
  DATA_PROCESSING: ShieldCheck,
  PLATFORM_COMMISSION: Building2,
  COOKIE_ESSENTIAL: Cookie,
  COOKIE_ANALYTICS: BarChart3,
  COOKIE_MARKETING: Target,
}

interface ConsentSelection {
  consentType: ConsentType
  version: string
  accepted: boolean
}

interface PublicConsentFormProps {
  /** Type of user - determines which consents to show */
  userType?: 'user' | 'vendor'
  /** Called when all required consents are accepted */
  onComplete?: (acceptedConsents: ConsentSelection[]) => void
  /** Custom class name */
  className?: string
  /** Show only required consents */
  requiredOnly?: boolean
  /** Pre-selected consents */
  preselected?: ConsentType[]
  /** Title override */
  title?: string
  /** Description override */
  description?: string
}

export function PublicConsentForm({
  userType = 'user',
  onComplete,
  className,
  requiredOnly = false,
  preselected = [],
  title = 'Terms & Consents',
  description = 'Please review and accept the following terms to continue using the platform.',
}: PublicConsentFormProps) {
  const [selections, setSelections] = useState<Map<ConsentType, ConsentSelection>>(new Map())
  const [viewingConsent, setViewingConsent] = useState<ConsentDefinition | null>(null)

  // Fetch consent definitions
  const { data, isLoading, error } = useQuery({
    queryKey: ['consent-definitions', userType],
    queryFn: () =>
      userType === 'vendor'
        ? publicService.getVendorConsentDefinitions()
        : publicService.getUserConsentDefinitions(),
  })

  // Initialize selections when data loads
  useEffect(() => {
    if (data) {
      const allConsents = [...(data.required || []), ...(data.optional || [])]
      const newSelections = new Map<ConsentType, ConsentSelection>()

      allConsents.forEach((consent) => {
        newSelections.set(consent.consentType, {
          consentType: consent.consentType,
          version: consent.version,
          accepted: preselected.includes(consent.consentType),
        })
      })

      setSelections(newSelections)
    }
  }, [data, preselected])

  const toggleConsent = (consent: ConsentDefinition) => {
    setSelections((prev) => {
      const newSelections = new Map(prev)
      const current = newSelections.get(consent.consentType)
      if (current) {
        newSelections.set(consent.consentType, {
          ...current,
          accepted: !current.accepted,
        })
      }
      return newSelections
    })
  }

  const acceptAllRequired = () => {
    if (!data?.required) return

    setSelections((prev) => {
      const newSelections = new Map(prev)
      data.required.forEach((consent) => {
        const current = newSelections.get(consent.consentType)
        if (current) {
          newSelections.set(consent.consentType, {
            ...current,
            accepted: true,
          })
        }
      })
      return newSelections
    })
  }

  const acceptAll = () => {
    setSelections((prev) => {
      const newSelections = new Map(prev)
      newSelections.forEach((value, key) => {
        newSelections.set(key, { ...value, accepted: true })
      })
      return newSelections
    })
  }

  const allRequiredAccepted = data?.required?.every(
    (consent) => selections.get(consent.consentType)?.accepted
  ) ?? false

  const handleSubmit = () => {
    if (!allRequiredAccepted) return

    const acceptedConsents = Array.from(selections.values()).filter((s) => s.accepted)
    onComplete?.(acceptedConsents)
  }

  const renderConsentItem = (consent: ConsentDefinition, isRequired: boolean) => {
    const Icon = consentIcons[consent.consentType] || FileText
    const selection = selections.get(consent.consentType)
    const isAccepted = selection?.accepted ?? false

    return (
      <div
        key={consent.id}
        className={`
          flex items-start gap-4 p-4 rounded-lg border transition-colors
          ${isAccepted ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-card border-border hover:border-primary/50'}
        `}
      >
        <Checkbox
          id={consent.id}
          checked={isAccepted}
          onCheckedChange={() => toggleConsent(consent)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <label
              htmlFor={consent.id}
              className="font-medium cursor-pointer"
            >
              {consent.title}
            </label>
            {isRequired && (
              <Badge variant="destructive" className="text-xs">
                Required
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              v{consent.version}
            </Badge>
          </div>
          {consent.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {consent.description}
            </p>
          )}
          <div className="flex items-center gap-4 mt-2">
            {consent.content && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-primary"
                    onClick={() => setViewingConsent(consent)}
                  >
                    <Info className="h-3 w-3 mr-1" />
                    Read full text
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {consent.title}
                    </DialogTitle>
                    <DialogDescription>
                      Version {consent.version} - Effective from{' '}
                      {new Date(consent.effectiveFrom).toLocaleDateString()}
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{consent.content}</ReactMarkdown>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            )}
            {consent.documentUrl && (
              <a
                href={consent.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                View document
              </a>
            )}
          </div>
          {consent.summary && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
              <strong>Summary:</strong> {consent.summary}
            </div>
          )}
        </div>
        {isAccepted && (
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading consent forms...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <AlertCircle className="h-10 w-10 mx-auto text-destructive mb-3" />
          <p className="font-medium text-destructive">Failed to load consent forms</p>
          <p className="text-sm text-muted-foreground mt-1">
            Please try again later or contact support.
          </p>
        </CardContent>
      </Card>
    )
  }

  const hasRequired = data.required && data.required.length > 0
  const hasOptional = data.optional && data.optional.length > 0 && !requiredOnly

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Required Consents */}
        {hasRequired ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Required Consents</h3>
              <Button variant="outline" size="sm" onClick={acceptAllRequired}>
                Accept All Required
              </Button>
            </div>
            <div className="space-y-3">
              {data.required.map((consent) => renderConsentItem(consent, true))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
            <p className="font-medium">No required consents at this time.</p>
          </div>
        )}

        {/* Optional Consents */}
        {hasOptional && (
          <>
            <Separator />
            <Accordion type="single" collapsible>
              <AccordionItem value="optional" className="border-none">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">Optional Preferences</h3>
                    <Badge variant="secondary" className="text-xs">
                      {data.optional.length}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pt-2">
                    {data.optional.map((consent) => renderConsentItem(consent, false))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </>
        )}

        {/* Actions */}
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {allRequiredAccepted ? (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                All required consents accepted
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Please accept all required consents to continue
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {hasOptional && (
              <Button variant="outline" onClick={acceptAll}>
                Accept All
              </Button>
            )}
            <Button
              onClick={handleSubmit}
              disabled={!allRequiredAccepted}
            >
              Continue
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
