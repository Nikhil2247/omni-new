'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  MapPin,
  CheckCircle2,
  Lightbulb,
  ChevronRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { chatbotService } from '@/lib/api/services/chatbot.service'
import type {
  ChatbotVendorSuggestion,
  ChatbotContext,
  FollowUpQuestion,
  ChatbotMessageHistory,
} from '@/lib/api/types/chatbot.types'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  createdAt: number
  vendors?: ChatbotVendorSuggestion[]
  suggestions?: string[]
  followUpQuestions?: FollowUpQuestion[]
  filters?: ChatbotContext
}

const STORAGE_KEY = 'omni-chatbot-history-v3'

const DEFAULT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm your AI event planning assistant. I can help you find photographers, caterers, venues, decorators, and more. Just tell me what you're looking for!\n\nTry saying:\n• \"Find photographers in Mumbai under 50K\"\n• \"Best caterers for a wedding\"\n• \"Show me decorators in Delhi\"",
  createdAt: Date.now(),
  suggestions: [
    'Wedding photographer in Delhi',
    'Caterers in Mumbai',
    'Decorators under ₹50K',
    'Premium venues',
  ],
  followUpQuestions: [
    { id: 'event', text: 'What type of event are you planning?', type: 'eventType' },
    { id: 'vendor', text: 'What kind of vendor do you need?', type: 'category' },
  ],
}

