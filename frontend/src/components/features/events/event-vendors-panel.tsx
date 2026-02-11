'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { useAddEventVendor, useDeleteEventVendor, useEventVendors, useUpdateEventVendor } from '@/hooks/queries/use-event-vendors'
import type { EventVendorStatus } from '@/lib/api/types/event-vendor.types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

const addVendorSchema = z.object({
  vendorProfileId: z.string().min(1, 'Vendor profile ID is required'),
  status: z.enum(['SHORTLISTED', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED']).default('SHORTLISTED'),
  contractAmount: z.string().optional(),
  depositPaid: z.string().optional(),
  notes: z.string().optional(),
})

type AddVendorValues = z.infer<typeof addVendorSchema>

const statusOptions: { label: string; value: EventVendorStatus }[] = [
  { label: 'Shortlisted', value: 'SHORTLISTED' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Booked', value: 'BOOKED' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function EventVendorsPanel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useEventVendors(eventId)
  const addVendor = useAddEventVendor(eventId)
  const updateVendor = useUpdateEventVendor(eventId)
  const deleteVendor = useDeleteEventVendor(eventId)

  const form = useForm<AddVendorValues>({
    resolver: zodResolver(addVendorSchema),
    defaultValues: {
      vendorProfileId: '',
      status: 'SHORTLISTED',
      contractAmount: '',
      depositPaid: '',
      notes: '',
    },
  })

  const onSubmit = async (values: AddVendorValues) => {
    await addVendor.mutateAsync({
      eventId,
      vendorProfileId: values.vendorProfileId,
      status: values.status,
      contractAmount: values.contractAmount ? Number(values.contractAmount) : undefined,
      depositPaid: values.depositPaid ? Number(values.depositPaid) : undefined,
      notes: values.notes || undefined,
    })
    form.reset()
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
      </div>
    )
  }

  if (error) {
    return <div className="text-sm text-destructive">Unable to load vendors.</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="vendorProfileId"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Vendor profile ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Vendor UUID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contractAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract amount</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="200000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="depositPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deposit paid</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="50000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-3">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-3">
                <Button type="submit" size="sm" disabled={addVendor.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add vendor
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event vendors</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Deposit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.length ? (
                data.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell>{vendor.vendorProfileId}</TableCell>
                    <TableCell>
                      <Select
                        value={vendor.status}
                        onValueChange={(value) =>
                          updateVendor.mutate({
                            id: vendor.id,
                            input: { status: value as EventVendorStatus },
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {vendor.contractAmount ? `₹${Number(vendor.contractAmount).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell>
                      {vendor.depositPaid ? `₹${Number(vendor.depositPaid).toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteVendor.mutate(vendor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No vendors added yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
