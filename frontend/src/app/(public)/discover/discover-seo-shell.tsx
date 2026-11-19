import Image from 'next/image'
import Link from 'next/link'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { serverImageProps } from '@/lib/utils/cloudinary'
import type { PortfolioMediaItem } from '@/lib/api/types/portfolio-media.types'

const TOPICS = ['mandap decor', 'bridal looks', 'mehendi ideas', 'sangeet decor', 'venue ideas', 'floral decor']

/**
 * Server-rendered version of the Discover page. Sent in the initial HTML so search engines (and people on slow
 * connections) get the heading, an introduction and real photos with descriptive alt text, each linking to the
 * vendor behind it. The interactive masonry grid replaces it once the page loads in the browser.
 */
export function DiscoverSeoShell({ items, total }: { items: PortfolioMediaItem[]; total?: number }) {
  return (
    <main className="min-h-screen">
      <section className="mx-auto w-full max-w-[1440px] px-4 pt-6 pb-1 md:pt-7">
        <p className="sk-eyebrow">Discover</p>
        <h1 className="font-display mt-2.5 max-w-[22ch] text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          Wedding inspiration from real Indian weddings
        </h1>
        <p className="text-ink-soft mt-3 max-w-2xl">
          Browse {total ? `${total.toLocaleString('en-IN')} ` : ''}photos from real weddings and events, shared by
          the photographers, decorators, venues and makeup artists who created them. Tap any photo to see the vendor
          behind it and ask for a quote.
        </p>
        <p className="text-ink-soft mt-3 flex flex-wrap items-center gap-2 text-[0.9rem]">
          Popular searches:
          {TOPICS.map((topic) => (
            <Link
              key={topic}
              href={`/discover?query=${encodeURIComponent(topic)}`}
              className="text-blue px-1 py-0.5 font-bold underline decoration-[3px] underline-offset-[3px]"
            >
              {topic}
            </Link>
          ))}
        </p>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 py-4 lg:py-8">
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.slice(0, 24).map((item, index) => {
            const source = item.cdnUrl || getMinioViewUrl(item.url) || item.url
            const vendorName = item.vendor.businessName
            const category = item.vendor.categoryName
            const alt = item.altText || `${vendorName}${category ? ` – ${category}` : ''} wedding photo`
            return (
              <li key={item.id} className="border-ink bg-sky1 overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2">
                <Link href={`/vendors/${item.vendor.slug}`} className="block">
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image
                      {...serverImageProps(source, 480)}
                      alt={alt}
                      fill
                      sizes="(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 17vw"
                      priority={index < 4}
                      className="object-cover"
                    />
                  </div>
                  <p className="truncate px-2.5 py-2 text-sm font-medium">{vendorName}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}
