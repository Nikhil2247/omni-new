import { PageHeader } from '@/components/dash'
import { OpsEventsList } from '@/components/features/ops'

export default function OpsEventsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Events" />
      <OpsEventsList />
    </div>
  )
}
