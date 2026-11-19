/** A small centred spinner for pages that wait on data. Reserves height so the page does not jump when content arrives. */
export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] w-full items-start justify-center pt-24">
      <div className="border-primary h-7 w-7 animate-spin rounded-full border-[3px] border-t-transparent" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
