import Link from 'next/link'
import { Brush } from './primitives'
import { SecHead, SketchButton } from './primitives'

/** Headline with the last word on a brush stroke: "Top-Rated Vendors" becomes "Top-Rated <Vendors>". */
export function BrushTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/)
  const last = words.pop() ?? ''
  return (
    <>
      {words.length ? `${words.join(' ')} ` : null}
      <Brush>{last}</Brush>
    </>
  )
}

/**
 * The shared heading for a row of listing cards (top-rated vendors, promoted vendors, trending portfolios):
 * eyebrow, headline, a short line and a button on the right.
 */
export function ListSectionHead({
  eyebrow,
  title,
  subtitle,
  href,
  cta,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  href?: string
  cta?: string
}) {
  return (
    <SecHead eyebrow={eyebrow} title={<BrushTitle title={title} />}>
      <div className="flex flex-col items-start gap-4">
        {subtitle ? <p>{subtitle}</p> : null}
        {href && cta ? (
          <SketchButton asChild variant="line">
            <Link href={href}>{cta}</Link>
          </SketchButton>
        ) : null}
      </div>
    </SecHead>
  )
}
