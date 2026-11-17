import { Brush, SecHead } from '@/components/sketch'
import { HOME_FAQS } from './content'

/** Frequently asked questions as hand-drawn accordions (native <details>, no JavaScript needed). */
export function FaqSection({ items = HOME_FAQS }: { items?: Array<{ question: string; answer: string }> }) {
  return (
    <section id="faq" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="FAQ" center title={<>Got <Brush>Questions?</Brush> We&apos;ve Got Answers</>} />
      <div className="mx-auto max-w-[780px]">
        {items.map((f, i) => (
          <details key={f.question} open={i === 0} className="border-line group border-b-2 border-dashed px-1 py-3.5">
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
        ))}
      </div>
    </section>
  )
}
