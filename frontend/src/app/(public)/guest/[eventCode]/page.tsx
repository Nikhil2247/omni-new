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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import {
  Camera,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ImageIcon,
  X,
  Calendar,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Plus,
} from 'lucide-react'
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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic'],
      'video/*': ['.mp4', '.webm', '.mov'],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  })

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
  const UploadForm = ({ isModal = false }: { isModal?: boolean }) => (
    <div className={cn("space-y-4", isModal ? "p-5" : "p-4")}>
      {uploadSuccess ? (
        <div className="text-center py-6">
          <div className="relative inline-block">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto shadow-lg animate-in zoom-in duration-300">
              <CheckCircle2 className="h-8 w-8 text-white" />
            </div>
            <Heart className="absolute -top-1 -right-1 h-6 w-6 text-pink-500 fill-pink-500 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mt-4">Thank You!</h3>
          <p className="text-gray-500 text-sm mt-1">
            {settings?.requireApproval ? 'Submitted for review' : 'Added to gallery'}
          </p>
          <Button
            size="sm"
            className="mt-4 rounded-full px-6 bg-gradient-to-r from-pink-500 to-purple-500"
            onClick={() => setUploadSuccess(false)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Upload Another
          </Button>
        </div>
      ) : (
        <>
          {/* Compact Name Input */}
          <Input
            placeholder="Your name (optional)"
            value={uploaderName}
            onChange={(e) => setUploaderName(e.target.value)}
            className="rounded-xl border-gray-200 h-10 text-sm"
          />

          {/* Dropzone */}
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                isDragActive
                  ? "border-pink-400 bg-pink-50"
                  : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/50"
              )}
            >
              <input {...getInputProps()} />
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="h-6 w-6 text-pink-500" />
              </div>
              <p className="text-gray-700 font-medium text-sm">
                {isDragActive ? 'Drop here!' : 'Tap to select photo'}
              </p>
              <p className="text-gray-400 text-xs mt-1">JPG, PNG, HEIC, MP4 (max 20MB)</p>
            </div>
          ) : (
            <div className="relative rounded-xl overflow-hidden">
              <NextImage
                src={preview || ''}
                alt="Preview"
                width={800}
                height={600}
                unoptimized
                className="w-full object-cover h-40"
              />
              <Button
                size="icon"
                variant="secondary"
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Caption (only when file selected) */}
          {selectedFile && (
            <Textarea
              placeholder="Add a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="rounded-xl border-gray-200 text-sm resize-none"
            />
          )}

          {/* Progress */}
          {uploadMutation.isPending && uploadProgress > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Uploading...</span>
                <span className="text-pink-500 font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1.5" />
            </div>
          )}

          {/* Upload Button */}
          <Button
            className={cn(
              "w-full h-11 rounded-xl font-medium transition-all",
              selectedFile
                ? "bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 shadow-lg"
                : "bg-gray-100 text-gray-400"
            )}
            disabled={!selectedFile || uploadMutation.isPending}
            onClick={handleUpload}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Share Memory
              </>
            )}
          </Button>

          {uploadMutation.isError && (
            <p className="text-xs text-red-500 text-center">Upload failed. Try again.</p>
          )}
        </>
      )}
    </div>
  )

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 p-4">
        <div className="mx-auto max-w-md pt-8 space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-[200px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  // Error State
  if (error || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 shadow-xl bg-white/90 backdrop-blur rounded-2xl">
          <CardContent className="pt-8 pb-6 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="h-7 w-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Event Not Found</h2>
            <p className="text-gray-500 text-sm mt-2">
              This link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Uploads Disabled State
  if (!settings.isActive || !settings.allowUploads) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-0 shadow-xl bg-white/90 backdrop-blur rounded-2xl">
          <CardContent className="pt-8 pb-6 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Camera className="h-7 w-7 text-gray-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Uploads Paused</h2>
            <p className="text-gray-500 text-sm mt-2">
              Photo uploads are currently unavailable.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Decorative Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-pink-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-32 w-64 h-64 bg-purple-200/40 rounded-full blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-md px-4 pb-28">
        {/* Compact Event Header */}
        <div className="pt-6 pb-4 text-center">
          <div className="relative inline-block">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg shadow-pink-200/50">
              <Camera className="h-7 w-7 text-white" />
            </div>
            <Sparkles className="absolute -bottom-0.5 -right-0.5 h-5 w-5 text-yellow-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mt-3">
            {settings.event?.name || 'Event Memories'}
          </h1>

          {settings.event?.date && (
            <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mt-1.5 bg-white/60 px-3 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5 text-pink-500" />
              {format(new Date(settings.event.date), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {/* Desktop/Tablet: Inline Upload Card */}
        <div className="hidden sm:block">
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3">
              <div className="flex items-center gap-2 text-white">
                <Upload className="h-4 w-4" />
                <span className="font-medium text-sm">Share Your Photos</span>
                <Badge variant="secondary" className="ml-auto text-[10px] bg-white/20 text-white border-0">
                  {settings.requireApproval ? 'Reviewed' : 'Instant'}
                </Badge>
              </div>
            </div>
            <UploadForm />
          </Card>
        </div>

        {/* Gallery Section */}
        {gallery && gallery.uploads.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Memories</h2>
              <Badge className="bg-pink-500/10 text-pink-600 border-0 text-xs">
                {gallery.count} photos
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {gallery.uploads.slice(0, 12).map((upload, index) => (
                <button
                  key={upload.id}
                  onClick={() => openLightbox(index)}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <NextImage
                    src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                    alt={upload.caption || 'Photo'}
                    width={300}
                    height={300}
                    unoptimized
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg" />
                  </div>
                </button>
              ))}
            </div>

            {gallery.count > 12 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-3 text-pink-600 hover:text-pink-700 hover:bg-pink-50 text-xs"
              >
                View all {gallery.count} photos
              </Button>
            )}
          </div>
        )}

        {/* Empty Gallery State */}
        {(!gallery || gallery.uploads.length === 0) && (
          <div className="mt-6 text-center py-8 bg-white/50 rounded-2xl border border-dashed border-pink-200">
            <ImageIcon className="h-10 w-10 text-pink-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No photos yet</p>
            <p className="text-gray-400 text-xs">Be the first to share!</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-1 text-gray-400 text-[10px]">
            <Heart className="h-2.5 w-2.5 fill-current" />
            Powered by Omnicassion
          </div>
        </div>
      </div>

      {/* Mobile: Floating Camera Button - positioned above bottom nav */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 sm:hidden z-50">
        <Button
          onClick={() => setShowUploadModal(true)}
          className="h-12 px-5 rounded-full shadow-2xl bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 gap-2"
        >
          <Camera className="h-5 w-5" />
          <span className="font-medium text-sm">Add Photo</span>
        </Button>
      </div>

      {/* Mobile: Upload Modal */}
      <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
        <DialogContent className="sm:hidden max-w-[calc(100%-2rem)] rounded-2xl p-0 border-0 bg-white">
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Camera className="h-4 w-4" />
              <span className="font-medium text-sm">Share a Memory</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-white hover:bg-white/20"
              onClick={resetAndClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <UploadForm isModal />
        </DialogContent>
      </Dialog>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full p-0 bg-black/95 border-0 rounded-xl overflow-hidden">
          {gallery?.uploads[lightboxIndex] && (
            <div className="relative">
              <NextImage
                src={getMinioViewUrl(gallery.uploads[lightboxIndex].mediaUrl) || ''}
                alt={gallery.uploads[lightboxIndex].caption || 'Photo'}
                width={1200}
                height={900}
                unoptimized
                className="w-full h-auto max-h-[85vh] object-contain"
              />

              {gallery.uploads.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                {gallery.uploads[lightboxIndex].uploaderName && (
                  <p className="text-white/70 text-xs">by {gallery.uploads[lightboxIndex].uploaderName}</p>
                )}
                {gallery.uploads[lightboxIndex].caption && (
                  <p className="text-white text-sm mt-0.5">{gallery.uploads[lightboxIndex].caption}</p>
                )}
                <p className="text-white/40 text-[10px] mt-1">
                  {lightboxIndex + 1} / {gallery.uploads.length}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                onClick={() => setLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
