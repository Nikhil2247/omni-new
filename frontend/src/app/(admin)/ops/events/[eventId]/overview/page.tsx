import { OpsEventDetails } from '@/components/features/ops'

export default function OpsEventOverviewPage({ params }: { params: { eventId: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Event Overview</h1>
      <OpsEventDetails eventId={params.eventId} />
    </div>
  )
}
