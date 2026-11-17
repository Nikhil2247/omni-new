'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { format } from 'date-fns'
import { useGuestUploads } from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Ico, ICONS, Paper, Stamp } from '@/components/sketch'
import { User, Calendar } from 'lucide-react'

interface MemoryGalleryProps {
  memoryId: string
}

export function MemoryGallery({ memoryId }: MemoryGalleryProps) {
  const { data, isLoading, error } = useGuestUploads(memoryId, 'APPROVED')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-rose py-8 text-center text-sm font-bold" role="alert">
        Failed to load gallery. Please try again.
      </p>
    )
  }

  if (!data?.uploads?.length) {
    return (
      <Paper alt className="px-6 py-12 text-center">
        <Ico d={ICONS.gallery} className="mx-auto mb-3 h-12 w-12" />
        <h3 className="font-display text-lg font-semibold">No photos yet</h3>
        <p className="text-ink-soft text-sm">Approved photos will appear here once guests upload them.</p>
      </Paper>
    )
  }

  const selectedUpload = data.uploads.find((u) => u.id === selectedPhoto)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Stamp>{data.count} photos</Stamp>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {data.uploads.map((upload) => (
            <button
              key={upload.id}
              type="button"
              onClick={() => setSelectedPhoto(upload.id)}
              aria-label={upload.caption ? `Open photo: ${upload.caption}` : 'Open photo'}
              className="sk-paper group relative aspect-square overflow-hidden p-1.5"
            >
              <NextImage
                src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                alt={upload.caption || 'Guest photo'}
                width={600}
                height={600}
                unoptimized={true}
                priority={true}
                className="h-full w-full rounded-md object-cover transition-transform group-hover:scale-105"
              />
              {upload.uploaderName && (
                <div className="absolute inset-x-1.5 bottom-1.5 rounded-b-md bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  <p className="truncate text-xs text-white">{upload.uploaderName}</p>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Photo Detail</DialogTitle>
          </DialogHeader>
          {selectedUpload && (
            <div className="space-y-4">
              <div className="bg-muted relative aspect-[4/3] overflow-hidden rounded-lg">
                <NextImage
                  src={getMinioViewUrl(selectedUpload.mediaUrl) || ''}
                  alt={selectedUpload.caption || 'Guest photo'}
                  width={1200}
                  height={900}
                  unoptimized={true}
                  priority={true}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="space-y-2">
                {selectedUpload.caption && <p className="text-sm">{selectedUpload.caption}</p>}
                <div className="text-ink-soft flex items-center gap-4 text-xs">
                  {selectedUpload.uploaderName && (
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {selectedUpload.uploaderName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(selectedUpload.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
