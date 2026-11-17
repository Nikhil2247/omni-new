import { samplePath } from '@/lib/sketch/math'

const PAL = ['var(--blue)', 'var(--gold)', 'var(--leaf)', 'var(--rose)', 'var(--blue-wash)']

/** Triangular flags hung on a sagging string. Returns SVG elements, so it can be dropped into any <svg>. */
export function BuntingString({
  x0,
  y0,
  x1,
  y1,
  sag,
  n,
  h,
  w,
  palette = PAL,
}: {
  x0: number
  y0: number
  x1: number
  y1: number
  sag: number
  n: number
  h: number
  w: number
  palette?: string[]
}) {
  const d = `M${x0} ${y0}Q${(x0 + x1) / 2} ${y0 + sag} ${x1} ${y1}`
  const path = samplePath(d)
  const L = path.length
  const flags = Array.from({ length: n }, (_, i) => {
    const t = ((i + 0.5) / n) * L
    const p = path.at(t)
    const q = path.at(Math.min(L, t + 2))
    const a = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
    return (
      <path
        key={i}
        d={`M${-w / 2} 0L${w / 2} 0L0 ${h}Z`}
        transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${a.toFixed(1)})`}
        style={{ fill: palette[i % palette.length], filter: 'url(#sk-rough)' }}
        opacity={0.95}
      />
    )
  })
  return (
    <g>
      <path d={d} fill="none" style={{ stroke: 'var(--ink)', filter: 'url(#sk-rough)' }} strokeWidth={2} />
      {flags}
    </g>
  )
}

/** A full-width strip of bunting, used between page sections. */
export function BuntingBand({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'block h-[92px] w-full'} viewBox="0 0 1200 92" preserveAspectRatio="none" aria-hidden="true">
      <BuntingString x0={-10} y0={10} x1={1210} y1={10} sag={70} n={32} h={38} w={34} />
    </svg>
  )
}
