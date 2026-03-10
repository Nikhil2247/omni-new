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
  Loader2,
  ArrowLeft,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Menu,
  X,
  Calculator,
  ListChecks,
  Clock,
  Users,
  Store,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth-store'
import { useChatStore, type ChatMessage, type ChatThread } from '@/store/chat-store'
import type { ChatbotVendorSuggestion, FollowUpQuestion, ChatbotAction, PlanningToolLink } from '@/lib/api/types/chatbot.types'
import { ChatbotMarkdown } from '@/components/features/chatbot/chatbot-markdown'

const formatPrice = (price?: number) => {
  if (!price) return null
  if (price >= 100000) return `₹${(price / 100000).toFixed(1)}L`
  if (price >= 1000) return `₹${(price / 1000).toFixed(0)}K`
  return `₹${price}`
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary/50"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, delay }}
        />
      ))}
    </div>
  )
}

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
    <Link href={vendor.profileUrl || `/vendors/${vendor.slug}`} className="group block">
      <div className="rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium">{vendor.businessName}</span>
              {vendor.isVerified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {vendor.categoryName}
              {vendor.city && (
                <>
                  <span className="mx-1">•</span>
                  <MapPin className="inline h-3 w-3" /> {vendor.city}
                </>
              )}
            </p>
            {priceRange && <p className="mt-1 text-xs font-medium text-primary">{priceRange}</p>}
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
        </div>
      </div>
    </Link>
  )
}

const PlanningToolIcon = ({ icon }: { icon: PlanningToolLink['icon'] }) => {
  switch (icon) {
    case 'budget':
      return <Calculator className="h-4 w-4" />
    case 'checklist':
      return <ListChecks className="h-4 w-4" />
    case 'timeline':
      return <Clock className="h-4 w-4" />
    case 'guestlist':
      return <Users className="h-4 w-4" />
    case 'vendors':
      return <Store className="h-4 w-4" />
    default:
      return <ExternalLink className="h-4 w-4" />
  }
}

function ActionButton({ action }: { action: ChatbotAction }) {
  if (action.url) {
    return (
      <Link
        href={action.url}
        className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
      >
        {action.label}
        <ExternalLink className="h-3 w-3" />
      </Link>
    )
  }
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
    >
      {action.label}
    </button>
  )
}

