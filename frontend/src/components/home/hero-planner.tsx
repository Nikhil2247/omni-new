'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SketchButton } from '@/components/sketch'
import { useCities, useEventTypes } from '@/hooks/queries/use-lookups'
import { FALLBACK_EVENT_TYPES } from './content'

/**
 * Quick planner: event type, city and date. It opens the vendor list already filtered to the chosen city,
 * and passes the event type and date along so quote forms can be prefilled.
 */
export function HeroPlanner() {
  const router = useRouter()
  const { data: cities } = useCities()
  const { data: eventTypes } = useEventTypes()
  const [event, setEvent] = useState('')
  const [cityId, setCityId] = useState('')
  const [date, setDate] = useState('')

  const eventOptions = useMemo(
    () => (eventTypes && eventTypes.length > 0 ? eventTypes.map((e) => e.name) : FALLBACK_EVENT_TYPES),
    [eventTypes],
  )
  const today = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    const city = cities?.find((c) => c.id === cityId)
    if (city) {
      params.set('cityId', city.id)
      params.set('cityName', city.name)
    }
    if (event) params.set('event', event)
    if (date) params.set('date', date)
    router.push(params.toString() ? `/vendors?${params.toString()}` : '/vendors')
  }

  return (
    <div>
      <form
        onSubmit={submit}
        role="search"
        aria-label="Quick event planner"
        className="sk-paper sk-tape mt-[30px] grid max-w-[780px] items-end gap-3 px-[18px] pt-[22px] pb-4 max-[520px]:grid-cols-1 max-[900px]:grid-cols-2 min-[901px]:grid-cols-[1.15fr_1fr_1fr_auto]"
      >
        <div className="sk-field !mb-0">
          <label htmlFor="hp-ev">Event type</label>
          <select id="hp-ev" value={event} onChange={(e) => setEvent(e.target.value)}>
            <option value="">Any event</option>
            {eventOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="sk-field !mb-0">
          <label htmlFor="hp-city">City</label>
          <select id="hp-city" value={cityId} onChange={(e) => setCityId(e.target.value)}>
            <option value="">Any city</option>
            {cities?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="sk-field !mb-0">
          <label htmlFor="hp-date">Event date</label>
          <input id="hp-date" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <SketchButton type="submit" className="max-[900px]:col-span-full">
          Find vendors →
        </SketchButton>
      </form>
      <p className="text-ink-soft mt-3 text-sm">Tell us the basics and we show vendors for your city. Takes about ten seconds.</p>
    </div>
  )
}
