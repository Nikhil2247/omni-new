// ============================================================================
// GUEST UPLOAD SERVICE
// ============================================================================

import { apiClient } from '../client'
import type {
  MemorySettings,
  GuestUploadResponse,
  PublicGalleryResponse,
  UploadsListResponse,
  PendingCountResponse,
  GuestUpload,
  CreateGuestUploadInput,
  BulkUploadActionInput,
  UploadStatus,
} from '../types/guest-upload.types'

const PUBLIC_BASE = '/public/guest-upload'
const USER_BASE = '/user/memories'

export const guestUploadService = {
  // ==================== PUBLIC ENDPOINTS (No Auth) ====================

  async getMemoryByCode(eventCode: string): Promise<MemorySettings> {
    const { data } = await apiClient.get(`${PUBLIC_BASE}/${eventCode}`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as MemorySettings
  },

  async uploadPhoto(
    eventCode: string,
    file: File,
    input?: CreateGuestUploadInput
  ): Promise<GuestUploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (input?.uploaderName) formData.append('uploaderName', input.uploaderName)
    if (input?.uploaderEmail) formData.append('uploaderEmail', input.uploaderEmail)
    if (input?.caption) formData.append('caption', input.caption)

    const { data } = await apiClient.post(`${PUBLIC_BASE}/${eventCode}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as GuestUploadResponse
  },

  async getPublicGallery(eventCode: string): Promise<PublicGalleryResponse> {
    const { data } = await apiClient.get(`${PUBLIC_BASE}/${eventCode}/gallery`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as PublicGalleryResponse
  },

  // ==================== OWNER ENDPOINTS (Auth Required) ====================

  async getUploads(memoryId: string, status?: UploadStatus): Promise<UploadsListResponse> {
    const params = status ? { status } : {}
    const { data } = await apiClient.get(`${USER_BASE}/${memoryId}/uploads`, { params })
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as UploadsListResponse
  },

  async getPendingCount(memoryId: string): Promise<PendingCountResponse> {
    const { data } = await apiClient.get(`${USER_BASE}/${memoryId}/uploads/pending-count`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as PendingCountResponse
  },

  async approveUpload(uploadId: string): Promise<GuestUpload> {
    const { data } = await apiClient.patch(`${USER_BASE}/uploads/${uploadId}/approve`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as GuestUpload
  },

  async rejectUpload(uploadId: string): Promise<GuestUpload> {
    const { data } = await apiClient.patch(`${USER_BASE}/uploads/${uploadId}/reject`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as GuestUpload
  },

  async deleteUpload(uploadId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`${USER_BASE}/uploads/${uploadId}`)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as { success: boolean }
  },

  async bulkApprove(memoryId: string, input: BulkUploadActionInput): Promise<UploadsListResponse> {
    const { data } = await apiClient.patch(`${USER_BASE}/${memoryId}/uploads/bulk-approve`, input)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as UploadsListResponse
  },

  async bulkReject(memoryId: string, input: BulkUploadActionInput): Promise<UploadsListResponse> {
    const { data } = await apiClient.patch(`${USER_BASE}/${memoryId}/uploads/bulk-reject`, input)
    // Unwrap backend response format: { success: true, data: {...} }
    return (data?.data || data) as UploadsListResponse
  },
}
