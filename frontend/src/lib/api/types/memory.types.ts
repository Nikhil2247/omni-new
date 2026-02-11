export interface EventMemory {
  id: string
  eventId: string
  qrCode: string
  qrCodeUrl?: string | null
  isActive: boolean
  allowUploads: boolean
  requireApproval: boolean
  createdAt: string
  expiresAt?: string | null
}

export interface CreateMemoryInput {
  eventId: string
  qrCode?: string
  qrCodeUrl?: string
  isActive?: boolean
  allowUploads?: boolean
  requireApproval?: boolean
  expiresAt?: string
}
