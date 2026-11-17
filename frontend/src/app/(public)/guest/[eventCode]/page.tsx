'use client'

import { useEffect, useState, useCallback } from 'react'
import NextImage from 'next/image'
import { useParams } from 'next/navigation'
import { trackContent } from '@/lib/analytics/umami'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import {
  useMemorySettings,
  usePublicGallery,
  useUploadGuestPhoto,
} from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Camera, Upload, Loader2, X, Calendar, ChevronLeft, ChevronRight, ZoomIn, Plus } from 'lucide-react'
import { Brush, BrushBar, Eyebrow, Ico, ICONS, Paper, SketchButton, SkContainer, Stamp } from '@/components/sketch'
import { cn } from '@/lib/utils'

export default function GuestUploadPage() {
  const params = useParams()
  const eventCode = params.eventCode as string
  const { data: settings, isLoading, error } = useMemorySettings(eventCode)
  const { data: gallery } = usePublicGallery(eventCode)
  const uploadMutation = useUploadGuestPhoto(eventCode)

  useEffect(() => {
    trackContent.articleView(`guest-${eventCode}`, 'Guest Upload')
  }, [eventCode])

  const [uploaderName, setUploaderName] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showUploadModal, setShowUploadModal] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      setPreview(URL.createObjectURL(file))
      setUploadSuccess(false)
    }
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setUploadProgress(0)
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90))
    }, 200)

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        input: {
          uploaderName: uploaderName || undefined,
          caption: caption || undefined,
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      setTimeout(() => {
        setUploadSuccess(true)
        setSelectedFile(null)
        setPreview(null)
        setCaption('')
        setUploadProgress(0)
      }, 500)
    } catch {
      clearInterval(progressInterval)
      setUploadProgress(0)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadSuccess(false)
  }

  const resetAndClose = () => {
    setUploadSuccess(false)
    setShowUploadModal(false)
  }

  const openLightbox = (index: number) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const nextImage = () => {
    if (gallery?.uploads) {
      setLightboxIndex((prev) => (prev + 1) % gallery.uploads.length)
    }
  }

  const prevImage = () => {
    if (gallery?.uploads) {
      setLightboxIndex((prev) => (prev - 1 + gallery.uploads.length) % gallery.uploads.length)
    }
  }

  // Upload Form Component (reusable for modal and inline)
  const UploadForm = ({ isModal = false }: { isModal?: boolean }) => {
    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
      onDrop,
      accept: {
        'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
        'video/*': ['.mp4', '.webm', '.mov'],
      },
      maxSize: 20 * 1024 * 1024,
      multiple: false,
      noClick: true,
    })

    return (
      <div className={cn('space-y-4', isModal ? 'p-5' : 'p-1')}>
        {uploadSuccess ? (
          <div className="py-6 text-center">
            <Ico d={ICONS.heart} className="mx-auto h-14 w-14" />
            <h3 className="font-display mt-3 text-2xl font-semibold">
              <Brush>Thank</Brush> you!
            </h3>
            <p className="text-ink-soft mt-2 text-sm">
              {settings?.requireApproval ? 'Submitted for review' : 'Added to gallery'}
            </p>
            <SketchButton size="sm" className="mt-4" onClick={() => setUploadSuccess(false)}>
              <Plus className="h-4 w-4" />
              Upload Another
            </SketchButton>
          </div>
        ) : (
          <>
            <div className="sk-field">
              <label htmlFor={isModal ? 'guest-name-modal' : 'guest-name'}>Your name (optional)</label>
              <input
                id={isModal ? 'guest-name-modal' : 'guest-name'}
                placeholder="Your name (optional)"
                value={uploaderName}
                onChange={(e) => setUploaderName(e.target.value)}
              />
            </div>

            {/* Dropzone */}
            {!selectedFile ? (
              <div
                {...getRootProps()}
                onClick={open}
                role="button"
                tabIndex={0}
                aria-label="Choose a photo or video to upload"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    open()
                  }
                }}
                className={cn(
                  'text-blue border-blue-wash grid min-h-44 cursor-pointer place-items-center rounded-[18px] border-[2.5px] border-dashed p-6 text-center font-bold transition-colors',
                  isDragActive ? 'bg-blue-wash/30 border-blue' : 'hover:bg-blue-wash/30 hover:border-blue',
                )}
              >
                <input {...getInputProps()} />
                <div>
                  <div className="font-hand text-5xl leading-none">+</div>
                  <p className="mt-2 text-base">{isDragActive ? 'Drop here!' : 'Tap to select a photo'}</p>
                  <p className="text-ink-soft mt-1 text-xs font-medium">JPG, PNG, HEIC, MP4 (max 20MB)</p>
                </div>
              </div>
            ) : (
              <div className="sk-paper relative overflow-hidden p-2">
                <NextImage
                  src={preview || ''}
                  alt="Preview"
                  width={800}
                  height={600}
                  unoptimized
                  className="h-44 w-full rounded-md object-cover"
                />
                <SketchButton
                  size="icon"
                  variant="line"
                  className="bg-card absolute top-3 right-3"
                  onClick={clearSelection}
                  aria-label="Remove selected photo"
                >
                  <X className="h-4 w-4" />
                </SketchButton>
              </div>
            )}

            {/* Caption (only when file selected) */}
            {selectedFile && (
              <div className="sk-field">
                <label htmlFor={isModal ? 'guest-caption-modal' : 'guest-caption'}>Caption</label>
                <textarea
                  id={isModal ? 'guest-caption-modal' : 'guest-caption'}
                  placeholder="Add a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={2}
                />
              </div>
            )}

            {/* Progress */}
            {uploadMutation.isPending && uploadProgress > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-soft">Uploading...</span>
                  <span className="text-blue font-bold">{uploadProgress}%</span>
                </div>
                <BrushBar value={uploadProgress} />
              </div>
            )}

            {/* Upload Button */}
            <SketchButton
              className="w-full"
              disabled={!selectedFile || uploadMutation.isPending}
              onClick={handleUpload}
            >
              {uploadMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Share Memory
                </>
              )}
            </SketchButton>

            {uploadMutation.isError && (
              <p className="text-rose text-center text-sm font-bold" role="alert">
                Upload failed. Try again.
              </p>
            )}
          </>
        )}
      </div>
    )
  }

  // Loading State
  if (isLoading) {
    return (
      <SkContainer className="max-w-md py-10">
        <div className="space-y-4" aria-busy="true">
          <Skeleton className="mx-auto h-12 w-12 rounded-full" />
          <Skeleton className="mx-auto h-6 w-48" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      </SkContainer>
    )
  }

  // Error State
  if (error || !settings) {
    return (
      <SkContainer className="max-w-md py-12">
        <Paper className="px-6 py-10 text-center">
          <Ico d={ICONS.gallery} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold">Event not found</h1>
          <p className="text-ink-soft mt-2 text-sm">This link is invalid or has expired.</p>
        </Paper>
      </SkContainer>
    )
  }

  // Uploads Disabled State
  if (!settings.isActive || !settings.allowUploads) {
    return (
      <SkContainer className="max-w-md py-12">
        <Paper className="px-6 py-10 text-center">
          <Ico d={ICONS.photography} className="mx-auto mb-3 h-12 w-12" />
          <h1 className="font-display text-2xl font-semibold">Uploads paused</h1>
          <p className="text-ink-soft mt-2 text-sm">Photo uploads are currently unavailable.</p>
        </Paper>
      </SkContainer>
    )
  }

  return (
    <SkContainer className="max-w-3xl pb-32 sm:pb-12">
      {/* Event Header */}
      <div className="pt-8 pb-6 text-center">
        <Eyebrow>Share your memories</Eyebrow>
        <h1 className="font-display mt-3 text-[clamp(1.9rem,6vw,2.8rem)] leading-[1.05] font-semibold tracking-tight text-balance">
          <Brush>{settings.event?.name || 'Event Memories'}</Brush>
        </h1>

        {settings.event?.date && (
          <p className="text-ink-soft mt-3 inline-flex items-center gap-1.5 text-sm font-bold">
            <Calendar className="text-blue h-4 w-4" aria-hidden="true" />
            {format(new Date(settings.event.date), 'MMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Desktop/Tablet: Inline Upload Card */}
      <div className="hidden sm:block">
        <Paper tape className="px-5 py-5">
          <div className="mb-2 flex items-center gap-2">
            <Upload className="text-blue h-4 w-4" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">Share your photos</h2>
            <Stamp tone={settings.requireApproval ? 'wait' : 'ok'} className="ml-auto">
              {settings.requireApproval ? 'Reviewed' : 'Instant'}
            </Stamp>
          </div>
          <UploadForm />
        </Paper>
      </div>

      {/* Gallery Section */}
      {gallery && gallery.uploads.length > 0 && (
        <section className="mt-8" aria-label="Memories">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Memories</h2>
            <Stamp>{gallery.count} photos</Stamp>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gallery.uploads.slice(0, 12).map((upload, index) => (
              <button
                key={upload.id}
                type="button"
                onClick={() => openLightbox(index)}
                aria-label={upload.caption ? `Open photo: ${upload.caption}` : 'Open photo'}
                className="sk-paper group relative aspect-square overflow-hidden p-1.5"
              >
                <NextImage
                  src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                  alt={upload.caption || 'Photo'}
                  width={300}
                  height={300}
                  unoptimized
                  className="h-full w-full rounded-md object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-1.5 flex items-center justify-center rounded-md bg-black/0 transition-colors group-hover:bg-black/10">
                  <ZoomIn className="h-5 w-5 text-white opacity-0 drop-shadow-lg group-hover:opacity-100" />
                </div>
              </button>
            ))}
          </div>

          {gallery.count > 12 && (
            <SketchButton variant="ghost" size="sm" className="mt-4 w-full">
              View all {gallery.count} photos
            </SketchButton>
          )}
        </section>
      )}

      {/* Empty Gallery State */}
      {(!gallery || gallery.uploads.length === 0) && (
        <Paper alt className="mt-8 px-6 py-8 text-center">
          <Ico d={ICONS.gallery} className="mx-auto mb-2 h-10 w-10" />
          <p className="font-display text-lg font-semibold">No photos yet</p>
          <p className="text-ink-soft text-sm">Be the first to share!</p>
        </Paper>
      )}

      {/* Footer */}
      <p className="text-ink-soft mt-8 text-center text-xs">Powered by Omnicassion</p>

      {/* Mobile: Floating Camera Button */}
      <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 sm:hidden">
        <SketchButton onClick={() => setShowUploadModal(true)} className="px-7 py-3.5 text-base shadow-lg">
          <Camera className="h-5 w-5" />
          Add Photo
        </SketchButton>
      </div>

      {/* Mobile: Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="bg-card max-w-[calc(100%-2rem)] rounded-2xl border-0 p-0 sm:hidden">
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="flex items-center gap-2">
              <Camera className="text-blue h-4 w-4" aria-hidden="true" />
              <span className="font-display text-lg font-semibold">Share a memory</span>
            </div>
            <SketchButton size="icon" variant="ghost" onClick={resetAndClose} aria-label="Close">
              <X className="h-4 w-4" />
            </SketchButton>
          </div>
          <UploadForm isModal />
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="w-full max-w-4xl overflow-hidden rounded-xl border-0 bg-black/95 p-0">
          {gallery?.uploads[lightboxIndex] && (
            <div className="relative">
              <NextImage
                src={getMinioViewUrl(gallery.uploads[lightboxIndex].mediaUrl) || ''}
                alt={gallery.uploads[lightboxIndex].caption || 'Photo'}
                width={1200}
                height={900}
                unoptimized
                className="h-auto max-h-[85vh] w-full object-contain"
              />

              {gallery.uploads.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Previous photo"
                    className="absolute top-1/2 left-2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Next photo"
                    className="absolute top-1/2 right-2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <div className="absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {gallery.uploads[lightboxIndex].uploaderName && (
                  <p className="text-xs text-white/70">by {gallery.uploads[lightboxIndex].uploaderName}</p>
                )}
                {gallery.uploads[lightboxIndex].caption && (
                  <p className="mt-0.5 text-sm text-white">{gallery.uploads[lightboxIndex].caption}</p>
                )}
                <p className="mt-1 text-[10px] text-white/40">
                  {lightboxIndex + 1} / {gallery.uploads.length}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                aria-label="Close"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 text-white hover:bg-white/20"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </SkContainer>
  )
}
