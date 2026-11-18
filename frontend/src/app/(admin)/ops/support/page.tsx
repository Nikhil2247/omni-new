import { PageHeader } from '@/components/dash'
import { OpsSupportList } from '@/components/features/ops'

export default function OpsSupportPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Support Tickets" />
      <OpsSupportList />
    </div>
  )
}
