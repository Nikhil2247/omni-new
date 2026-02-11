// ============================================================================
// GUEST UPLOAD TYPES
// ============================================================================

export type UploadStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type MediaType = 'IMAGE' | 'VIDEO'

export interface MemorySettings {
  id: string
  qrCode: string
  isActive: boolean
  allowUploads: boolean
  requireApproval: boolean
  expiresAt?: string | null
  event?: {
    id: string
    name: string
    date?: string | null
  } | null
}

export interface GuestUpload {
  id: string
  eventMemoryId: string
  uploaderName?: string | null
  uploaderEmail?: string | null
  mediaUrl: string
  thumbnailUrl?: string | null
  mediaType: MediaType
  fileSize: number
  caption?: string | null
  status: UploadStatus
  approvedAt?: string | null
  rejectedAt?: string | null
  createdAt: string
}

export interface GuestUploadResponse {
  id: string
  status: UploadStatus
  mediaUrl: string
  thumbnailUrl?: string | null
  message: string
}

export interface PublicGalleryResponse {
  count: number
  uploads: {
    id: string
    mediaUrl: string
    thumbnailUrl?: string | null
    mediaType: MediaType
    uploaderName?: string | null
    caption?: string | null
    createdAt: string
  }[]
}

export interface UploadsListResponse {
  count: number
  uploads: GuestUpload[]
}

export interface PendingCountResponse {
  pendingCount: number
}

export interface CreateGuestUploadInput {
  uploaderName?: string
  uploaderEmail?: string
  caption?: string
}

export interface BulkUploadActionInput {
  ids: string[]
}
