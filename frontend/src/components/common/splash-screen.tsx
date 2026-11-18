import NextImage from 'next/image'

/** Shown while the app starts up: just the logo, which pops in, and a small brush loading bar. */
export function SplashScreen() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading Omnicassion"
      className="sk-root fixed inset-0 z-[100] grid place-items-center overflow-hidden"
    >
      <div className="sk-bgfx" aria-hidden="true">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
        <i className="b4" />
        <i className="b5" />
      </div>
      <div className="relative z-[2] flex flex-col items-center gap-7 px-6">
        <div className="sk-sticker sk-splash-logo !px-5 !py-3.5">
          <NextImage src="/images/omnilogo.avif" width={260} height={62} unoptimized priority alt="Omnicassion" className="!h-[54px] w-auto max-sm:!h-[40px]" />
        </div>
        <div className="sk-bar w-48 overflow-hidden" aria-hidden>
          <i className="sk-splash-bar" />
        </div>
        <span className="sr-only">Loading</span>
      </div>
    </div>
  )
}
