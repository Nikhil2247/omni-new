import { OpsDisputeDetails } from '@/components/features/ops'

export default function OpsDisputeDetailPage({ params }: { params: { disputeId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dispute Details</h1>
      <OpsDisputeDetails disputeId={params.disputeId} />
    </div>
  )
}
