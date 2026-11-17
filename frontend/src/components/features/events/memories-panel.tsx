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
import { Brush, Eyebrow, Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
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
import {
  Clock,
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
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="sk-paper px-6 py-8 text-center"
        role="alert"
      >
        <p className="text-rose text-sm font-bold">
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
        <Paper tape className="px-6 py-8 sm:px-8">
          <Ico d={ICONS.gallery} className="mb-3 h-12 w-12" />
          <Eyebrow>Guest memories</Eyebrow>
          <h2 className="font-display mt-2 text-[clamp(1.6rem,3.6vw,2.2rem)] leading-[1.05] font-semibold tracking-tight">
            Create your <Brush>Memory</Brush> Wall
          </h2>
          <p className="text-ink-soft mt-2 mb-5 max-w-xl">
            Create a memory wall where guests can upload and share photos and videos from your event
          </p>
          <div>
            <SketchButton onClick={() => setShowCreateMemoryDialog(true)}>
              Create Memory Wall
            </SketchButton>

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
                        <FormItem className="border-line flex items-center justify-between rounded-lg border-2 border-dashed p-4">
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
                        <FormItem className="border-line flex items-center justify-between rounded-lg border-2 border-dashed p-4">
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
                        <FormItem className="border-line flex items-center justify-between rounded-lg border-2 border-dashed p-4">
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
          </div>
        </Paper>
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
        <Paper tape className="space-y-4 px-5 py-5">
          <h2 className="font-display flex items-center gap-2 text-lg font-semibold">
            <Ico d={ICONS.gallery} className="h-5 w-5" />
            Guest Upload Link
          </h2>
          <div className="flex items-center gap-2">
            <Input
              value={guestUrl}
              readOnly
              aria-label="Guest upload link"
              className="font-mono text-xs"
            />
            <SketchButton size="icon" variant="line" onClick={copyGuestLink} aria-label="Copy guest link">
              <Copy className="h-4 w-4" />
            </SketchButton>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="sk-paper sk-paper--alt shrink-0 bg-white p-3">
              <QRCodeReact
                value={guestUrl}
                size={100}
                level="H"
              />
            </div>
            <div className="min-w-0 flex-1 basis-40 space-y-2">
              <p className="text-ink-soft text-xs">
                Guests can scan this QR code to upload photos and view the gallery.
              </p>
              <SketchButton size="sm" variant="line" onClick={downloadQRCode}>
                <Download className="h-3.5 w-3.5" />
                Download QR
              </SketchButton>
            </div>
          </div>
        </Paper>

        {/* Settings Overview Card */}
        <Paper className="px-5 py-5">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Settings</h2>
            <Stamp tone={data.isActive ? 'ok' : 'wait'}>
              {data.isActive ? 'Active' : 'Inactive'}
            </Stamp>
          </div>
          <div>
            <div className="border-line flex items-center gap-3 border-b-2 border-dashed py-3">
              <Upload className="text-blue h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="sk-eyebrow">Uploads</p>
                <p className="text-sm font-bold">{data.allowUploads ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            <div className="border-line flex items-center gap-3 border-b-2 border-dashed py-3">
              <Shield className="text-blue h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="sk-eyebrow">Approval</p>
                <p className="text-sm font-bold">{data.requireApproval ? 'Required' : 'Auto-approve'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <Clock className="text-blue h-4 w-4 shrink-0" aria-hidden="true" />
              <div>
                <p className="sk-eyebrow">Expires</p>
                <p className="text-sm font-bold">
                  {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </Paper>
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
          <h2 className="font-display text-2xl font-semibold">
            Guest <Brush>Uploads</Brush>
          </h2>
          {requireApproval && pendingCount && pendingCount.pendingCount > 0 && (
            <Stamp tone="wait">
              {pendingCount.pendingCount} Pending
            </Stamp>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SketchButton
            size="sm"
            variant={viewMode === 'card' ? 'solid' : 'ghost'}
            aria-pressed={viewMode === 'card'}
            onClick={() => setViewMode('card')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Card View
          </SketchButton>
          <SketchButton
            size="sm"
            variant={viewMode === 'list' ? 'solid' : 'ghost'}
            aria-pressed={viewMode === 'list'}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List View
          </SketchButton>
        </div>
      </div>

      {/* Tabs */}
      {requireApproval && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter uploads">
          {(
            [
              ['all', 'All'],
              ['pending', 'Pending Review'],
              ['approved', 'Approved'],
            ] as const
          ).map(([key, label]) => (
            <SketchButton
              key={key}
              size="sm"
              variant={activeTab === key ? 'solid' : 'line'}
              aria-pressed={activeTab === key}
              onClick={() => setActiveTab(key)}
            >
              {label}
              {key === 'pending' && pendingCount && pendingCount.pendingCount > 0 && (
                <span className="font-hand text-base">({pendingCount.pendingCount})</span>
              )}
            </SketchButton>
          ))}
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {[...Array(10)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }

  if (!uploads?.uploads?.length) {
    return (
      <Paper alt className="px-6 py-14 text-center">
        <Ico d={ICONS.gallery} className="mx-auto mb-3 h-12 w-12" />
        <p className="font-display text-xl font-semibold">No uploads yet</p>
        <p className="text-ink-soft mt-1 text-sm">
          Share the QR code with guests to start collecting memories
        </p>
      </Paper>
    )
  }

  if (viewMode === 'list') {
    return (
      <>
        <Paper className="p-0">
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-hidden">
              <div className="sk-eyebrow border-line grid grid-cols-12 border-b-2 border-dashed px-4 py-3">
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
                    className="border-line grid grid-cols-12 items-center gap-2 border-b-2 border-dashed px-4 py-3 last:border-0 hover:bg-blue-wash/20"
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
                      <p className="text-[10px] text-ink-soft">
                        {new Date(upload.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-4 text-sm text-ink-soft truncate">
                      {upload.caption || '-'}
                    </div>
                    <div className="col-span-2">
                      <Stamp tone={upload.status === 'APPROVED' ? 'ok' : upload.status === 'PENDING' ? 'wait' : 'late'}>{upload.status}</Stamp>
                    </div>
                    <div className="col-span-2 flex justify-end gap-1">
                      {upload.status === 'PENDING' && (
                        <>
                          <SketchButton
                            variant="ghost"
                            size="icon"
                            aria-label="Approve"
                            onClick={() => approveUpload.mutate(upload.id)}
                          >
                            <CheckCircle2 className="text-leaf-deep h-3.5 w-3.5" />
                          </SketchButton>
                          <SketchButton
                            variant="ghost"
                            size="icon"
                            aria-label="Reject"
                            onClick={() => rejectUpload.mutate(upload.id)}
                          >
                            <AlertCircle className="text-gold h-3.5 w-3.5" />
                          </SketchButton>
                        </>
                      )}
                      <SketchButton
                        variant="ghost"
                        size="icon"
                        aria-label="Delete"
                        onClick={() => deleteUpload.mutate(upload.id)}
                      >
                        <Trash2 className="text-rose h-3.5 w-3.5" />
                      </SketchButton>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden">
              <AnimatePresence mode="popLayout">
                {uploads.uploads.map((upload, index) => (
                  <motion.div
                    key={upload.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-line border-b-2 border-dashed p-4 last:border-0"
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
                            <p className="text-[10px] text-ink-soft">
                              {new Date(upload.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Stamp tone={upload.status === 'APPROVED' ? 'ok' : upload.status === 'PENDING' ? 'wait' : 'late'}>{upload.status}</Stamp>
                        </div>
                        {upload.caption && (
                          <p className="text-xs text-ink-soft mt-1 line-clamp-2">{upload.caption}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2">
                          {upload.status === 'PENDING' && (
                            <>
                              <SketchButton
                                variant="line"
                                size="sm"
                                onClick={() => approveUpload.mutate(upload.id)}
                              >
                                <CheckCircle2 className="h-3 w-3" />
                                Approve
                              </SketchButton>
                              <SketchButton
                                variant="line"
                                size="sm"
                                onClick={() => rejectUpload.mutate(upload.id)}
                              >
                                <AlertCircle className="h-3 w-3" />
                                Reject
                              </SketchButton>
                            </>
                          )}
                          <SketchButton
                            variant="ghost"
                            size="icon"
                            className="ml-auto"
                            aria-label="Delete"
                            onClick={() => deleteUpload.mutate(upload.id)}
                          >
                            <Trash2 className="text-rose h-3.5 w-3.5" />
                          </SketchButton>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </Paper>

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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <AnimatePresence mode="popLayout">
          {uploads.uploads.map((upload, index) => {
            const isPending = upload.status === 'PENDING'

            return (
              <motion.div
                key={upload.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ scale: 1.02, y: -2 }}
                className="sk-paper group relative overflow-hidden p-2"
              >
                {/* Image */}
                <button
                  type="button"
                  onClick={() => openLightbox(index)}
                  aria-label={upload.caption ? `Open photo: ${upload.caption}` : 'Open photo'}
                  className="bg-muted relative aspect-square w-full overflow-hidden rounded-md"
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
                <div className="absolute top-3.5 left-3.5">
                  <Stamp tone={upload.status === 'APPROVED' ? 'ok' : upload.status === 'PENDING' ? 'wait' : 'late'}>{upload.status}</Stamp>
                </div>

                {/* Action Buttons (always visible on touch, on hover/focus from sm up) */}
                <div className="absolute top-3.5 right-3.5 flex items-center gap-1 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {isPending && (
                    <>
                      <SketchButton
                        variant="line"
                        size="icon"
                        onClick={() => approveUpload.mutate(upload.id)}
                        aria-label="Approve"
                        className="bg-card !px-2 !py-1"
                      >
                        <CheckCircle2 className="text-leaf-deep h-3.5 w-3.5" />
                      </SketchButton>
                      <SketchButton
                        variant="line"
                        size="icon"
                        onClick={() => rejectUpload.mutate(upload.id)}
                        aria-label="Reject"
                        className="bg-card !px-2 !py-1"
                      >
                        <AlertCircle className="text-gold h-3.5 w-3.5" />
                      </SketchButton>
                    </>
                  )}
                  <SketchButton
                    variant="line"
                    size="icon"
                    onClick={() => deleteUpload.mutate(upload.id)}
                    aria-label="Delete"
                    className="bg-card !px-2 !py-1"
                  >
                    <Trash2 className="text-rose h-3.5 w-3.5" />
                  </SketchButton>
                </div>

                {/* Info Footer */}
                <div className="px-1 pt-2 pb-0.5">
                  <p className="truncate text-xs font-bold">
                    {upload.uploaderName || 'Anonymous'}
                  </p>
                  {upload.caption && (
                    <p className="text-ink-soft mt-0.5 truncate text-[11px]">
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
              <Stamp tone={currentUpload.status === 'APPROVED' ? 'ok' : currentUpload.status === 'PENDING' ? 'wait' : 'late'}>{currentUpload.status}</Stamp>
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
