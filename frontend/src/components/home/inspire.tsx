import Link from 'next/link'
import { Brush, Photo, SecHead, SketchButton } from '@/components/sketch'
import { INSPIRE_TILES } from './content'

const PHOTOS: Record<string, string> = {
  decor: 'inspire-decor',
  venue: 'inspire-venue',
  bridal: 'inspire-bridal',
  food: 'inspire-food',
}

export function InspireSection() {
  return (
    <section data-reveal id="inspire" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Get Inspired" center title={<>Explore Ideas for Your <Brush>Event</Brush></>}>
        Browse through stunning photos, trending styles, and creative ideas
      </SecHead>
      <div className="grid gap-6 min-[1001px]:grid-cols-4 min-[621px]:max-[1000px]:grid-cols-2">
        {INSPIRE_TILES.map((t) => (
          <Link
            key={t.title}
            href={`/discover?query=${encodeURIComponent(t.query)}`}
            className="border-ink bg-sky1 group relative block aspect-[4/5] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 text-white transition-transform hover:-translate-y-1"
          >
            <Photo
              name={PHOTOS[t.query]}
              alt={t.title}
              width={720}
              height={900}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(10_14_35/.86)] to-transparent px-4 pt-11 pb-3.5">
              <h3 className="font-display text-[1.3rem] font-semibold text-white">{t.title}</h3>
              <span className="text-[0.85rem] opacity-85">{t.count}</span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 text-center">
        <SketchButton asChild variant="line">
          <Link href="/discover">Explore Discover →</Link>
        </SketchButton>
      </div>
    </section>
  )
}
