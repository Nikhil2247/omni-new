'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Trash2, Plus, Users, CheckCircle, XCircle, HelpCircle } from 'lucide-react'
import { useAddGuest, useCreateGuestlist, useDeleteGuest, useGuestlist, useUpdateRsvp } from '@/hooks/queries/use-guestlist'
import { WhatsAppInvitePanel } from './whatsapp-invite-panel'
import { useExportGuestlist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExportDropdown } from '@/components/common/export-dropdown'
import { toast } from 'sonner'
import type { RSVPStatus } from '@/lib/api/types/guestlist.types'

const addGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  plusOne: z.string().optional(),
})

type AddGuestValues = z.infer<typeof addGuestSchema>

const RSVP_OPTIONS: { label: string; value: RSVPStatus }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Attending', value: 'ATTENDING' },
  { label: 'Not attending', value: 'NOT_ATTENDING' },
  { label: 'Maybe', value: 'MAYBE' },
]

export function GuestlistPanel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useGuestlist(eventId)
  const createGuestlist = useCreateGuestlist()
  const addGuest = useAddGuest(eventId, data?.id)
  const updateRsvp = useUpdateRsvp(eventId)
  const deleteGuest = useDeleteGuest(eventId)
  const exportGuestlist = useExportGuestlist({
    onSuccess: () => toast.success('Export downloaded'),
    onError: () => toast.error('Export failed'),
  })

  const guestForm = useForm<AddGuestValues>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', plusOne: '' },
  })

  const handleCreate = async () => {
    await createGuestlist.mutateAsync({ eventId })
  }

  const onAddGuest = async (values: AddGuestValues) => {
    await addGuest.mutateAsync({
      firstName: values.firstName,
      lastName: values.lastName || undefined,
      email: values.email || undefined,
      phone: values.phone || undefined,
      plusOne: values.plusOne ? Number(values.plusOne) : undefined,
    })
    guestForm.reset()
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
    return <div className="text-sm text-destructive">Unable to load guest list.</div>
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create your guest list</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreate} disabled={createGuestlist.isPending}>
            {createGuestlist.isPending ? 'Creating...' : 'Create guest list'}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Calculate RSVP statistics
  const stats = {
    total: data.guests?.length ?? 0,
    attending: data.guests?.filter((g: any) => g.rsvpStatus === 'ATTENDING').length ?? 0,
    notAttending: data.guests?.filter((g: any) => g.rsvpStatus === 'NOT_ATTENDING').length ?? 0,
    pending: data.guests?.filter((g: any) => g.rsvpStatus === 'PENDING').length ?? 0,
    maybe: data.guests?.filter((g: any) => g.rsvpStatus === 'MAYBE').length ?? 0,
    totalPlusOnes: data.guests?.reduce((sum: number, g: any) => sum + (g.plusOne || 0), 0) ?? 0,
  }

  return (
    <div className="space-y-6">
      {/* RSVP Summary Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            RSVP Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="rounded-lg bg-gray-50 p-4 text-center">
              <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Guests</div>
            </div>
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-5 w-5" />
                {stats.attending}
              </div>
              <div className="text-sm text-green-700">Attending</div>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-1">
                <XCircle className="h-5 w-5" />
                {stats.notAttending}
              </div>
              <div className="text-sm text-red-700">Declined</div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                <HelpCircle className="h-5 w-5" />
                {stats.pending + stats.maybe}
              </div>
              <div className="text-sm text-yellow-700">Pending</div>
            </div>
            <div className="rounded-lg bg-purple-50 p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.attending + stats.totalPlusOnes}
              </div>
              <div className="text-sm text-purple-700">Expected Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* WhatsApp Integration */}
      <WhatsAppInvitePanel guestlistId={data.id} guests={data.guests ?? []} />

      <Card>
        <CardHeader>
          <CardTitle>Add guest</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...guestForm}>
            <form onSubmit={guestForm.handleSubmit(onAddGuest)} className="grid gap-4 md:grid-cols-2">
              <FormField
                control={guestForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input placeholder="Simran" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={guestForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input placeholder="Kaur" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={guestForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="guest@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={guestForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+91 90000 00000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={guestForm.control}
                name="plusOne"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plus ones</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <Button type="submit" size="sm" disabled={addGuest.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add guest
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Guests</CardTitle>
          <ExportDropdown
            type="guestlist"
            id={data.id}
            filename="guestlist"
            onExport={async (format) => {
              await exportGuestlist.mutateAsync({ id: data.id, format })
            }}
            disabled={exportGuestlist.isPending}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RSVP</TableHead>
                <TableHead>Plus ones</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.guests?.length ? (
                data.guests.map((guest: any) => (
                  <TableRow key={guest.id}>
                    <TableCell>{guest.firstName} {guest.lastName ?? ''}</TableCell>
                    <TableCell>{guest.email ?? '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={guest.rsvpStatus}
                        onValueChange={(value) =>
                          updateRsvp.mutate({
                            guestId: guest.id,
                            input: { rsvpStatus: value as RSVPStatus },
                          })
                        }
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RSVP_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{guest.plusOne}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteGuest.mutate(guest.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No guests added yet.
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
