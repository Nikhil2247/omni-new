'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { useAddEventVendor, useDeleteEventVendor, useEventVendors, useUpdateEventVendor } from '@/hooks/queries/use-event-vendors'
import type { EventVendorStatus } from '@/lib/api/types/event-vendor.types'
import { Button } from '@/components/ui/button'
import { Paper, SketchButton } from '@/components/sketch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'

const addVendorSchema = z.object({
  vendorProfileId: z.string().min(1, 'Vendor profile ID is required'),
  status: z.enum(['SHORTLISTED', 'CONTACTED', 'BOOKED', 'CONFIRMED', 'CANCELLED']),
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
  const [showAddVendorDialog, setShowAddVendorDialog] = useState(false)
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
    setShowAddVendorDialog(false)
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
    return <div className="text-sm text-rose">Unable to load vendors.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SketchButton size="sm" onClick={() => setShowAddVendorDialog(true)}>
          Add Vendor
        </SketchButton>
      </div>

      <Dialog open={showAddVendorDialog} onOpenChange={setShowAddVendorDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add vendor</DialogTitle>
            <DialogDescription>Add a vendor to this event.</DialogDescription>
          </DialogHeader>
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
              <DialogFooter className="md:col-span-3">
                <Button type="button" variant="outline" onClick={() => setShowAddVendorDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addVendor.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addVendor.isPending ? 'Adding...' : 'Add vendor'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Paper className="px-5 py-5">
        <h2 className="font-display mb-3 text-2xl font-semibold">Event vendors</h2>
        <div className="overflow-x-auto">
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
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        aria-label="Remove vendor"
                        onClick={() => deleteVendor.mutate(vendor.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </SketchButton>
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
        </div>
      </Paper>
    </div>
  )
}
