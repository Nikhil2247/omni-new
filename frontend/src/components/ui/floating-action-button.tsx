'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FABAction {
  icon: ReactNode
  label: string
  onClick: () => void
  color?: string
}

interface FloatingActionButtonProps {
  actions?: FABAction[]
  icon?: ReactNode
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  className?: string
}

const positions = {
  'bottom-right': 'bottom-20 right-4 md:bottom-6',
  'bottom-left': 'bottom-20 left-4 md:bottom-6',
  'bottom-center': 'bottom-20 left-1/2 -translate-x-1/2 md:bottom-6',
}

export function FloatingActionButton({
  actions,
  icon,
  onClick,
  position = 'bottom-right',
  className,
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const hasActions = actions && actions.length > 0

  const handleClick = () => {
    if (hasActions) {
      setIsOpen(!isOpen)
    } else {
      onClick?.()
    }
  }

  return (
    <div className={cn('fixed z-40', positions[position], className)}>
      {/* Action items */}
      <AnimatePresence>
        {isOpen && hasActions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-16 right-0 mb-2 flex flex-col-reverse gap-3"
          >
            {actions.map((action, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3"
              >
                {/* Label */}
                <motion.span
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 + 0.1 }}
                  className="whitespace-nowrap rounded-lg bg-background px-3 py-1.5 text-sm font-medium shadow-lg"
                >
                  {action.label}
                </motion.span>

                {/* Mini FAB */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    action.onClick()
                    setIsOpen(false)
                  }}
                  className={cn(
                    'flex h-12 w-12 items-center justify-center rounded-full shadow-lg',
                    action.color || 'bg-primary text-primary-foreground'
                  )}
                >
                  {action.icon}
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[-1] bg-black/20 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {isOpen ? <X className="h-6 w-6" /> : icon || <Plus className="h-6 w-6" />}
        </motion.div>
      </motion.button>
    </div>
  )
}

// Extended FAB with label
interface ExtendedFABProps {
  icon: ReactNode
  label: string
  onClick: () => void
  extended?: boolean
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center'
  className?: string
}

export function ExtendedFAB({
  icon,
  label,
  onClick,
  extended = true,
  position = 'bottom-right',
  className,
}: ExtendedFABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'fixed z-40 flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground shadow-lg transition-all hover:bg-primary/90',
        positions[position],
        className
      )}
    >
      {icon}
      <AnimatePresence>
        {extended && (
          <motion.span
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden whitespace-nowrap"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
