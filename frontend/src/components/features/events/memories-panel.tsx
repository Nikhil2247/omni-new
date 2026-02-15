'use client'

import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
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
} from 'lucide-react'
import { toast } from 'sonner'

const memorySchema = z.object({
  isActive: z.boolean(),
  allowUploads: z.boolean(),
  requireApproval: z.boolean(),
  expiresAt: z.string().optional(),
})

type MemoryValues = z.infer<typeof memorySchema>

export function MemoriesPanel({ eventId }: { eventId: string }) {
  const [showCreateMemoryDialog, setShowCreateMemoryDialog] = useState(false)
  const { data, isLoading, error } = useMemories(eventId)
  const createMemory = useCreateMemory()

  // Debug logging
  console.log('MemoriesPanel render:', { eventId, isLoading, error, data, hasData: !!data, qrCode: data?.qrCode })

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
    console.log('onCreate called with:', values)
    try {
      console.log('Calling createMemory.mutateAsync...')
      const result = await createMemory.mutateAsync({
        eventId,
        isActive: values.isActive,
        allowUploads: values.allowUploads,
        requireApproval: values.requireApproval,
        expiresAt: values.expiresAt || undefined,
      })
      console.log('Created memory result:', result)
      console.log('QR Code from result:', result?.qrCode)
      toast.success('Memory wall created successfully!')
      setShowCreateMemoryDialog(false)
    } catch (err) {
      console.error('Failed to create memory:', err)
      toast.error('Failed to create memory wall')
    }
  }

  const copyGuestLink = () => {
    console.log('copyGuestLink called, data:', data)
    if (data?.qrCode) {
      const guestUrl = `${window.location.origin}/guest/${data.qrCode}`
      console.log('Copying guest URL:', guestUrl)
      navigator.clipboard.writeText(guestUrl)
      toast.success('Guest link copied to clipboard')
    } else {
      console.error('No qrCode in data:', data)
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
    } catch (error) {
      console.error('Failed to download QR code:', error)
      toast.error('Failed to download QR code')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error) {
    console.error('Memories error:', error)
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">
          Unable to load memories settings. {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    )
  }

  // Show create form if no memory exists or if data is invalid (missing qrCode)
  if (!data || !data.qrCode) {
    console.log('No memory data or missing qrCode, showing create form', { data })
    return (
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-purple-500">
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
      </div>
    )
  }

  const guestUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/guest/${data.qrCode}`

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-pink-950/30 dark:via-purple-950/30 dark:to-blue-950/30 p-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-purple-500">
                <ImageIcon className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Event Memories</h1>
                <p className="text-muted-foreground">Guests can share photos and videos</p>
              </div>
            </div>
            <Badge variant={data.isActive ? 'default' : 'secondary'} className="text-base px-4 py-2">
              {data.isActive ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Active
                </>
              ) : (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Inactive
                </>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Guest Upload Link & QR Code */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Guest Upload Link & QR Code
          </CardTitle>
          <CardDescription>
            Share this link or QR code with your guests so they can upload photos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Link with Copy Button */}
          <div>
            <label className="text-sm font-medium mb-2 block">Share Link</label>
            <div className="flex items-center gap-2">
              <Input
                value={guestUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button size="icon" variant="outline" onClick={copyGuestLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* QR Code Preview */}
          <div>
            <label className="text-sm font-medium mb-2 block">QR Code</label>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {/* QR Code Display */}
              <div className="bg-white p-4 rounded-lg border">
                <QRCodeReact
                  value={guestUrl}
                  size={200}
                  level="H"
                  className="w-full h-auto"
                />
              </div>
              
              {/* Instructions & Download */}
              <div className="flex-1 space-y-3">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">Guests can scan this QR code to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Upload photos and videos</li>
                    <li>View approved memories</li>
                    <li>Share moments from your event</li>
                  </ul>
                </div>
                
                <Button onClick={downloadQRCode} variant="default" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  💡 Print this QR code on table cards, signage, or event programs
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Wall Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${data.allowUploads ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                <Upload className={`h-5 w-5 ${data.allowUploads ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Uploads</p>
                <p className="font-semibold">{data.allowUploads ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${data.requireApproval ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
                <Shield className={`h-5 w-5 ${data.requireApproval ? 'text-orange-600 dark:text-orange-400' : 'text-blue-600 dark:text-blue-400'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Approval</p>
                <p className="font-semibold">{data.requireApproval ? 'Required' : 'Auto'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Expires</p>
                <p className="font-semibold">
                  {data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Gallery & Moderation */}
      <GalleryModeration eventMemoryId={data.id} requireApproval={data.requireApproval} />
    </div>
  )
}

// Gallery and Moderation Component
function GalleryModeration({ eventMemoryId, requireApproval }: { eventMemoryId: string; requireApproval: boolean }) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved'>('all')
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Guest Uploads</CardTitle>
          {requireApproval && <PendingBadge memoryId={eventMemoryId} />}
        </div>
        <CardDescription>
          View and moderate guest-uploaded photos and videos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        {requireApproval && (
          <div className="flex gap-2 border-b">
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
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Pending Review
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
        <UploadGrid memoryId={eventMemoryId} status={requireApproval ? activeTab : undefined} />
      </CardContent>
    </Card>
  )
}

// Pending Badge Component
function PendingBadge({ memoryId }: { memoryId: string }) {
  const { data: pendingCount } = usePendingUploadCount(memoryId)
  
  if (!pendingCount || pendingCount.pendingCount === 0) return null
  
  return (
    <Badge variant="destructive" className="animate-pulse">
      {pendingCount.pendingCount} Pending
    </Badge>
  )
}

// Upload Grid Component
function UploadGrid({ memoryId, status }: { memoryId: string; status?: 'all' | 'pending' | 'approved' }) {
  const filterStatus = status === 'pending' ? 'PENDING' : status === 'approved' ? 'APPROVED' : undefined
  const { data: uploads, isLoading } = useGuestUploads(memoryId, filterStatus)
  const approveUpload = useApproveUpload(memoryId)
  const rejectUpload = useRejectUpload(memoryId)
  const deleteUpload = useDeleteGuestUpload(memoryId)
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }
  
  if (!uploads || uploads.uploads.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No uploads yet</p>
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {uploads.uploads.map((upload) => (
        <UploadCard
          key={upload.id}
          upload={upload}
          onApprove={() => approveUpload.mutate(upload.id)}
          onReject={() => rejectUpload.mutate(upload.id)}
          onDelete={() => deleteUpload.mutate(upload.id)}
        />
      ))}
    </div>
  )
}

// Upload Card Component
function UploadCard({
  upload,
  onApprove,
  onReject,
  onDelete,
}: {
  upload: any
  onApprove: () => void
  onReject: () => void
  onDelete: () => void
}) {
  const [showActions, setShowActions] = useState(false)
  const imageUrl = upload.thumbnailUrl || upload.mediaUrl
  
  return (
    <div
      className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img
        src={imageUrl}
        alt={upload.caption || 'Guest upload'}
        className="w-full h-full object-cover"
      />
      
      {/* Status Badge */}
      <div className="absolute top-2 left-2">
        <Badge
          variant={upload.status === 'APPROVED' ? 'default' : upload.status === 'PENDING' ? 'secondary' : 'destructive'}
          className="text-xs"
        >
          {upload.status}
        </Badge>
      </div>
      
      {/* Actions Overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-4">
          {upload.uploaderName && (
            <p className="text-white text-xs font-medium">{upload.uploaderName}</p>
          )}
          {upload.caption && (
            <p className="text-white/80 text-xs text-center line-clamp-2">{upload.caption}</p>
          )}
          
          {upload.status === 'PENDING' && (
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="default" onClick={onApprove}>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={onReject}>
                <AlertCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}
          
          <Button size="sm" variant="ghost" className="text-white hover:text-white" onClick={onDelete}>
            Delete
          </Button>
        </div>
      )}
    </div>
  )
}
