/** Small helpers for the hand-painted art: a seeded random generator and path sampling (server safe). */

export function rng(seed: number) {
  let a = seed | 0
  return function next() {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface PathSampler {
  length: number
  at: (l: number) => { x: number; y: number }
}

/** Samples a path made of M, C and Q commands (absolute coordinates). */
export function samplePath(d: string): PathSampler {
  const tokens = d.match(/[MCQ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []
  let i = 0
  let cx = 0
  let cy = 0
  const pts: Array<[number, number]> = []
  const num = () => parseFloat(tokens[i++])
  while (i < tokens.length) {
    const c = tokens[i++]
    if (c === 'M') {
      cx = num()
      cy = num()
      pts.push([cx, cy])
    } else if (c === 'C') {
      const a = num()
      const b = num()
      const c2 = num()
      const e = num()
      const x = num()
      const y = num()
      for (let k = 1; k <= 60; k++) {
        const u = k / 60
        const v = 1 - u
        pts.push([
          v * v * v * cx + 3 * v * v * u * a + 3 * v * u * u * c2 + u * u * u * x,
          v * v * v * cy + 3 * v * v * u * b + 3 * v * u * u * e + u * u * u * y,
        ])
      }
      cx = x
      cy = y
    } else if (c === 'Q') {
      const a = num()
      const b = num()
      const x = num()
      const y = num()
      for (let k = 1; k <= 60; k++) {
        const u = k / 60
        const v = 1 - u
        pts.push([v * v * cx + 2 * v * u * a + u * u * x, v * v * cy + 2 * v * u * b + u * u * y])
      }
      cx = x
      cy = y
    }
  }
  const cum = [0]
  for (let k = 1; k < pts.length; k++) {
    cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]))
  }
  const length = cum[cum.length - 1] || 0
  return {
    length,
    at(l: number) {
      const t = Math.max(0, Math.min(length, l))
      let k = 1
      while (k < cum.length - 1 && cum[k] < t) k++
      const span = cum[k] - cum[k - 1] || 1
      const f = (t - cum[k - 1]) / span
      return {
        x: pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * f,
        y: pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * f,
      }
    },
  }
}
