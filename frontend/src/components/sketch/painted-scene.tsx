import { rng } from '@/lib/sketch/math'

/**
 * A small hand-painted landscape used as a stand-in whenever there is no real photo.
 * Every seed gives a different scene with one motif (tent, arch, tree, lanterns or flowers).
 */
const SKY = [
  'var(--sky1)',
  'color-mix(in srgb,var(--gold) 38%,var(--paper))',
  'color-mix(in srgb,var(--rose) 38%,var(--paper))',
  'color-mix(in srgb,var(--leaf-light) 70%,var(--paper))',
  'color-mix(in srgb,var(--blue-wash) 70%,var(--paper))',
]
const HILL = [
  ['var(--hill1)', 'var(--hill2)'],
  ['var(--hill2)', 'var(--hill3)'],
  ['var(--blue-wash)', 'var(--hill1)'],
  ['var(--leaf-light)', 'var(--leaf)'],
  ['var(--hill1)', 'var(--hill3)'],
]

export function sceneMarkup(seed: number, motif?: number): string {
  const r = rng(seed * 97 + 13)
  const sky = SKY[seed % SKY.length]
  const h = HILL[(seed * 3 + 1) % HILL.length]
  const m = (motif == null ? seed : motif) % 5
  let o = `<rect width="300" height="220" style="fill:${sky}"/>`
  const sx = 40 + r() * 220
  const sy = 34 + r() * 34
  o += `<circle cx="${sx}" cy="${sy}" r="${30 + r() * 10}" style="fill:var(--gold);opacity:.3;filter:url(#sk-wash)"/><circle cx="${sx}" cy="${sy}" r="${17 + r() * 7}" style="fill:${seed % 2 ? 'var(--gold)' : 'var(--rose)'};filter:url(#sk-dry)"/>`
  const y1 = 118 + r() * 24
  const y2 = 150 + r() * 18
  o += `<path d="M0 ${y1}C70 ${y1 - 44} 150 ${y1 + 6} 210 ${y1 - 20}S280 ${y1 - 30} 300 ${y1 - 12}V220H0Z" style="fill:${h[0]};filter:url(#sk-rough)"/>`
  o += `<path d="M0 ${y2}C90 ${y2 - 30} 170 ${y2 + 14} 300 ${y2 - 16}V220H0Z" style="fill:${h[1]};filter:url(#sk-rough)"/>`
  const mx = 60 + r() * 180
  if (m === 0)
    o += `<g style="filter:url(#sk-rough)"><path d="M${mx - 34} 176L${mx} 118L${mx + 34} 176Z" style="fill:var(--ink)"/><path d="M${mx} 118V104M${mx} 106l14 4" style="stroke:var(--gold);stroke-width:3;fill:none"/><path d="M${mx - 10} 176L${mx} 150L${mx + 10} 176Z" style="fill:var(--card)"/></g>`
  if (m === 1)
    o += `<g style="filter:url(#sk-rough)" fill="none"><path d="M${mx - 30} 182V138A30 30 0 0 1 ${mx + 30} 138V182" style="stroke:var(--ink);stroke-width:5"/><path d="M${mx - 22} 182V140A22 22 0 0 1 ${mx + 22} 140V182" style="stroke:var(--gold);stroke-width:4"/></g>`
  if (m === 2)
    o += `<g style="filter:url(#sk-rough)"><rect x="${mx - 3}" y="140" width="7" height="44" style="fill:var(--ink)"/><circle cx="${mx}" cy="128" r="28" style="fill:var(--leaf)"/><circle cx="${mx - 16}" cy="144" r="18" style="fill:var(--leaf-deep)"/><circle cx="${mx + 18}" cy="140" r="16" style="fill:var(--leaf)"/></g>`
  if (m === 3) {
    o += `<g style="filter:url(#sk-rough)"><path d="M0 18Q150 70 300 18" fill="none" style="stroke:var(--ink);stroke-width:2"/>`
    for (let i = 0; i < 6; i++) {
      const lx = 25 + i * 50
      const ly = 18 + Math.sin((i / 5) * Math.PI) * 28 + 8
      o += `<ellipse cx="${lx}" cy="${ly + 16}" rx="9" ry="13" style="fill:${i % 2 ? 'var(--gold)' : 'var(--rose)'}"/><path d="M${lx} ${ly}V${ly + 4}" style="stroke:var(--ink);stroke-width:1.5"/>`
    }
    o += '</g>'
  }
  if (m === 4) {
    o += '<g style="filter:url(#sk-rough)">'
    for (let j = 0; j < 4; j++) {
      const fx = mx - 36 + j * 24 + r() * 8
      const fh = 44 + r() * 26
      o += `<path d="M${fx} 190V${190 - fh}" style="stroke:var(--leaf-deep);stroke-width:3;fill:none"/><circle cx="${fx}" cy="${190 - fh}" r="${9 + r() * 3}" style="fill:${j % 2 ? '#e8751a' : 'var(--gold)'}"/><circle cx="${fx}" cy="${190 - fh}" r="3.5" style="fill:#a84a05;opacity:.7"/>`
    }
    o += '</g>'
  }
  return o
}

export function PaintedScene({
  seed,
  motif,
  className,
}: {
  seed: number
  motif?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 300 220"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className={className ?? 'block h-full w-full'}
      dangerouslySetInnerHTML={{ __html: sceneMarkup(seed, motif) }}
    />
  )
}
