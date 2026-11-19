'use client'

import { ListSectionHead } from '@/components/sketch'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { useFeaturedVendors } from '@/hooks/queries/use-public-vendors'

/** "Top-Rated Vendors": handpicked professionals. Hidden when there are none. */
export function TopVendors() {
  const { data: vendors, isLoading } = useFeaturedVendors(4)
  // Render nothing until data arrives (no skeleton flash); hidden when there are none.
  if (isLoading || !vendors || vendors.length === 0) return null

  return (
    <section data-reveal id="top-vendors" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <ListSectionHead
        eyebrow="Featured"
        title="Top-Rated Vendors"
        subtitle="Handpicked professionals for your special day"
        href="/vendors"
        cta="View All Vendors →"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {vendors.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
      </div>
    </section>
  )
}
