import NextImage from 'next/image'
import { BgFx, CornerMandala, Vine } from '@/components/sketch'

const PETALS = [6, 17, 28, 39, 50, 61, 72, 83, 92]

/**
 * Shown while the app starts up: paper background with the faint mandala pattern, mandala corners,
 * leafy vines growing in around the centred logo, falling petals and a small brush loading bar.
 */
export function SplashScreen() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Omnicassion"
      className="sk-root fixed inset-0 z-[100] grid place-items-center overflow-hidden"
    >
      <BgFx />
      <div className="sk-splash-corner">
        <CornerMandala />
      </div>

      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PETALS.map((left, i) => (
          <span key={left} className="sk-splash-petal" style={{ left: `${left}%`, animationDelay: `${(i % 5) * 0.7}s`, animationDuration: `${5 + (i % 4)}s` }} />
        ))}
      </div>

      <div className="relative z-[2] flex flex-col items-center gap-7 px-6">
        <div className="relative">
          <Vine
            d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12"
            seed={12}
            n={9}
            s={1}
            className="sk-splash-vine pointer-events-none absolute right-[calc(100%-18px)] bottom-[-34px] h-[150px] w-[210px] max-sm:w-[130px] max-sm:h-[95px]"
            style={{ ['--sk-from' as string]: '-10deg', animationDelay: '0.35s' }}
          />
          <Vine
            d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12"
            seed={27}
            n={9}
            s={1}
            className="sk-splash-vine pointer-events-none absolute bottom-[-34px] left-[calc(100%-18px)] h-[150px] w-[210px] -scale-x-100 max-sm:w-[130px] max-sm:h-[95px]"
            style={{ ['--sk-from' as string]: '10deg', animationDelay: '0.5s' }}
          />
          <div className="sk-sticker sk-splash-logo !px-5 !py-3.5">
            <NextImage src="/images/omnilogo.avif" width={260} height={62} unoptimized priority alt="Omnicassion" className="!h-[54px] w-auto max-sm:!h-[40px]" />
          </div>
        </div>

        <div className="sk-bar w-48 overflow-hidden" aria-hidden>
          <i className="sk-splash-bar" />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  )
}
