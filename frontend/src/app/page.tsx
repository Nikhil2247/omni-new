import { PublicLayout } from '@/components/layouts/public'
import { BuntingBand } from '@/components/sketch'
import { HeroSection } from '@/components/home/hero'
import { CategoryTiles } from '@/components/home/categories'
import { StartPlanning } from '@/components/home/journey'
import { ToolsShowcase } from '@/components/home/tools-showcase'
import { TopVendors } from '@/components/home/top-vendors'
import { TrustSection } from '@/components/home/trust'
import { InspireSection } from '@/components/home/inspire'
import { TopBlogs } from '@/components/home/blogs'
import { FaqSection } from '@/components/home/faq'
import { VendorCta } from '@/components/home/vendor-cta'
import { SponsoredBanner, BoostedVendors, PromotedAlbumsSection } from '@/components/home/ads'

export default function Home() {
  return (
    <PublicLayout>
      <HeroSection />
      <BuntingBand />
      <CategoryTiles />
      <StartPlanning />
      <SponsoredBanner />
      <ToolsShowcase />
      <BoostedVendors />
      <TopVendors />
      <PromotedAlbumsSection />
      <TrustSection />
      <InspireSection />
      <TopBlogs />
      <FaqSection />
      <VendorCta />
    </PublicLayout>
  )
}
