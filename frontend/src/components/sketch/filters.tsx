/**
 * SVG filters that give the hand-painted theme its wobbly edges and dry-brush texture.
 * Render once, near the top of <body>. The CSS in sketch.css references them by id.
 */
export function SketchFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="sk-rough" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" />
        </filter>
        <filter id="sk-wash" x="-15%" y="-15%" width="130%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" seed="11" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="12" />
          <feGaussianBlur stdDeviation="0.6" />
        </filter>
        <filter id="sk-dry" x="-10%" y="-30%" width="120%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.45" numOctaves="3" seed="8" result="s" />
          <feDisplacementMap in="SourceGraphic" in2="s" scale="6" result="d" />
          <feColorMatrix
            in="s"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3 0 0 0 -0.85"
            result="m"
          />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
      </defs>
    </svg>
  )
}
