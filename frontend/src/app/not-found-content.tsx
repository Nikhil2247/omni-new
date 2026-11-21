import Link from 'next/link'
import { Brush, Eyebrow, PaintedScene, Paper, SketchButton, SkContainer } from '@/components/sketch'

const POPULAR = [
  { href: '/vendors', label: 'Find Vendors' },
  { href: '/discover', label: 'Discover' },
  { href: '/planning-tools', label: 'Planning Tools' },
  { href: '/blog', label: 'Blog' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
]

/** The 404 body only. The caller supplies the header/footer (or not), so they never render twice. */
export function NotFoundContent() {
  return (
    <SkContainer className="py-10 sm:py-16">
      <Paper tape className="mx-auto max-w-2xl px-5 py-9 text-center sm:px-10">
        {/* a small painted scene, with the 404 hung over it */}
        <div className="border-ink bg-sky1 relative mx-auto mb-7 aspect-[16/7] max-w-md overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2">
          <PaintedScene seed={404} className="h-full w-full" />
          <span className="font-display text-on-blue absolute inset-0 grid place-items-center text-[clamp(3.6rem,16vw,6rem)] leading-none font-bold [text-shadow:0_2px_0_rgb(28_39_87/.55)]">
            404
          </span>
        </div>

        <Eyebrow>Lost the way</Eyebrow>
        <h1 className="font-display mt-2 text-[clamp(1.9rem,6vw,3rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          This page wandered <Brush>off</Brush>
        </h1>
        <p className="text-ink-soft mx-auto mt-4 max-w-md">
          Sorry, the page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <SketchButton asChild>
            <Link href="/">Back to Home</Link>
          </SketchButton>
          <SketchButton asChild variant="line">
            <Link href="/vendors">Browse Vendors</Link>
          </SketchButton>
        </div>

        <div className="border-line mt-9 border-t-2 border-dashed pt-6">
          <p className="sk-hand text-ink-soft mb-3 text-xl">Popular places</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {POPULAR.map((l) => (
              <Link key={l.href} href={l.href} className="sk-chip hover:bg-blue-wash">
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </Paper>
    </SkContainer>
  )
}
