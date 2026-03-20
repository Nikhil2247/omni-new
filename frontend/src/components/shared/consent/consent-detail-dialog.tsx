'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { publicService } from '@/lib/api/services/public.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
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
  Calendar,
  Clock,
  CheckCircle2,
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

interface ConsentDetailDialogProps {
  /** The consent definition to display, or consent type to fetch */
  consent?: ConsentDefinition
  consentType?: ConsentType
  version?: string
  /** Trigger element */
  trigger?: React.ReactNode
  /** Called when user accepts */
  onAccept?: () => void
  /** Whether to show accept button */
  showAcceptButton?: boolean
  /** Whether consent is already accepted */
  isAccepted?: boolean
  /** Open state control */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ConsentDetailDialog({
  consent: propConsent,
  consentType,
  version,
  trigger,
  onAccept,
  showAcceptButton = false,
  isAccepted = false,
  open,
  onOpenChange,
}: ConsentDetailDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  // Fetch consent if only type is provided
  const { data: fetchedConsent, isLoading } = useQuery({
    queryKey: ['consent-definition', consentType, version],
    queryFn: () => publicService.getConsentDefinitionByType(consentType!, version),
    enabled: !propConsent && !!consentType,
  })

  const consent = propConsent || fetchedConsent
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen

  if (!consent && !consentType) {
    return null
  }

  const Icon = consent ? consentIcons[consent.consentType] : FileText

  const handleAccept = () => {
    onAccept?.()
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-4xl max-h-[90vh]">
        {isLoading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        ) : consent ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <span>{consent.title}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      Version {consent.version}
                    </Badge>
                    {consent.isRequired && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                    {isAccepted && (
                      <Badge className="text-xs bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Accepted
                      </Badge>
                    )}
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Effective: {new Date(consent.effectiveFrom).toLocaleDateString()}
                </span>
                {consent.effectiveUntil && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Until: {new Date(consent.effectiveUntil).toLocaleDateString()}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="content" className="flex-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="content">Full Text</TabsTrigger>
                <TabsTrigger value="summary">Summary</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-4">
                <ScrollArea className="h-[50vh] pr-4">
                  {consent.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{consent.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Full text not available.</p>
                      {consent.documentUrl && (
                        <a
                          href={consent.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center justify-center gap-1 mt-2"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View external document
                        </a>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="summary" className="mt-4">
                <ScrollArea className="h-[50vh] pr-4">
                  {consent.summary ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-medium mb-2">Plain Language Summary</h4>
                        <p className="text-sm text-muted-foreground">{consent.summary}</p>
                      </div>
                      {consent.description && (
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                          <h4 className="font-medium mb-2">What You're Agreeing To</h4>
                          <p className="text-sm">{consent.description}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Summary not available.</p>
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <DialogFooter className="gap-2">
              {consent.documentUrl && (
                <Button variant="outline" asChild>
                  <a href={consent.documentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Document
                  </a>
                </Button>
              )}
              {showAcceptButton && !isAccepted && (
                <Button onClick={handleAccept}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  I Accept
                </Button>
              )}
              {!showAcceptButton && (
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Close
                </Button>
              )}
            </DialogFooter>
          </>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            Consent not found.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
