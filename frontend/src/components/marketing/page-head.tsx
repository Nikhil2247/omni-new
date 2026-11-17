import { Eyebrow } from '@/components/sketch'
import { cn } from '@/lib/utils'

/** Page heading block used by the marketing and content pages: eyebrow, large display title and an optional lead paragraph. */
export function PageHead({
  eyebrow,
  title,
  sub,
  center,
  children,
  className,
}: {
  eyebrow: React.ReactNode
  title: React.ReactNode
  sub?: React.ReactNode
  center?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn('relative pt-[22px] pb-2.5', center && 'text-center', className)}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h1
        className={cn(
          'font-display mt-2.5 max-w-[20ch] text-[clamp(2rem,9.2vw,2.8rem)] leading-[1.05] font-semibold tracking-tight text-balance md:text-[clamp(2.2rem,5vw,3.8rem)]',
          center && 'mx-auto',
        )}
      >
        {title}
      </h1>
      {sub ? <p className={cn('text-ink-soft mt-3 max-w-xl', center && 'mx-auto')}>{sub}</p> : null}
      {children}
    </header>
  )
}
