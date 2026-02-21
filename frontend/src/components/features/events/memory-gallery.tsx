'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { format } from 'date-fns'
import { useGuestUploads } from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ImageIcon, User, Calendar, X } from 'lucide-react'

interface MemoryGalleryProps {
  memoryId: string
}

export function MemoryGallery({ memoryId }: MemoryGalleryProps) {
  const { data, isLoading, error } = useGuestUploads(memoryId, 'APPROVED')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-destructive text-center py-8">
        Failed to load gallery. Please try again.
      </div>
    )
  }

  if (!data?.uploads?.length) {
    return (
      <div className="text-center py-12 space-y-3">
        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-medium">No photos yet</h3>
          <p className="text-sm text-muted-foreground">
            Approved photos will appear here once guests upload them.
          </p>
        </div>
      </div>
    )
  }

  const selectedUpload = data.uploads.find((u) => u.id === selectedPhoto)

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{data.count} photos</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {data.uploads.map((upload) => (
            <button
              key={upload.id}
              onClick={() => setSelectedPhoto(upload.id)}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <NextImage
                src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                alt={upload.caption || 'Guest photo'}
                width={600}
                height={600}
                unoptimized={true}
                priority={true}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {upload.uploaderName && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-white text-xs truncate">{upload.uploaderName}</p>
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
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <NextImage
                  src={getMinioViewUrl(selectedUpload.mediaUrl) || ''}
                  alt={selectedUpload.caption || 'Guest photo'}
                  width={1200}
                  height={900}
                  unoptimized={true}
                  priority={true}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="space-y-2">
                {selectedUpload.caption && (
                  <p className="text-sm">{selectedUpload.caption}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
