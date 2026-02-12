'use client'

import { useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { Button } from './button'
import { cn } from '@/lib/utils'
import type React from 'react'

interface ConfettiButtonProps extends React.ComponentProps<typeof Button> {
  confettiColors?: string[]
  particleCount?: number
}

export function ConfettiButton({
  children,
  onClick,
  confettiColors = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'],
  particleCount = 30,
  className,
  ...props
}: ConfettiButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  const createConfetti = useCallback(() => {
    if (!buttonRef.current) return

    const button = buttonRef.current
    const rect = button.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div')
      particle.style.cssText = `
        position: fixed;
        width: ${Math.random() * 8 + 4}px;
        height: ${Math.random() * 8 + 4}px;
        background: ${confettiColors[Math.floor(Math.random() * confettiColors.length)]};
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events: none;
        z-index: 9999;
        left: ${centerX}px;
        top: ${centerY}px;
      `
      document.body.appendChild(particle)

      const angle = (Math.random() * Math.PI * 2)
      const velocity = Math.random() * 200 + 100
      const vx = Math.cos(angle) * velocity
      const vy = Math.sin(angle) * velocity - 100

      let x = 0
      let y = 0
      let opacity = 1
      const gravity = 400
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = (currentTime - startTime) / 1000

        x = vx * elapsed
        y = vy * elapsed + 0.5 * gravity * elapsed * elapsed
        opacity = Math.max(0, 1 - elapsed * 1.5)

        particle.style.transform = `translate(${x}px, ${y}px) rotate(${elapsed * 360}deg)`
        particle.style.opacity = String(opacity)

        if (opacity > 0) {
          requestAnimationFrame(animate)
        } else {
          particle.remove()
        }
      }

      requestAnimationFrame(animate)
    }
  }, [confettiColors, particleCount])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    createConfetti()
    onClick?.(e)
  }

  return (
    <motion.div whileTap={{ scale: 0.95 }}>
      <Button
        ref={buttonRef}
        onClick={handleClick}
        className={cn('relative overflow-visible', className)}
        {...props}
      >
        {children}
      </Button>
    </motion.div>
  )
}
