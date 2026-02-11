'use client'

import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  description?: string
  snapPoints?: number[] // percentages [0.5, 0.9] means 50% and 90%
  initialSnap?: number
  showHandle?: boolean
  showCloseButton?: boolean
  className?: string
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  description,
  snapPoints = [0.5, 0.9],
  initialSnap = 0,
  showHandle = true,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const dragControls = useDragControls()

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { velocity, offset } = info

    // If dragged down with velocity or past threshold, close
    if (velocity.y > 500 || offset.y > 100) {
      onClose()
    }
  }

  const initialHeight = snapPoints[initialSnap] * 100

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: `${100 - initialHeight}%` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-background shadow-2xl',
              className
            )}
            style={{ height: `${initialHeight}%`, maxHeight: '90%' }}
          >
            {/* Handle */}
            {showHandle && (
              <div
                className="flex cursor-grab justify-center py-3 active:cursor-grabbing"
                onPointerDown={(e) => dragControls.start(e)}
              >
                <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
              </div>
            )}

            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between border-b px-4 pb-3">
                <div>
                  {title && <h2 className="text-lg font-semibold">{title}</h2>}
                  {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                  )}
                </div>
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-muted"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Quick action bottom sheet
interface QuickActionItem {
  icon: ReactNode
  label: string
  description?: string
  onClick: () => void
  destructive?: boolean
}

interface QuickActionsSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  actions: QuickActionItem[]
}

export function QuickActionsSheet({
  isOpen,
  onClose,
  title = 'Actions',
  actions,
}: QuickActionsSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} snapPoints={[0.4]}>
      <div className="space-y-2">
        {actions.map((action, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className={cn(
              'flex w-full items-center gap-4 rounded-xl p-4 text-left transition-colors',
              'hover:bg-muted',
              action.destructive && 'text-destructive hover:bg-destructive/10'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full',
                action.destructive ? 'bg-destructive/10' : 'bg-primary/10'
              )}
            >
              {action.icon}
            </div>
            <div>
              <p className="font-medium">{action.label}</p>
              {action.description && (
                <p className="text-sm text-muted-foreground">{action.description}</p>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </BottomSheet>
  )
}
