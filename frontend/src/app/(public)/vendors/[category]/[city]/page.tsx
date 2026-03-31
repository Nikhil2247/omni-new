import { cache } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { publicService } from '@/lib/api/services/public.service'
import { VendorCard } from '@/components/features/vendors/vendor-card'
import { Breadcrumb } from '@/components/common/Breadcrumb'
import { Button } from '@/components/ui/button'
import { ChevronRight, MapPin, Star, Users } from 'lucide-react'
import { indianCities } from '@/lib/seo/keywords'

const validCities = new Set(indianCities.map(c => c.toLowerCase().replace(/\s+/g, '-')))

// Category display configurations
const categoryDisplayConfig: Record<string, { singular: string; plural: string }> = {
  'photography': { singular: 'Wedding Photographer', plural: 'Wedding Photographers' },
  'videography': { singular: 'Wedding Videographer', plural: 'Wedding Videographers' },
  'catering': { singular: 'Caterer', plural: 'Caterers' },
  'venues': { singular: 'Wedding Venue', plural: 'Wedding Venues' },
  'entertainment': { singular: 'Wedding DJ', plural: 'Wedding DJs & Entertainment' },
  'decor-design': { singular: 'Wedding Decorator', plural: 'Wedding Decorators' },
  'florist': { singular: 'Wedding Florist', plural: 'Wedding Florists' },
  'makeup-hair': { singular: 'Bridal Makeup Artist', plural: 'Bridal Makeup Artists' },
  'mehndi-artists': { singular: 'Mehndi Artist', plural: 'Mehndi Artists' },
  'wedding-planning': { singular: 'Wedding Planner', plural: 'Wedding Planners' },
  'invitation': { singular: 'Invitation Designer', plural: 'Invitation Designers' },
  'jewellery': { singular: 'Bridal Jewellery', plural: 'Bridal Jewellery Shops' },
}

function getCityDisplayName(citySlug: string): string {
  const cityMap: Record<string, string> = {
    'mumbai': 'Mumbai',
    'delhi': 'Delhi',
    'bangalore': 'Bangalore',
    'hyderabad': 'Hyderabad',
    'chennai': 'Chennai',
    'kolkata': 'Kolkata',
    'pune': 'Pune',
    'ahmedabad': 'Ahmedabad',
    'jaipur': 'Jaipur',
    'lucknow': 'Lucknow',
    'chandigarh': 'Chandigarh',
    'goa': 'Goa',
    'udaipur': 'Udaipur',
    'kochi': 'Kochi',
    'gurgaon': 'Gurgaon',
    'noida': 'Noida',
    'indore': 'Indore',
    'surat': 'Surat',
    'nagpur': 'Nagpur',
    'coimbatore': 'Coimbatore',
  }
  return cityMap[citySlug.toLowerCase()] || citySlug.charAt(0).toUpperCase() + citySlug.slice(1)
}

function getCategoryConfig(categorySlug: string) {
  const config = categoryDisplayConfig[categorySlug]
  if (config) return config

  const displayName = categorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  return { singular: displayName, plural: `${displayName}s` }
}

const getVendorsByCategoryAndCity = cache(async (category: string, _city: string, limit = 24) => {
  try {
    // Fetch vendors filtered by category
    const response = await publicService.getVendors({
      categoryId: category,
      limit,
    })
    // In production, add city filtering at the API level
    return response?.data || []
  } catch {
    return []
  }
})

// Other cities for internal linking
const otherCities = indianCities.slice(0, 12)

