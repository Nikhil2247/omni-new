// ============================================================================
// GUEST UPLOADS HOOKS
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { guestUploadService } from '@/lib/api/services/guest-upload.service'
import type {
  MemorySettings,
  GuestUpload,
  PublicGalleryResponse,
  UploadsListResponse,
  CreateGuestUploadInput,
  UploadStatus,
} from '@/lib/api/types/guest-upload.types'

// Query Keys
export const guestUploadKeys = {
  all: ['guest-uploads'] as const,
  memorySettings: (eventCode: string) => [...guestUploadKeys.all, 'settings', eventCode] as const,
  publicGallery: (eventCode: string) => [...guestUploadKeys.all, 'gallery', eventCode] as const,
  uploads: (memoryId: string, status?: UploadStatus) =>
    [...guestUploadKeys.all, 'uploads', memoryId, status] as const,
  pendingCount: (memoryId: string) => [...guestUploadKeys.all, 'pending', memoryId] as const,
}

// ==================== PUBLIC HOOKS ====================

export function useMemorySettings(eventCode: string) {
  return useQuery<MemorySettings>({
    queryKey: guestUploadKeys.memorySettings(eventCode),
    queryFn: () => guestUploadService.getMemoryByCode(eventCode),
    enabled: !!eventCode,
    retry: false,
  })
}

export function usePublicGallery(eventCode: string) {
  return useQuery<PublicGalleryResponse>({
    queryKey: guestUploadKeys.publicGallery(eventCode),
    queryFn: () => guestUploadService.getPublicGallery(eventCode),
    enabled: !!eventCode,
  })
}

export function useUploadGuestPhoto(eventCode: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ file, input }: { file: File; input?: CreateGuestUploadInput }) =>
      guestUploadService.uploadPhoto(eventCode, file, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.publicGallery(eventCode) })
    },
  })
}

// ==================== OWNER HOOKS ====================

export function useGuestUploads(memoryId: string, status?: UploadStatus) {
  return useQuery<UploadsListResponse>({
    queryKey: guestUploadKeys.uploads(memoryId, status),
    queryFn: () => guestUploadService.getUploads(memoryId, status),
    enabled: !!memoryId,
  })
}

export function usePendingUploadCount(memoryId: string) {
  return useQuery({
    queryKey: guestUploadKeys.pendingCount(memoryId),
    queryFn: () => guestUploadService.getPendingCount(memoryId),
    enabled: !!memoryId,
    refetchInterval: 30000, // Poll every 30 seconds
  })
}

export function useApproveUpload(memoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uploadId: string) => guestUploadService.approveUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.uploads(memoryId) })
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.pendingCount(memoryId) })
    },
  })
}

export function useRejectUpload(memoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uploadId: string) => guestUploadService.rejectUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.uploads(memoryId) })
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.pendingCount(memoryId) })
    },
  })
}

export function useDeleteGuestUpload(memoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (uploadId: string) => guestUploadService.deleteUpload(uploadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.uploads(memoryId) })
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.pendingCount(memoryId) })
    },
  })
}

export function useBulkApproveUploads(memoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => guestUploadService.bulkApprove(memoryId, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.uploads(memoryId) })
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.pendingCount(memoryId) })
    },
  })
}

export function useBulkRejectUploads(memoryId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (ids: string[]) => guestUploadService.bulkReject(memoryId, { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.uploads(memoryId) })
      queryClient.invalidateQueries({ queryKey: guestUploadKeys.pendingCount(memoryId) })
    },
  })
}
