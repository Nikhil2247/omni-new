import { PageHeader } from '@/components/dash'
import { OpsVendorsList } from '@/components/features/ops'

export default function OpsVendorDetailPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Vendor Details" />
      <OpsVendorsList />
    </div>
  )
}
