import Link from 'next/link'
import NextImage from 'next/image'
import { Paper } from '@/components/sketch'
import { cn } from '@/lib/utils'

interface AuthCardProps {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

/** Centred taped paper card with the logo sticker, used by every auth page. */
export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <Paper tape className={cn('w-full px-7 pb-7 pt-8 max-sm:px-5', className)}>
      <div className="mb-5 flex flex-col items-center gap-3 text-center">
        <Link href="/" className="sk-sticker" aria-label="Omnicassion home">
          <NextImage
            src="/images/omnilogo.avif"
            width={150}
            height={36}
            unoptimized
            priority
            alt="Omnicassion"
            className="h-[34px] w-auto"
          />
        </Link>
        <h1 className="font-display text-[1.7rem] font-bold leading-tight text-ink">{title}</h1>
        {description ? <p className="text-sm text-ink-soft">{description}</p> : null}
      </div>
      {children}
      {footer ? (
        <div className="mt-6 border-t-2 border-dashed border-line pt-4 text-center text-sm text-ink-soft [&_a]:font-bold [&_a]:text-blue [&_a:hover]:underline">
          {footer}
        </div>
      ) : null}
    </Paper>
  )
}
