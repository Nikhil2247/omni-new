import Link from 'next/link'
import { Brush, PaintedScene, SecHead, SketchButton } from '@/components/sketch'
import { INSPIRE_TILES } from './content'

export function InspireSection() {
  return (
    <section id="inspire" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Get Inspired" center title={<>Explore Ideas for Your <Brush>Event</Brush></>}>
        Browse through stunning photos, trending styles, and creative ideas
      </SecHead>
      <div className="grid gap-6 min-[1001px]:grid-cols-4 min-[621px]:max-[1000px]:grid-cols-2">
        {INSPIRE_TILES.map((t, i) => (
          <Link
            key={t.title}
            href={`/discover?query=${encodeURIComponent(t.query)}`}
            className="border-ink relative block aspect-[4/5] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2 text-white transition-transform hover:-translate-y-1"
          >
            <PaintedScene seed={i * 4 + 6} motif={t.motif} className="absolute inset-0 h-full w-full" />
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
