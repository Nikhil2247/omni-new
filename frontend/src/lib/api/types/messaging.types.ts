// ============================================================================
// MESSAGING MODULE TYPES
// ============================================================================

export type ConversationType = 'DIRECT' | 'LEAD'

export type ParticipantRole = 'PLANNER' | 'VENDOR'

export interface MessagingUserSummary {
  id: string
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  avatarUrl?: string | null
  vendorProfile?: {
    id: string
    slug?: string | null
    businessName?: string | null
    profilePhotoUrl?: string | null
  } | null
}

export interface ConversationParticipant {
  id: string
  conversationId: string
  userId: string
  role: ParticipantRole
  lastReadAt?: string | null
  createdAt?: string
  updatedAt?: string
  user?: MessagingUserSummary
}

export type MessageAttachmentType = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'OTHER'

export interface MessageAttachment {
  id: string
  messageId: string
  type: MessageAttachmentType
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  createdAt?: string
}

export interface MessageReaction {
  id: string
  messageId: string
  userId: string
  emoji: string
  createdAt?: string
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  createdAt: string
  updatedAt?: string
  attachments?: MessageAttachment[]
  reactions?: MessageReaction[]
  sender?: MessagingUserSummary
  status?: 'sending' | 'failed'
}

export interface Conversation {
  id: string
  type: ConversationType
  leadId?: string | null
  createdAt: string
  updatedAt: string
  lastMessageAt?: string | null
  participants?: ConversationParticipant[]
  messages?: Message[]
}

export interface CreateDirectConversationPayload {
  participantUserId: string
}

export interface SendMessagePayload {
  content: string
  attachments?: Array<{
    type: MessageAttachmentType
    url: string
    fileName: string
    fileSize: number
    mimeType: string
  }>
}

export interface MessageListParams {
  page?: number
  limit?: number
}

export interface ConversationListParams {
  page?: number
  limit?: number
}

export interface AddReactionPayload {
  emoji: string
}
