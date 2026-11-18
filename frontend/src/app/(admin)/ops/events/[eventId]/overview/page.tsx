import { PageHeader } from '@/components/dash'
import { OpsEventDetails } from '@/components/features/ops'

export default function OpsEventOverviewPage({ params }: { params: { eventId: string } }) {
  return (
    <div className="space-y-3">
      <PageHeader title="Event Overview" />
      <OpsEventDetails eventId={params.eventId} />
    </div>
  )
}
