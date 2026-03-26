// ============================================================================
// E-INVITE TYPES
// ============================================================================

export type EInviteCategory =
  | 'WEDDING'
  | 'ENGAGEMENT'
  | 'BIRTHDAY'
  | 'BABY_SHOWER'
  | 'ANNIVERSARY'
  | 'CORPORATE'
  | 'HOUSEWARMING'
  | 'GRADUATION'
  | 'OTHER';

export type EInviteChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'LINK';

export type EInviteSentStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'VIEWED' | 'FAILED';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface EInviteTemplate {
  id: string;
  name: string;
  category: EInviteCategory;
  thumbnailUrl: string | null;
  canvasJson: Record<string, any>;
  defaultColors: {
    primary: string;
    secondary: string;
    accent: string;
  } | null;
  isActive: boolean;
  isPremium: boolean;
  sortOrder: number;
  createdAt: string;
}

// ============================================================================
// E-INVITE TYPES
// ============================================================================

export interface EInvite {
  id: string;
  eventId: string;
  templateId: string | null;
  title: string | null;
  canvasJson: Record<string, any>;
  previewUrl: string | null;
  eventName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  eventAddress: string | null;
  hostNames: string | null;
  customMessage: string | null;
  shareCode: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  template?: EInviteTemplate | null;
  sentCount?: number;
  viewedCount?: number;
}

export interface EInviteSent {
  id: string;
  einviteId: string;
  guestId: string;
  channel: EInviteChannel;
  status: EInviteSentStatus;
  sentAt: string | null;
  deliveredAt: string | null;
  viewedAt: string | null;
  guest?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string | null;
  };
}

// ============================================================================
// INPUT TYPES
// ============================================================================

export interface CreateEInviteInput {
  eventId: string;
  templateId?: string;
  title?: string;
  canvasJson: Record<string, any>;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  eventAddress?: string;
  hostNames?: string;
  customMessage?: string;
}

export interface UpdateEInviteInput {
  title?: string;
  canvasJson?: Record<string, any>;
  previewUrl?: string;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  eventVenue?: string;
  eventAddress?: string;
  hostNames?: string;
  customMessage?: string;
  isPublished?: boolean;
}

export interface SendEInviteInput {
  guestIds: string[];
  channel: EInviteChannel;
  customMessage?: string;
}

export interface BulkSendEInviteInput {
  channel: EInviteChannel;
  customMessage?: string;
  excludeAlreadySent?: boolean;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface SendEInviteResponse {
  sent: number;
  skipped: number;
}

export interface PublicEInvite {
  id: string;
  canvasJson: Record<string, any>;
  eventName: string | null;
  eventDate: string | null;
  eventTime: string | null;
  eventVenue: string | null;
  eventAddress: string | null;
  hostNames: string | null;
  customMessage: string | null;
  previewUrl: string | null;
}
