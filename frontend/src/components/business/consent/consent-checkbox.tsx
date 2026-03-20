'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, FileText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ConsentDetailDialog } from '@/components/shared/consent'
import type { ConsentType, ConsentDefinition } from '@/lib/api/types/business.types'

interface ConsentCheckboxProps {
  type: ConsentType
  name: string
  description: string
  required?: boolean
  checked: boolean
  onChange: (checked: boolean) => void
  documentUrl?: string | null
  content?: string | null
  summary?: string | null
  version?: string
  disabled?: boolean
  alreadyAccepted?: boolean
  className?: string
}

export function ConsentCheckbox({
  type,
  name,
  description,
  required = false,
  checked,
  onChange,
  documentUrl,
  content,
  summary,
  version = '1.0',
  disabled = false,
  alreadyAccepted = false,
  className,
}: ConsentCheckboxProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  // Create a consent definition object for the dialog
  const consentDefinition: ConsentDefinition = {
    id: type,
    consentType: type,
    version,
    title: name,
    description: description || null,
    content: content || null,
    summary: summary || null,
    documentUrl: documentUrl || null,
    isRequired: required,
    isActive: true,
    appliesToUsers: false,
    appliesToVendors: true,
    displayOrder: 0,
    effectiveFrom: new Date().toISOString(),
    effectiveUntil: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  const hasFullContent = content || summary || documentUrl

  return (
    <div
      className={cn(
        'flex items-start space-x-3 p-4 rounded-lg border transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border',
        alreadyAccepted && 'border-green-500/50 bg-green-500/5',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <Checkbox
        id={`consent-${type}`}
        checked={checked}
        onCheckedChange={onChange}
        disabled={disabled || alreadyAccepted}
        className="mt-1"
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <Label
            htmlFor={`consent-${type}`}
            className={cn(
              'text-sm font-medium cursor-pointer',
              disabled && 'cursor-not-allowed'
            )}
          >
            {name}
          </Label>
          {required && (
            <Badge variant="secondary" className="text-xs">
              Required
            </Badge>
          )}
          {alreadyAccepted && (
            <Badge className="text-xs bg-green-600">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Accepted
            </Badge>
          )}
          {version && (
            <Badge variant="outline" className="text-xs">
              v{version}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex items-center gap-2 pt-1">
          {hasFullContent && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs text-primary"
              onClick={(e) => {
                e.stopPropagation()
                setDialogOpen(true)
              }}
            >
              <FileText className="h-3 w-3 mr-1" />
              Read Full Terms
            </Button>
          )}
          {documentUrl && (
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              External Link
            </a>
          )}
        </div>
      </div>

      {hasFullContent && (
        <ConsentDetailDialog
          consent={consentDefinition}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          isAccepted={checked || alreadyAccepted}
          showAcceptButton={!checked && !alreadyAccepted && !disabled}
          onAccept={() => onChange(true)}
        />
      )}
    </div>
  )
}
