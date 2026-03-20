'use client'

import { use } from 'react'
import { OpsKycDetails } from '@/components/features/ops'

export default function OpsKycDetailPage({ params }: { params: Promise<{ kycId: string }> }) {
  const { kycId } = use(params)

  return <OpsKycDetails kycId={kycId} />
}
