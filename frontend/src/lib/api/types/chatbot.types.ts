export interface ChatbotContext {
  categoryId?: string
  categoryName?: string
  cityId?: string
  cityName?: string
  budgetMin?: number
  budgetMax?: number
  eventType?: string
}

export interface ChatbotMessageHistory {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatbotMessageRequest {
  message: string
  userId?: string
  sessionId?: string
  conversationId?: string
  resetSession?: boolean
  context?: ChatbotContext
  conversationHistory?: ChatbotMessageHistory[]
}

export interface ChatbotVendorSuggestion {
  id: string
  slug: string
  businessName: string
  tagline?: string
  categoryName?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  isVerified?: boolean
  profileImageUrl?: string
  planTier?: string
  searchBoost?: number
  isProfileBoosted?: boolean
  hasProBadge?: boolean
  hasPremiumBadge?: boolean
  recommendationScore?: number
  recommendationLabel?: 'high' | 'medium' | 'low'
  profileUrl: string
}

export interface FollowUpQuestion {
  id: string
  text: string
  type: 'category' | 'location' | 'budget' | 'eventType' | 'refinement'
}

export interface ChatbotAction {
  id: string
  label: string
  type: 'search' | 'filter' | 'plan' | 'compare' | 'navigate'
  url?: string
  payload?: Record<string, unknown>
}

export interface PlanningToolLink {
  id: string
  label: string
  description: string
  url: string
  icon: 'budget' | 'checklist' | 'timeline' | 'guestlist' | 'vendors'
}

export interface VendorCategoryLink {
  id: string
  name: string
  slug: string
  url: string
}

export interface ChatbotCard {
  id: string
  type: 'vendor' | 'planning'
  title: string
  subtitle?: string
  description?: string
  imageUrl?: string
  ctaLabel?: string
  ctaUrl?: string
}

export interface ChatbotResponseMeta {
  responseTime: number
  vendorsFound: number
  hasMoreResults: boolean
  route?: 'welcome' | 'deterministic' | 'deterministic+llm-refine' | 'llm-tools' | 'fallback'
  provider?: string
}

export interface ChatbotResponse {
  reply: string
  intent: string
  language: 'en' | 'hi' | 'hinglish'
  confidence: number
  suggestions: string[]
  actions: ChatbotAction[]
  cards: ChatbotCard[]
  vendors: ChatbotVendorSuggestion[]
  followUpQuestions: FollowUpQuestion[]
  filters: ChatbotContext
  planningTools?: PlanningToolLink[]
  vendorCategories?: VendorCategoryLink[]
  session: {
    userId?: string
    sessionId?: string
    conversationId?: string
    turns: number
  }
  meta: ChatbotResponseMeta
}

export interface ChatbotHistoryResponse {
  userId: string
  sessionId?: string
  turns: number
  language: 'en' | 'hi' | 'hinglish'
  filters: ChatbotContext
  messages: ChatbotMessageHistory[]
}

// Conversation management types
export interface ConversationListItem {
  id: string
  title: string
  turns: number
  lastMessageAt: string | null
  createdAt: string
  updatedAt: string
  lastMessage?: string
}

export interface ConversationDetail {
  id: string
  title: string
  turns: number
  language: 'en' | 'hi' | 'hinglish'
  filters: ChatbotContext
  messages: ChatbotMessageHistory[]
}
