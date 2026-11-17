import { BannerAd, FeaturedVendors, PromotedAlbums } from '@/components/ads'

/** Paid placements, kept in the same slots as before. */
export function SponsoredBanner() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 py-8">
      <BannerAd placement="homepage" variant="large" />
    </section>
  )
}

/** Promoted vendors: same heading and card layout as "Top-Rated Vendors". */
export function BoostedVendors() {
  return (
    <FeaturedVendors
      limit={4}
      title="Promoted Vendors"
      subtitle="Premium vendors ready to make your event special"
    />
  )
}

/** Trending portfolios: same heading and card layout as the vendor rows. */
export function PromotedAlbumsSection() {
  return (
    <PromotedAlbums
      limit={4}
      title="Trending Portfolios"
      subtitle="Discover stunning work from top vendors"
    />
  )
}
