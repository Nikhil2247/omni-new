'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
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
  Send,
  ExternalLink,
  LayoutGrid,
  List as ListIcon,
  Sparkles,
  ChevronRight,
  UserPlus,
} from 'lucide-react'
import { useAddGuest, useCreateGuestlist, useDeleteGuest, useGuestlist, useUpdateRsvp, useImportGuests, useGenerateMissingTokens } from '@/hooks/queries/use-guestlist'
import { useEInviteByEvent } from '@/hooks/queries/use-einvites'
import { guestlistService, type ImportResult } from '@/lib/api/services/guestlist.service'
import { WhatsAppInvitePanel } from './whatsapp-invite-panel'
import { SendToGuestsDialog } from '@/components/features/einvite/send-to-guests-dialog'
import { useExportGuestlist } from '@/hooks/queries/use-export'
import { Button } from '@/components/ui/button'
import { Paper, SketchButton, Stamp, Ico, ICONS } from '@/components/sketch'
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
import { ExportDropdown } from '@/components/common/export-dropdown'
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

const RSVP_OPTIONS: { label: string; value: RSVPStatus; tone: 'ok' | 'wait' | 'late' }[] = [
  { label: 'Pending', value: 'PENDING', tone: 'wait' },
  { label: 'Attending', value: 'ATTENDING', tone: 'ok' },
  { label: 'Declined', value: 'NOT_ATTENDING', tone: 'late' },
  { label: 'Maybe', value: 'MAYBE', tone: 'wait' },
]

