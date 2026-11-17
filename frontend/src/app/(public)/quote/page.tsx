'use client'

import { useEffect, useState } from 'react'
import NextImage from 'next/image'
import axios from 'axios'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { trackQuote } from '@/lib/analytics/umami'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useAuthStore } from '@/store/auth-store'
import { usePublicVendor } from '@/hooks/queries/use-public-vendors'
import { useCreateLead } from '@/hooks/queries/use-leads'
import { Brush, Eyebrow, Paper, SketchButton, SkContainer } from '@/components/sketch'

const quoteSchema = z.object({
  eventDate: z.string().min(1, 'Event date is required'),
  eventType: z.string().min(2, 'Event type is required'),
  guestCount: z
    .string()
    .optional()
    .refine((value) => !value || Number(value) > 0, {
      message: 'Guest count must be greater than 0',
    }),
  budget: z
    .string()
    .optional()
    .refine((value) => !value || Number(value) >= 0, {
      message: 'Budget must be a positive amount',
    }),
  message: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteSchema>

const NEXT_STEPS = [
  { title: '1. Ops admin reviews your request.', text: 'The ops team looks at your date, guests and budget.' },
  { title: '2. We confirm availability.', text: 'We check availability and requirements with vendors.' },
  { title: '3. You receive curated options.', text: 'Review the vendor options we shortlist for you.' },
]

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="text-xs font-bold text-destructive">
      {message}
    </p>
  )
}

