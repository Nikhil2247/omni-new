import { PageHeader } from '@/components/dashboard'
import { CreateEventForm } from '@/components/forms/ops'

export default function OpsEventCreatePage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Create New Active Event" />
      <CreateEventForm />
    </div>
  )
}
