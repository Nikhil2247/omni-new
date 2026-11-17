import Link from 'next/link'
import {
  Brush,
  Hand,
  Ico,
  ICONS,
  PaintedNum,
  PaintedScene,
  SecHead,
  SketchButton,
  SkContainer,
  Vine,
  skPaper,
} from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'
import { TrackSectionView } from '@/components/marketing/track-view'

const BENEFITS = [
  {
    title: 'Quality Leads',
    description: 'Connect with engaged couples and event planners actively searching for your services.',
    icon: '<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="8"/><circle cx="24" cy="24" r="2"/>',
  },
  {
    title: 'Business Insights',
    description: 'Track your performance with detailed analytics on views, inquiries, and bookings.',
    icon: ICONS.chart,
  },
  {
    title: 'Direct Messaging',
    description: 'Chat directly with clients through our integrated messaging system. No phone tag.',
    icon: ICONS.chat,
  },
  {
    title: 'Portfolio Showcase',
    description: 'Showcase your best work with unlimited photo and video galleries that convert.',
    icon: '<rect x="6" y="9" width="36" height="30" rx="3"/><circle cx="17" cy="20" r="3.5"/><path d="M6 34l11-9 8 7 6-5 11 9"/>',
  },
  {
    title: 'Verified Badge',
    description: 'Get verified to build trust and stand out from the competition.',
    icon: ICONS.shield,
  },
  {
    title: 'Secure Payments',
    description: 'Accept payments securely with integrated payment processing and invoicing.',
    icon: ICONS.wallet,
  },
]

const SPLITS = [
  {
    title: 'Showcase your work like never before',
    description:
      'Create a stunning portfolio that highlights your expertise. Upload unlimited photos, videos, and real client reviews that build trust and drive bookings.',
    seed: 14,
    motif: 3,
  },
  {
    title: 'Manage everything from one dashboard',
    description:
      'Handle inquiries, send quotes, manage bookings, and track payments, all in one place. Spend less time on admin and more time on what you do best.',
    seed: 23,
    motif: 1,
  },
]

const STEPS = [
  {
    title: 'Create Your Profile',
    description: 'Sign up and build your professional profile with your services, pricing, and portfolio.',
  },
  {
    title: 'Get Discovered',
    description: 'Appear in search results when couples and planners look for vendors in your category.',
  },
  {
    title: 'Connect & Convert',
    description: 'Receive inquiries, chat with clients, send quotes, and close more bookings.',
  },
]

const VINE_D = 'M0 190C60 170 110 130 150 80C180 40 230 20 290 12'

export default function ForVendorsPage() {
  return (
    <SkContainer className="pb-16">
      <TrackSectionView section="for-vendors" role="vendor" />
      <PageHead
        eyebrow="For Vendors"
        title={
          <>
            Get discovered by your <Brush>ideal clients</Brush>.
          </>
        }
        sub="Your profile appears in relevant searches when couples and planners are actively looking for services like yours. Our smart matching ensures you connect with the right audience."
      >
        <div className="mt-[22px] flex flex-wrap gap-3">
          <SketchButton asChild>
            <Link href="/register/vendor">List your business</Link>
          </SketchButton>
          <SketchButton asChild variant="line">
            <Link href="#features">See how it works</Link>
          </SketchButton>
        </div>
      </PageHead>

      <section id="features" className="scroll-mt-20 pt-10 pb-2.5">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[30px]">
          {BENEFITS.map((b, i) => (
            <div key={b.title} className={skPaper({ alt: i % 2 === 1, className: 'p-6' })}>
              <Ico d={b.icon} />
              <h3 className="font-display mt-3 mb-1.5 text-[1.35rem] font-semibold">{b.title}</h3>
              <p className="text-ink-soft">{b.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-5 pb-2.5">
        {SPLITS.map((s, i) => {
          const rev = i % 2 === 1
          return (
            <div key={s.title} className="grid items-center gap-11 py-[30px] max-[820px]:grid-cols-1 min-[821px]:grid-cols-2">
              <div className={rev ? 'min-[821px]:order-2' : undefined}>
                <h3 className="font-display text-[clamp(1.6rem,3vw,2.3rem)] leading-tight font-semibold">{s.title}</h3>
                <p className="text-ink-soft mt-3 max-w-[34rem]">{s.description}</p>
                <div className="mt-5">
                  <SketchButton asChild variant="line" size="sm">
                    <Link href="/register/vendor">Get started</Link>
                  </SketchButton>
                </div>
              </div>
              <div className="border-ink bg-sky1 relative aspect-[4/3] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2">
                <PaintedScene seed={s.seed} motif={s.motif} />
                <Vine
                  d={VINE_D}
                  seed={i === 0 ? 81 : 83}
                  n={8}
                  s={0.8}
                  className={
                    i === 0
                      ? 'pointer-events-none absolute top-0 -right-2 h-[140px] w-[200px] -scale-x-100'
                      : 'pointer-events-none absolute -bottom-2.5 -left-2 h-[140px] w-[200px]'
                  }
                />
              </div>
            </div>
          )
        })}
      </section>

      <section className="pt-5">
        <SecHead
          eyebrow="How it works"
          title={
            <>
              Three steps to your first <Brush>booking</Brush>.
            </>
          }
        />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-[30px]">
          {STEPS.map((s, i) => (
            <div key={s.title} className="grid gap-2">
              <PaintedNum tone={i === 1 ? 'green' : i === 2 ? 'gold' : 'blue'}>{i + 1}</PaintedNum>
              <h3 className="font-display text-[1.35rem] font-semibold">{s.title}</h3>
              <p className="text-ink-soft max-w-[34ch]">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-16">
        <div className={`${skPaper({ tape: true })} px-6 py-14 text-center`}>
          <Hand>For Vendors</Hand>
          <h2 className="font-display mx-auto mt-3 mb-4 max-w-[16ch] text-[clamp(2rem,5vw,3.4rem)] leading-[1.05] font-semibold text-balance">
            Ready to grow your business?
          </h2>
          <p className="text-ink-soft mx-auto max-w-[34rem]">
            Join the vendors who are booking more events and building their reputation on India&apos;s premier event
            planning platform.
          </p>
          <div className="relative z-[1] mt-7 flex flex-wrap justify-center gap-3">
            <SketchButton asChild>
              <Link href="/register/vendor">Join as a Vendor</Link>
            </SketchButton>
            <SketchButton asChild variant="line">
              <Link href="/contact">Contact Sales</Link>
            </SketchButton>
          </div>
        </div>
      </section>
    </SkContainer>
  )
}