function EmptyGuests({ filtered, bare }: { filtered: boolean; bare?: boolean }) {
  const Wrap = bare ? 'div' : Paper
  return (
    <Wrap className="flex flex-col items-center justify-center px-5 py-12 text-center">
      <Ico d={ICONS.guests} className="mb-3 h-12 w-12" />
      <p className="font-display text-xl font-semibold">
        {filtered ? 'No guests match your filter' : 'No guests yet'}
      </p>
      <p className="text-ink-soft mt-1 text-sm">Add your first guest to get started</p>
    </Wrap>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
}

// Get frontend URL for RSVP links
const FRONTEND_URL = typeof window !== 'undefined'
  ? window.location.origin
  : process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://omnicassion.com'

export function GuestlistPanel({ eventId }: { eventId: string }) {
  const { data, isLoading, error } = useGuestlist(eventId)
  const { data: einvite } = useEInviteByEvent(eventId)
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

  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [showSendEInviteDialog, setShowSendEInviteDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RSVPStatus | 'ALL'>('ALL')

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

  // Filter guests
  const filteredGuests = useMemo(() => {
    if (!data?.guests) return []
    return data.guests.filter((guest: Guest) => {
      const matchesSearch =
        !searchQuery ||
        guest.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        guest.phone?.includes(searchQuery)
      const matchesStatus = statusFilter === 'ALL' || guest.rsvpStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [data?.guests, searchQuery, statusFilter])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sk-paper px-5 py-8 text-center"
      >
        <p className="text-rose text-sm">Unable to load guest list.</p>
      </motion.div>
    )
  }

  if (!data) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Hero Section */}
        <Paper className="px-6 py-7">
          <div className="flex items-center gap-4">
            <Ico d={ICONS.guests} className="h-14 w-14 shrink-0" />
            <div>
              <h2 className="font-display text-2xl font-semibold">Create Your Guest List</h2>
              <p className="text-ink-soft">Track RSVPs and manage your guests</p>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <SketchButton onClick={handleCreate} disabled={createGuestlist.isPending}>
              <Plus className="h-4 w-4" />
              {createGuestlist.isPending ? 'Creating...' : 'Create Guest List'}
            </SketchButton>
          </div>
        </Paper>

        {/* Features */}
        <Paper className="px-6 py-5">
          <h3 className="font-display mb-4 flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="text-gold h-5 w-5" />
            Guest List Features
          </h3>
          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: UserPlus, title: 'Add Guests', desc: 'Manually add guests or import from CSV' },
                { icon: Link2, title: 'RSVP Links', desc: 'Unique links for each guest to respond' },
                { icon: MessageCircle, title: 'WhatsApp Integration', desc: 'Share invites via WhatsApp' },
                { icon: Send, title: 'E-Invite Integration', desc: 'Send digital invitations' },
              ].map((feature, i) => (
                <div key={i} className="border-line flex items-start gap-3 border-b-2 border-dashed py-3">
                  <div className="bg-blue-wash text-blue flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-ink-soft text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Paper>
      </motion.div>
    )
  }

  const stats = {
    total: data.guests?.length ?? 0,
    attending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'ATTENDING').length ?? 0,
    notAttending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'NOT_ATTENDING').length ?? 0,
    pending: data.guests?.filter((g: Guest) => g.rsvpStatus === 'PENDING').length ?? 0,
    maybe: data.guests?.filter((g: Guest) => g.rsvpStatus === 'MAYBE').length ?? 0,
    totalPlusOnes: data.guests?.reduce((sum: number, g: Guest) => sum + (g.plusOne || 0), 0) ?? 0,
  }

  const guestsMissingTokens = data.guests?.filter((g: Guest) => !g.rsvpToken).length ?? 0

  const handleGenerateTokens = async () => {
    try {
      const result = await generateTokens.mutateAsync()
      toast.success(`Generated RSVP links for ${result.updated} guests`)
    } catch (err) {
      toast.error('Failed to generate RSVP links')
    }
  }

  const getRsvpOption = (status: RSVPStatus) => RSVP_OPTIONS.find(o => o.value === status) || RSVP_OPTIONS[0]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* View Toggle & Actions */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex gap-2">
            <SketchButton
              size="sm"
              variant={viewMode === 'card' ? 'solid' : 'line'}
              onClick={() => setViewMode('card')}
              aria-pressed={viewMode === 'card'}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Card View
            </SketchButton>
            <SketchButton
              size="sm"
              variant={viewMode === 'list' ? 'solid' : 'line'}
              onClick={() => setViewMode('list')}
              aria-pressed={viewMode === 'list'}
            >
              <ListIcon className="h-3.5 w-3.5" />
              List View
            </SketchButton>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ExportDropdown
              type="guestlist"
              id={data.id}
              filename="guestlist"
              onExport={async (format) => {
                await exportGuestlist.mutateAsync({ id: data.id, format })
              }}
              disabled={exportGuestlist.isPending}
            />
            <SketchButton size="sm" variant="line" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4" />
              Import
            </SketchButton>
            <SketchButton size="sm" onClick={() => setShowAddGuestDialog(true)}>
              <Plus className="h-4 w-4" />
              Add Guest
            </SketchButton>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="sk-pill flex-1 sm:max-w-xs">
            <Search className="text-ink-soft h-4 w-4 shrink-0" />
            <input
              placeholder="Search guests..."
              aria-label="Search guests"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as RSVPStatus | 'ALL')}>
            <SelectTrigger className="w-40">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              {RSVP_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Warning: Guests Missing RSVP Links */}
      {guestsMissingTokens > 0 && (
        <motion.div variants={itemVariants}>
          <Paper alt className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-gold h-5 w-5 shrink-0" />
              <div>
                <p className="font-medium">
                  {guestsMissingTokens} guest{guestsMissingTokens > 1 ? 's' : ''} missing RSVP link
                </p>
                <p className="text-ink-soft text-sm">Generate links to enable sharing.</p>
              </div>
            </div>
            <SketchButton variant="line" size="sm" onClick={handleGenerateTokens} disabled={generateTokens.isPending}>
              <Link2 className="h-4 w-4" />
              {generateTokens.isPending ? 'Generating...' : 'Generate Links'}
            </SketchButton>
          </Paper>
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Paper className="px-5 py-4">
            <div className="mb-3">
              <h3 className="font-display text-xl font-semibold">Guests</h3>
              <p className="text-ink-soft text-xs">
                {filteredGuests.length} of {stats.total} guests
              </p>
            </div>
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="sk-eyebrow border-ink/40 grid grid-cols-12 border-b-2 px-3 py-2">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Contact</div>
                  <div className="col-span-2">RSVP</div>
                  <div className="col-span-1">+1s</div>
                  <div className="col-span-3 text-right">Actions</div>
                </div>

                <AnimatePresence mode="popLayout">
                  {filteredGuests.map((guest: Guest) => {
                    const rsvpOpt = getRsvpOption(guest.rsvpStatus)
                    return (
                      <motion.div
                        key={guest.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-line grid grid-cols-12 items-center gap-2 border-b-2 border-dashed px-3 py-2.5 text-sm"
                      >
                        <div className="col-span-3 min-w-0">
                          <p className="truncate font-medium">{guest.firstName} {guest.lastName ?? ''}</p>
                        </div>
                        <div className="text-ink-soft col-span-3 truncate text-xs">
                          {guest.email || guest.phone || '-'}
                        </div>
                        <div className="col-span-2">
                          <Stamp tone={rsvpOpt.tone}>{rsvpOpt.label}</Stamp>
                        </div>
                        <div className="col-span-1 text-xs">{guest.plusOne || 0}</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          <SketchButton variant="ghost" size="icon" onClick={() => copyRsvpLink(guest.rsvpToken)} title="Copy link" aria-label="Copy RSVP link">
                            <Copy className="h-3.5 w-3.5" />
                          </SketchButton>
                          <SketchButton variant="ghost" size="icon" onClick={() => shareViaWhatsApp(guest)} title="WhatsApp" aria-label="Share via WhatsApp">
                            <MessageCircle className="text-leaf-deep h-3.5 w-3.5" />
                          </SketchButton>
                          <SketchButton variant="ghost" size="icon" onClick={() => deleteGuest.mutate(guest.id)} title="Delete guest" aria-label="Delete guest">
                            <Trash2 className="text-rose h-3.5 w-3.5" />
                          </SketchButton>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-2">
                <AnimatePresence mode="popLayout">
                  {filteredGuests.map((guest: Guest) => {
                    const rsvpOpt = getRsvpOption(guest.rsvpStatus)
                    return (
                      <motion.div
                        key={guest.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-line border-b-2 border-dashed py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-medium">{guest.firstName} {guest.lastName ?? ''}</p>
                              <Stamp tone={rsvpOpt.tone}>{rsvpOpt.label}</Stamp>
                            </div>
                            {(guest.email || guest.phone) && (
                              <p className="text-ink-soft mt-0.5 text-xs break-all">{guest.email || guest.phone}</p>
                            )}
                            {guest.plusOne > 0 && (
                              <p className="text-ink-soft mt-1 text-xs">+{guest.plusOne} guest{guest.plusOne > 1 ? 's' : ''}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <SketchButton variant="ghost" size="icon" onClick={() => copyRsvpLink(guest.rsvpToken)} aria-label="Copy RSVP link">
                              <Copy className="h-4 w-4" />
                            </SketchButton>
                            <SketchButton variant="ghost" size="icon" onClick={() => shareViaWhatsApp(guest)} aria-label="Share via WhatsApp">
                              <MessageCircle className="text-leaf-deep h-4 w-4" />
                            </SketchButton>
                            <SketchButton variant="ghost" size="icon" onClick={() => deleteGuest.mutate(guest.id)} aria-label="Delete guest">
                              <Trash2 className="text-rose h-4 w-4" />
                            </SketchButton>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {filteredGuests.length === 0 && (
                <EmptyGuests bare filtered={Boolean(searchQuery) || statusFilter !== 'ALL'} />
              )}
            </div>
          </Paper>
        </motion.div>
      ) : (
        /* Card View - Grid Layout */
        <motion.div variants={itemVariants}>
          {filteredGuests.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredGuests.map((guest: Guest) => {
                  const rsvpOpt = getRsvpOption(guest.rsvpStatus)

                  return (
                    <motion.div
                      key={guest.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ y: -2 }}
                      className="sk-paper group relative px-3.5 py-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-1">
                        <Stamp tone={rsvpOpt.tone}>{rsvpOpt.label}</Stamp>
                        <div className="-mt-1 -mr-1 flex items-center gap-0.5">
                          <SketchButton variant="ghost" size="icon" onClick={() => copyRsvpLink(guest.rsvpToken)} aria-label="Copy RSVP link">
                            <Copy className="h-3 w-3" />
                          </SketchButton>
                          <SketchButton variant="ghost" size="icon" onClick={() => shareViaWhatsApp(guest)} aria-label="Share via WhatsApp">
                            <MessageCircle className="text-leaf-deep h-3 w-3" />
                          </SketchButton>
                          <SketchButton variant="ghost" size="icon" onClick={() => deleteGuest.mutate(guest.id)} aria-label="Delete guest">
                            <Trash2 className="text-rose h-3 w-3" />
                          </SketchButton>
                        </div>
                      </div>

                      <p className="font-display line-clamp-1 text-base leading-tight font-semibold">
                        {guest.firstName} {guest.lastName ?? ''}
                      </p>

                      <div className="border-line mt-2 border-t-2 border-dashed pt-2">
                        {(guest.email || guest.phone) && (
                          <p className="text-ink-soft line-clamp-1 text-[11px]">
                            {guest.email || guest.phone}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between">
                          {guest.plusOne > 0 ? (
                            <span className="text-ink-soft text-[11px]">
                              +{guest.plusOne} guest{guest.plusOne > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-ink-soft text-[11px]">No +1</span>
                          )}
                          {guest.rsvpAt && (
                            <span className="text-ink-soft flex items-center gap-0.5 text-[11px]">
                              <Clock className="h-2.5 w-2.5" />
                              {format(new Date(guest.rsvpAt), 'MMM d')}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <EmptyGuests filtered={Boolean(searchQuery) || statusFilter !== 'ALL'} />
          )}
        </motion.div>
      )}

      {/* E-Invite & WhatsApp Integration */}
      <motion.div variants={itemVariants}>
        <WhatsAppInvitePanel guestlistId={data.id} guests={data.guests ?? []} />
      </motion.div>

      {/* Add Guest Dialog */}
      <Dialog open={showAddGuestDialog} onOpenChange={setShowAddGuestDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add guest</DialogTitle>
            <DialogDescription>Add a guest to this event guest list.</DialogDescription>
          </DialogHeader>
          <Form {...guestForm}>
            <form onSubmit={guestForm.handleSubmit(onAddGuest)} className="grid gap-4 md:grid-cols-2">
              <FormField control={guestForm.control} name="firstName" render={({ field }) => (
                <FormItem>
                  <FormLabel>First name</FormLabel>
                  <FormControl><Input placeholder="Simran" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={guestForm.control} name="lastName" render={({ field }) => (
                <FormItem>
                  <FormLabel>Last name</FormLabel>
                  <FormControl><Input placeholder="Kaur" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={guestForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input placeholder="guest@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={guestForm.control} name="phone" render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl><Input placeholder="+91 90000 00000" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={guestForm.control} name="plusOne" render={({ field }) => (
                <FormItem>
                  <FormLabel>Plus ones</FormLabel>
                  <FormControl><Input type="number" min={0} placeholder="0" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="md:col-span-2">
                <Button type="button" variant="outline" onClick={() => setShowAddGuestDialog(false)}>Cancel</Button>
                <Button type="submit" disabled={addGuest.isPending}>
                  <Plus className="mr-2 h-4 w-4" />
                  {addGuest.isPending ? 'Adding...' : 'Add guest'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={(open) => { setShowImportDialog(open); if (!open) setImportResult(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Import Guests from CSV
            </DialogTitle>
            <DialogDescription>Upload a CSV file to bulk import guests.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="border-line flex items-center justify-between gap-3 border-b-2 border-dashed pb-4">
              <div>
                <p className="text-sm font-medium">CSV Template</p>
                <p className="text-ink-soft text-xs">Download to see the required format</p>
              </div>
              <SketchButton variant="line" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4" />
                Download
              </SketchButton>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Upload CSV File</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                    <p className="mb-1 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span></p>
                    <p className="text-xs text-muted-foreground">CSV files only</p>
                  </div>
                  <input type="file" className="hidden" accept=".csv" onChange={handleFileImport} disabled={importGuests.isPending} />
                </label>
              </div>
            </div>
            {importResult && (
              <div className="space-y-3 rounded-lg border p-4">
                <h4 className="font-medium text-sm">Import Results</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-blue-wash rounded-lg p-2">
                    <div className="font-display text-leaf-deep text-lg font-bold">{importResult.imported}</div>
                    <div className="text-ink-soft text-xs">Imported</div>
                  </div>
                  <div className="bg-blue-wash rounded-lg p-2">
                    <div className="font-display text-gold text-lg font-bold">{importResult.skipped}</div>
                    <div className="text-ink-soft text-xs">Skipped</div>
                  </div>
                  <div className="bg-blue-wash rounded-lg p-2">
                    <div className="font-display text-rose text-lg font-bold">{importResult.errors.length}</div>
                    <div className="text-ink-soft text-xs">Errors</div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowImportDialog(false); setImportResult(null) }}>
              {importResult ? 'Done' : 'Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send E-Invite Dialog */}
      {einvite && (
        <SendToGuestsDialog
          open={showSendEInviteDialog}
          onOpenChange={setShowSendEInviteDialog}
          einviteId={einvite.id}
          eventId={eventId}
          shareCode={einvite.shareCode}
          eventName={einvite.eventName}
        />
      )}
    </motion.div>
  )
}
