'use client'

import { useParams } from 'next/navigation'
import { useVendorsByCategory } from '@/hooks/queries/use-public-vendors'
import { VendorCard } from '@/components/features/vendors/vendor-card'

export default function VendorsByCategoryPage() {
  const params = useParams()
  const category = params.category as string
  const { data, isLoading, error } = useVendorsByCategory(category, 24)

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold">Category Vendors</h1>
        <p className="text-muted-foreground">
          Category: {category}
        </p>
      </div>
      {isLoading && (
        <div className="text-sm text-muted-foreground">Loading vendors...</div>
      )}
      {error && (
        <div className="text-sm text-destructive">
          Failed to load vendors.
        </div>
      )}
      {data && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      )}
    </main>
  )
}
