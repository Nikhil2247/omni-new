'use client'

import { useState } from 'react'
import NextImage from 'next/image'
import { format } from 'date-fns'
import {
  useGuestUploads,
  usePendingUploadCount,
  useApproveUpload,
  useRejectUpload,
  useDeleteGuestUpload,
  useBulkApproveUploads,
  useBulkRejectUploads,
} from '@/hooks/queries/use-guest-uploads'
import { getMinioViewUrl } from '@/lib/utils/minio'
import { Ico, ICONS, Paper, SketchButton, Stamp } from '@/components/sketch'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Check,
  X,
  Trash2,
  CheckCheck,
  XCircle,
  User,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface MemoryModerationProps {
  memoryId: string
}

export function MemoryModeration({ memoryId }: MemoryModerationProps) {
  const { data, isLoading, error } = useGuestUploads(memoryId, 'PENDING')
  const { data: pendingCount } = usePendingUploadCount(memoryId)
  const approveUpload = useApproveUpload(memoryId)
  const rejectUpload = useRejectUpload(memoryId)
  const deleteUpload = useDeleteGuestUpload(memoryId)
  const bulkApprove = useBulkApproveUploads(memoryId)
  const bulkReject = useBulkRejectUploads(memoryId)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedIds(newSelected)
  }

  const selectAll = () => {
    if (data?.uploads) {
      setSelectedIds(new Set(data.uploads.map((u) => u.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleApprove = async (id: string) => {
    try {
      await approveUpload.mutateAsync(id)
      toast.success('Photo approved')
    } catch {
      toast.error('Failed to approve photo')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await rejectUpload.mutateAsync(id)
      toast.success('Photo rejected')
    } catch {
      toast.error('Failed to reject photo')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteUpload.mutateAsync(id)
      setDeleteTarget(null)
      toast.success('Photo deleted')
    } catch {
      toast.error('Failed to delete photo')
    }
  }

  const handleBulkApprove = async () => {
    try {
      await bulkApprove.mutateAsync(Array.from(selectedIds))
      clearSelection()
      toast.success(`${selectedIds.size} photos approved`)
    } catch {
      toast.error('Failed to approve photos')
    }
  }

  const handleBulkReject = async () => {
    try {
      await bulkReject.mutateAsync(Array.from(selectedIds))
      clearSelection()
      toast.success(`${selectedIds.size} photos rejected`)
    } catch {
      toast.error('Failed to reject photos')
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="text-rose py-8 text-center text-sm font-bold" role="alert">
        Failed to load pending uploads.
      </p>
    )
  }

  if (!data?.uploads?.length) {
    return (
      <Paper alt className="px-6 py-12 text-center">
        <Ico d={ICONS.clock} className="mx-auto mb-3 h-12 w-12" />
        <h3 className="font-display text-lg font-semibold">No pending uploads</h3>
        <p className="text-ink-soft text-sm">New guest uploads will appear here for review.</p>
      </Paper>
    )
  }

  const isProcessing =
    approveUpload.isPending ||
    rejectUpload.isPending ||
    bulkApprove.isPending ||
    bulkReject.isPending

  return (
    <>
      <div className="space-y-4">
        {/* Header with bulk actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stamp tone="wait">
              {pendingCount?.pendingCount ?? data.count} pending
            </Stamp>
            {selectedIds.size > 0 && (
              <Stamp>{selectedIds.size} selected</Stamp>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {selectedIds.size > 0 ? (
              <>
                <SketchButton
                  size="sm"
                  variant="line"
                  onClick={handleBulkApprove}
                  disabled={isProcessing}
                >
                  {bulkApprove.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                  Approve all
                </SketchButton>
                <SketchButton
                  size="sm"
                  variant="line"
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                >
                  {bulkReject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  Reject all
                </SketchButton>
                <SketchButton size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </SketchButton>
              </>
            ) : (
              <SketchButton size="sm" variant="ghost" onClick={selectAll}>
                Select all
              </SketchButton>
            )}
          </div>
        </div>

        {/* Upload grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.uploads.map((upload) => (
            <div
              key={upload.id}
              className="sk-paper relative overflow-hidden p-2"
            >
              {/* Selection checkbox */}
              <div className="absolute top-3.5 left-3.5 z-10">
                <input
                  type="checkbox"
                  className="sk-check"
                  aria-label="Select photo"
                  checked={selectedIds.has(upload.id)}
                  onChange={() => toggleSelection(upload.id)}
                />
              </div>

              {/* Image */}
              <div className="bg-muted aspect-square overflow-hidden rounded-md">
                <NextImage
                  src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                  alt={upload.caption || 'Guest photo'}
                  width={600}
                  height={600}
                  unoptimized={true}
                  priority={true}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info and actions */}
              <div className="space-y-2 px-1 pt-3 pb-1">
                {upload.uploaderName && (
                  <div className="flex items-center gap-1 text-xs text-ink-soft">
                    <User className="h-3 w-3" />
                    <span className="truncate">{upload.uploaderName}</span>
                  </div>
                )}
                {upload.caption && (
                  <p className="text-xs text-ink-soft line-clamp-2">
                    {upload.caption}
                  </p>
                )}
                <p className="text-xs text-ink-soft">
                  {format(new Date(upload.createdAt), 'MMM d, h:mm a')}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <SketchButton
                    size="sm"
                    variant="line"
                    className="flex-1"
                    onClick={() => handleApprove(upload.id)}
                    disabled={isProcessing}
                  >
                    <Check className="h-3 w-3" />
                    Approve
                  </SketchButton>
                  <SketchButton
                    size="sm"
                    variant="line"
                    className="flex-1"
                    onClick={() => handleReject(upload.id)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3" />
                    Reject
                  </SketchButton>
                  <SketchButton
                    size="icon"
                    variant="ghost"
                    className="text-rose"
                    aria-label="Delete photo"
                    onClick={() => setDeleteTarget(upload.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </SketchButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this photo. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUpload.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
