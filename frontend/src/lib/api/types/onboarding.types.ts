// Vibe Quiz Types
export interface VibeImage {
  id: string
  url: string
  thumbnailUrl: string
  category: string
  style: string
  tags: string[]
}

export interface VibeQuizSelection {
  imageId: string
  selectedAt: string
}

export interface VibeQuizResult {
  id: string
  userId: string
  topStyles: string[]
  topColors: string[]
  topCategories: string[]
  completedAt: string
}

export interface SubmitVibeQuizInput {
  selectedImageIds: string[]
}

// Wedding Identity Types
export interface WeddingPartner {
  id?: string
  name: string
  email?: string
  phone?: string
  isOwner: boolean
  inviteStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  invitedAt?: string
  acceptedAt?: string
}

export interface WeddingIdentity {
  id: string
  displayName: string // e.g., "Rohit & Riya"
  eventDate?: string
  eventType: 'WEDDING' | 'ENGAGEMENT' | 'OTHER'
  partners: WeddingPartner[]
  createdAt: string
  updatedAt: string
}

export interface CreateWeddingIdentityInput {
  partnerOneName: string
  partnerTwoName: string
  eventDate?: string
  eventType?: 'WEDDING' | 'ENGAGEMENT' | 'OTHER'
}

export interface UpdateWeddingIdentityInput {
  displayName?: string
  eventDate?: string
  eventType?: 'WEDDING' | 'ENGAGEMENT' | 'OTHER'
}

export interface InvitePartnerInput {
  email: string
  phone?: string
}
