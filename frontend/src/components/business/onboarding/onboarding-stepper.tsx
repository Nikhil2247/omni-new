'use client'

import { cn } from '@/lib/utils'
import { Check, Circle, Loader2, Lock } from 'lucide-react'

export interface OnboardingStep {
  id: string
  title: string
  description: string
  status: 'completed' | 'current' | 'pending' | 'blocked'
}

interface OnboardingStepperProps {
  steps: OnboardingStep[]
  currentStep: string
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function OnboardingStepper({
  steps,
  currentStep,
  orientation = 'vertical',
  className,
}: OnboardingStepperProps) {
  const isVertical = orientation === 'vertical'

  return (
    <div
      className={cn(
        'flex',
        isVertical ? 'flex-col' : 'flex-row items-start justify-between',
        className
      )}
    >
      {steps.map((step, index) => {
        const isCompleted = step.status === 'completed'
        const isCurrent = step.id === currentStep
        const isPending = step.status === 'pending'
        const isBlocked = step.status === 'blocked'
        const isLast = index === steps.length - 1

        return (
          <div
            key={step.id}
            className={cn(
              'flex group',
              isVertical ? 'flex-row' : 'flex-col items-center',
              !isVertical && 'flex-1'
            )}
          >
            <div className={cn('flex', isVertical ? 'flex-col items-center' : 'flex-col items-center')}>
              {/* Step Indicator */}
              <div
                className={cn(
                  'relative flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200',
                  isCompleted && 'bg-primary text-primary-foreground shadow-sm shadow-primary/30',
                  isCurrent && 'bg-primary/10 border-2 border-primary',
                  isPending && 'bg-muted border border-border',
                  isBlocked && 'bg-amber-100 border border-amber-300'
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                ) : isCurrent ? (
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                ) : isBlocked ? (
                  <Lock className="w-3 h-3 text-amber-600" />
                ) : (
                  <span className="text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                )}
              </div>

              {/* Connector Line */}
              {!isLast && isVertical && (
                <div
                  className={cn(
                    'w-0.5 h-6 transition-colors duration-200',
                    isCompleted ? 'bg-primary' : 'bg-border'
                  )}
                />
              )}
            </div>

            {/* Step Content */}
            <div
              className={cn(
                isVertical ? 'ml-3 pb-1' : 'mt-2 text-center px-2',
                isVertical && 'min-h-[52px] flex flex-col justify-center'
              )}
            >
              <p
                className={cn(
                  'text-sm font-medium leading-tight',
                  isCompleted && 'text-foreground',
                  isCurrent && 'text-primary',
                  isPending && 'text-muted-foreground',
                  isBlocked && 'text-amber-700'
                )}
              >
                {step.title}
              </p>
              {isCurrent && (
                <p className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {step.description}
                </p>
              )}
              {isBlocked && (
                <p className="text-xs text-amber-600 mt-0.5">Awaiting review</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
