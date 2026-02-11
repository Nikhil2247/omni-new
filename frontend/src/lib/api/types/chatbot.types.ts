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
  profileUrl: string
}

export interface FollowUpQuestion {
  id: string
  text: string
  type: 'category' | 'location' | 'budget' | 'eventType' | 'refinement'
}

export interface ChatbotResponseMeta {
  responseTime: number
  vendorsFound: number
  hasMoreResults: boolean
}

export interface ChatbotResponse {
  reply: string
  intent: string
  suggestions: string[]
  vendors: ChatbotVendorSuggestion[]
  followUpQuestions: FollowUpQuestion[]
  filters: ChatbotContext
  meta: ChatbotResponseMeta
}
