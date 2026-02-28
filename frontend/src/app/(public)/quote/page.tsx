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
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

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

export default function QuotePage() {
  const searchParams = useSearchParams()
  const mediaId = searchParams.get('mediaId') || undefined
  const imageUrl = searchParams.get('image') || undefined
  const vendorIdParam = searchParams.get('vendorId') || undefined
  const vendorSlug = searchParams.get('vendorSlug') || undefined
  const vendorNameParam = searchParams.get('vendorName') || undefined

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
      eventDate: '',
      eventType: '',
      guestCount: '',
      budget: '',
      message: '',
    },
  })

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
    <main className="mx-auto max-w-3xl space-y-8 p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Quote request</p>
        <h1 className="text-3xl font-semibold">Tell us about your event</h1>
        <p className="text-muted-foreground">
          Share your details and our ops team will curate the right vendor options for you.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {hasHydrated && !isAuthenticated && (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
              <p className="font-medium">Log in to send a quote request.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild size="sm">
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link href="/register">Create account</Link>
                </Button>
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-lg border bg-card p-4">
                <p className="text-sm text-muted-foreground">Selected vendor</p>
                <p className="text-lg font-semibold">{vendorName}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="eventDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="eventType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event type</FormLabel>
                      <FormControl>
                        <Input placeholder="Wedding, Gala, Birthday" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="guestCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest count</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="150" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (USD)</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step="0.01" placeholder="10000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes for the ops team</FormLabel>
                    <FormControl>
                      <Textarea rows={4} placeholder="Share preferences, venue ideas, or timing." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {status && (
                <p className={status.type === 'success' ? 'text-sm text-green-600' : 'text-sm text-destructive'}>
                  {status.text}
                </p>
              )}

              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? 'Sending request...' : 'Send quote request'}
              </Button>
            </form>
          </Form>
        </div>

        <aside className="space-y-4">
          {imageUrl && (
            <div className="overflow-hidden rounded-xl border">
              <NextImage
                src={imageUrl}
                alt="Reference"
                width={1200}
                height={900}
                unoptimized={true}
                priority={true}
                className="h-auto w-full object-cover"
              />
              <div className="p-3 text-xs text-muted-foreground">Reference image</div>
            </div>
          )}
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens next?</p>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li>Ops admin reviews your request.</li>
              <li>We confirm availability and requirements.</li>
              <li>You receive curated vendor options.</li>
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
