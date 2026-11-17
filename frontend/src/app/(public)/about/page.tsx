import Link from 'next/link'
import { Brush, Ico, ICONS, SkContainer, SecHead, SketchButton, skPaper } from '@/components/sketch'
import { PageHead } from '@/components/marketing/page-head'

const PILLARS = [
  {
    title: 'Discover with confidence',
    description: 'Curated vendor portfolios, transparent pricing, and verified reviews in one place.',
    icon: ICONS.search,
  },
  {
    title: 'Plan collaboratively',
    description: 'Shared checklists, guestlists, and timelines keep every stakeholder aligned.',
    icon: ICONS.planner,
  },
  {
    title: 'Execute with clarity',
    description: 'Operations-grade workflows for vendor agreements, tasks, and day-of coordination.',
    icon: ICONS.shield,
  },
]

const ROLES = [
  {
    title: 'Couples and hosts',
    description: 'Save ideas, compare quotes and keep the guest list, budget and timeline in one place.',
  },
  { title: 'Vendors', description: 'Show your portfolio, answer enquiries, send quotes and manage bookings.' },
  {
    title: 'Planners and operations',
    description: 'Coordinate vendor agreements and tasks, and run the day with a clear workflow.',
  },
]

export default function AboutPage() {
  return (
    <SkContainer className="pb-16">
      <PageHead
        eyebrow="About Omnicassion"
        title={
          <>
            A visual-first planning platform for <Brush>unforgettable</Brush> events.
          </>
        }
        sub="Omnicassion unifies inspiration, vendor discovery, and planning workflows into one elegant workspace. We help teams and couples turn ideas into perfectly orchestrated experiences with a modern, data-informed toolkit."
      />

      <section className="py-[34px]">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[30px]">
          {PILLARS.map((p, i) => (
            <div key={p.title} className={skPaper({ alt: i === 1, className: 'p-6' })}>
              <Ico d={p.icon} />
              <h3 className="font-display mt-3 mb-1.5 text-[1.35rem] font-semibold">{p.title}</h3>
              <p className="text-ink-soft">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-2.5">
        <SecHead
          eyebrow="Who it is for"
          title={
            <>
              Built for every role in the <Brush gold>celebration</Brush>.
            </>
          }
        >
          <p>
            From couples to vendors and operations teams, Omnicassion brings the entire ecosystem together. Our
            architecture scales with your needs while staying simple to use.
          </p>
        </SecHead>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[30px]">
          {ROLES.map((r, i) => (
            <div key={r.title} className={skPaper({ alt: i % 2 === 0, className: 'p-6' })}>
              <h3 className="font-display mb-1.5 text-[1.35rem] font-semibold">{r.title}</h3>
              <p className="text-ink-soft">{r.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap gap-3">
          <SketchButton asChild>
            <Link href="/register">Get started</Link>
          </SketchButton>
          <SketchButton asChild variant="line">
            <Link href="/vendors">Explore vendors</Link>
          </SketchButton>
        </div>
      </section>
    </SkContainer>
  )
}
