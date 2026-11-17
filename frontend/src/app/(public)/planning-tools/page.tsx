import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANNING_TOOLS } from '@/components/home/content'
import { Brush, Eyebrow, Ico, ICONS, SkContainer, skPaper } from '@/components/sketch'

export const metadata: Metadata = {
  title: 'Free Event Planning Tools | Omnicassion',
  description:
    'Powerful, easy-to-use tools to plan every aspect of your event: budget calculator, guest list, checklist, timeline, RSVP manager and digital invites.',
  alternates: { canonical: '/planning-tools' },
}

export default function PlanningToolsPage() {
  return (
    <SkContainer className="pb-12">
      <div className="pt-[22px] pb-2.5">
        <Eyebrow>Free Tools</Eyebrow>
        <h1 className="font-display mt-2.5 max-w-[20ch] text-[clamp(2.2rem,5vw,3.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          Planning Tools to Keep You <Brush>Organized</Brush>
        </h1>
        <p className="text-ink-soft mt-3 max-w-xl">Powerful, easy-to-use tools to plan every aspect of your event.</p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-[30px] max-[1000px]:grid-cols-2 max-[620px]:grid-cols-1">
        {PLANNING_TOOLS.map((t, i) => (
          <Link key={t.key} href={t.href} className={skPaper({ alt: i % 2 === 1, tape: true, className: 'block p-6 text-inherit no-underline' })}>
            <Ico d={ICONS[t.icon]} />
            <h2 className="font-display mt-3 mb-1.5 text-[1.35rem] font-semibold">{t.title}</h2>
            <p className="sk-hand mb-2 text-[1.35rem]">{t.tagline}</p>
            <p className="text-ink-soft">{t.description}</p>
            <span className="text-blue mt-3 inline-block font-bold">Open tool →</span>
          </Link>
        ))}
      </div>
    </SkContainer>
  )
}
