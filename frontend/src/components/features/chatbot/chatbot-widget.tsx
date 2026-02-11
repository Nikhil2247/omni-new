'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Lightbulb,
  Maximize2,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { chatbotService } from '@/lib/api/services/chatbot.service'
import type {
  ChatbotVendorSuggestion,
  ChatbotContext,
  FollowUpQuestion,
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
}

const STORAGE_KEY = 'omni-chatbot-history-v2'

const DEFAULT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm your event planning assistant. Tell me what vendors you need, your city, and budget - I'll find the perfect matches!",
  createdAt: Date.now(),
  suggestions: ['Wedding photographer in Delhi', 'Catering under ₹80K', 'Decorators in Mumbai'],
  followUpQuestions: [
    { id: 'vendor', text: 'What kind of vendor do you need?', type: 'category' },
    { id: 'location', text: 'Which city?', type: 'location' },
  ],
}

const formatPrice = (price?: number) => {
  if (!price) return null
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`
  return `₹${price}`
}

// Typing indicator
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
      />
      <motion.div
        className="h-1.5 w-1.5 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  )
}

// Compact vendor card for widget
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
      className="group block rounded-xl border border-border/60 bg-background/80 p-3 transition-all hover:border-primary/40 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-sm text-foreground truncate">{vendor.businessName}</span>
            {vendor.isVerified && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {vendor.categoryName || 'Vendor'}
            {vendor.city && (
              <>
                <span className="mx-1">•</span>
                <MapPin className="h-2.5 w-2.5 inline -mt-0.5" />
                <span className="ml-0.5">{vendor.city}</span>
              </>
            )}
          </p>
          {priceRange && <p className="text-xs font-medium text-primary mt-1">{priceRange}</p>}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary shrink-0 transition-colors" />
      </div>
    </Link>
  )
}

export function ChatbotWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([DEFAULT_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [context, setContext] = useState<ChatbotContext>({})
  const bottomRef = useRef<HTMLDivElement | null>(null)

  // Load from storage
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

  // Save to storage
  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, context }))
  }, [messages, context])

  // Scroll to bottom
  useEffect(() => {
    if (!open) return
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open, isLoading])

  const lastSuggestions = useMemo(() => {
    const last = [...messages].reverse().find((m) => m.suggestions?.length)
    return last?.suggestions || []
  }, [messages])

  const handleClear = () => {
    setMessages([DEFAULT_MESSAGE])
    setContext({})
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

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await chatbotService.sendMessage({ message: text, context })

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
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'bot',
          text: "Sorry, I couldn't connect. Please try again.",
          createdAt: Date.now(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="fixed bottom-24 right-4 z-50 h-12 gap-2 rounded-full bg-gradient-to-r from-primary to-primary/80 px-5 shadow-xl shadow-primary/20 md:bottom-6 md:right-6 hover:shadow-2xl hover:shadow-primary/30 transition-all">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Chat</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-full w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-sm">
                <Bot className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <SheetTitle className="text-base">Event Assistant</SheetTitle>
                <p className="text-xs text-muted-foreground">Find perfect vendors</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                <Link href="/assistant">
                  <Maximize2 className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleClear} className="h-8 w-8">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2', message.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  {message.role === 'bot' && (
                    <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className={cn('max-w-[85%] space-y-2', message.role === 'user' && 'order-first')}>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-sm shadow-sm',
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                    </div>

                    {/* Vendors */}
                    {message.vendors && message.vendors.length > 0 && (
                      <div className="space-y-2">
                        {message.vendors.map((vendor) => (
                          <CompactVendorCard key={vendor.id} vendor={vendor} />
                        ))}
                      </div>
                    )}

                    {/* Follow-up questions */}
                    {message.followUpQuestions && message.followUpQuestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {message.followUpQuestions.slice(0, 2).map((q) => (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => handleSend(q.text)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-border/60 bg-background/50 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors flex items-center gap-1"
                          >
                            <Lightbulb className="h-3 w-3" />
                            {q.text.length > 30 ? q.text.slice(0, 30) + '...' : q.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2">
                <div className="shrink-0 h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-muted">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="border-t px-4 py-3 space-y-3">
          {/* Quick suggestions */}
          {lastSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lastSuggestions.slice(0, 3).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors"
                  onClick={() => handleSend(suggestion)}
                >
                  <Sparkles className="h-3 w-3" />
                  {suggestion.length > 25 ? suggestion.slice(0, 25) + '...' : suggestion}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about vendors..."
              className="min-h-[44px] max-h-24 resize-none text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
