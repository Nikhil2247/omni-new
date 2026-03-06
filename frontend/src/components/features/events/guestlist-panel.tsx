'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import {
  Trash2,
  Plus,
  Users,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Copy,
  MessageCircle,
  Link2,
  Clock,
  Filter,
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react'
import { useAddGuest, useCreateGuestlist, useDeleteGuest, useGuestlist, useUpdateRsvp, useImportGuests, useGenerateMissingTokens } from '@/hooks/queries/use-guestlist'
import { guestlistService, type ImportResult } from '@/lib/api/services/guestlist.service'
import { WhatsAppInvitePanel } from './whatsapp-invite-panel'
import { useExportGuestlist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ExportDropdown } from '@/components/common/export-dropdown'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { RSVPStatus, Guest } from '@/lib/api/types/guestlist.types'

const addGuestSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  plusOne: z.string().optional(),
})

type AddGuestValues = z.infer<typeof addGuestSchema>

const RSVP_OPTIONS: { label: string; value: RSVPStatus; color: string }[] = [
  { label: 'Pending', value: 'PENDING', color: 'bg-gray-100 text-gray-700' },
  { label: 'Attending', value: 'ATTENDING', color: 'bg-green-100 text-green-700' },
  { label: 'Not attending', value: 'NOT_ATTENDING', color: 'bg-red-100 text-red-700' },
  { label: 'Maybe', value: 'MAYBE', color: 'bg-yellow-100 text-yellow-700' },
]

// Get frontend URL for RSVP links
const FRONTEND_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://omnicassion.com'

