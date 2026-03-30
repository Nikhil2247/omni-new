'use client'

import { useState, useRef } from 'react'
import NextImage from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import QRCodeReact from 'react-qr-code'
import QRCodeGen from 'qrcode'
import { useCreateMemory, useMemories } from '@/hooks/queries/use-memories'
import {
  useGuestUploads,
  usePendingUploadCount,
  useApproveUpload,
  useRejectUpload,
  useDeleteGuestUpload,
} from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  ImageIcon,
  Clock,
  QrCode,
  Copy,
  CheckCircle2,
  AlertCircle,
  Upload,
  Shield,
  Download,
  LayoutGrid,
  List as ListIcon,
  Trash2,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

const memorySchema = z.object({
  isActive: z.boolean(),
  allowUploads: z.boolean(),
  requireApproval: z.boolean(),
  expiresAt: z.string().optional(),
})

type MemoryValues = z.infer<typeof memorySchema>

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

export function MemoriesPanel({ eventId }: { eventId: string }) {
  const [showCreateMemoryDialog, setShowCreateMemoryDialog] = useState(false)
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card')
  const { data, isLoading, error } = useMemories(eventId)
  const createMemory = useCreateMemory()

  const form = useForm<MemoryValues>({
    resolver: zodResolver(memorySchema),
    defaultValues: {
      isActive: true,
      allowUploads: true,
      requireApproval: false,
      expiresAt: '',
    },
  })

  const onCreate = async (values: MemoryValues) => {
    try {
      await createMemory.mutateAsync({
        eventId,
        isActive: values.isActive,
        allowUploads: values.allowUploads,
        requireApproval: values.requireApproval,
        expiresAt: values.expiresAt || undefined,
      })
      toast.success('Memory wall created successfully!')
      setShowCreateMemoryDialog(false)
    } catch {
      toast.error('Failed to create memory wall')
    }
  }

  const copyGuestLink = () => {
    if (data?.qrCode) {
      const guestUrl = `${window.location.origin}/guest/${data.qrCode}`
      navigator.clipboard.writeText(guestUrl)
      toast.success('Guest link copied to clipboard')
    }
  }

  const downloadQRCode = async () => {
    if (!data?.qrCode) return

    try {
      const guestUrl = `${window.location.origin}/guest/${data.qrCode}`
      const qrCodeDataUrl = await QRCodeGen.toDataURL(guestUrl, {
        width: 800,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })

      const link = document.createElement('a')
      link.href = qrCodeDataUrl
      link.download = `event-qr-${data.qrCode}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('QR code downloaded successfully')
    } catch {
      toast.error('Failed to download QR code')
    }
  }

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
        <p className="text-sm text-destructive">
          Unable to load memories settings. {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </motion.div>
    )
  }

  // Show create form if no memory exists or if data is invalid (missing qrCode)
  if (!data || !data.qrCode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500">
                <ImageIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Create Memory Wall</h1>
                <p className="text-muted-foreground">Let guests share photos and videos from your event</p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enable Guest Memories</CardTitle>
            <CardDescription>
              Create a memory wall where guests can upload and share photos and videos from your event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => setShowCreateMemoryDialog(true)}>
              Create Memory Wall
            </Button>

            <Dialog open={showCreateMemoryDialog} onOpenChange={setShowCreateMemoryDialog}>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create memory wall</DialogTitle>
                  <DialogDescription>
                    Configure how guests can share photos and videos for this event.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCreate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium">Active Status</FormLabel>
                            <FormDescription>
                              Enable the memory wall for your event
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="allowUploads"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <Upload className="h-4 w-4" />
                              Allow Guest Uploads
                            </FormLabel>
                            <FormDescription>
                              Let guests upload their own photos and videos
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base font-medium flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Require Approval
                            </FormLabel>
                            <FormDescription>
                              Review uploads before they appear on the memory wall
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Expiration Date (Optional)
                          </FormLabel>
                          <FormControl>
                            <Input type="date" {...field} className="max-w-xs" />
                          </FormControl>
                          <FormDescription>
                            Set when guests can no longer upload content
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowCreateMemoryDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMemory.isPending}>
                        {createMemory.isPending ? 'Creating...' : 'Create Memory Wall'}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const guestUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/guest/${data.qrCode}`

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Settings & QR Code Row */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2">
        {/* QR Code Card */}
        <Card className="border-muted/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <QrCode className="h-4 w-4" />
              Guest Upload Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={guestUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button size="icon" variant="outline" onClick={copyGuestLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-lg border shrink-0">
                <QRCodeReact
                  value={guestUrl}
                  size={100}
                  level="H"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Guests can scan this QR code to upload photos and view the gallery.
                </p>
                <Button size="sm" variant="outline" onClick={downloadQRCode}>
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Download QR
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Settings Overview Card */}
        <Card className="border-muted/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Settings</CardTitle>
              <Badge variant={data.isActive ? 'default' : 'secondary'}>
                {data.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${data.allowUploads ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                  <Upload className={`h-4 w-4 ${data.allowUploads ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Uploads</p>
                  <p className="text-sm font-medium">{data.allowUploads ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${data.requireApproval ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <Shield className={`h-4 w-4 ${data.requireApproval ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Approval</p>
                  <p className="text-sm font-medium">{data.requireApproval ? 'Required' : 'Auto-approve'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Expires</p>
                  <p className="text-sm font-medium">
                    {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Photo Gallery & Moderation */}
      <GalleryModeration
        eventMemoryId={data.id}
        requireApproval={data.requireApproval}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
    </motion.div>
  )
}

// Gallery and Moderation Component
function GalleryModeration({
  eventMemoryId,
  requireApproval,
  viewMode,
  setViewMode
}: {
  eventMemoryId: string
  requireApproval: boolean
  viewMode: 'card' | 'list'
  setViewMode: (mode: 'card' | 'list') => void
}) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all')
  const { data: pendingCount } = usePendingUploadCount(eventMemoryId)

  return (
    <motion.div variants={itemVariants}>
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">Guest Uploads</h2>
          {requireApproval && pendingCount && pendingCount.pendingCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {pendingCount.pendingCount} Pending
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
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
      </div>

      {/* Tabs */}
      {requireApproval && (
        <div className="flex gap-2 border-b mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'pending'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Review
            {pendingCount && pendingCount.pendingCount > 0 && (
              <span className="bg-orange-100 text-orange-700 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount.pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'approved'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Approved
          </button>
        </div>
      )}

      {/* Upload Grid */}
      <UploadGrid
        memoryId={eventMemoryId}
        status={requireApproval ? activeTab : undefined}
        viewMode={viewMode}
      />
    </motion.div>
  )
}

// Upload Grid Component
function UploadGrid({
  memoryId,
  status,
  viewMode
}: {
  memoryId: string
  status?: 'all' | 'pending' | 'approved'
  viewMode: 'card' | 'list'
}) {
  const filterStatus = status === 'pending' ? 'PENDING' : status === 'approved' ? 'APPROVED' : undefined
  const { data: uploads, isLoading } = useGuestUploads(memoryId, filterStatus)
  const approveUpload = useApproveUpload(memoryId)
  const rejectUpload = useRejectUpload(memoryId)
  const deleteUpload = useDeleteGuestUpload(memoryId)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    if (uploads?.uploads) {
      setLightboxIndex((prev) => (prev + 1) % uploads.uploads.length)
    }
  }

  const prevImage = () => {
    if (uploads?.uploads) {
      setLightboxIndex((prev) => (prev - 1 + uploads.uploads.length) % uploads.uploads.length)
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    )
  }

  if (!uploads?.uploads?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border-2 border-dashed border-muted">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-100 to-pink-100 dark:from-rose-900/30 dark:to-pink-900/30">
          <ImageIcon className="h-8 w-8 text-rose-500" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No uploads yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Share the QR code with guests to start collecting memories
        </p>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <>
        <Card className="border-muted/60">
          <CardContent className="p-0">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden">
              <div className="grid grid-cols-12 bg-muted/50 px-4 py-2.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground border-b">
                <div className="col-span-1">Preview</div>
                <div className="col-span-3">Uploader</div>
                <div className="col-span-4">Caption</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <AnimatePresence mode="popLayout">
                {uploads.uploads.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-12 items-center gap-2 border-b last:border-0 px-4 py-3 hover:bg-muted/40"
                  >
                    <div className="col-span-1">
                      <button
                        onClick={() => openLightbox(index)}
                        className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted group"
                      >
                        <NextImage
                          src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                          alt={upload.caption || 'Upload'}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                          <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100" />
                        </div>
                      </button>
                    </div>
                    <div className="col-span-3 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {upload.uploaderName || 'Anonymous'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-4 text-sm text-muted-foreground truncate">
                      {upload.caption || '-'}
                    </div>
                    <div className="col-span-2">
                      <Badge
                        variant={upload.status === 'APPROVED' ? 'default' : upload.status === 'PENDING' ? 'secondary' : 'destructive'}
                        className="text-[10px]"
                      >
                        {upload.status}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      {upload.status === 'PENDING' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => approveUpload.mutate(upload.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => rejectUpload.mutate(upload.id)}
                          >
                            <AlertCircle className="h-3.5 w-3.5 text-orange-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => deleteUpload.mutate(upload.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y">
              <AnimatePresence mode="popLayout">
                {uploads.uploads.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-4"
                  >
                    <div className="flex gap-3">
                      <button
                        onClick={() => openLightbox(index)}
                        className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0"
                      >
                        <NextImage
                          src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                          alt={upload.caption || 'Upload'}
                          width={64}
                          height={64}
                          unoptimized
                          className="w-full h-full object-cover"
                        />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{upload.uploaderName || 'Anonymous'}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(upload.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge
                            variant={upload.status === 'APPROVED' ? 'default' : upload.status === 'PENDING' ? 'secondary' : 'destructive'}
                            className="text-[10px] shrink-0"
                          >
                            {upload.status}
                          </Badge>
                        </div>
                        {upload.caption && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{upload.caption}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {upload.status === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => approveUpload.mutate(upload.id)}
                              >
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => rejectUpload.mutate(upload.id)}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-auto"
                            onClick={() => deleteUpload.mutate(upload.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Lightbox */}
        <LightboxDialog
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          uploads={uploads.uploads}
          currentIndex={lightboxIndex}
          onNext={nextImage}
          onPrev={prevImage}
        />
      </>
    )
  }

  // Card View - Grid Layout
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        <AnimatePresence mode="popLayout">
          {uploads.uploads.map((upload, index) => {
            const isPending = upload.status === 'PENDING'
            const isApproved = upload.status === 'APPROVED'
            const isRejected = upload.status === 'REJECTED'

            return (
              <motion.div
                key={upload.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className={`group relative rounded-xl border overflow-hidden transition-all ${
                  isApproved
                    ? 'border-green-200 dark:border-green-900/30'
                    : isPending
                    ? 'border-orange-200 dark:border-orange-900/30'
                    : isRejected
                    ? 'border-red-200 dark:border-red-900/30'
                    : 'border-muted'
                }`}
              >
                {/* Image */}
                <button
                  onClick={() => openLightbox(index)}
                  className="w-full aspect-square bg-muted relative"
                >
                  <NextImage
                    src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                    alt={upload.caption || 'Upload'}
                    width={300}
                    height={300}
                    unoptimized
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                    <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg" />
                  </div>
                </button>

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                  <Badge
                    variant={isApproved ? 'default' : isPending ? 'secondary' : 'destructive'}
                    className="text-[9px] px-1.5 py-0 shadow-sm"
                  >
                    {upload.status}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isPending && (
                    <>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => approveUpload.mutate(upload.id)}
                        className="h-6 w-6 bg-white/90 hover:bg-green-100"
                      >
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => rejectUpload.mutate(upload.id)}
                        className="h-6 w-6 bg-white/90 hover:bg-orange-100"
                      >
                        <AlertCircle className="h-3 w-3 text-orange-600" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => deleteUpload.mutate(upload.id)}
                    className="h-6 w-6 bg-white/90 hover:bg-red-100"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>

                {/* Info Footer */}
                <div className="p-2 bg-card">
                  <p className="text-[10px] font-medium truncate">
                    {upload.uploaderName || 'Anonymous'}
                  </p>
                  {upload.caption && (
                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">
                      {upload.caption}
                    </p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Lightbox */}
      <LightboxDialog
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        uploads={uploads.uploads}
        currentIndex={lightboxIndex}
        onNext={nextImage}
        onPrev={prevImage}
      />
    </>
  )
}

// Lightbox Dialog Component
function LightboxDialog({
  open,
  onOpenChange,
  uploads,
  currentIndex,
  onNext,
  onPrev,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  uploads: any[]
  currentIndex: number
  onNext: () => void
  onPrev: () => void
}) {
  const currentUpload = uploads[currentIndex]

  if (!currentUpload) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0 rounded-xl overflow-hidden">
        <div className="relative">
          <NextImage
            src={getMinioViewUrl(currentUpload.mediaUrl) || ''}
            alt={currentUpload.caption || 'Photo'}
            width={1200}
            height={900}
            unoptimized
            className="w-full h-auto max-h-[85vh] object-contain"
          />

          {uploads.length > 1 && (
            <>
              <Button
                size="icon"
                variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={onPrev}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={onNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center gap-2">
              <Badge
                variant={currentUpload.status === 'APPROVED' ? 'default' : currentUpload.status === 'PENDING' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {currentUpload.status}
              </Badge>
              {currentUpload.uploaderName && (
                <span className="text-white/70 text-xs">by {currentUpload.uploaderName}</span>
              )}
            </div>
            {currentUpload.caption && (
              <p className="text-white text-sm mt-1">{currentUpload.caption}</p>
            )}
            <p className="text-white/40 text-[10px] mt-1">
              {currentIndex + 1} / {uploads.length}
            </p>
          </div>

          <Button
            size="icon"
            variant="ghost"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
