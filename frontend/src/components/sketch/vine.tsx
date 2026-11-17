import type { CSSProperties, ReactNode } from 'react'
import { rng, samplePath } from '@/lib/sketch/math'

/** A hand-painted leafy vine with a few blossoms. Drawn with plain math, so it also renders on the server. */
export function Vine({
  d,
  seed = 1,
  n = 10,
  s = 1,
  viewBox = '0 0 300 200',
  className,
  style,
  sway = false,
}: {
  d: string
  seed?: number
  n?: number
  s?: number
  viewBox?: string
  className?: string
  style?: CSSProperties
  sway?: boolean
}) {
  const r = rng(seed)
  const path = samplePath(d)
  const L = path.length
  const fills = ['var(--leaf)', 'var(--leaf-deep)', 'var(--leaf-light)', 'var(--leaf)']
  const parts: ReactNode[] = []
  for (let i = 0; i < n; i++) {
    const t = ((i + 0.6) / (n + 0.4)) * L
    const p = path.at(t)
    const q = path.at(Math.min(L, t + 2))
    const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI
    const side = i % 2 ? 1 : -1
    const taper = 1 - 0.55 * (i / n)
    const size = (0.8 + r() * 0.7) * s * taper * 1.25
    const a = ang + side * (38 + r() * 34)
    const fill = fills[Math.floor(r() * fills.length)]
    parts.push(
      <g
        key={`l${i}`}
        transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${a.toFixed(1)}) scale(${size.toFixed(2)})`}
      >
        <path d="M0 0C7-12 26-14 40 0C26 14 7 12 0 0Z" style={{ fill }} opacity={0.92} />
        <path d="M3 0L34 0" style={{ stroke: 'var(--paper)' }} strokeWidth={1} opacity={0.55} fill="none" />
      </g>,
    )
    if (r() > 0.72) {
      const bx = p.x + Math.cos((a * Math.PI) / 180) * 38 * size
      const by = p.y + Math.sin((a * Math.PI) / 180) * 38 * size
      const rose = r() > 0.5
      parts.push(
        <g key={`f${i}`} transform={`translate(${bx.toFixed(1)} ${by.toFixed(1)})`}>
          {[0, 1, 2, 3, 4].map((k) => (
            <ellipse
              key={k}
              cx={0}
              cy={-6 * s}
              rx={3.4 * s}
              ry={6 * s}
              transform={`rotate(${k * 72})`}
              style={{ fill: rose ? 'var(--rose)' : 'var(--gold)' }}
            />
          ))}
          <circle r={2.2 * s} style={{ fill: 'var(--ink)' }} />
        </g>,
      )
    }
  }
  return (
    <svg className={className} style={{ overflow: 'visible', ...style }} viewBox={viewBox} aria-hidden="true">
      <g className={sway ? 'sk-sway' : undefined} filter="url(#sk-rough)">
        <path d={d} fill="none" style={{ stroke: 'var(--leaf-deep)' }} strokeWidth={2.6} strokeLinecap="round" />
        {parts}
      </g>
    </svg>
  )
}
