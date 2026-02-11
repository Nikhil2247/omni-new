'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useDropzone } from 'react-dropzone'
import { format } from 'date-fns'
import {
  useMemorySettings,
  usePublicGallery,
  useUploadGuestPhoto,
} from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ImageIcon,
  X,
  Calendar,
} from 'lucide-react'

export default function GuestUploadPage() {
  const params = useParams()
  const eventCode = params.eventCode as string
  const { data: settings, isLoading, error } = useMemorySettings(eventCode)
  const { data: gallery } = usePublicGallery(eventCode)
  const uploadMutation = useUploadGuestPhoto(eventCode)

  const [uploaderName, setUploaderName] = useState('')
  const [caption, setCaption] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)

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
    maxSize: 20 * 1024 * 1024, // 20MB
    multiple: false,
  })

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      await uploadMutation.mutateAsync({
        file: selectedFile,
        input: {
          uploaderName: uploaderName || undefined,
          caption: caption || undefined,
        },
      })

      setUploadSuccess(true)
      setSelectedFile(null)
      setPreview(null)
      setCaption('')
    } catch {
      // Error handled by mutation
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    setUploadSuccess(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4">
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  if (error || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-lg font-semibold">Event Not Found</h2>
            <p className="text-muted-foreground mt-2">
              This event link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!settings.isActive || !settings.allowUploads) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Camera className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">Uploads Disabled</h2>
            <p className="text-muted-foreground mt-2">
              Photo uploads are currently not available for this event.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-4">
      <div className="mx-auto max-w-lg space-y-6">
        {/* Event Header */}
        <div className="text-center pt-8">
          <Camera className="mx-auto h-12 w-12 text-pink-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">
            {settings.event?.name || 'Event Memories'}
          </h1>
          {settings.event?.date && (
            <p className="text-muted-foreground mt-1 flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              {format(new Date(settings.event.date), 'MMMM d, yyyy')}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-2">
            Share your favorite moments from the celebration
          </p>
        </div>

        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Photo
            </CardTitle>
            <CardDescription>
              {settings.requireApproval
                ? 'Photos will be reviewed before appearing in the gallery'
                : 'Your photos will appear in the gallery immediately'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadSuccess ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-lg font-semibold">Thank You!</h3>
                <p className="text-muted-foreground mt-2">
                  {settings.requireApproval
                    ? 'Your photo has been submitted for review.'
                    : 'Your photo has been added to the gallery.'}
                </p>
                <Button
                  className="mt-4"
                  variant="outline"
                  onClick={() => setUploadSuccess(false)}
                >
                  Upload Another
                </Button>
              </div>
            ) : (
              <>
                {/* Uploader Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name (optional)</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    value={uploaderName}
                    onChange={(e) => setUploaderName(e.target.value)}
                  />
                </div>

                {/* Dropzone */}
                {!selectedFile ? (
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                      isDragActive
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-300 hover:border-pink-400'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600">
                      {isDragActive
                        ? 'Drop your photo here...'
                        : 'Drag & drop a photo, or tap to select'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports JPG, PNG, GIF, HEIC, MP4 (max 20MB)
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={preview || ''}
                      alt="Preview"
                      className="w-full rounded-lg object-cover max-h-64"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={clearSelection}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Caption */}
                {selectedFile && (
                  <div className="space-y-2">
                    <Label htmlFor="caption">Caption (optional)</Label>
                    <Textarea
                      id="caption"
                      placeholder="Add a caption..."
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}

                {/* Upload Button */}
                <Button
                  className="w-full"
                  size="lg"
                  disabled={!selectedFile || uploadMutation.isPending}
                  onClick={handleUpload}
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Photo
                    </>
                  )}
                </Button>

                {uploadMutation.isError && (
                  <p className="text-sm text-destructive text-center">
                    Failed to upload. Please try again.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Gallery Preview */}
        {gallery && gallery.uploads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Gallery</span>
                <Badge variant="secondary">{gallery.count} photos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2">
                {gallery.uploads.slice(0, 9).map((upload) => (
                  <div
                    key={upload.id}
                    className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                  >
                    <img
                      src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                      alt={upload.caption || 'Guest photo'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
              {gallery.count > 9 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  +{gallery.count - 9} more photos
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 pb-8">
          Powered by Omnicassion
        </p>
      </div>
    </div>
  )
}
