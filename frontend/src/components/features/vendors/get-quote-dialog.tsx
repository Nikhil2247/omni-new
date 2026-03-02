'use client'

import { useState } from 'react'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FileText, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useCreateLead } from '@/hooks/queries/use-leads'
import { trackQuote } from '@/lib/analytics/umami'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
    .refine((v) => !v || Number(v) > 0, { message: 'Must be greater than 0' }),
  budget: z
    .string()
    .optional()
    .refine((v) => !v || Number(v) >= 0, { message: 'Must be a positive amount' }),
  message: z.string().optional(),
})

type QuoteFormValues = z.infer<typeof quoteSchema>

interface GetQuoteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorName: string
}

export function GetQuoteDialog({ open, onOpenChange, vendorId, vendorName }: GetQuoteDialogProps) {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const createLead = useCreateLead()
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: { eventDate: '', eventType: '', guestCount: '', budget: '', message: '' },
  })

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      // Reset when closing so form is fresh next open
      setTimeout(() => {
        form.reset()
        setSubmitted(false)
        setErrorMsg(null)
      }, 300)
    }
    onOpenChange(next)
  }

  const onSubmit = async (values: QuoteFormValues) => {
    setErrorMsg(null)

    if (!isAuthenticated || !user?.id) {
      setErrorMsg('Please log in to send a quote request.')
      return
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
        initialMessage: values.message?.trim() || undefined,
      })
      trackQuote.submit(vendorId, values.eventType)
      setSubmitted(true)
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        const msg = String(error.response?.data?.message ?? '')
        if (msg.toLowerCase().includes('account is not active')) {
          setErrorMsg('Please complete your account setup before requesting a quote.')
          return
        }
        setErrorMsg('Please log in to send a quote request.')
        return
      }
      setErrorMsg('Failed to send request. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Get a Quote
          </DialogTitle>
          <DialogDescription>
            Request pricing from <span className="font-medium text-foreground">{vendorName}</span>
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          /* ── Success state ── */
          <div className="flex flex-col items-center py-8 text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold">Request sent!</h3>
            <p className="max-w-xs text-sm text-muted-foreground">
              Our ops team will review your request and connect you with {vendorName} shortly.
            </p>
            <Button className="mt-2" onClick={() => handleOpenChange(false)}>
              Done
            </Button>
          </div>
        ) : (
          /* ── Form ── */
          <div className="space-y-5 pt-1">
            {hasHydrated && !isAuthenticated && (
              <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-sm">
                <p className="font-medium">Log in to send a quote request.</p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" onClick={() => router.push('/login')}>
                    <Link href="/login">Log in</Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href="/register">Create account</Link>
                  </Button>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
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
                          <Input placeholder="Wedding, Gala, Birthday…" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
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
                        <FormLabel>Budget (INR)</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} placeholder="50000" {...field} />
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
                      <FormLabel>
                        Notes{' '}
                        <span className="text-xs font-normal text-muted-foreground">(optional)</span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Share preferences, venue ideas, or timing requirements…"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {errorMsg && (
                  <p className="text-sm text-destructive">{errorMsg}</p>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createLead.isPending || !isAuthenticated}
                  >
                    {createLead.isPending ? 'Sending…' : 'Send request'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
