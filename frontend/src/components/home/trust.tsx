import { Brush, Chip, Hand, SecHead, Stamp, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { TESTIMONIALS } from '@/lib/data/testimonials'

const STEPS = [
  { title: 'Business documents checked', text: "We review the vendor's business documents before the listing goes live." },
  {
    title: 'Portfolio reviewed',
    text: 'Vendors submit their profile and portfolio for review. Approval typically takes 1 to 3 business days.',
  },
  {
    title: 'Reviews monitored',
    text: 'We keep monitoring reviews after a vendor is listed, to protect the quality of service.',
  },
]

/** Trust: how vendors are verified, plus customer quotes when real ones are available. */
export function TrustSection() {
  const hasQuotes = TESTIMONIALS.length > 0
  return (
    <section id="proof" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Trust" center title={<>Book with <Brush>confidence</Brush></>}>
        Every vendor goes through a verification process, and reviews come from real couples who have worked with them.
      </SecHead>
      <div className={cn('grid items-start gap-10', hasQuotes ? 'min-[901px]:grid-cols-[1.05fr_.95fr]' : 'mx-auto max-w-3xl')}>
        <div className={cn(skPaper({ tape: true }), 'px-[30px] pt-[30px] pb-7 max-sm:px-5 max-sm:py-6')}>
          <Hand>How we verify vendors</Hand>
          <h3 className="font-display mt-1.5 mb-1 text-[1.7rem] font-semibold">Checked before they appear</h3>
          <ol className="my-5 grid gap-5">
            {STEPS.map((s) => (
              <li key={s.title} className="grid grid-cols-[48px_1fr] items-start gap-4">
                <span className="sk-vn">✓</span>
                <div>
                  <b className="font-display block text-[1.15rem]">{s.title}</b>
                  <p className="text-ink-soft mt-0.5 text-[0.95rem]">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="border-line text-ink-soft flex flex-wrap items-center gap-3 border-t-2 border-dashed pt-[18px] text-[0.93rem]">
            <Stamp>★ Verified</Stamp>
            <span>Look for this badge on a vendor&apos;s card and profile.</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Chip>Secure payments</Chip>
            <Chip>Booking protection</Chip>
            <Chip>Message vendors in one place</Chip>
          </div>
        </div>

        {hasQuotes ? (
          <div className="grid gap-7">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={`${t.name}-${i}`}
                className={cn(skPaper({ alt: i % 2 === 0, tape: true }), 'px-7 pt-[26px] pb-5 max-sm:px-5', i % 2 ? 'rotate-[0.8deg]' : '-rotate-[0.9deg]')}
              >
                <span className="text-blue-wash font-display absolute top-2 right-5 text-[3.4rem] leading-none font-bold" aria-hidden>
                  “
                </span>
                <q className="font-display block pr-8 text-[1.22rem] leading-[1.45] font-medium italic [quotes:none] max-sm:text-[1.08rem]">{t.quote}</q>
                <div className="mt-4 flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
                  <span className="sk-hand text-[1.4rem]">
                    {t.name}, {t.city}
                  </span>
                  <small className="text-ink-soft">{t.event}</small>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
