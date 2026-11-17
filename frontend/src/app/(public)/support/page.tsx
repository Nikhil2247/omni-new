import Link from 'next/link'
import type { Metadata } from 'next'
import { Brush, SketchButton, SkContainer, skPaper } from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'
import { SupportBrowser } from '@/components/marketing/support-browser'

export const metadata: Metadata = {
  title: 'Support | Omnicassion',
  description: 'Get help with your Omnicassion account, bookings, and vendor listings.',
}

export default function SupportPage() {
  return (
    <SkContainer className="pb-16">
      <PageHead
        eyebrow="Support"
        title={
          <>
            How can we <Brush>help</Brush>?
          </>
        }
        sub="Get help with your Omnicassion account, bookings, and vendor listings."
      />
      <SupportBrowser />

      <div className={skPaper({ alt: true, className: 'mx-auto mt-[30px] max-w-[560px] p-[26px] text-center' })}>
        <h3 className="font-display text-[1.5rem] font-semibold">Still need help?</h3>
        <p className="text-ink-soft mt-2 mb-4">Our support team is available Monday – Saturday, 9 AM – 7 PM IST.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <SketchButton asChild>
            <Link href="/contact">Contact us</Link>
          </SketchButton>
          <SketchButton asChild variant="line">
            <a href="mailto:support@omnicassion.com">Email Support</a>
          </SketchButton>
        </div>
      </div>
    </SkContainer>
  )
}
