'use client'

import { Loader2 } from 'lucide-react'
import { Ico, ICONS, SketchButton, Stamp } from '@/components/sketch'
import { cn } from '@/lib/utils'

const CHOICES = [
  { value: 'ATTENDING', label: "Yes, I'll be there!", tone: 'ok' as const },
  { value: 'NOT_ATTENDING', label: "Sorry, I can't make it", tone: 'late' as const },
  { value: 'MAYBE', label: 'Not sure yet', tone: 'wait' as const },
]

interface RsvpResponseFieldsProps {
  idPrefix: string
  rsvpStatus: string
  onStatusChange: (v: string) => void
  plusOne: number
  onPlusOneChange: (n: number) => void
  dietaryReq: string
  onDietaryChange: (v: string) => void
  dietaryOptions?: string[]
  message: string
  onMessageChange: (v: string) => void
  isPending: boolean
  hasResponded: boolean
  submitLabel: string
  onSubmit: () => void
}

/** Shared RSVP form body (option cards, extras, message, submit) used by the RSVP and e-invite pages. */
export function RsvpResponseFields({
  idPrefix,
  rsvpStatus,
  onStatusChange,
  plusOne,
  onPlusOneChange,
  dietaryReq,
  onDietaryChange,
  dietaryOptions,
  message,
  onMessageChange,
  isPending,
  hasResponded,
  submitLabel,
  onSubmit,
}: RsvpResponseFieldsProps) {
  return (
    <div className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="font-display mb-3 text-lg font-semibold">Will you be attending?</legend>
        <div className="grid gap-3">
          {CHOICES.map((c) => {
            const id = `${idPrefix}-${c.value}`
            const active = rsvpStatus === c.value
            return (
              <label
                key={c.value}
                htmlFor={id}
                className={cn(
                  'sk-paper flex min-h-16 cursor-pointer items-center gap-4 px-5 py-4 transition-colors',
                  active && 'sk-paper--alt',
                )}
              >
                <input
                  id={id}
                  type="radio"
                  name={`${idPrefix}-rsvp`}
                  value={c.value}
                  checked={active}
                  onChange={() => onStatusChange(c.value)}
                  className="sk-check"
                />
                <span className="flex-1 text-base font-bold">{c.label}</span>
                {active && <Stamp tone={c.tone}>Selected</Stamp>}
              </label>
            )
          })}
        </div>
      </fieldset>

      {rsvpStatus === 'ATTENDING' && (
        <div className="grid gap-5">
          <div className="sk-field">
            <label htmlFor={`${idPrefix}-plus`}>Additional guests</label>
            <select
              id={`${idPrefix}-plus`}
              value={plusOne.toString()}
              onChange={(e) => onPlusOneChange(parseInt(e.target.value))}
            >
              {[0, 1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n.toString()}>
                  {n === 0 ? 'Just me' : `+${n} guest${n > 1 ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>

          {dietaryOptions && dietaryOptions.length > 0 && (
            <div className="sk-field">
              <label htmlFor={`${idPrefix}-diet`}>Dietary requirements</label>
              <select id={`${idPrefix}-diet`} value={dietaryReq} onChange={(e) => onDietaryChange(e.target.value)}>
                <option value="">Select dietary preference</option>
                {dietaryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="sk-field">
        <label htmlFor={`${idPrefix}-msg`}>Message for the hosts (optional)</label>
        <textarea
          id={`${idPrefix}-msg`}
          placeholder="Send your wishes or let us know anything special..."
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          rows={3}
        />
      </div>

      <SketchButton className="w-full" disabled={!rsvpStatus || isPending} onClick={onSubmit}>
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Ico d={ICONS.heart} className="h-4 w-4" />
            {hasResponded ? 'Update Response' : submitLabel}
          </>
        )}
      </SketchButton>
    </div>
  )
}
