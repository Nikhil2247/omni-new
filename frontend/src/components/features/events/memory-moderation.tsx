'use client'

import { useState } from 'react'
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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
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
  Clock,
  User,
  Loader2,
  ImageIcon,
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
      <div className="text-sm text-destructive text-center py-8">
        Failed to load pending uploads.
      </div>
    )
  }

  if (!data?.uploads?.length) {
    return (
      <div className="text-center py-12 space-y-3">
        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
        <div>
          <h3 className="font-medium">No pending uploads</h3>
          <p className="text-sm text-muted-foreground">
            New guest uploads will appear here for review.
          </p>
        </div>
      </div>
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
            <Badge variant="secondary">
              {pendingCount?.pendingCount ?? data.count} pending
            </Badge>
            {selectedIds.size > 0 && (
              <Badge variant="outline">{selectedIds.size} selected</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkApprove}
                  disabled={isProcessing}
                >
                  {bulkApprove.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCheck className="h-4 w-4 mr-1" />
                  )}
                  Approve all
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleBulkReject}
                  disabled={isProcessing}
                >
                  {bulkReject.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-1" />
                  )}
                  Reject all
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>
                  Clear
                </Button>
              </>
            ) : (
              <Button size="sm" variant="ghost" onClick={selectAll}>
                Select all
              </Button>
            )}
          </div>
        </div>

        {/* Upload grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.uploads.map((upload) => (
            <div
              key={upload.id}
              className="relative rounded-lg overflow-hidden border bg-card"
            >
              {/* Selection checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedIds.has(upload.id)}
                  onCheckedChange={() => toggleSelection(upload.id)}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>

              {/* Image */}
              <div className="aspect-square bg-muted">
                <img
                  src={getMinioViewUrl(upload.thumbnailUrl || upload.mediaUrl) || ''}
                  alt={upload.caption || 'Guest photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              {/* Info and actions */}
              <div className="p-3 space-y-2">
                {upload.uploaderName && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span className="truncate">{upload.uploaderName}</span>
                  </div>
                )}
                {upload.caption && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {upload.caption}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {format(new Date(upload.createdAt), 'MMM d, h:mm a')}
                </p>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => handleApprove(upload.id)}
                    disabled={isProcessing}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-8"
                    onClick={() => handleReject(upload.id)}
                    disabled={isProcessing}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    onClick={() => setDeleteTarget(upload.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
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
