import { OpsKycDetails } from '@/components/features/ops'

export default function OpsKycDetailPage({ params }: { params: { kycId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">KYC Record</h1>
      <OpsKycDetails kycId={params.kycId} />
    </div>
  )
}
