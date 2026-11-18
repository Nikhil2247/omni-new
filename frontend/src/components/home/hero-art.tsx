import { Vine, BuntingString } from '@/components/sketch'
import { rng, samplePath } from '@/lib/sketch/math'

const LANTERNS: Array<[number, number, number]> = [
  [120, 70, 40],
  [190, 48, 62],
  [330, 60, 50],
  [390, 110, 36],
]

/** The hand-painted arch for the hero: sky, hills, a marigold sun, lanterns, bunting and a garland. */
export function HeroArt() {
  const garland = samplePath('M44 470Q240 590 436 470')
  const gr = rng(7)
  const marigolds = Array.from({ length: 26 }, (_, i) => {
    const p = garland.at(((i + 0.5) / 26) * garland.length)
    return { x: p.x, y: p.y + 7, r: 9 + gr() * 2.5, orange: i % 3 === 0 }
  })

  return (
    <div className="relative mx-auto w-full max-w-[470px] max-md:max-w-[380px]">
      <span className="sk-wash left-[-14%] top-[30%] h-[55%] w-[70%] opacity-55" style={{ background: 'var(--blue-wash)' }} />
      <span className="sk-wash right-[-10%] top-[-4%] h-[38%] w-[46%] opacity-35" style={{ background: 'var(--gold)' }} />

      <svg
        className="relative z-[1] block h-auto w-full"
        viewBox="0 0 480 580"
        role="img"
        aria-label="A couple celebrating in a hand-painted arch with bunting and a marigold garland"
      >
        <defs>
          <clipPath id="hero-archclip">
            <path d="M40 560V230A200 200 0 0 1 440 230V560Z" />
          </clipPath>
          <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--sky1)' }} />
            <stop offset="1" style={{ stopColor: 'var(--sky2)' }} />
          </linearGradient>
          <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0a0e23" stopOpacity="0" />
            <stop offset="1" stopColor="#0a0e23" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <g clipPath="url(#hero-archclip)">
          <rect width="480" height="580" fill="url(#hero-sky)" />
          <image
            href="/images/home/hero.webp"
            x="40"
            y="30"
            width="400"
            height="530"
            preserveAspectRatio="xMidYMid slice"
          />
          <rect x="40" y="440" width="400" height="120" fill="url(#hero-fade)" />
          <g style={{ filter: 'url(#sk-rough)' }}>
            {LANTERNS.map(([x, y, size], i) => (
              <g key={x}>
                <path d={`M${x} 0V${y}`} style={{ stroke: 'var(--ink)' }} strokeWidth={1.6} fill="none" />
                <ellipse cx={x} cy={y + size / 2.6} rx={size / 3.4} ry={size / 2.6} style={{ fill: i % 2 ? 'var(--rose)' : 'var(--gold)' }} opacity={0.9} />
              </g>
            ))}
          </g>
        </g>
        <path d="M40 560V230A200 200 0 0 1 440 230V560Z" transform="translate(4 4)" fill="none" style={{ stroke: 'var(--blue)', filter: 'url(#sk-rough)' }} opacity={0.55} strokeWidth={3} />
        <path d="M40 560V230A200 200 0 0 1 440 230V560Z" fill="none" style={{ stroke: 'var(--ink)', filter: 'url(#sk-rough)' }} strokeWidth={5} strokeLinejoin="round" />
        <BuntingString x0={46} y0={262} x1={434} y1={262} sag={86} n={11} h={34} w={28} />
        <g>
          <path d="M44 470Q240 590 436 470" fill="none" style={{ stroke: 'var(--leaf-deep)', filter: 'url(#sk-rough)' }} strokeWidth={2.4} />
          {marigolds.map((m, i) => (
            <g key={i} transform={`translate(${m.x.toFixed(1)} ${m.y.toFixed(1)})`} style={{ filter: 'url(#sk-rough)' }}>
              <circle r={m.r} style={{ fill: m.orange ? '#e8751a' : 'var(--gold)' }} />
              <circle r={3.4} style={{ fill: '#a84a05' }} opacity={0.7} />
            </g>
          ))}
        </g>
      </svg>

      <Vine
        d="M60 612C30 500 30 380 80 270C130 160 220 80 300 40"
        seed={4}
        n={15}
        s={1.05}
        viewBox="0 0 340 620"
        sway
        className="pointer-events-none absolute -top-[4%] -left-[22%] z-[2] w-[64%] max-md:-left-[10%]"
      />
      <Vine
        d="M60 612C40 520 50 420 90 330C140 220 220 140 290 100"
        seed={9}
        n={13}
        s={0.95}
        viewBox="0 0 340 620"
        sway
        className="pointer-events-none absolute -top-[4%] -right-[22%] z-[2] w-[64%] -scale-x-100 max-md:-right-[10%]"
      />
    </div>
  )
}