export function GuestlistPanel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useGuestlist(eventId)
  const createGuestlist = useCreateGuestlist()
  const addGuest = useAddGuest(eventId, data?.id)
  const updateRsvp = useUpdateRsvp(eventId)
  const deleteGuest = useDeleteGuest(eventId)
  const importGuests = useImportGuests(eventId, data?.id)
  const generateTokens = useGenerateMissingTokens(eventId, data?.id)
  const exportGuestlist = useExportGuestlist({
    onSuccess: () => toast.success('Export downloaded'),
    onError: () => toast.error('Export failed'),
  })

  const [showCreateGuestlistDialog, setShowCreateGuestlistDialog] = useState(false)
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RSVPStatus | 'ALL'>('ALL')

  const guestForm = useForm<AddGuestValues>({
    resolver: zodResolver(addGuestSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', plusOne: '' },
  })

  const handleCreate = async () => {
    await createGuestlist.mutateAsync({ eventId })
    setShowCreateGuestlistDialog(false)
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
    setShowAddGuestDialog(false)
  }

  // Copy RSVP link to clipboard
  const copyRsvpLink = (token?: string | null) => {
    if (!token) {
      toast.error('No RSVP link available. Please delete and re-add this guest.')
      return
    }
    const link = `${FRONTEND_URL}/rsvp/${token}`
    navigator.clipboard.writeText(link)
      .then(() => toast.success('RSVP link copied to clipboard!'))
      .catch(() => toast.error('Failed to copy link'))
  }

  // Share via WhatsApp
  const shareViaWhatsApp = (guest: Guest) => {
    if (!guest.rsvpToken) {
      toast.error('No RSVP link available. Please delete and re-add this guest.')
      return
    }
    if (!guest.phone) {
      // If no phone, just copy the link instead
      copyRsvpLink(guest.rsvpToken)
      toast.info('No phone number - link copied instead')
      return
    }
    const link = `${FRONTEND_URL}/rsvp/${guest.rsvpToken}`
    const message = encodeURIComponent(
      `Hi ${guest.firstName}! You're invited to our event. Please RSVP here: ${link}`
    )
    const phone = guest.phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank')
  }

  // Handle file import
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const result = await importGuests.mutateAsync(text)
      setImportResult(result)
      toast.success(`Imported ${result.imported} guests`)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to import guests')
    }

    // Reset file input
    event.target.value = ''
  }

  // Download template
  const downloadTemplate = () => {
    const templateContent = 'firstName,lastName,email,phone,plusOne,dietaryReq,notes\nJohn,Doe,john@example.com,+1234567890,1,Vegetarian,VIP Guest'
    const blob = new Blob([templateContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'guest-import-template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Template downloaded')
  }

  // Filter guests based on search and status
  const filteredGuests = useMemo(() => {
    if (!data?.guests) return []

    return data.guests.filter((guest: Guest) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone?.includes(searchQuery)

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || guest.rsvpStatus === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [data?.guests, searchQuery, statusFilter])

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
          <Button onClick={() => setShowCreateGuestlistDialog(true)}>
            Create guest list
          </Button>

          <Dialog open={showCreateGuestlistDialog} onOpenChange={setShowCreateGuestlistDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create guest list</DialogTitle>
                <DialogDescription>
                  This will create the guest list for this event.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCreateGuestlistDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={createGuestlist.isPending}>
                  {createGuestlist.isPending ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  // Calculate RSVP statistics
  const stats = {
    total: data.guests?.length ?? 0,
    attending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'ATTENDING').length ?? 0,
    notAttending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'NOT_ATTENDING').length ?? 0,
    pending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'PENDING').length ?? 0,
    maybe: data.guests?.filter((g: Guest) => g.rsvpStatus === 'MAYBE').length ?? 0,
    totalPlusOnes: data.guests?.reduce((sum: number, g: Guest) => sum + (g.plusOne || 0), 0) ?? 0,
  }

  // Check for guests missing RSVP tokens
  const guestsMissingTokens = data.guests?.filter((g: Guest) => !g.rsvpToken).length ?? 0

  // Handle generating missing tokens
  const handleGenerateTokens = async () => {
    try {
      const result = await generateTokens.mutateAsync()
      toast.success(`Generated RSVP links for ${result.updated} guests`)
    } catch (err) {
      toast.error('Failed to generate RSVP links')
    }
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
            <div className="rounded-lg bg-gray-50 dark:bg-gray-900/50 p-4 text-center">
              <div className="text-3xl font-bold text-gray-700 dark:text-gray-300">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Guests</div>
            </div>
            <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 text-center">
              <div className="text-3xl font-bold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-5 w-5" />
                {stats.attending}
              </div>
              <div className="text-sm text-green-700 dark:text-green-400">Attending</div>
            </div>
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 text-center">
              <div className="text-3xl font-bold text-red-600 flex items-center justify-center gap-1">
                <XCircle className="h-5 w-5" />
                {stats.notAttending}
              </div>
              <div className="text-sm text-red-700 dark:text-red-400">Declined</div>
            </div>
            <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600 flex items-center justify-center gap-1">
                <HelpCircle className="h-5 w-5" />
                {stats.pending + stats.maybe}
              </div>
              <div className="text-sm text-yellow-700 dark:text-yellow-400">Pending</div>
            </div>
            <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-4 text-center">
              <div className="text-3xl font-bold text-purple-600">
                {stats.attending + stats.totalPlusOnes}
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-400">Expected Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning: Guests Missing RSVP Links */}
      {guestsMissingTokens > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800 dark:text-yellow-200">
                {guestsMissingTokens} guest{guestsMissingTokens > 1 ? 's' : ''} missing RSVP link
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                These guests were added before the RSVP link feature. Generate links to enable sharing.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateTokens}
            disabled={generateTokens.isPending}
            className="border-yellow-300 hover:bg-yellow-100 dark:border-yellow-700 dark:hover:bg-yellow-900/40"
          >
            <Link2 className="mr-2 h-4 w-4" />
            {generateTokens.isPending ? 'Generating...' : 'Generate Links'}
          </Button>
        </div>
      )}

      {/* WhatsApp Integration */}
      <WhatsAppInvitePanel guestlistId={data.id} guests={data.guests ?? []} />

      {/* Search, Filter, and Add */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as RSVPStatus | 'ALL')}
          >
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {RSVP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowImportDialog(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddGuestDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Guest
          </Button>
        </div>
      </div>

      {/* Add Guest Dialog */}
      <Dialog open={showAddGuestDialog} onOpenChange={setShowAddGuestDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add guest</DialogTitle>
            <DialogDescription>Add a guest to this event guest list.</DialogDescription>
          </DialogHeader>

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

              <DialogFooter className="md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowAddGuestDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={addGuest.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addGuest.isPending ? 'Adding...' : 'Add guest'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => {
        setShowImportDialog(open)
        if (!open) setImportResult(null)
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Guests from CSV
            </DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import guests. Download the template to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Download Template */}
            <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
              <div>
                <p className="font-medium text-sm">CSV Template</p>
                <p className="text-xs text-muted-foreground">Download to see the required format</p>
              </div>
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">CSV files only</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv"
                    onChange={handleFileImport}
                    disabled={importGuests.isPending}
                  />
                </label>
              </div>
              {importGuests.isPending && (
                <p className="text-sm text-muted-foreground text-center">Importing guests...</p>
              )}
            </div>

            {/* Import Results */}
            {importResult && (
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium text-sm">Import Results</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-2">
                    <div className="text-lg font-bold text-green-600">{importResult.imported}</div>
                    <div className="text-xs text-green-700 dark:text-green-400">Imported</div>
                  </div>
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/20 p-2">
                    <div className="text-lg font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">Skipped</div>
                  </div>
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-2">
                    <div className="text-lg font-bold text-red-600">{importResult.errors.length}</div>
                    <div className="text-xs text-red-700 dark:text-red-400">Errors</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="flex items-center gap-1 text-destructive font-medium">
                      <AlertCircle className="h-4 w-4" />
                      Errors:
                    </p>
                    <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
                      {importResult.errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 5 && (
                        <li>...and {importResult.errors.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                {importResult.guests.filter(g => g.status === 'skipped').length > 0 && (
                  <div className="mt-2 text-sm">
                    <p className="font-medium text-yellow-600">Skipped (duplicates):</p>
                    <ul className="mt-1 text-xs text-muted-foreground list-disc pl-5">
                      {importResult.guests.filter(g => g.status === 'skipped').slice(0, 5).map((g, i) => (
                        <li key={i}>{g.firstName} {g.lastName || ''} - {g.reason}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowImportDialog(false)
              setImportResult(null)
            }}>
              {importResult ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guests Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>
            Guests
            {searchQuery || statusFilter !== 'ALL' ? (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredGuests.length} of {stats.total})
              </span>
            ) : null}
          </CardTitle>
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>RSVP</TableHead>
                  <TableHead>Plus ones</TableHead>
                  <TableHead>RSVP Link</TableHead>
                  <TableHead>Responded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.length ? (
                  filteredGuests.map((guest: Guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        {guest.firstName} {guest.lastName ?? ''}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {guest.email && <div className="text-muted-foreground">{guest.email}</div>}
                          {guest.phone && <div className="text-muted-foreground">{guest.phone}</div>}
                          {!guest.email && !guest.phone && <span className="text-muted-foreground">-</span>}
                        </div>
                      </TableCell>
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
                          <SelectTrigger className="w-36">
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
                      <TableCell>
                        <Badge variant="secondary">{guest.plusOne}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              copyRsvpLink(guest.rsvpToken)
                            }}
                            title="Copy RSVP link"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              shareViaWhatsApp(guest)
                            }}
                            title="Share via WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4 text-green-600" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        {guest.rsvpAt ? (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(guest.rsvpAt), 'MMM d, h:mm a')}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGuest.mutate(guest.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'No guests match your search or filter.'
                        : 'No guests added yet. Click "Add Guest" to get started.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
