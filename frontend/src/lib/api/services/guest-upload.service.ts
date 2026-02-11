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
    return data
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
    return data
  },

  async getPublicGallery(eventCode: string): Promise<PublicGalleryResponse> {
    const { data } = await apiClient.get(`${PUBLIC_BASE}/${eventCode}/gallery`)
    return data
  },

  // ==================== OWNER ENDPOINTS (Auth Required) ====================

  async getUploads(memoryId: string, status?: UploadStatus): Promise<UploadsListResponse> {
    const params = status ? { status } : {}
    const { data } = await apiClient.get(`${USER_BASE}/${memoryId}/uploads`, { params })
    return data
  },

  async getPendingCount(memoryId: string): Promise<PendingCountResponse> {
    const { data } = await apiClient.get(`${USER_BASE}/${memoryId}/uploads/pending-count`)
    return data
  },

  async approveUpload(uploadId: string): Promise<GuestUpload> {
    const { data } = await apiClient.patch(`${USER_BASE}/uploads/${uploadId}/approve`)
    return data
  },

  async rejectUpload(uploadId: string): Promise<GuestUpload> {
    const { data } = await apiClient.patch(`${USER_BASE}/uploads/${uploadId}/reject`)
    return data
  },

  async deleteUpload(uploadId: string): Promise<{ success: boolean }> {
    const { data } = await apiClient.delete(`${USER_BASE}/uploads/${uploadId}`)
    return data
  },

  async bulkApprove(memoryId: string, input: BulkUploadActionInput): Promise<UploadsListResponse> {
    const { data } = await apiClient.patch(`${USER_BASE}/${memoryId}/uploads/bulk-approve`, input)
    return data
  },

  async bulkReject(memoryId: string, input: BulkUploadActionInput): Promise<UploadsListResponse> {
    const { data } = await apiClient.patch(`${USER_BASE}/${memoryId}/uploads/bulk-reject`, input)
    return data
  },
}
