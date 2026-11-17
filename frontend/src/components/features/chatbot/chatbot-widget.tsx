'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  Send,
  Sparkles,
  Trash2,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Maximize2,
  Loader2,
  X,
  Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { skBtn } from '@/components/sketch'
import { useAuthStore } from '@/store/auth-store'
import { useChatStore, type ChatMessage } from '@/store/chat-store'
import type { ChatbotVendorSuggestion, FollowUpQuestion } from '@/lib/api/types/chatbot.types'
import { ChatbotMarkdown } from '@/components/features/chatbot/chatbot-markdown'

const formatPrice = (price?: number) => {
  if (!price) return null
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`
  return `₹${price}`
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="bg-blue/60 h-1.5 w-1.5 rounded-full"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay }}
        />
      ))}
    </div>
  )
}

function CompactVendorCard({ vendor }: { vendor: ChatbotVendorSuggestion }) {
  const priceRange = useMemo(() => {
    const min = formatPrice(vendor.minPrice)
    const max = formatPrice(vendor.maxPrice)
    if (min && max) return `${min} - ${max}`
    if (max) return `Up to ${max}`
    return null
  }, [vendor.minPrice, vendor.maxPrice])

  return (
    <Link
      href={vendor.profileUrl || `/vendors/${vendor.slug}`}
      className="group border-ink bg-card block rounded-lg border-2 p-2.5 transition-all hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <span className="truncate text-sm font-medium">{vendor.businessName}</span>
            {vendor.isVerified && <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {vendor.categoryName}
            {vendor.city && (
              <>
                <span className="mx-1">•</span>
                <MapPin className="inline h-2.5 w-2.5" /> {vendor.city}
              </>
            )}
          </p>
          {priceRange && <p className="mt-0.5 text-xs font-medium text-primary">{priceRange}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
      </div>
    </Link>
  )
}

function WidgetMessage({
  message,
  onSuggestion,
  onFollowUp,
}: {
  message: ChatMessage
  onSuggestion: (text: string) => void
  onFollowUp: (q: FollowUpQuestion) => void
}) {
  const isBot = message.role === 'bot'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-2', isBot ? 'justify-start' : 'justify-end')}
    >
      {isBot && (
        <div className="border-ink bg-gold flex size-7 shrink-0 items-center justify-center rounded-full border-2">
          <Bot className="text-ink h-3.5 w-3.5" />
        </div>
      )}

      <div className={cn('max-w-[85%] space-y-1.5', !isBot && 'order-first')}>
        <div
          className={cn(
            'px-3.5 py-2.5 text-sm',
            isBot
              ? 'border-ink bg-card rounded-[18px_18px_18px_4px] border-2'
              : 'bg-blue text-on-blue rounded-[18px_18px_4px_18px]'
          )}
        >
          <ChatbotMarkdown content={message.text} variant={isBot ? 'bot' : 'user'} />
        </div>

        {message.vendors && message.vendors.length > 0 && (
          <div className="space-y-1.5">
            {message.vendors.slice(0, 3).map((v) => (
              <CompactVendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}

        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.followUpQuestions.slice(0, 2).map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onFollowUp(q)}
                className="border-blue-wash bg-card text-ink-soft hover:border-blue hover:text-ink flex items-center gap-1 rounded-[12px_40px_14px_36px/36px_12px_40px_14px] border-2 border-dashed px-2.5 py-1 text-xs transition-colors"
              >
                <Lightbulb className="h-2.5 w-2.5" />
                {q.text.length > 28 ? q.text.slice(0, 28) + '...' : q.text}
              </button>
            ))}
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {message.suggestions.slice(0, 3).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="border-ink bg-card text-ink hover:bg-blue-wash/40 flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold transition-colors"
              >
                <Sparkles className="h-2.5 w-2.5" />
                {s.length > 22 ? s.slice(0, 22) + '...' : s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export function ChatbotWidget() {
  const { user, isAuthenticated, hasHydrated: authHydrated } = useAuthStore()
  const userId = user?.id

  const [open, setOpen] = useState(false)

  const {
    isLoading,
    isHydrated,
    getActiveThread,
    getMessages,
    sendMessage,
    clearThread,
    createThread,
    initialize,
  } = useChatStore()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeThread = getActiveThread()
  const messages = getMessages()

  // Initialize store with user context
  useEffect(() => {
    if (!authHydrated) return
    initialize(isAuthenticated ? userId : undefined)
  }, [authHydrated, isAuthenticated, userId, initialize])

  // Scroll to bottom when open
  useEffect(() => {
    if (!open) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, open])

  // Focus input when opened
  useEffect(() => {
    if (open && isHydrated) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, isHydrated])

  const handleSend = async (content?: string) => {
    const text = content ?? inputRef.current?.value ?? ''
    if (!text.trim()) return

    if (inputRef.current) {
      inputRef.current.value = ''
      inputRef.current.style.height = 'auto'
    }

    await sendMessage(text)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleNewChat = async () => {
    await createThread()
  }

  return (
    <>
      {/* Trigger button */}
      <AnimatePresence>
        {!open && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6"
          >
            <button type="button" onClick={() => setOpen(true)} className="sk-btn !px-5 !py-3.5" aria-label="Open AI assistant">
              <Sparkles className="size-5" />
              <span>AI Assistant</span>
              <span
                className="border-ink bg-gold absolute -top-1.5 -right-1 flex size-5 items-center justify-center rounded-full border-2 text-[10px] text-[#2a1c00]"
                aria-hidden
              >
                ✦
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="sk-paper [--hand:26px_70px_28px_60px/60px_26px_70px_24px] fixed bottom-4 right-4 z-50 flex h-[min(620px,calc(100dvh-2rem))] w-[min(390px,calc(100vw-2rem))] flex-col md:bottom-6 md:right-6"
          >
            {/* Header */}
            <div className="border-line flex items-center justify-between border-b-2 border-dashed px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="border-ink bg-gold flex size-9 items-center justify-center rounded-full border-2">
                  <Bot className="text-ink h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-display max-w-[150px] truncate text-base font-semibold">
                    {activeThread?.title || 'AI Assistant'}
                  </p>
                  <p className="text-ink-soft truncate text-xs">
                    {isAuthenticated ? 'Synced' : 'Sign in to save'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNewChat}
                  className="h-8 w-8"
                  title="New chat"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-8 w-8" title="Open full page">
                  <Link href="/assistant" onClick={() => setOpen(false)}>
                    <Maximize2 className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => clearThread()}
                  className="h-8 w-8"
                  title="Clear chat"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8" title="Close">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {messages.map((m) => (
                    <WidgetMessage
                      key={m.id}
                      message={m}
                      onSuggestion={handleSend}
                      onFollowUp={(q) => handleSend(q.text)}
                    />
                  ))}
                </AnimatePresence>

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                    <div className="border-ink bg-gold flex size-7 items-center justify-center rounded-full border-2">
                      <Bot className="text-ink h-3.5 w-3.5" />
                    </div>
                    <div className="border-ink bg-card rounded-[18px_18px_18px_4px] border-2">
                      <TypingIndicator />
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="border-line border-t-2 border-dashed p-3">
              <div className="flex items-end gap-2">
                <textarea
                  ref={inputRef}
                  placeholder="Ask about vendors, budgets, venues..."
                  className="border-blue-wash bg-card focus:border-blue placeholder:text-ink-soft max-h-24 min-h-[40px] flex-1 resize-none rounded-[14px_40px_16px_36px/36px_14px_40px_16px] border-2 px-3.5 py-2.5 text-sm outline-none transition-colors"
                  rows={1}
                  onKeyDown={handleKeyDown}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement
                    target.style.height = 'auto'
                    target.style.height = Math.min(target.scrollHeight, 96) + 'px'
                  }}
                />
                <button type="button" className={skBtn('solid', 'icon', 'shrink-0')} onClick={() => handleSend()} disabled={isLoading} aria-label="Send message">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
