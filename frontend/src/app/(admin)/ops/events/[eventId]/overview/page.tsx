import { OpsEventDetails } from '@/components/features/ops'

export default function OpsEventOverviewPage({ params }: { params: { eventId: string } }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Event Overview</h1>
      <OpsEventDetails eventId={params.eventId} />
    </div>
  )
}
