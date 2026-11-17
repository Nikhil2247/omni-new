'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useLeadConversion } from '@/hooks/queries/use-ops'
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
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'sonner'

const leadConversionSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  opsAdminId: z.string().min(1, 'Ops Admin ID is required'),
  opsManagerId: z.string().optional(),
  referenceImageId: z.string().optional(),
  venueName: z.string().optional(),
  venueAddressId: z.string().optional(),
  totalBudget: z.string().optional(),
})

type LeadConversionFormValues = z.infer<typeof leadConversionSchema>

export function LeadConversionForm() {
  const router = useRouter()
  const convertLead = useLeadConversion()

  const form = useForm<LeadConversionFormValues>({
    resolver: zodResolver(leadConversionSchema),
    defaultValues: {
      leadId: '',
      opsAdminId: '',
      opsManagerId: '',
      referenceImageId: '',
      venueName: '',
      venueAddressId: '',
      totalBudget: '',
    },
  })

  const onSubmit = (values: LeadConversionFormValues) => {
    convertLead.mutate({
      leadId: values.leadId,
      opsAdminId: values.opsAdminId,
      opsManagerId: values.opsManagerId || undefined,
      referenceImageId: values.referenceImageId || undefined,
      venueName: values.venueName || undefined,
      venueAddressId: values.venueAddressId || undefined,
      totalBudget: values.totalBudget ? Number(values.totalBudget) : undefined,
    })
  }

  useEffect(() => {
    if (convertLead.isSuccess) {
      toast.success('Lead converted successfully! Redirecting...')
      form.reset()
      // Optionally redirect after success
      setTimeout(() => router.push('/ops/events'), 2000)
    }
  }, [convertLead.isSuccess, form, router])

  useEffect(() => {
    if (convertLead.isError) {
      toast.error('Failed to convert lead. Please try again.')
    }
  }, [convertLead.isError])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="leadId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead ID</FormLabel>
                <FormControl>
                  <Input placeholder="Lead ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="opsAdminId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ops Admin ID</FormLabel>
                <FormControl>
                  <Input placeholder="Admin ID" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="opsManagerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ops Manager ID</FormLabel>
                <FormControl>
                  <Input placeholder="Manager ID (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="referenceImageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reference Image ID</FormLabel>
                <FormControl>
                  <Input placeholder="Image ID (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Name</FormLabel>
                <FormControl>
                  <Input placeholder="Grand Ballroom (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="venueAddressId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Venue Address ID</FormLabel>
                <FormControl>
                  <Input placeholder="Address ID (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalBudget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Budget</FormLabel>
                <FormControl>
                  <Input type="number" min="0" placeholder="10000 (optional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={convertLead.isPending}>
          {convertLead.isPending ? 'Converting...' : 'Convert Lead to Event'}
        </Button>
      </form>
    </Form>
  )
}
