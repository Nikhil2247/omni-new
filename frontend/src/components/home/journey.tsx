'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brush, Ico, ICONS, PaintedNum, Photo, SecHead, skPaper } from '@/components/sketch'
import { cn } from '@/lib/utils'
import { PLATFORM_FEATURES } from './content'

const PHOTOS = ['journey-vendors', 'journey-reviews', 'journey-tools', 'journey-booking', 'journey-chat', 'journey-price']

// Grid slots on wide screens: 1 2 3 across the top, then 4 5 6 back along the bottom (4 sits under 3).
const SNAKE = [
  'lg:col-start-1 lg:row-start-1',
  'lg:col-start-2 lg:row-start-1 lg:mt-14',
  'lg:col-start-3 lg:row-start-1',
  'lg:col-start-3 lg:row-start-2',
  'lg:col-start-2 lg:row-start-2 lg:mt-14',
  'lg:col-start-1 lg:row-start-2',
]

/**
 * "Start Planning": the six platform features as staggered cards in two columns, joined by a winding dashed path.
 * The path is drawn from the real positions of the numbered stops, so it follows the layout at any width.
 */
export function StartPlanning() {
  const wrap = useRef<HTMLDivElement>(null)
  const stops = useRef<Array<HTMLDivElement | null>>([])
  const [path, setPath] = useState<{ d: string; w: number; h: number }>({ d: '', w: 0, h: 0 })

  const measure = useCallback(() => {
    const el = wrap.current
    if (!el) return
    const box = el.getBoundingClientRect()
    const pts = stops.current
      .filter((s): s is HTMLDivElement => Boolean(s))
      .map((s) => {
        const r = s.getBoundingClientRect()
        return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
      })
    if (pts.length < 2) return
    let d = `M${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const dy = (b.y - a.y) * 0.55
      d += ` C${a.x.toFixed(1)} ${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)} ${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`
    }
    setPath({ d, w: box.width, h: box.height })
  }, [])

  useEffect(() => {
    const el = wrap.current
    if (!el) return
    // The observer fires once after it starts watching, and again whenever images or the viewport change the size.
    const ro = new ResizeObserver(() => measure())
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  return (
    <section id="services" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Start Planning" center title={<>Everything You Need to Plan Your <Brush>Dream Event</Brush></>}>
        Omnicassion is your all-in-one event planning platform. From finding verified vendors to managing your budget,
        we provide every tool and resource you need to create unforgettable celebrations.
      </SecHead>

      <div ref={wrap} className="relative mx-auto flex max-w-[1180px] flex-col gap-12 md:gap-0 lg:grid lg:grid-cols-3 lg:gap-x-10 lg:gap-y-14">
        {path.d ? (
          <svg
            className="pointer-events-none absolute inset-0 z-0 overflow-visible"
            width={path.w}
            height={path.h}
            viewBox={`0 0 ${path.w} ${path.h}`}
            aria-hidden
          >
            <path
              d={path.d}
              fill="none"
              style={{ stroke: 'var(--ink-soft)', filter: 'url(#sk-rough)' }}
              strokeWidth={3.5}
              strokeDasharray="2 13"
              strokeLinecap="round"
              opacity={0.65}
            />
          </svg>
        ) : null}

        {PLATFORM_FEATURES.map((f, i) => {
          const right = i % 2 === 1
          return (
            <article
              key={f.title}
              // Wide screens: a compact snake. Row 1 runs left to right, row 2 comes back right to left,
              // and the middle cards sit lower so the path swings up and down. Medium screens alternate sides; phones stack.
              className={cn(
                skPaper({ alt: right, tape: true }),
                'relative z-[1] p-3.5 pb-5 md:w-[46%] lg:w-auto lg:p-2.5 lg:pb-4',
                right ? 'md:self-end' : 'md:self-start',
                i > 0 && 'md:-mt-44 lg:mt-0',
                SNAKE[i],
              )}
            >
              <div
                ref={(el) => {
                  stops.current[i] = el
                }}
                className={cn(
                  'absolute top-9 z-[2] lg:top-0! lg:left-2! lg:right-auto! lg:-translate-y-1/2',
                  right ? '-left-[2.1rem] md:-left-[3.5rem]' : '-right-[3.5rem] max-md:-left-[2.1rem] max-md:right-auto',
                )}
              >
                <PaintedNum tone={i % 3 === 1 ? 'green' : i % 3 === 2 ? 'gold' : 'blue'} className="!size-[52px] !text-[1.5rem] lg:!size-[44px] lg:!text-[1.25rem]">
                  {i + 1}
                </PaintedNum>
              </div>

              <div className="bg-sky1 border-ink relative aspect-[16/10] overflow-hidden rounded-[18px_240px_20px_220px/230px_18px_250px_16px] border-2">
                <Photo name={PHOTOS[i]} alt={f.title} width={720} height={450} />
                <span className="sk-hand border-ink bg-card absolute bottom-2 left-3 rounded-[10px_16px_12px_14px] border-2 px-2.5 py-0.5 text-[1.1rem] !text-ink">
                  {f.caption}
                </span>
              </div>

              <div className="px-2 pt-4">
                <div className="flex items-center gap-3">
                  <Ico d={ICONS[f.icon]} className="!size-9 lg:!size-7" />
                  <h3 className="font-display text-[1.45rem] leading-tight font-semibold lg:text-[1.15rem]">{f.title}</h3>
                </div>
                <p className="text-ink-soft mt-2 text-[0.95rem] lg:mt-1.5 lg:text-[0.85rem] lg:leading-snug">{f.description}</p>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