export default function QuotePage() {
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') || undefined
  const imageUrl = searchParams.get('image') || undefined
  const vendorIdParam = searchParams.get('vendorId') || undefined
  const vendorSlug = searchParams.get('vendorSlug') || undefined
  const vendorNameParam = searchParams.get('vendorName') || undefined
  const eventParam = searchParams.get('event') || ''
  const dateParam = searchParams.get('date') || ''

  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const createLead = useCreateLead()
  const { data: vendorData } = usePublicVendor(vendorSlug ?? '')

  const vendorId = vendorIdParam ?? vendorData?.id
  const vendorName = vendorNameParam ?? vendorData?.businessName ?? 'Selected vendor'

  useEffect(() => {
    if (vendorId) trackQuote.start(vendorId, 'quote-page')
  }, [vendorId])

  const [status, setStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      eventDate: dateParam,
      eventType: eventParam,
      guestCount: '',
      budget: '',
      message: '',
    },
  })
  const {
    register,
    formState: { errors },
  } = form

  const onSubmit = async (values: QuoteFormValues) => {
    setStatus(null)

    if (!hasHydrated) {
      setStatus({ type: 'error', text: 'Loading your session. Please wait a moment.' })
      return
    }

    if (!isAuthenticated || !user?.id) {
      setStatus({ type: 'error', text: 'Please log in to request a quote.' })
      return
    }

    if (!vendorId) {
      setStatus({ type: 'error', text: 'Vendor information is missing. Please try again.' })
      return
    }

    const noteParts = [values.message?.trim()].filter(Boolean) as string[]
    if (mediaId) {
      noteParts.push(`Reference image: ${mediaId}`)
    }

    try {
      await createLead.mutateAsync({
        vendorProfileId: vendorId,
        plannerId: user.id,
        source: 'INQUIRY',
        eventDate: values.eventDate,
        eventType: values.eventType,
        guestCount: values.guestCount ? Number(values.guestCount) : undefined,
        budget: values.budget ? Number(values.budget) : undefined,
        initialMessage: noteParts.length ? noteParts.join('\n') : undefined,
      })

      setStatus({ type: 'success', text: 'Quote request sent. Our ops team will reach out shortly.' })
      if (vendorId) trackQuote.submit(vendorId, values.eventType)
      form.reset()
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const message = String(error.response?.data?.message ?? '')
        if (message.toLowerCase().includes('account is not active')) {
          setStatus({
            type: 'error',
            text: 'Please complete your account setup before requesting a quote.',
          })
          return
        }
        setStatus({ type: 'error', text: 'Please log in to request a quote.' })
        return
      }
      setStatus({ type: 'error', text: 'Failed to send quote request. Please try again.' })
    }
  }

  return (
    <SkContainer className="pb-16">
      <div className="pb-2 pt-6">
        <Eyebrow>Get a quote</Eyebrow>
        <h1 className="mt-2.5 max-w-[20ch] font-display text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[1.05] text-ink">
          Tell us about your <Brush gold>event</Brush>
        </h1>
        <p className="mt-3 max-w-xl text-ink-soft">
          Share your details and our ops team will curate the right vendor options for you.
        </p>
      </div>

      <div className="mt-6 grid items-start gap-[34px] min-[900px]:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          {hasHydrated && !isAuthenticated && (
            <Paper alt className="p-5 text-sm">
              <p className="font-bold">Log in to send a quote request.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <SketchButton asChild size="sm">
                  <Link href="/login">Log in</Link>
                </SketchButton>
                <SketchButton asChild size="sm" variant="line">
                  <Link href="/register">Create account</Link>
                </SketchButton>
              </div>
            </Paper>
          )}

          <Paper tape className="p-7 max-sm:p-5">
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <div className="mb-5 rounded-[var(--hand2)] border-2 border-dashed border-line p-3">
                <p className="text-sm text-ink-soft">Selected vendor</p>
                <p className="font-display text-lg font-bold">{vendorName}</p>
              </div>

              <div className="grid gap-x-4 sm:grid-cols-2">
                <div className="sk-field">
                  <label htmlFor="q-date">Event date</label>
                  <input id="q-date" type="date" aria-invalid={!!errors.eventDate} {...register('eventDate')} />
                  <FieldError message={errors.eventDate?.message} />
                </div>
                <div className="sk-field">
                  <label htmlFor="q-type">Event type</label>
                  <input
                    id="q-type"
                    placeholder="Wedding, Gala, Birthday"
                    aria-invalid={!!errors.eventType}
                    {...register('eventType')}
                  />
                  <FieldError message={errors.eventType?.message} />
                </div>
                <div className="sk-field">
                  <label htmlFor="q-guests">Guest count</label>
                  <input
                    id="q-guests"
                    type="number"
                    min={1}
                    placeholder="150"
                    aria-invalid={!!errors.guestCount}
                    {...register('guestCount')}
                  />
                  <FieldError message={errors.guestCount?.message} />
                </div>
                <div className="sk-field">
                  <label htmlFor="q-budget">Budget (INR)</label>
                  <input
                    id="q-budget"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="10000"
                    aria-invalid={!!errors.budget}
                    {...register('budget')}
                  />
                  <FieldError message={errors.budget?.message} />
                </div>
              </div>

              <div className="sk-field">
                <label htmlFor="q-notes">Notes for the ops team</label>
                <textarea
                  id="q-notes"
                  rows={4}
                  placeholder="Share preferences, venue ideas, or timing."
                  {...register('message')}
                />
              </div>

              {status && (
                <p
                  role={status.type === 'error' ? 'alert' : 'status'}
                  className={
                    status.type === 'success'
                      ? 'mb-3 font-hand text-xl font-bold text-leaf-deep'
                      : 'mb-3 text-sm font-bold text-destructive'
                  }
                >
                  {status.text}
                </p>
              )}

              <SketchButton type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? 'Sending request...' : 'Send quote request'}
              </SketchButton>
            </form>
          </Paper>
        </div>

        <aside className="space-y-5">
          {imageUrl && (
            <Paper className="overflow-hidden p-3">
              <NextImage
                src={imageUrl}
                alt="Reference"
                width={1200}
                height={900}
                unoptimized={true}
                priority={true}
                className="h-auto w-full rounded-[var(--hand2)] object-cover"
              />
              <div className="pt-2 text-xs text-ink-soft">Reference image</div>
            </Paper>
          )}
          <Paper alt className="p-[22px]">
            <h2 className="mb-2.5 font-display text-[1.3rem] font-bold">What happens next</h2>
            <ul className="m-0 grid list-none gap-3 p-0 text-ink-soft">
              {NEXT_STEPS.map((step) => (
                <li key={step.title}>
                  <b className="text-ink">{step.title}</b>
                  <br />
                  {step.text}
                </li>
              ))}
            </ul>
          </Paper>
        </aside>
      </div>
    </SkContainer>
  )
}
