/** Rangoli-style quarter mandala for the top corners, and the soft painted washes behind the page. */
export function CornerMandala() {
  const rad = Math.PI / 180
  const one = (side: 'l' | 'r') => (
    <div key={side} className={`sk-corner sk-corner--${side}`} aria-hidden="true">
      <svg
        viewBox="0 0 215 215"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
      >
        <circle cx={0} cy={0} r={38} style={{ fill: 'var(--blue-wash)' }} opacity={0.55} />
        <circle cx={0} cy={0} r={20} style={{ fill: 'var(--gold)' }} opacity={0.55} />
        {Array.from({ length: 7 }, (_, k) => (
          <path
            key={`a${k}`}
            d="M70 0C84 -15 108 -15 122 0C108 15 84 15 70 0Z"
            transform={`rotate(${6.4 + k * 12.86})`}
            style={{ fill: 'var(--gold)', stroke: 'var(--ink-soft)' }}
            strokeWidth={1.2}
            opacity={0.42}
          />
        ))}
        {Array.from({ length: 6 }, (_, k) => (
          <path
            key={`b${k}`}
            d="M124 0C140 -17 158 -17 172 0C158 17 140 17 124 0Z"
            transform={`rotate(${7.5 + k * 15})`}
            style={{ fill: 'var(--rose)', stroke: 'var(--ink-soft)' }}
            strokeWidth={1.2}
            opacity={0.36}
          />
        ))}
        {[70, 124, 174].map((R, i) => (
          <path
            key={R}
            d={`M${R} 0A${R} ${R} 0 0 1 0 ${R}`}
            fill="none"
            style={{ stroke: 'var(--gold)' }}
            strokeWidth={i === 1 ? 1.8 : 2.6}
            strokeDasharray={i === 1 ? '1 8' : undefined}
            strokeLinecap="round"
            opacity={0.75}
          />
        ))}
        {Array.from({ length: 9 }, (_, q) => {
          const a0 = q * 10 * rad
          const a1 = (q + 1) * 10 * rad
          const R2 = 198
          return (
            <g key={`s${q}`}>
              <path
                d={`M${(R2 * Math.cos(a0)).toFixed(1)} ${(R2 * Math.sin(a0)).toFixed(1)}A15 15 0 0 1 ${(R2 * Math.cos(a1)).toFixed(1)} ${(R2 * Math.sin(a1)).toFixed(1)}`}
                fill="none"
                style={{ stroke: 'var(--gold)' }}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.7}
              />
              <circle
                cx={(186 * Math.cos((q * 10 + 5) * rad)).toFixed(1)}
                cy={(186 * Math.sin((q * 10 + 5) * rad)).toFixed(1)}
                r={2.6}
                style={{ fill: 'var(--rose)' }}
                opacity={0.75}
              />
            </g>
          )
        })}
      </svg>
    </div>
  )
  return (
    <>
      {one('l')}
      {one('r')}
    </>
  )
}

export function BgFx() {
  return (
    <div className="sk-bgfx" aria-hidden="true">
      <i className="b1" />
      <i className="b2" />
      <i className="b3" />
      <i className="b4" />
      <i className="b5" />
    </div>
  )
}
