import { Brush, Hand } from '@/components/sketch'
import { HeroArt } from './hero-art'
import { HeroPlanner } from './hero-planner'

export function HeroSection() {
  return (
    <main id="top">
      <div className="mx-auto grid w-full max-w-[1440px] items-center gap-10 px-4 pt-3.5 pb-9 md:pt-7 md:pb-14 min-[901px]:grid-cols-[1.05fr_.95fr]">
        <div>
          <Hand className="inline-block -rotate-2 text-2xl">India&apos;s #1 wedding &amp; event planning platform</Hand>
          <h1 className="font-display mt-3 text-[clamp(2.7rem,6.4vw,5rem)] leading-[1.05] font-bold tracking-tight text-balance">
            Plan Your <Brush>Perfect</Brush> Event
          </h1>
          <p className="text-ink-soft mt-[22px] max-w-[34rem] text-[1.15rem]">
            Discover top vendors, manage your budget, and bring your dream celebration to life.
          </p>
          <HeroPlanner />
        </div>
        <HeroArt />
      </div>
    </main>
  )
}
