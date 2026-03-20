// ============================================================================
// EVENT CONSTANTS - Domain Event Names
// ============================================================================
// Centralized event name definitions for the event-driven architecture
// ============================================================================

// User & Authentication Events
export const USER_EVENTS = {
  CREATED: 'user.created',
  UPDATED: 'user.updated',
  DELETED: 'user.deleted',
  LOGGED_IN: 'user.loggedIn',
  LOGGED_OUT: 'user.loggedOut',
  LOGGED_OUT_ALL_DEVICES: 'user.loggedOutAllDevices',
  PASSWORD_CHANGED: 'user.passwordChanged',
  PASSWORD_RESET_REQUESTED: 'user.passwordResetRequested',
  PASSWORD_RESET: 'user.passwordReset',
  ACCOUNT_LOCKED: 'user.accountLocked',
  ACCOUNT_UNLOCKED: 'user.accountUnlocked',
  EMAIL_VERIFIED: 'user.emailVerified',
  ROLE_ASSIGNED: 'user.roleAssigned',
  ROLE_REMOVED: 'user.roleRemoved',
} as const;

// Vendor Profile Events
export const VENDOR_EVENTS = {
  CREATED: 'vendor.created',
  UPDATED: 'vendor.updated',
  DELETED: 'vendor.deleted',
  PUBLISHED: 'vendor.published',
  UNPUBLISHED: 'vendor.unpublished',
  VERIFIED: 'vendor.verified',
  VERIFICATION_REQUESTED: 'vendor.verificationRequested',
  REJECTED: 'vendor.rejected',
  SUSPENDED: 'vendor.suspended',
  REACTIVATED: 'vendor.reactivated',
  FEATURED: 'vendor.featured',
  UNFEATURED: 'vendor.unfeatured',
  CLAIMED: 'vendor.claimed',
} as const;

// Vendor Claim Events
export const VENDOR_CLAIM_EVENTS = {
  INITIATED: 'vendor.claim.initiated',
  VERIFICATION_SENT: 'vendor.claim.verification_sent',
  VERIFIED: 'vendor.claim.verified',
  APPROVED: 'vendor.claim.approved',
  REJECTED: 'vendor.claim.rejected',
  EXPIRED: 'vendor.claim.expired',
} as const;

// Portfolio & Media Events
export const PORTFOLIO_EVENTS = {
  CREATED: 'portfolio.created',
  UPDATED: 'portfolio.updated',
  DELETED: 'portfolio.deleted',
} as const;

export const MEDIA_EVENTS = {
  UPLOADED: 'media.uploaded',
  DELETED: 'media.deleted',
  PROCESSED: 'media.processed',
  THUMBNAIL_GENERATED: 'media.thumbnailGenerated',
} as const;

// Lead Events
export const LEAD_EVENTS = {
  CREATED: 'lead.created',
  UPDATED: 'lead.updated',
  STATUS_CHANGED: 'lead.statusChanged',
  ASSIGNED: 'lead.assigned',
  CONVERTED: 'lead.converted',
  LOST: 'lead.lost',
  MESSAGE_SENT: 'lead.messageSent',
  MESSAGE_READ: 'lead.messageRead',
} as const;

// Event Planning Events
export const EVENT_EVENTS = {
  CREATED: 'event.created',
  UPDATED: 'event.updated',
  DELETED: 'event.deleted',
  STATUS_CHANGED: 'event.statusChanged',
  VENDOR_ADDED: 'event.vendorAdded',
  VENDOR_REMOVED: 'event.vendorRemoved',
  TASK_CREATED: 'event.taskCreated',
  TASK_COMPLETED: 'event.taskCompleted',
} as const;

// Review Events
export const REVIEW_EVENTS = {
  CREATED: 'review.created',
  UPDATED: 'review.updated',
  DELETED: 'review.deleted',
  APPROVED: 'review.approved',
  REJECTED: 'review.rejected',
  RESPONSE_ADDED: 'review.responseAdded',
} as const;

// Category Events
export const CATEGORY_EVENTS = {
  CREATED: 'category.created',
  UPDATED: 'category.updated',
  DELETED: 'category.deleted',
} as const;

// Service Events
export const SERVICE_EVENTS = {
  CREATED: 'service.created',
  UPDATED: 'service.updated',
  DELETED: 'service.deleted',
} as const;

// KYC/KYB Events
export const KYC_EVENTS = {
  SUBMITTED: 'kyc.submitted',
  APPROVED: 'kyc.approved',
  REJECTED: 'kyc.rejected',
  DOCUMENT_UPLOADED: 'kyc.documentUploaded',
  DOCUMENT_VERIFIED: 'kyc.documentVerified',
} as const;

// Analytics Events
export const ANALYTICS_EVENTS = {
  PROFILE_VIEWED: 'analytics.profileViewed',
  PROFILE_LIKED: 'analytics.profileLiked',
  PROFILE_SAVED: 'analytics.profileSaved',
  SEARCH_PERFORMED: 'analytics.searchPerformed',
  LEAD_INTERACTION: 'analytics.leadInteraction',
} as const;

// Notification Events
export const NOTIFICATION_EVENTS = {
  CREATED: 'notification.created',
  READ: 'notification.read',
  DELETED: 'notification.deleted',
} as const;

// Cache Events
export const CACHE_EVENTS = {
  INVALIDATE: 'cache.invalidate',
  INVALIDATE_PATTERN: 'cache.invalidatePattern',
  WARM_UP: 'cache.warmUp',
} as const;

// Search Index Events
export const SEARCH_EVENTS = {
  INDEX_VENDOR: 'search.indexVendor',
  REMOVE_VENDOR: 'search.removeVendor',
  REINDEX_ALL: 'search.reindexAll',
} as const;

// All events combined for type safety
export const ALL_EVENTS = {
  ...USER_EVENTS,
  ...VENDOR_EVENTS,
  ...VENDOR_CLAIM_EVENTS,
  ...PORTFOLIO_EVENTS,
  ...MEDIA_EVENTS,
  ...LEAD_EVENTS,
  ...EVENT_EVENTS,
  ...REVIEW_EVENTS,
  ...CATEGORY_EVENTS,
  ...SERVICE_EVENTS,
  ...KYC_EVENTS,
  ...ANALYTICS_EVENTS,
  ...NOTIFICATION_EVENTS,
  ...CACHE_EVENTS,
  ...SEARCH_EVENTS,
} as const;

export type EventName = (typeof ALL_EVENTS)[keyof typeof ALL_EVENTS];

// Event payload types
export interface BaseEventPayload {
  timestamp: Date;
}

export interface UserEventPayload extends BaseEventPayload {
  userId: string;
  email?: string;
}

export interface VendorEventPayload extends BaseEventPayload {
  vendorProfileId: string;
  userId?: string;
}

export interface VendorClaimEventPayload extends BaseEventPayload {
  claimId: string;
  vendorProfileId: string;
  userId: string;
  adminUserId?: string;
  verificationMethod?: string;
  reason?: string;
}

export interface LeadEventPayload extends BaseEventPayload {
  leadId: string;
  vendorProfileId: string;
  plannerId?: string;
}

export interface MediaEventPayload extends BaseEventPayload {
  mediaItems: { id: string; url: string }[];
  vendorProfileId: string;
  portfolioId: string;
}

export interface CacheInvalidationPayload extends BaseEventPayload {
  keys?: string[];
  pattern?: string;
  entityType?: string;
  entityId?: string;
}

export interface SearchIndexPayload extends BaseEventPayload {
  entityType: 'vendor' | 'category' | 'service';
  entityId: string;
  action: 'index' | 'remove' | 'update';
}