const formatPrice = (price?: number) => {
  if (!price) return null
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`
  return `₹${price}`
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <motion.div
        className="h-2 w-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

// Vendor card component
function VendorCard({ vendor }: { vendor: ChatbotVendorSuggestion }) {
  const priceRange = useMemo(() => {
    const min = formatPrice(vendor.minPrice)
    const max = formatPrice(vendor.maxPrice)
    if (min && max) return `${min} - ${max}`
    if (max) return `Up to ${max}`
    if (min) return `From ${min}`
    return null
  }, [vendor.minPrice, vendor.maxPrice])

  return (
    <Link
      href={vendor.profileUrl || `/vendors/${vendor.slug}`}
      className="group block"
    >
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        className="rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-foreground truncate">{vendor.businessName}</h4>
              {vendor.isVerified && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {vendor.categoryName || 'Vendor'}
              {vendor.city && (
                <>
                  <span className="mx-1.5">•</span>
                  <MapPin className="h-3 w-3 inline -mt-0.5" />
                  <span className="ml-1">{vendor.city}</span>
                </>
              )}
            </p>
            {vendor.tagline && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{vendor.tagline}</p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
        </div>
        {priceRange && (
          <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{priceRange}</span>
            <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              View Profile <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        )}
      </motion.div>
    </Link>
  )
}

// Message component
function MessageBubble({
  message,
  onSuggestionClick,
  onFollowUpClick,
}: {
  message: ChatMessage
  onSuggestionClick: (text: string) => void
  onFollowUpClick: (question: FollowUpQuestion) => void
}) {
  const isBot = message.role === 'bot'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isBot ? 'justify-start' : 'justify-end')}
    >
      {isBot && (
        <div className="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
          <Bot className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
      <div className={cn('max-w-[85%] space-y-3', !isBot && 'order-first')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 shadow-sm',
            isBot
              ? 'bg-card border border-border/50 text-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          <p className="whitespace-pre-wrap leading-relaxed text-sm">{message.text}</p>
        </div>

        {/* Vendors */}
        {message.vendors && message.vendors.length > 0 && (
          <div className="space-y-2">
            {message.vendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>
        )}

        {/* Follow-up questions */}
        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3" />
              Quick questions:
            </p>
            <div className="flex flex-wrap gap-2">
              {message.followUpQuestions.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onFollowUpClick(q)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border/60 bg-muted/30 text-foreground hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestionClick(suggestion)}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
              >
                <Sparkles className="h-3 w-3" />
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<ChatbotContext>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load messages from storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.messages && Array.isArray(parsed.messages) && parsed.messages.length > 0) {
          setMessages(parsed.messages)
        }
        if (parsed.context) {
          setContext(parsed.context)
        }
      }
    } catch {
      setMessages([DEFAULT_MESSAGE])
    }
  }, [])

  // Save messages to storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, context }))
  }, [messages, context])

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleClear = () => {
    setMessages([DEFAULT_MESSAGE])
    setContext({})
    inputRef.current?.focus()
  }

  // Build conversation history for the API request
  const buildConversationHistory = (currentMessages: ChatMessage[]): ChatbotMessageHistory[] => {
    // Get last 10 messages for context (5 exchanges)
    const recentMessages = currentMessages.slice(-10)

    return recentMessages
      .filter(msg => msg.id !== 'welcome') // Skip welcome message
      .map((msg) => ({
        role: msg.role === 'bot' ? 'assistant' as const : 'user' as const,
        content: msg.text,
      }))
  }

  const handleSend = async (content?: string) => {
    const text = (content ?? input).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text,
      createdAt: Date.now(),
    }

    // Build history before adding new message
    const conversationHistory = buildConversationHistory(messages)

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatbotService.sendMessage({
        message: text,
        context,
        conversationHistory,
      })

      // Update context with filters from response
      if (response.filters) {
        setContext(response.filters)
      }

      const botMessage: ChatMessage = {
        id: `${Date.now()}-bot`,
        role: 'bot',
        text: response.reply,
        createdAt: Date.now(),
        vendors: response.vendors,
        suggestions: response.suggestions,
        followUpQuestions: response.followUpQuestions,
        filters: response.filters,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'bot',
          text: "I'm having trouble connecting right now. Please try again in a moment.",
          createdAt: Date.now(),
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleFollowUpClick = (question: FollowUpQuestion) => {
    handleSend(question.text)
  }

  // Active filters display
  const activeFilters = useMemo(() => {
    const filters: string[] = []
    if (context.categoryName) filters.push(context.categoryName)
    if (context.cityName) filters.push(context.cityName)
    if (context.budgetMax) filters.push(`Up to ${formatPrice(context.budgetMax)}`)
    if (context.budgetMin && !context.budgetMax) filters.push(`From ${formatPrice(context.budgetMin)}`)
    if (context.eventType) filters.push(context.eventType.replace('_', ' '))
    return filters
  }, [context])

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="mx-auto max-w-4xl px-4 py-8 lg:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg mb-4">
            <Bot className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">AI Event Assistant</h1>
          <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
            Powered by AI to help you discover perfect vendors for your events
          </p>
        </motion.div>

        {/* Active filters */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">Active filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
                <button
                  onClick={() => setContext({})}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat container */}
        <div className="rounded-2xl border border-border/50 bg-card shadow-xl overflow-hidden">
          {/* Chat header */}
          <div className="border-b border-border/50 px-6 py-4 bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">AI Assistant Online</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClear} className="text-muted-foreground">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Chat
            </Button>
          </div>

          {/* Messages area */}
          <div className="h-[500px] overflow-y-auto px-6 py-6 space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSend}
                  onFollowUpClick={handleFollowUpClick}
                />
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-3"
              >
                <div className="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-foreground" />
                </div>
                <div className="rounded-2xl bg-card border border-border/50">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border/50 p-4 bg-muted/20">
            <div className="flex items-end gap-3">
              <div className="flex-1 relative">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about vendors, budgets, or event planning..."
                  className="min-h-[52px] max-h-32 resize-none pr-12 rounded-xl border-border/60 bg-background"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSend()
                    }
                  }}
                />
              </div>
              <Button
                size="lg"
                onClick={() => handleSend()}
                disabled={isLoading || !input.trim()}
                className="h-[52px] px-6 rounded-xl shadow-md"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Send
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3 text-center">
              Try: "Wedding photographer in Mumbai under 50K" or "Best caterers for corporate event"
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
