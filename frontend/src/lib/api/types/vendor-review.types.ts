export interface VendorReviewMedia {
  id: string
  url: string
  thumbnailUrl?: string | null
  mimeType: string
  fileSize: number
}

export interface VendorReview {
  id: string
  vendorProfileId: string
  reviewerId: string
  eventId?: string | null
  rating: number
  title?: string | null
  body?: string | null
  status?: string
  reviewNotes?: string | null
  reviewedAt?: string | null
  createdAt: string
  updatedAt: string
  reviewer?: {
    id?: string
    firstName?: string | null
    lastName?: string | null
    avatarUrl?: string | null
  }
  vendor?: {
    id?: string
    businessName?: string | null
    slug?: string | null
  }
  media?: VendorReviewMedia[]
}

export interface CreateVendorReviewPayload {
  vendorProfileId: string
  eventId?: string
  rating: number
  title?: string
  body?: string
  media?: Array<{
    url: string
    mimeType: string
    fileSize: number
    thumbnailUrl?: string
  }>
}

export interface UpdateVendorReviewPayload {
  rating?: number
  title?: string
  body?: string
}