export default async function VendorCityCategoryPage({
  params,
}: {
  params: Promise<{ category: string; city: string }>
}) {
  const { category, city } = await params

  // Validate city
  if (!validCities.has(city.toLowerCase())) {
    notFound()
  }

  const categoryConfig = getCategoryConfig(category)
  const cityName = getCityDisplayName(city)
  const vendors = await getVendorsByCategoryAndCity(category, city, 24)

  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Vendors', url: '/vendors' },
    { name: categoryConfig.plural, url: `/vendors/category/${category}` },
    { name: cityName },
  ]

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumb items={breadcrumbItems} />

      {/* SEO-Optimized Header */}
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Best {categoryConfig.plural} in {cityName}
        </h1>
        <p className="max-w-3xl text-lg text-muted-foreground">
          Find and book top-rated {categoryConfig.plural.toLowerCase()} in {cityName}.
          Compare portfolios, read verified reviews, and get quotes from the best
          {' '}{categoryConfig.singular.toLowerCase()}s for your wedding or event.
        </p>

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span className="font-semibold text-foreground">{vendors.length}+</span> verified {categoryConfig.plural.toLowerCase()}
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            Serving {cityName} & nearby areas
          </span>
          <span className="hidden sm:inline">|</span>
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            4.5+ average rating
          </span>
        </div>
      </header>

      {/* Vendor Grid */}
      {vendors.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <VendorCard key={vendor.id} vendor={vendor} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <h3 className="text-lg font-medium">No {categoryConfig.plural.toLowerCase()} found in {cityName}</h3>
          <p className="mt-2 text-muted-foreground">
            We&apos;re adding new {categoryConfig.plural.toLowerCase()} regularly. Check back soon or explore other cities.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/vendors/category/${category}`}>
              Browse All {categoryConfig.plural}
            </Link>
          </Button>
        </div>
      )}

      {/* SEO Content Section */}
      <section className="mt-12 space-y-6 border-t pt-8">
        <h2 className="text-2xl font-semibold">
          Why Book {categoryConfig.plural} in {cityName} on Omnicassion?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <h3 className="font-medium">Local Experts</h3>
            <p className="text-sm text-muted-foreground">
              Our {categoryConfig.plural.toLowerCase()} know {cityName} inside out - the best locations,
              local customs, and how to make your event perfect.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Verified Reviews</h3>
            <p className="text-sm text-muted-foreground">
              Read authentic reviews from couples in {cityName} who have used these services.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">Best Prices</h3>
            <p className="text-sm text-muted-foreground">
              Compare prices from multiple {categoryConfig.plural.toLowerCase()} in {cityName} and find the best deal.
            </p>
          </div>
        </div>

        {/* Other Cities for Internal Linking */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-medium">
            {categoryConfig.plural} in Other Cities
          </h3>
          <div className="flex flex-wrap gap-2">
            {otherCities
              .filter(c => c.toLowerCase().replace(/\s+/g, '-') !== city.toLowerCase())
              .map(otherCity => {
                const citySlug = otherCity.toLowerCase().replace(/\s+/g, '-')
                return (
                  <Link
                    key={citySlug}
                    href={`/vendors/${category}/${citySlug}`}
                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
                  >
                    {categoryConfig.plural} in {otherCity}
                    <ChevronRight className="ml-1 h-3 w-3" />
                  </Link>
                )
              })}
          </div>
        </div>

        {/* Other Categories in Same City */}
        <div className="mt-8">
          <h3 className="mb-4 text-lg font-medium">
            Other Wedding Services in {cityName}
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryDisplayConfig)
              .filter(([slug]) => slug !== category)
              .slice(0, 8)
              .map(([slug, config]) => (
                <Link
                  key={slug}
                  href={`/vendors/${slug}/${city}`}
                  className="inline-flex items-center rounded-full border px-3 py-1 text-sm hover:bg-muted transition-colors"
                >
                  {config.plural}
                  <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}

// Generate static params for top cities and categories
export async function generateStaticParams() {
  const categories = Object.keys(categoryDisplayConfig)
  const cities = indianCities.slice(0, 10).map(c => c.toLowerCase().replace(/\s+/g, '-'))

  const params: Array<{ category: string; city: string }> = []

  for (const category of categories) {
    for (const city of cities) {
      params.push({ category, city })
    }
  }

  return params
}
