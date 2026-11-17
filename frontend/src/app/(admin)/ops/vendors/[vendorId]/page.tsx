import { OpsVendorsList } from '@/components/features/ops'

export default function OpsVendorDetailPage({ params }: { params: { vendorId: string } }) {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Vendor Details</h1>
      <p className="text-muted-foreground">Vendor profile ID: {params.vendorId}</p>
      <OpsVendorsList />
    </div>
  )
}
