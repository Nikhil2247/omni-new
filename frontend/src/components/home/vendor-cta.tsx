import Link from 'next/link'
import { Hand, SketchButton, Vine, skPaper } from '@/components/sketch'

const STATS = [
  { value: '50,000+', label: 'Active Users' },
  { value: '5,000+', label: 'Verified Vendors' },
  { value: '10,000+', label: 'Successful Events' },
]

/** "For Vendors": invitation for vendors to join, with the platform's headline numbers. */
export function VendorCta() {
  return (
    <section className="mx-auto w-full max-w-[1440px] px-4 pt-5 pb-12">
      <div className={`${skPaper({ tape: true })} px-6 py-[60px] text-center`}>
        <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={31} n={11} s={1.05} className="pointer-events-none absolute -bottom-6 -left-10 w-[300px] max-[700px]:w-40" />
        <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={41} n={11} s={1.05} className="pointer-events-none absolute -right-10 -bottom-6 w-[300px] -scale-x-100 max-[700px]:w-40" />
        <Hand>For Vendors</Hand>
        <h2 className="font-display mx-auto mt-3 mb-4 max-w-[16ch] text-[clamp(2.1rem,5vw,3.6rem)] leading-[1.05] font-semibold text-balance">
          Grow Your Business With Us
        </h2>
        <p className="text-ink-soft mx-auto max-w-[34rem]">Join thousands of vendors reaching couples planning their dream events.</p>
        <div className="my-[26px] flex flex-wrap justify-center gap-7">
          {STATS.map((s) => (
            <div key={s.label} className="text-ink-soft max-w-44 text-center text-[0.92rem]">
              <b className="font-display text-ink block text-[1.15rem] leading-tight">{s.value}</b>
              {s.label}
            </div>
          ))}
        </div>
        <div className="relative z-[1] flex flex-wrap justify-center gap-3">
          <SketchButton asChild>
            <Link href="/register/vendor">Join as Vendor</Link>
          </SketchButton>
          <SketchButton asChild variant="line">
            <Link href="/for-vendors">Learn More</Link>
          </SketchButton>
        </div>
      </div>
    </section>
  )
}
