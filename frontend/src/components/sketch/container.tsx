import { cn } from '@/lib/utils'

/** The page width used across the hand-painted theme: up to 1440px with a 16px gutter. */
export function SkContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mx-auto w-full max-w-[1440px] px-4', className)} {...props} />
}
