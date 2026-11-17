import { OpsDisputeDetails } from '@/components/features/ops'

export default function OpsDisputeDetailPage({ params }: { params: { disputeId: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Dispute Details</h1>
      <OpsDisputeDetails disputeId={params.disputeId} />
    </div>
  )
}
