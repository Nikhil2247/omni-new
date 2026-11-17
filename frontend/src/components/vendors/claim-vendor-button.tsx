'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { SketchButton } from '@/components/sketch'
import { ClaimVendorModal } from './claim-vendor-modal'
import { cn } from '@/lib/utils'

interface ClaimVendorButtonProps {
  vendorProfileId: string
  vendorName: string
  contactEmail?: string | null
  contactPhone?: string | null
  className?: string
}

export function ClaimVendorButton({
  vendorProfileId,
  vendorName,
  contactEmail,
  contactPhone,
  className,
}: ClaimVendorButtonProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <SketchButton variant="line" size="sm" className={cn(className)} onClick={() => setModalOpen(true)}>
        <Shield className="h-4 w-4" />
        Claim this business
      </SketchButton>

      <ClaimVendorModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        vendorProfileId={vendorProfileId}
        vendorName={vendorName}
        contactEmail={contactEmail}
        contactPhone={contactPhone}
      />
    </>
  )
}
