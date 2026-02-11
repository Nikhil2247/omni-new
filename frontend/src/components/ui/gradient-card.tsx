'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface GradientCardProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'sunset' | 'ocean' | 'forest'
  hover?: boolean
  glow?: boolean
  className?: string
}

// All variants now use primary color for consistency
const gradients = {
  primary: 'from-primary/10 via-primary/5 to-transparent',
  secondary: 'from-muted/20 via-muted/10 to-transparent',
  sunset: 'from-primary/10 via-primary/5 to-transparent',
  ocean: 'from-primary/10 via-primary/5 to-transparent',
  forest: 'from-primary/10 via-primary/5 to-transparent',
}

const borderGradients = {
  primary: 'from-primary to-primary/50',
  secondary: 'from-muted-foreground/50 to-muted-foreground/20',
  sunset: 'from-primary to-primary/50',
  ocean: 'from-primary to-primary/50',
  forest: 'from-primary to-primary/50',
}

export function GradientCard({
  children,
  variant = 'primary',
  hover = true,
  glow = false,
  className,
}: GradientCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      whileTap={hover ? { scale: 0.98 } : undefined}
      className={cn('group relative', className)}
    >
      {/* Glow effect */}
      {glow && (
        <div
          className={cn(
            'absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-75',
            borderGradients[variant]
          )}
        />
      )}

      {/* Border gradient */}
      <div
        className={cn(
          'absolute inset-0 rounded-2xl bg-gradient-to-r p-[1px]',
          borderGradients[variant]
        )}
      >
        <div className="h-full w-full rounded-2xl bg-background" />
      </div>

      {/* Content with gradient background */}
      <div
        className={cn(
          'relative rounded-2xl bg-gradient-to-br p-6',
          gradients[variant]
        )}
      >
        {children}
      </div>
    </motion.div>
  )
}

// Glassmorphism card
interface GlassCardProps {
  children: ReactNode
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const blurSizes = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

export function GlassCard({ children, blur = 'md', className }: GlassCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl',
        blurSizes[blur],
        className
      )}
    >
      {children}
    </motion.div>
  )
}

// Feature highlight card
interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  gradient?: keyof typeof gradients
  className?: string
}

export function FeatureCard({
  icon,
  title,
  description,
  gradient = 'primary',
  className,
}: FeatureCardProps) {
  return (
    <GradientCard variant={gradient} glow className={className}>
      <div className="flex flex-col items-start gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br',
            borderGradients[gradient]
          )}
        >
          <div className="text-white">{icon}</div>
        </div>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </GradientCard>
  )
}

// Stats card with animation
interface StatCardProps {
  label: string
  value: string | number
  change?: number
  icon?: ReactNode
  gradient?: keyof typeof gradients
}

export function StatCard({ label, value, change, icon, gradient = 'primary' }: StatCardProps) {
  return (
    <GradientCard variant={gradient} className="overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 text-3xl font-bold"
          >
            {value}
          </motion.p>
          {change !== undefined && (
            <p
              className={cn(
                'mt-1 text-sm font-medium',
                change >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {change >= 0 ? '+' : ''}
              {change}% from last month
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-background/50 p-2">{icon}</div>
        )}
      </div>
    </GradientCard>
  )
}
