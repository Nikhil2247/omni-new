import { Brush, SkContainer } from '@/components/sketch'
import { PageHead } from './page-head'

export type LegalSection = {
  id: string
  title: string
  content: Array<{ subtitle: string | null; text: string }>
}

/** Two-column legal document: sticky "on this page" list on desktop, readable 64ch body text. */
export function LegalLayout({
  title,
  highlight,
  updated,
  intro,
  sections,
}: {
  title: string
  highlight: string
  updated: string
  intro: React.ReactNode
  sections: LegalSection[]
}) {
  return (
    <SkContainer className="pb-16">
      <PageHead
        eyebrow="Legal"
        title={
          <>
            {title} <Brush>{highlight}</Brush>
          </>
        }
      >
        <p className="text-ink-soft mt-3 text-sm">{updated}</p>
        <p className="text-ink-soft mt-3 max-w-[64ch]">{intro}</p>
      </PageHead>

      <div className="mt-[22px] grid items-start gap-10 min-[761px]:grid-cols-[220px_1fr]">
        <nav
          aria-label="On this page"
          className="grid gap-1.5 text-[0.95rem] min-[761px]:sticky min-[761px]:top-24"
        >
          <span className="sk-eyebrow mb-1">On this page</span>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-ink-soft hover:text-blue no-underline">
              {s.title}
            </a>
          ))}
        </nav>

        <div>
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display mt-[26px] mb-2 text-[1.5rem] font-semibold first:mt-0">{section.title}</h2>
              <div className="space-y-4">
                {section.content.map((item, i) => (
                  <div key={i} className="space-y-1">
                    {item.subtitle && <h3 className="text-ink text-base font-bold">{item.subtitle}</h3>}
                    <p className="text-ink-soft max-w-[64ch] leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </SkContainer>
  )
}
