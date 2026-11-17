'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface DatePickerProps extends Omit<React.ComponentProps<'button'>, 'value' | 'onChange'> {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  /** Earliest date that can be picked. */
  minDate?: Date
  /** Date-fns format for the shown value. */
  displayFormat?: string
}

/**
 * A date field in the hand-painted theme: an input-style button that opens a calendar.
 * Works with react-hook-form (`value` + `onChange`) and inside `FormControl`.
 */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  minDate,
  displayFormat = 'PPP',
  className,
  disabled,
  ...props
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          data-slot="date-picker"
          className={cn(
            'border-blue-wash bg-card text-ink hover:border-blue/60 focus-visible:border-blue flex h-8 w-full items-center justify-between gap-2 rounded-[10px_18px_12px_16px] border-2 px-2.5 py-1 text-left text-sm outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-50',
            !value && 'text-ink-soft',
            className,
          )}
          {...props}
        >
          <span className="truncate">{value ? format(value, displayFormat) : placeholder}</span>
          <CalendarIcon className="text-ink-soft size-4 shrink-0" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            if (date) setOpen(false)
          }}
          disabled={minDate ? { before: minDate } : undefined}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
