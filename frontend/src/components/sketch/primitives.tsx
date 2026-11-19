import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

/* ---------- class helpers (use these on <Link> and other elements) ---------- */
export function skPaper(opts?: { alt?: boolean; tape?: boolean; className?: string }) {
  return cn('sk-paper', opts?.alt && 'sk-paper--alt', opts?.tape && 'sk-tape', opts?.className)
}

export function skBtn(
  variant: 'solid' | 'line' | 'ghost' = 'solid',
  size: 'md' | 'sm' | 'icon' = 'md',
  className?: string,
) {
  return cn(
    'sk-btn',
    variant === 'line' && 'sk-btn--line',
    variant === 'ghost' && 'sk-btn--ghost',
    size === 'sm' && 'sk-btn--sm',
    size === 'icon' && 'sk-btn--sm sk-btn--icon',
    className,
  )
}

/* ---------- components ---------- */
type DivProps = React.HTMLAttributes<HTMLDivElement>

/** A card with a wobbly hand-drawn outline. */
export function Paper({ alt, tape, className, ...props }: DivProps & { alt?: boolean; tape?: boolean }) {
  return <div className={skPaper({ alt, tape, className })} {...props} />
}

/** A brush-stroke highlight behind a word. */
export function Brush({ gold, className, ...props }: React.HTMLAttributes<HTMLSpanElement> & { gold?: boolean }) {
  return <span className={cn('sk-brush', gold && 'sk-brush--gold', className)} {...props} />
}

/** Handwritten accent text. */
export function Hand({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('sk-hand', className)} {...props} />
}

export function Eyebrow({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('sk-eyebrow', className)} {...props} />
}

export function Stamp({
  tone = 'ok',
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: 'ok' | 'wait' | 'late' }) {
  return (
    <span
      className={cn('sk-stamp', tone === 'wait' && 'sk-stamp--wait', tone === 'late' && 'sk-stamp--late', className)}
      {...props}
    />
  )
}

export function Chip({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('sk-chip', className)} {...props} />
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'line' | 'ghost'
  size?: 'md' | 'sm' | 'icon'
  asChild?: boolean
}

/** The brush button. Use asChild to render a Next <Link> or <a>. */
export const SketchButton = React.forwardRef<HTMLButtonElement, BtnProps>(function SketchButton(
  { variant = 'solid', size = 'md', asChild, className, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={skBtn(variant, size, className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  )
})

/** Section heading: eyebrow, headline and an optional supporting paragraph. */
export function SecHead({
  eyebrow,
  title,
  children,
  center,
  className,
  titleClassName,
}: {
  eyebrow?: React.ReactNode
  title: React.ReactNode
  children?: React.ReactNode
  center?: boolean
  className?: string
  titleClassName?: string
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-wrap gap-6',
        center ? 'flex-col items-center text-center' : 'items-end justify-between',
        className,
      )}
    >
      <div>
        {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
        <h2
          className={cn(
            'font-display mt-2.5 text-[clamp(2rem,4.4vw,3.2rem)] leading-[1.05] font-semibold tracking-tight text-balance',
            center ? 'mx-auto max-w-[22ch]' : 'max-w-[18ch]',
            titleClassName,
          )}
        >
          {title}
        </h2>
      </div>
      {children ? <div className={cn('text-ink-soft max-w-xl', center && 'mx-auto')}>{children}</div> : null}
    </div>
  )
}

/** Progress as a dry-brush bar. */
export function BrushBar({
  value,
  tone = 'blue',
  className,
  label = 'Progress',
}: {
  value: number
  tone?: 'blue' | 'green' | 'gold'
  className?: string
  /** Accessible name for screen readers. */
  label?: string
}) {
  return (
    <div
      className={cn('sk-bar', tone === 'green' && 'sk-bar--green', tone === 'gold' && 'sk-bar--gold', className)}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  )
}

/** A painted blob with a number or glyph inside. */
export function PaintedNum({
  tone = 'blue',
  className,
  children,
}: {
  tone?: 'blue' | 'green' | 'gold'
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn('sk-num', tone === 'green' && 'sk-num--green', tone === 'gold' && 'sk-num--gold', className)}>
      {children}
    </span>
  )
}
