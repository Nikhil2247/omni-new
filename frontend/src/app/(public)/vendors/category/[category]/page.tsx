import { cache } from 'react'
import Link from 'next/link'
import { publicService } from '@/lib/api/services/public.service'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Button } from '@/components/ui/button'
import { ChevronRight, Filter, MapPin } from 'lucide-react'
import VendorCategoryClient from './vendor-category-client'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://omnicassion.com'

// Category display names for better SEO
const categoryDisplayNames: Record<string, string> = {
  'photography': 'Wedding Photographers',
  'videography': 'Wedding Videographers',
  'catering': 'Catering Services',
  'venues': 'Wedding Venues',
  'entertainment': 'Entertainment & DJs',
  'decor-design': 'Decor & Design',
  'florist': 'Florists',
  'makeup-hair': 'Makeup & Hair Artists',
  'mehndi-artists': 'Mehndi Artists',
  'wedding-planning': 'Wedding Planners',
  'invitation': 'Invitation Designers',
  'jewellery': 'Bridal Jewellery',
}

function getCategoryDisplayName(slug: string): string {
  return categoryDisplayNames[slug.toLowerCase()] ||
    slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

const getVendorsByCategory = cache(async (category: string, limit = 24) => {
  try {
    const response = await publicService.getVendors({
      categoryId: category,
      limit,
    })
    return response?.data || []
  } catch {
    return []
  }
})

export default async function VendorsByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const displayName = getCategoryDisplayName(category)
  const vendors = await getVendorsByCategory(category, 24)

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Vendors', url: '/vendors' },
    { name: displayName },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* SEO-Optimized Header */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Best {displayName} in India
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Discover top-rated {displayName.toLowerCase()} for your wedding or event.
          Compare portfolios, read verified reviews, and book with confidence on Omnicassion.
        </p>

        {/* Quick Stats for Trust Signals */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="font-semibold text-foreground">{vendors.length}+</span> verified vendors
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Serving all major cities in India
          </span>
        </div>
      </header>

      {/* Filter Bar - Client Component for Interactivity */}
      <VendorCategoryClient
        category={category}
        initialVendors={vendors}
        displayName={displayName}
      />

      {/* SEO Content Section */}
      <section className="mt-12 space-y-6 border-t pt-8">
        <h2 className="text-2xl font-semibold">
          Why Choose {displayName} on Omnicassion?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-medium">Verified Professionals</h3>
            <p className="text-sm text-muted-foreground">
              Every {displayName.toLowerCase().replace(/s$/, '')} on our platform is verified
              for quality and reliability.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Real Reviews</h3>
            <p className="text-sm text-muted-foreground">
              Read authentic reviews from real customers who have used these services.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Easy Booking</h3>
            <p className="text-sm text-muted-foreground">
              Request quotes, compare prices, and book directly through our secure platform.
            </p>
          </div>
        </div>

        {/* Internal Linking for SEO */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-medium">Browse Other Categories</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryDisplayNames)
              .filter(([slug]) => slug !== category.toLowerCase())
              .slice(0, 8)
              .map(([slug, name]) => (
                <Link
                  key={slug}
                  href={`/vendors/category/${slug}`}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
                >
                  {name}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}
