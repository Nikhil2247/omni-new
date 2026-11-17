'use client'

import { ListSectionHead, skPaper } from '@/components/sketch'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { useFeaturedVendors } from '@/hooks/queries/use-public-vendors'

/** "Top-Rated Vendors": handpicked professionals. Hidden when there are none. */
export function TopVendors() {
  const { data: vendors, isLoading } = useFeaturedVendors(4)
  if (!isLoading && (!vendors || vendors.length === 0)) return null

  return (
    <section id="top-vendors" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <ListSectionHead
        eyebrow="Featured"
        title="Top-Rated Vendors"
        subtitle="Handpicked professionals for your special day"
        href="/vendors"
        cta="View All Vendors →"
      />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={`${skPaper({ alt: i % 2 === 1 })} animate-pulse p-2.5`}>
                <div className="bg-muted aspect-[4/3] rounded-md" />
                <div className="bg-muted mt-3 h-3 w-2/3 rounded" />
                <div className="bg-muted mt-2 h-3 w-full rounded" />
              </div>
            ))
          : vendors?.map((vendor) => <VendorCard key={vendor.id} vendor={vendor} />)}
      </div>
    </section>
  )
}
