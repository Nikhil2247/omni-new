export type NotificationType =
  | 'NEW_LEAD'
  | 'LEAD_RESPONSE'
  | 'NEW_MESSAGE'
  | 'ACCOUNT_VERIFIED'
  | 'PASSWORD_CHANGED'
  | 'TWO_FACTOR_ENABLED'
  | 'SUSPICIOUS_LOGIN'
  | 'SESSION_EXPIRED'
  | 'PROFILE_APPROVED'
  | 'PROFILE_REJECTED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'NEW_REVIEW'
  | 'EVENT_REMINDER'
  | 'TASK_ASSIGNED'
  | 'TASK_DUE'
  | 'VENDOR_BOOKED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'MAINTENANCE'

export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, unknown> | null
  actionUrl?: string | null
  imageUrl?: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationListResponse {
  items: NotificationItem[]
  meta: {
    page: number
    limit: number
    total: number
    unreadCount: number
  }
}
