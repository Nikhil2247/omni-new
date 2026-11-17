import { Ico, ICONS, PaintedNum, PaintedScene, SecHead, Brush, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { PLATFORM_FEATURES } from './content'

/** "Start Planning": the six platform features along a winding painted path. */
export function StartPlanning() {
  return (
    <section id="services" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Start Planning" center title={<>Everything You Need to Plan Your <Brush>Dream Event</Brush></>}>
        Omnicassion is your all-in-one event planning platform. From finding verified vendors to managing your budget,
        we provide every tool and resource you need to create unforgettable celebrations.
      </SecHead>
      <div className="sk-journey">
        {PLATFORM_FEATURES.map((f, i) => (
          <div key={f.title} className={cn('sk-jrow', i % 2 ? 'sk-jrow--r' : 'sk-jrow--l')}>
            <div className={cn(skPaper({ alt: i % 2 === 1 }), 'sk-jcard px-7 py-[26px] max-sm:px-[18px] max-sm:py-5')}>
              <Ico d={ICONS[f.icon]} />
              <h3 className="font-display mt-3 mb-2 text-[1.6rem] leading-tight font-semibold max-sm:text-[1.35rem]">{f.title}</h3>
              <p className="text-ink-soft">{f.description}</p>
            </div>
            <div className="sk-jnode">
              <PaintedNum tone={i % 3 === 1 ? 'green' : i % 3 === 2 ? 'gold' : 'blue'}>{i + 1}</PaintedNum>
            </div>
            <div className="sk-jart">
              <div className="sk-polaroid sk-tape">
                <div className="bg-sky1 aspect-[4/3] overflow-hidden">
                  <PaintedScene seed={i * 7 + 9} motif={f.motif} />
                </div>
                <b className="sk-hand mt-2.5 block text-[1.35rem] leading-[1.1]">{f.caption}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
