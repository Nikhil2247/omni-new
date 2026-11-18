'use client'

import * as React from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DateRangeValue {
  startDate: Date
  endDate: Date
}

export interface DateRangePreset {
  label: string
  days: number
}

const defaultPresets: DateRangePreset[] = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

export interface DateRangeSelectorProps {
  value?: DateRangeValue
  onChange?: (range: DateRangeValue) => void
  presets?: DateRangePreset[]
  className?: string
  placeholder?: string
}

export function DateRangeSelector({
  value,
  onChange,
  presets = defaultPresets,
  className,
  placeholder = 'Select date range',
}: DateRangeSelectorProps) {
  const [open, setOpen] = React.useState(false)
  const [selectedPreset, setSelectedPreset] = React.useState<number | null>(30)

  // Convert value to DateRange for calendar
  const dateRange: DateRange | undefined = value
    ? { from: value.startDate, to: value.endDate }
    : undefined

  const handlePresetClick = (days: number) => {
    setSelectedPreset(days)
    const endDate = endOfDay(new Date())
    const startDate = startOfDay(subDays(endDate, days - 1))
    onChange?.({ startDate, endDate })
  }

  const handleDateSelect = (range: DateRange | undefined) => {
    setSelectedPreset(null)
    if (range?.from && range?.to) {
      onChange?.({
        startDate: startOfDay(range.from),
        endDate: endOfDay(range.to),
      })
    }
  }

  const formatDateRange = () => {
    if (!value) return placeholder
    return `${format(value.startDate, 'MMM d, yyyy')} - ${format(value.endDate, 'MMM d, yyyy')}`
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Preset buttons */}
      <div className="flex items-center gap-1">
        {presets.map((preset) => (
          <Button
            key={preset.days}
            variant={selectedPreset === preset.days ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-3"
            onClick={() => handlePresetClick(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Calendar picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedPreset === null && value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'h-8 justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedPreset === null && value ? formatDateRange() : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.startDate}
            selected={dateRange}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