function PlanningToolsGrid({ tools }: { tools: PlanningToolLink[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {tools.slice(0, 6).map((tool) => (
        <Link
          key={tool.id}
          href={tool.url}
          className="group flex flex-col gap-1.5 rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-primary/30 hover:shadow-sm"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <PlanningToolIcon icon={tool.icon} />
            </div>
            <span className="text-sm font-medium">{tool.label}</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
        </Link>
      ))}
    </div>
  )
}

function MessageBubble({
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isBot ? 'justify-start' : 'justify-end')}
    >
      {isBot && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bot className="h-4 w-4 text-primary" />
        </div>
      )}

      <div className={cn('max-w-[85%] space-y-3', !isBot && 'order-first')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm',
            isBot ? 'bg-muted' : 'bg-primary text-primary-foreground'
          )}
        >
          <ChatbotMarkdown content={message.text} variant={isBot ? 'bot' : 'user'} />
        </div>

        {message.vendors && message.vendors.length > 0 && (
          <div className="space-y-2">
            {message.vendors.map((v) => (
              <VendorCard key={v.id} vendor={v} />
            ))}
          </div>
        )}

        {message.followUpQuestions && message.followUpQuestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.followUpQuestions.map((q) => (
              <button
                key={q.id}
                type="button"
                onClick={() => onFollowUp(q)}
                className="flex items-center gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
              >
                <Lightbulb className="h-3 w-3" />
                {q.text}
              </button>
            ))}
          </div>
        )}

        {message.suggestions && message.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
              >
                <Sparkles className="h-3 w-3" />
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

function ThreadItem({
  thread,
  isActive,
  onSelect,
  onRename,
  onDelete,
  onClear,
}: {
  thread: ChatThread
  isActive: boolean
  onSelect: () => void
  onRename: (title: string) => void
  onDelete: () => void
  onClear: () => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(thread.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isEditing])

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== thread.title) {
      onRename(editTitle.trim())
    }
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors cursor-pointer',
        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
      )}
      onClick={onSelect}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSaveTitle}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveTitle()
            if (e.key === 'Escape') {
              setEditTitle(thread.title)
              setIsEditing(false)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent text-sm outline-none border-b border-primary"
        />
      ) : (
        <span className="flex-1 truncate text-sm">{thread.title}</span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
          >
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onClear()
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Clear messages
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />
            Delete chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function AssistantPage() {
  const { user, isAuthenticated, hasHydrated: authHydrated } = useAuthStore()
  const userId = user?.id

  const {
    threads,
    activeThreadId,
    isLoading,
    isHydrated,
    isSyncing,
    getActiveThread,
    getMessages,
    setActiveThreadId,
    createThread,
    deleteThread,
    clearThread,
    renameThread,
    sendMessage,
    loadConversation,
    initialize,
  } = useChatStore()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const activeThread = getActiveThread()
  const messages = getMessages()

  // Active filters from current thread context
  const activeFilters = useMemo(() => {
    if (!activeThread?.context) return []
    const { context } = activeThread
    const filters: string[] = []
    if (context.categoryName) filters.push(context.categoryName)
    if (context.cityName) filters.push(context.cityName)
    if (context.budgetMax) filters.push(`Up to ${formatPrice(context.budgetMax)}`)
    if (context.budgetMin && !context.budgetMax) filters.push(`From ${formatPrice(context.budgetMin)}`)
    if (context.eventType) filters.push(context.eventType.replace('_', ' '))
    return filters
  }, [activeThread?.context])

  // Initialize on mount
  useEffect(() => {
    if (!authHydrated) return
    initialize(isAuthenticated ? userId : undefined)
  }, [authHydrated, isAuthenticated, userId, initialize])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on mount
  useEffect(() => {
    if (isHydrated) {
      inputRef.current?.focus()
    }
  }, [isHydrated])

  // Close sidebar on mobile when thread selected
  const handleSelectThread = async (threadId: string) => {
    if (threadId === activeThreadId) {
      setSidebarOpen(false)
      return
    }
    setActiveThreadId(threadId)
    // Load full conversation if it's from backend
    if (!threadId.startsWith('local-')) {
      await loadConversation(threadId)
    }
    setSidebarOpen(false)
  }

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
    console.log('[handleNewChat] Button clicked')
    await createThread()
    console.log('[handleNewChat] createThread completed')
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-[100dvh] bg-background">
      {/* Sidebar Overlay for mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-72 flex-col border-r bg-background transition-transform md:relative md:translate-x-0 md:flex',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Chats</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNewChat}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto p-2">
          {isSyncing ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No chats yet
            </div>
          ) : (
            <div className="space-y-1">
              {threads.map((thread) => (
                <ThreadItem
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  onSelect={() => handleSelectThread(thread.id)}
                  onRename={(title) => renameThread(thread.id, title)}
                  onDelete={() => deleteThread(thread.id)}
                  onClear={() => clearThread(thread.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-3">
          <p className="text-xs text-center text-muted-foreground">
            {isAuthenticated ? 'Conversations synced' : 'Sign in to save chats'}
          </p>
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-8 w-8 hidden md:flex">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-sm font-semibold truncate max-w-[200px]">
                {activeThread?.title || 'AI Assistant'}
              </h1>
              <p className="text-xs text-muted-foreground">
                {activeThread ? `${activeThread.turns} messages` : 'Start a conversation'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => clearThread()}
              className="h-8 w-8 text-muted-foreground"
              title="Clear messages"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Active filters */}
        <AnimatePresence>
          {activeFilters.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b px-4 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Filters:</span>
                {activeFilters.map((filter) => (
                  <Badge key={filter} variant="secondary" className="text-xs">
                    {filter}
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl space-y-4 px-4 py-6">
            <AnimatePresence mode="popLayout">
              {messages.map((m) => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onSuggestion={handleSend}
                  onFollowUp={(q) => handleSend(q.text)}
                />
              ))}
            </AnimatePresence>

            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-muted">
                  <TypingIndicator />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t bg-background p-4">
          <div className="mx-auto flex max-w-2xl items-end gap-3">
            <textarea
              ref={inputRef}
              placeholder="Ask about vendors, budgets, or event planning..."
              className="min-h-[44px] max-h-32 flex-1 resize-none rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background"
              rows={1}
              onKeyDown={handleKeyDown}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 128) + 'px'
              }}
            />
            <Button
              size="icon"
              className="h-11 w-11 shrink-0 rounded-xl"
              onClick={() => handleSend()}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
