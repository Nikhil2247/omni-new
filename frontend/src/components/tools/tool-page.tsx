import Link from 'next/link'
import { PLANNING_TOOLS, type ToolKey } from '@/components/home/content'
import { FaqSection } from '@/components/home/faq'
import { JsonLd } from '@/components/common/JsonLd'
import { Brush, Hand, Ico, ICONS, Paper, PaintedNum, SecHead, SketchButton, Vine, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { ToolDemo } from './tool-demos'
import { FEATURE_ICONS, TOOL_CONTENT } from './tool-content'
import { ToolPreview } from './tool-previews'

const section = 'mx-auto w-full max-w-[1440px] px-4 py-11'
const VINE = 'M0 190C60 170 110 130 150 80C180 40 230 20 290 12'

/** Template for one public planning-tool page: hero, live demo, features, steps, FAQ, other tools and a call to action. */
export function ToolPage({ tool }: { tool: ToolKey }) {
  const c = TOOL_CONTENT[tool]
  const others = PLANNING_TOOLS.filter((t) => t.key !== tool)
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  }

  return (
    <>
      <JsonLd data={faqSchema} />

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[1.1fr_0.9fr] items-center gap-12 px-4 pt-7 pb-10 max-[900px]:grid-cols-1 max-[900px]:gap-8">
        <div>
          <Hand>Free Planning Tool</Hand>
          <h1 className="font-display mt-2.5 text-[clamp(2.4rem,5.6vw,4.4rem)] leading-[1.05] font-semibold tracking-tight text-balance">{c.name}</h1>
          <p className="font-display text-blue mt-3 text-[1.6rem] leading-tight font-semibold italic">{c.tagline}</p>
          <p className="text-ink-soft mt-4 max-w-xl text-[1.12rem]">{c.description}</p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <SketchButton asChild>
              <Link href="/register">Get Started Free</Link>
            </SketchButton>
            <SketchButton asChild variant="line">
              <a href="#try-it">Try it below</a>
            </SketchButton>
          </div>
        </div>
        <Paper alt tape className="px-7 py-[26px] max-sm:px-[18px] max-sm:py-5">
          <ToolPreview tool={tool} />
        </Paper>
      </div>

      <section id="try-it" className={cn(section, 'scroll-mt-24')}>
        <SecHead eyebrow="Try it now" title={<>Plan it right here, <Brush>no sign-up</Brush>.</>}>
          Everything below works in this page. Create an account to save and share it.
        </SecHead>
        <ToolDemo tool={tool} />
      </section>

      <section className={section}>
        <SecHead eyebrow="Features" title={<>Everything you need, <Brush gold>nothing you do not</Brush>.</>} />
        <div className="grid grid-cols-4 gap-[26px] max-[1000px]:grid-cols-2 max-[620px]:grid-cols-1">
          {c.features.map((f, i) => (
            <Paper key={f.title} alt={i % 2 === 1} className="p-6">
              <Ico d={FEATURE_ICONS[i % FEATURE_ICONS.length]} />
              <h3 className="font-display mt-3 mb-1.5 text-[1.35rem] font-semibold">{f.title}</h3>
              <p className="text-ink-soft">{f.text}</p>
            </Paper>
          ))}
        </div>
      </section>

      <section className={section}>
        <SecHead eyebrow="How it works" title={<>{c.steps.length} simple <Brush>steps</Brush>.</>} />
        <ol className="grid list-none grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-[30px] p-0">
          {c.steps.map((s, i) => (
            <li key={s.title}>
              <PaintedNum tone={(['blue', 'green', 'gold'] as const)[i % 3]}>{i + 1}</PaintedNum>
              <h3 className="font-display mt-3.5 mb-1.5 text-[1.3rem] font-semibold">{s.title}</h3>
              <p className="text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <FaqSection items={c.faqs} />

      <section className={section}>
        <SecHead eyebrow="More Tools" title={<>Keep <Brush gold>planning</Brush>.</>} />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-6">
          {others.map((t, i) => (
            <Link key={t.key} href={t.href} className={skPaper({ alt: i % 2 === 1, className: 'block px-[22px] py-5 text-inherit no-underline' })}>
              <Ico d={ICONS[t.icon]} />
              <h3 className="font-display mt-2.5 mb-1 text-[1.2rem] font-semibold">{t.title}</h3>
              <p className="text-ink-soft text-[0.92rem]">{t.description}</p>
              <span className="text-blue mt-2.5 inline-block text-[0.72rem] font-bold tracking-[0.08em] uppercase">{TOOL_CONTENT[t.key].badge} →</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-12">
        <div className={skPaper({ tape: true, className: 'px-6 py-[52px] text-center' })}>
          <Vine d={VINE} seed={91} n={11} s={1.05} className="pointer-events-none absolute -bottom-6 -left-[30px] w-60 max-[700px]:w-[120px]" />
          <Vine d={VINE} seed={92} n={11} s={1.05} className="pointer-events-none absolute -right-[30px] -bottom-6 w-60 -scale-x-100 max-[700px]:w-[120px]" />
          <Hand>Free to start</Hand>
          <h2 className="font-display mx-auto mt-2.5 mb-4 max-w-[18ch] text-[clamp(1.9rem,4vw,3rem)] leading-[1.1] font-semibold text-balance">Ready to plan your perfect event?</h2>
          <p className="text-ink-soft mx-auto mb-[22px] max-w-xl">
            Join thousands of couples using Omnicassion to plan stress-free events. Experience the future of elegant event planning today.
          </p>
          <div className="relative z-[1] flex flex-wrap justify-center gap-3">
            <SketchButton asChild>
              <Link href="/register">Get Started Free</Link>
            </SketchButton>
            <SketchButton asChild variant="line">
              <Link href="/vendors">Browse Vendors</Link>
            </SketchButton>
          </div>
        </div>
      </div>
    </>
  )
}
