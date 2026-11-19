import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Ico } from './ico'
import { Eyebrow, Paper } from './primitives'

/** Hand-drawn doodles for status screens (errors, maintenance, locked features). */
export const NOTICE_ICONS = {
  alert: '<path d="M24 6L44 40H4Z"/><path d="M24 19v10M24 34v1"/>',
  lock: '<rect x="9" y="21" width="30" height="21" rx="3"/><path d="M15 21v-6a9 9 0 0 1 18 0v6M24 29v6"/>',
  wrench: '<path d="M32 6a10 10 0 0 0-9 14L6 37l5 5 17-17a10 10 0 0 0 14-9l-7 6-5-1-1-5z"/>',
  compass: '<circle cx="24" cy="24" r="17"/><path d="M30 18l-4 9-9 4 4-9z"/>',
} as const

/**
 * A centred paper card for status screens: an icon, a small label, a title, some words and the buttons.
 * Has no hooks, so it works in server components and in error boundaries.
 */
export function Notice({
  icon,
  eyebrow,
  title,
  children,
  actions,
  alt,
  className,
}: {
  icon?: string
  eyebrow?: ReactNode
  title: ReactNode
  children?: ReactNode
  actions?: ReactNode
  alt?: boolean
  className?: string
}) {
  return (
    <Paper tape alt={alt} className={cn('mx-auto w-full max-w-lg px-6 py-9 text-center sm:px-9', className)}>
      {icon ? <Ico d={icon} className="mx-auto mb-3 size-14" /> : null}
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h1 className="font-display mt-2 text-[clamp(1.6rem,5vw,2.2rem)] leading-[1.1] font-semibold text-balance">{title}</h1>
      {children ? <div className="text-ink-soft mt-3 space-y-3">{children}</div> : null}
      {actions ? <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div> : null}
    </Paper>
  )
}
