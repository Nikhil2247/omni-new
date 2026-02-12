'use client'

import { motion, useSpring, useTransform } from 'framer-motion'
import { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface ProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  showValue?: boolean
  valueFormat?: (value: number) => string
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'gradient' | string
  className?: string
}

// All colors now use primary for consistency
const colorMap = {
  primary: { stroke: 'stroke-primary', text: 'text-primary' },
  success: { stroke: 'stroke-primary', text: 'text-primary' },
  warning: { stroke: 'stroke-primary', text: 'text-primary' },
  danger: { stroke: 'stroke-destructive', text: 'text-destructive' },
  gradient: { stroke: 'stroke-primary', text: 'text-primary' },
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 10,
  label,
  sublabel,
  showValue = true,
  valueFormat = (v) => `${Math.round(v)}%`,
  color = 'primary',
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percent = Math.min((value / max) * 100, 100)

  const springValue = useSpring(0, { stiffness: 100, damping: 30 })
  const displayValue = useTransform(springValue, (v) => valueFormat(v))

  useEffect(() => {
    springValue.set(percent)
  }, [percent, springValue])

  const offset = circumference - (percent / 100) * circumference
  const colorKey = color as keyof typeof colorMap
  const colorConfig = colorMap[colorKey] || colorMap.primary

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Gradient definition - uses primary color */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            className="text-muted/20"
          />

          {/* Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            className={color === 'gradient' ? '' : colorConfig.stroke}
            stroke={color === 'gradient' ? 'url(#gradient)' : undefined}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showValue && (
            <motion.span className={cn('text-2xl font-bold', colorConfig.text)}>
              {displayValue}
            </motion.span>
          )}
          {sublabel && (
            <span className="text-xs text-muted-foreground">{sublabel}</span>
          )}
        </div>
      </div>

      {label && (
        <p className="mt-2 text-sm font-medium text-muted-foreground">{label}</p>
      )}
    </div>
  )
}

// Wedding Countdown Ring
interface CountdownRingProps {
  targetDate: Date
  size?: number
  className?: string
}

export function CountdownRing({ targetDate, size = 150, className }: CountdownRingProps) {
  const now = new Date()
  const diff = targetDate.getTime() - now.getTime()
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)))

  // Assume wedding planning is ~365 days, calculate progress
  const totalDays = 365
  const daysElapsed = totalDays - days
  const progress = Math.min((daysElapsed / totalDays) * 100, 100)

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <ProgressRing
        value={progress}
        size={size}
        strokeWidth={12}
        color="gradient"
        showValue={false}
      />
      <div className="absolute flex flex-col items-center justify-center" style={{ height: size }}>
        <motion.span
          className="text-4xl font-bold"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
        >
          {days}
        </motion.span>
        <span className="text-sm text-muted-foreground">days to go</span>
        {hours > 0 && days < 30 && (
          <span className="text-xs text-muted-foreground">{hours}h remaining</span>
        )}
      </div>
    </div>
  )
}

// Animated counter
interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1,
  className,
}: AnimatedCounterProps) {
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  })

  const display = useTransform(springValue, (v) => Math.round(v))

  useEffect(() => {
    springValue.set(value)
  }, [value, springValue])

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  )
}
