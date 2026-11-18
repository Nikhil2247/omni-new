import { PageHeader } from '@/components/dashboard'
import { OpsDisputeDetails } from '@/components/features/ops'

export default function OpsDisputeDetailPage({ params }: { params: { disputeId: string } }) {
  return (
    <div className="space-y-3">
      <PageHeader title="Dispute Details" />
      <OpsDisputeDetails disputeId={params.disputeId} />
    </div>
  )
}
