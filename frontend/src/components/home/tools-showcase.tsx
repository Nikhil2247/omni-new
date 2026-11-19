'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Brush, Ico, ICONS, PaintedScene, SecHead, SketchButton, Vine } from '@/components/sketch'
import { ToolPreview } from '@/components/tools/tool-previews'
import { PLANNING_TOOLS } from './content'

/** "Free Tools": pick a tool on the left and see a live-looking preview of it on a painted stage. */
export function ToolsShowcase() {
  const [selected, setSelected] = useState(PLANNING_TOOLS[0].key)
  const index = PLANNING_TOOLS.findIndex((t) => t.key === selected)
  const tool = PLANNING_TOOLS[index]

  return (
    <section data-reveal id="free-tools" className="mx-auto w-full max-w-[1440px] px-4 py-11 md:py-16">
      <SecHead eyebrow="Free Tools" center title={<>Planning Tools to Keep You <Brush gold>Organized</Brush></>}>
        Powerful, easy-to-use tools to plan every aspect of your event
      </SecHead>
      <div className="sk-toolshow">
        <div className="grid content-start gap-3" role="group" aria-label="Free planning tools">
          {PLANNING_TOOLS.map((t) => (
            <button key={t.key} type="button" className="sk-tl-btn" aria-pressed={t.key === selected} onClick={() => setSelected(t.key)}>
              <Ico d={ICONS[t.icon]} />
              <span>
                <b className="font-display block text-[1.1rem]">{t.title}</b>
                <small className="text-ink-soft block text-[0.85rem] leading-snug">{t.description}</small>
              </span>
            </button>
          ))}
        </div>
        <div className="sk-stage max-sm:min-h-[420px] max-sm:px-3.5 max-sm:pt-[52px] max-sm:pb-[74px]">
          <PaintedScene seed={index * 5 + 11} motif={index} className="absolute inset-0 h-full w-full" />
          <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={100 + index} n={9} s={0.9} className="pointer-events-none absolute top-0 -right-1.5 z-[1] h-[170px] w-[250px] -scale-x-100" />
          <Vine d="M0 190C60 170 110 130 150 80C180 40 230 20 290 12" seed={110 + index} n={8} s={0.8} className="pointer-events-none absolute -bottom-1.5 -left-1.5 z-[1] h-[150px] w-[210px]" />
          <span className="sk-hand absolute top-4 left-[22px] z-[2] text-[1.9rem] !text-ink max-sm:left-3.5 max-sm:text-2xl" style={{ textShadow: '0 0 8px var(--paper)' }}>
            {tool.tagline}
          </span>
          <div className="sk-paper sk-paper--alt sk-tape relative z-[2] w-[min(460px,100%)] -rotate-[1.2deg] px-7 py-[26px] max-sm:rotate-0 max-sm:px-[18px] max-sm:py-5">
            <ToolPreview tool={selected} />
          </div>
          <SketchButton asChild className="absolute right-5 bottom-[18px] z-[2]">
            <Link href={tool.href}>Open {tool.title} →</Link>
          </SketchButton>
        </div>
      </div>
    </section>
  )
}
