'use client'

import { useMemo, useState } from 'react'
import { skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { SUPPORT_CATEGORIES, SUPPORT_FAQS, type SupportCategoryId } from './support-data'

/** Help search, category filter cards and the FAQ accordions. */
export function SupportBrowser() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<SupportCategoryId | null>(null)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    return SUPPORT_FAQS.filter(
      (f) =>
        (category === null || f.category === category) &&
        (q === '' || f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)),
    )
  }, [query, category])

  return (
    <>
      <form className="sk-pill mt-[22px]" role="search" onSubmit={(e) => e.preventDefault()}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles"
          aria-label="Search help articles"
        />
        <button type="submit" aria-label="Search">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-current stroke-[2.4]"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="10.5" cy="10.5" r="6.5" />
            <path d="M15.5 15.5L21 21" />
          </svg>
        </button>
      </form>

      <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-[22px] max-sm:grid-cols-1">
        {SUPPORT_CATEGORIES.map((c, i) => {
          const active = category === c.id
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              onClick={() => setCategory(active ? null : c.id)}
              className={cn(
                skPaper({ alt: i % 2 === 1 }),
                'block w-full cursor-pointer p-[18px] text-left',
                active && 'before:!bg-[color-mix(in_srgb,var(--blue-wash)_40%,var(--card))]',
              )}
            >
              <b className="font-display mb-1 block text-[1.1rem]">{c.title}</b>
              <span className="text-ink-soft text-[0.88rem]">{c.description}</span>
            </button>
          )
        })}
      </div>

      <section className="pt-[34px] pb-2.5" aria-live="polite">
        <h2 className="font-display mb-2.5 text-[1.8rem] font-semibold">Frequently Asked Questions</h2>
        <div className="max-w-[820px]">
          {results.length > 0 ? (
            results.map((f) => (
              <details key={f.id} id={f.id} className="border-line group scroll-mt-20 border-b-2 border-dashed px-1 py-3.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-bold [&::-webkit-details-marker]:hidden">
                  {f.question}
                  <span className="sk-hand text-[1.7rem] group-open:hidden" aria-hidden>
                    +
                  </span>
                  <span className="sk-hand hidden text-[1.7rem] group-open:inline" aria-hidden>
                    –
                  </span>
                </summary>
                <p className="text-ink-soft mt-2 max-w-[62ch]">{f.answer}</p>
              </details>
            ))
          ) : (
            <p className="text-ink-soft">No articles match. Try different words or contact us.</p>
          )}
        </div>
      </section>
    </>
  )
}
