import { PageHeader } from '@/components/dash'
import { OpsSupportList } from '@/components/features/ops'

export default function OpsSupportDetailPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Support Ticket" />
      <OpsSupportList />
    </div>
  )
}
