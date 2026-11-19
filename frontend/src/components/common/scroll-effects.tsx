'use client'

import { useEffect } from 'react'

/**
 * Landing-page polish: smooth (inertial) scrolling and scroll-reveal for sections marked `data-reveal`.
 *
 * Built so it cannot hurt Core Web Vitals:
 *  - nothing is hidden in the server HTML, so the hero/LCP never waits on JS;
 *  - only elements that start below the fold are hidden, and only transform/opacity animate (no layout shift);
 *  - Lenis is imported after the browser is idle, and only for fine-pointer (desktop) devices;
 *  - everything is skipped for users who prefer reduced motion.
 */
export function ScrollEffects() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    const cleanups: Array<() => void> = []

    // ── Scroll reveal ───────────────────────────────────────────────────────
    const targets = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]')).filter(
      (el) => el.getBoundingClientRect().top > window.innerHeight * 0.9,
    )
    if (targets.length && 'IntersectionObserver' in window) {
      root.setAttribute('data-reveal-ready', '')
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue
            entry.target.classList.add('is-in')
            io.unobserve(entry.target)
          }
        },
        { rootMargin: '0px 0px -12% 0px', threshold: 0.05 },
      )
      targets.forEach((el) => {
        el.setAttribute('data-reveal-hidden', '')
        io.observe(el)
      })
      cleanups.push(() => {
        io.disconnect()
        root.removeAttribute('data-reveal-ready')
        targets.forEach((el) => {
          el.removeAttribute('data-reveal-hidden')
          el.classList.remove('is-in')
        })
      })
    }

    // ── Smooth scroll (desktop only, loaded when idle) ──────────────────────
    let destroyed = false
    let lenis: { destroy: () => void } | null = null
    if (window.matchMedia('(pointer: fine)').matches) {
      const start = () => {
        import('lenis').then(({ default: Lenis }) => {
          if (destroyed) return
          // lerp: lower = slower, floatier glide. wheelMultiplier < 1 makes each wheel notch travel less.
          lenis = new Lenis({ autoRaf: true, lerp: 0.065, wheelMultiplier: 0.8, anchors: true })
        })
      }
      const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number })
        .requestIdleCallback
      if (idle) idle(start, { timeout: 2500 })
      else setTimeout(start, 1200)
    }

    return () => {
      destroyed = true
      lenis?.destroy()
      cleanups.forEach((fn) => fn())
    }
  }, [])

  return null
}
