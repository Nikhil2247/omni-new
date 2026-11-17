import Link from 'next/link'
import { Brush, SketchButton, SkContainer, skPaper } from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'
import { ContactForm } from '@/components/marketing/contact-form'
import { siteConfig } from '@/config/site'

export default function ContactPage() {
  return (
    <SkContainer className="pb-16">
      <PageHead
        eyebrow="Contact"
        title={
          <>
            Tell us what you <Brush>need</Brush>.
          </>
        }
        sub={
          <>
            For disputes and refunds you can also email{' '}
            <a className="text-blue font-bold underline" href={`mailto:${siteConfig.contact.supportEmail}`}>
              {siteConfig.contact.supportEmail}
            </a>
            .
          </>
        }
      />
      <div className="mt-6 grid items-start gap-[34px] min-[901px]:grid-cols-[1fr_340px]">
        <ContactForm />
        <aside className={skPaper({ alt: true, className: 'p-[22px]' })}>
          <h2 className="font-display mb-2 text-[1.3rem] font-semibold">Looking for quick answers?</h2>
          <p className="text-ink-soft mb-3.5">
            Most questions about passwords, bookings and payouts are answered in the help centre.
          </p>
          <SketchButton asChild variant="line" size="sm">
            <Link href="/support">Browse help articles</Link>
          </SketchButton>
        </aside>
      </div>
    </SkContainer>
  )
}
