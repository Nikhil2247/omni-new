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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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

const RSVP_OPTIONS: { label: string; value: RSVPStatus; color: string; bgColor: string }[] = [
  { label: 'Pending', value: 'PENDING', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-800' },
  { label: 'Attending', value: 'ATTENDING', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  { label: 'Declined', value: 'NOT_ATTENDING', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  { label: 'Maybe', value: 'MAYBE', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
]

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
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl border-2 border-dashed border-destructive/50 bg-destructive/5 p-8 text-center"
      >
        <p className="text-sm text-destructive">Unable to load guest list.</p>
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
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-950/30 dark:via-purple-950/30 dark:to-fuchsia-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Create Your Guest List</h1>
                <p className="text-muted-foreground">Track RSVPs and manage your guests</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleCreate} disabled={createGuestlist.isPending}>
                <Plus className="mr-2 h-4 w-4" />
                {createGuestlist.isPending ? 'Creating...' : 'Create Guest List'}
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              Guest List Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: UserPlus, title: 'Add Guests', desc: 'Manually add guests or import from CSV' },
                { icon: Link2, title: 'RSVP Links', desc: 'Unique links for each guest to respond' },
                { icon: MessageCircle, title: 'WhatsApp Integration', desc: 'Share invites via WhatsApp' },
                { icon: Send, title: 'E-Invite Integration', desc: 'Send digital invitations' },
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <feature.icon className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
          <div className="inline-flex rounded-xl border bg-background p-1 shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              onClick={() => setViewMode('card')}
              className="h-8 gap-1.5 px-3"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Card View
            </Button>
            <Button
              type="button"
              size="sm"
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              onClick={() => setViewMode('list')}
              className="h-8 gap-1.5 px-3"
            >
              <ListIcon className="h-3.5 w-3.5" />
              List View
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <ExportDropdown
              type="guestlist"
              id={data.id}
              filename="guestlist"
              onExport={async (format) => {
                await exportGuestlist.mutateAsync({ id: data.id, format })
              }}
              disabled={exportGuestlist.isPending}
            />
            <Button size="sm" variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button size="sm" onClick={() => setShowAddGuestDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Guest
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Search & Filter */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
          <div className="flex items-center justify-between rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">
                  {guestsMissingTokens} guest{guestsMissingTokens > 1 ? 's' : ''} missing RSVP link
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Generate links to enable sharing.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleGenerateTokens} disabled={generateTokens.isPending}>
              <Link2 className="mr-2 h-4 w-4" />
              {generateTokens.isPending ? 'Generating...' : 'Generate Links'}
            </Button>
          </div>
        </motion.div>
      )}

      {/* List View */}
      {viewMode === 'list' ? (
        <motion.div variants={itemVariants}>
          <Card className="border-muted/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Guests</CardTitle>
              <CardDescription className="text-xs">
                {filteredGuests.length} of {stats.total} guests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-lg border border-muted/60">
                <div className="grid grid-cols-12 bg-muted/50 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
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
                        className="grid grid-cols-12 items-center gap-2 border-t px-3 py-2 text-sm hover:bg-muted/40"
                      >
                        <div className="col-span-3 min-w-0">
                          <p className="truncate font-medium">{guest.firstName} {guest.lastName ?? ''}</p>
                        </div>
                        <div className="col-span-3 text-xs text-muted-foreground truncate">
                          {guest.email || guest.phone || '-'}
                        </div>
                        <div className="col-span-2">
                          <Badge className={`${rsvpOpt.bgColor} ${rsvpOpt.color} text-[10px]`}>
                            {rsvpOpt.label}
                          </Badge>
                        </div>
                        <div className="col-span-1 text-xs">{guest.plusOne || 0}</div>
                        <div className="col-span-3 flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyRsvpLink(guest.rsvpToken)} title="Copy link">
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => shareViaWhatsApp(guest)} title="WhatsApp">
                            <MessageCircle className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteGuest.mutate(guest.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
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
                        className="rounded-lg border p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm">{guest.firstName} {guest.lastName ?? ''}</p>
                              <Badge className={`${rsvpOpt.bgColor} ${rsvpOpt.color} text-[10px]`}>
                                {rsvpOpt.label}
                              </Badge>
                            </div>
                            {(guest.email || guest.phone) && (
                              <p className="text-xs text-muted-foreground mt-0.5">{guest.email || guest.phone}</p>
                            )}
                            {guest.plusOne > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">+{guest.plusOne} guest{guest.plusOne > 1 ? 's' : ''}</p>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyRsvpLink(guest.rsvpToken)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => shareViaWhatsApp(guest)}>
                              <MessageCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteGuest.mutate(guest.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {filteredGuests.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {searchQuery || statusFilter !== 'ALL' ? 'No guests match your filter' : 'No guests yet'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Add your first guest to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        /* Card View - Grid Layout */
        <motion.div variants={itemVariants}>
          {filteredGuests.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              <AnimatePresence mode="popLayout">
                {filteredGuests.map((guest: Guest) => {
                  const rsvpOpt = getRsvpOption(guest.rsvpStatus)
                  const isAttending = guest.rsvpStatus === 'ATTENDING'
                  const isDeclined = guest.rsvpStatus === 'NOT_ATTENDING'

                  return (
                    <motion.div
                      key={guest.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className={`group relative rounded-xl border p-3 transition-all ${
                        isAttending
                          ? 'border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-900/30 dark:from-green-950/30 dark:to-emerald-950/20'
                          : isDeclined
                          ? 'border-red-200 bg-gradient-to-br from-red-50 to-orange-50 dark:border-red-900/30 dark:from-red-950/30 dark:to-orange-950/20'
                          : 'bg-card hover:border-primary/50 hover:shadow-lg'
                      }`}
                    >
                      <div className="absolute right-2 top-2 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyRsvpLink(guest.rsvpToken)}
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => shareViaWhatsApp(guest)}
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <MessageCircle className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteGuest.mutate(guest.id)}
                          className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>

                      <div className="pr-20">
                        <Badge className={`mb-2 ${rsvpOpt.bgColor} ${rsvpOpt.color} text-[10px] px-1.5 py-0`}>
                          {rsvpOpt.label}
                        </Badge>
                        <p className="text-sm font-medium line-clamp-1 leading-tight">
                          {guest.firstName} {guest.lastName ?? ''}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-muted/50">
                        {(guest.email || guest.phone) && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {guest.email || guest.phone}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          {guest.plusOne > 0 ? (
                            <span className="text-[10px] text-muted-foreground">
                              +{guest.plusOne} guest{guest.plusOne > 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground">No +1</span>
                          )}
                          {guest.rsvpAt && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  {searchQuery || statusFilter !== 'ALL' ? 'No guests match your filter' : 'No guests yet'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Add your first guest to get started</p>
              </CardContent>
            </Card>
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
