'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange?: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { box: 'h-4 w-4', icon: 'h-3 w-3', text: 'text-sm' },
  md: { box: 'h-5 w-5', icon: 'h-3.5 w-3.5', text: 'text-base' },
  lg: { box: 'h-6 w-6', icon: 'h-4 w-4', text: 'text-lg' },
}

export function AnimatedCheckbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  size = 'md',
  className,
}: AnimatedCheckboxProps) {
  const sizeConfig = sizes[size]

  return (
    <label
      className={cn(
        'group flex cursor-pointer items-start gap-3',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <motion.button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-md border-2 transition-colors',
          sizeConfig.box,
          checked
            ? 'border-primary bg-primary'
            : 'border-muted-foreground/30 bg-background group-hover:border-primary/50'
        )}
      >
        <motion.div
          initial={false}
          animate={checked ? { scale: 1, opacity: 1 } : { scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <Check className={cn(sizeConfig.icon, 'text-primary-foreground')} strokeWidth={3} />
        </motion.div>

        {/* Ripple effect on check */}
        {checked && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 rounded-md bg-primary"
          />
        )}
      </motion.button>

      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <motion.span
              animate={checked ? { opacity: 0.6 } : { opacity: 1 }}
              className={cn(
                sizeConfig.text,
                'font-medium leading-tight',
                checked && 'line-through'
              )}
            >
              {label}
            </motion.span>
          )}
          {description && (
            <span className="text-sm text-muted-foreground">{description}</span>
          )}
        </div>
      )}
    </label>
  )
}

// Checklist with celebration
interface ChecklistProps {
  items: { id: string; label: string; checked: boolean }[]
  onToggle: (id: string, checked: boolean) => void
  onComplete?: () => void
}

export function AnimatedChecklist({ items, onToggle, onComplete }: ChecklistProps) {
  const completedCount = items.filter(item => item.checked).length
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0

  const handleToggle = (id: string, checked: boolean) => {
    onToggle(id, checked)

    // Check if all items will be completed
    const willBeComplete = items.every(item =>
      item.id === id ? checked : item.checked
    )

    if (willBeComplete && onComplete) {
      setTimeout(onComplete, 300)
    }
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{completedCount}/{items.length}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <AnimatedCheckbox
              checked={item.checked}
              onChange={(checked) => handleToggle(item.id, checked)}
              label={item.label}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
