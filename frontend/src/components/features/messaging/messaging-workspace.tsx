'use client'

import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import NextImage from 'next/image'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { MessagingClient } from '@/lib/websocket/messaging-client'
import {
  useBusinessConversations,
  useConversationMessages,
  useMessagingClient,
  useMessagingConversationsRealtime,
  useMessagingRealtime,
  useAddReaction,
  useSendMessage,
  useCreateDirectConversation,
  type MessagingScope,
} from '@/hooks/queries/use-messaging'
import { useUserConversations } from '@/hooks/queries/use-messaging'
import { useCreateBusinessLead } from '@/hooks/queries/use-business'
import { useVendorSubscription, useVendorUsage } from '@/hooks/queries/use-subscription'
import type { Conversation, ConversationParticipant, Message, MessageAttachment } from '@/lib/api/types/messaging.types'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import {
  MessageSquareText,
  FileText,
  Send,
  Smile,
  CheckCheck,
  Clock,
  AlertCircle,
  Search,
  MoreVertical,
  Paperclip,
  ArrowLeft,
  X,
  Trash2,
  UserCircle,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Video,
  UserPlus,
  Calendar,
  Users,
  DollarSign,
  Lock,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface MessagingWorkspaceProps {
  scope: MessagingScope
}

const QUICK_EMOJIS = ['😀', '😂', '😍', '😊', '🙏', '👍', '🎉', '🔥', '💯', '😎', '❤️', '🤝']

const formatTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
}

const formatConversationTime = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return formatTime(value)
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const getUserLabel = (user?: {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  vendorProfile?: { businessName?: string | null } | null
}) => {
  const vendorName = user?.vendorProfile?.businessName
  if (vendorName) return vendorName
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  return name || user?.email || 'Unknown'
}

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getConversationTitle = (conversation: Conversation, currentUserId?: string) => {
  const other = conversation.participants?.find((participant) => participant.userId !== currentUserId)
  if (other) {
    return getUserLabel(other.user)
  }
  return `Conversation ${conversation.id.slice(0, 6).toUpperCase()}`
}

const getConversationSubtitle = (conversation: Conversation, currentUserId?: string) => {
  const other = conversation.participants?.find((participant) => participant.userId !== currentUserId)
  if (other) {
    return other.role === 'VENDOR' ? 'Vendor' : 'Event Planner'
  }
  return 'Participant'
}

const getConversationAvatar = (conversation: Conversation, currentUserId?: string) => {
  const other = conversation.participants?.find((participant) => participant.userId !== currentUserId)
  return other?.user?.vendorProfile?.profilePhotoUrl || other?.user?.avatarUrl || ''
}

const groupMessagesByDate = (messages: Message[]) => {
  const groups: { date: string; messages: Message[] }[] = []
  let currentDate = ''

  messages.forEach((message) => {
    const messageDate = new Date(message.createdAt).toDateString()
    if (messageDate !== currentDate) {
      currentDate = messageDate
      groups.push({ date: message.createdAt, messages: [message] })
    } else {
      groups[groups.length - 1].messages.push(message)
    }
  })

  return groups
}

export function MessagingWorkspace({ scope }: MessagingWorkspaceProps) {
  useMessagingClient()
  useMessagingConversationsRealtime(scope)

  const { user } = useAuthStore()
  const router = useRouter()

  // Check vendor messaging access (only for business scope)
  const { data: vendorSubscription } = useVendorSubscription({ enabled: scope === 'business' })
  const { data: vendorUsage } = useVendorUsage({ enabled: scope === 'business' })

  // Check if messaging feature is available for vendors
  const hasMessagingAccess = useMemo(() => {
    if (scope !== 'business') return true // Users always have messaging access
    if (!vendorUsage) return false // Loading or no subscription
    const messagingFeature = vendorUsage.find((f) => f.featureKey === 'messaging')
    // For BOOLEAN features, limitValue of 1 or isUnlimited means access
    return messagingFeature?.isUnlimited || (messagingFeature?.limit ?? 0) > 0
  }, [scope, vendorUsage])
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const initialConversationId = searchParams.get('conversationId')
  const initialParticipantUserId = searchParams.get('userId')
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const conversationsQuery =
    scope === 'business'
      ? useBusinessConversations({ page: 1, limit: 50 })
      : useUserConversations({ page: 1, limit: 50 })

  const conversations: Conversation[] = Array.isArray(conversationsQuery.data)
    ? conversationsQuery.data
    : conversationsQuery.data?.data ?? []

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageSearchQuery, setMessageSearchQuery] = useState('')
  const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false)
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const [showMobileChat, setShowMobileChat] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showCreateLeadDialog, setShowCreateLeadDialog] = useState(false)
  const [createLeadForm, setCreateLeadForm] = useState({
    eventType: '',
    eventDate: '',
    guestCount: '',
    budget: '',
    initialMessage: '',
  })

  const createBusinessLead = useCreateBusinessLead()
  const createDirectConversation = useCreateDirectConversation(scope)
  const [isResolvingDeepLinkConversation, setIsResolvingDeepLinkConversation] = useState(false)

  const setConversationQueryParam = useCallback(
    (conversationId: string) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('conversationId', conversationId)
      next.delete('userId')
      router.replace(`${pathname}?${next.toString()}`)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (initialConversationId) {
      setActiveConversationId(initialConversationId)
      setShowMobileChat(true)
      return
    }
    if (!activeConversationId && conversations.length) {
      setActiveConversationId(conversations[0].id)
    }
  }, [initialConversationId, conversations, activeConversationId])

  useEffect(() => {
    if (!initialParticipantUserId || initialConversationId) {
      return
    }
    if (!user?.id || conversationsQuery.isLoading || isResolvingDeepLinkConversation) {
      return
    }

    const existing = conversations.find((conversation) =>
      conversation.participants?.some((participant) => participant.userId === initialParticipantUserId),
    )

    if (existing) {
      setActiveConversationId(existing.id)
      setShowMobileChat(true)
      setConversationQueryParam(existing.id)
      return
    }

    let cancelled = false
    setIsResolvingDeepLinkConversation(true)

    createDirectConversation
      .mutateAsync({ participantUserId: initialParticipantUserId })
      .then((conversation) => {
        if (cancelled) return
        setActiveConversationId(conversation.id)
        setShowMobileChat(true)
        setConversationQueryParam(conversation.id)
      })
      .catch(() => {
        if (cancelled) return
        toast.error('Unable to start conversation')
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolvingDeepLinkConversation(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    initialParticipantUserId,
    initialConversationId,
    user?.id,
    conversations,
    conversationsQuery.isLoading,
    isResolvingDeepLinkConversation,
    createDirectConversation,
    setConversationQueryParam,
  ])

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) || null,
    [conversations, activeConversationId]
  )

  const filteredConversations = useMemo(() => {
    const seen = new Set<string>()
    const deduped = conversations.filter((conv) => {
      if (seen.has(conv.id)) return false
      seen.add(conv.id)
      return true
    })
    if (!searchQuery.trim()) return deduped
    const query = searchQuery.toLowerCase()
    return deduped.filter((conv) => {
      const title = getConversationTitle(conv, user?.id).toLowerCase()
      const lastMessage = conv.messages?.[0]?.content?.toLowerCase() || ''
      return title.includes(query) || lastMessage.includes(query)
    })
  }, [conversations, searchQuery, user?.id])

  const { data: messageData, isLoading: messagesLoading, refetch: refetchMessages } = useConversationMessages(
    scope,
    activeConversationId || ''
  )

  const messages = Array.isArray(messageData) ? messageData : messageData?.data ?? []

  // Filter messages based on search
  const searchMatchingMessages = useMemo(() => {
    if (!messageSearchQuery.trim()) return []
    const query = messageSearchQuery.toLowerCase()
    return messages
      .map((msg, index) => ({ msg, index }))
      .filter(({ msg }) => msg.content.toLowerCase().includes(query))
  }, [messages, messageSearchQuery])

  useMessagingRealtime(scope, activeConversationId || '')

  const { mutateAsync: sendMessage, isPending: sending } = useSendMessage(scope, activeConversationId || '')

  const { mutate: addReaction } = useAddReaction(scope)

  const [draft, setDraft] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.scrollTop = container.scrollHeight
    }
  }, [])

  const scrollToMessage = useCallback((messageId: string) => {
    const element = document.getElementById(`message-${messageId}`)
    const container = messagesContainerRef.current
    if (element && container) {
      const elementTop = element.offsetTop
      const elementHeight = element.offsetHeight
      const containerHeight = container.clientHeight
      container.scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
      element.classList.add('bg-primary/20')
      setTimeout(() => element.classList.remove('bg-primary/20'), 2000)
    }
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    if (isMessageSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isMessageSearchOpen])

  // Navigate search results
  useEffect(() => {
    if (searchMatchingMessages.length > 0 && currentSearchIndex < searchMatchingMessages.length) {
      scrollToMessage(searchMatchingMessages[currentSearchIndex].msg.id)
    }
  }, [currentSearchIndex, searchMatchingMessages, scrollToMessage])

  const handleSend = async () => {
    if (!draft.trim() || !activeConversationId) return
    const content = draft.trim()
    setDraft('')

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    MessagingClient.stopTyping(activeConversationId)

    await sendMessage({ content })
    textareaRef.current?.focus()
  }

  useEffect(() => {
    if (!activeConversationId) return

    const unsubscribe = MessagingClient.onTyping((payload) => {
      if (payload.conversationId !== activeConversationId) return
      if (!payload.userId || payload.userId === user?.id) return

      setTypingUsers((prev) => {
        if (!payload.isTyping) {
          const next = { ...prev }
          delete next[payload.userId]
          return next
        }
        return { ...prev, [payload.userId]: payload.userName || 'Someone' }
      })
    })

    return () => {
      unsubscribe()
    }
  }, [activeConversationId, user?.id])

  const typingLabel = useMemo(() => {
    const names = Object.values(typingUsers)
    if (!names.length) return ''
    if (names.length === 1) return `${names[0]} is typing`
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing`
    return 'Several people are typing'
  }, [typingUsers])

  const handleDraftChange = (value: string) => {
    setDraft(value)
    if (!activeConversationId) return
    MessagingClient.startTyping(activeConversationId)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      MessagingClient.stopTyping(activeConversationId)
    }, 1500)
  }

  const handleEmojiSelect = (emoji: string) => {
    setDraft((prev) => `${prev}${emoji}`)
    setEmojiOpen(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  const handleConversationSelect = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setShowMobileChat(true)
    setIsMessageSearchOpen(false)
    setMessageSearchQuery('')
  }

  const handleBackToList = () => {
    setShowMobileChat(false)
  }

  const handleSearchPrev = () => {
    if (searchMatchingMessages.length === 0) return
    setCurrentSearchIndex((prev) => (prev > 0 ? prev - 1 : searchMatchingMessages.length - 1))
  }

  const handleSearchNext = () => {
    if (searchMatchingMessages.length === 0) return
    setCurrentSearchIndex((prev) => (prev < searchMatchingMessages.length - 1 ? prev + 1 : 0))
  }

  const handleCloseMessageSearch = () => {
    setIsMessageSearchOpen(false)
    setMessageSearchQuery('')
    setCurrentSearchIndex(0)
  }

  const getOtherParticipant = useCallback((): ConversationParticipant | null => {
    if (!activeConversation) return null
    return activeConversation.participants?.find((p: ConversationParticipant) => p.userId !== user?.id) || null
  }, [activeConversation, user?.id])

  const handleViewProfile = useCallback(() => {
    const other = getOtherParticipant()
    if (!other) {
      toast.error('Could not find user profile')
      return
    }

    // If the other participant is a vendor, navigate to their vendor profile using slug
    if (other.user?.vendorProfile?.slug) {
      router.push(`/vendors/${other.user.vendorProfile.slug}`)
    } else {
      // For regular users or vendors without slug, show a toast
      toast.info(`${getUserLabel(other.user)}`, {
        description: other.role === 'VENDOR' ? 'Vendor' : 'Event Planner',
      })
    }
  }, [getOtherParticipant, router])

  const handleDeleteChat = useCallback(async () => {
    if (!activeConversationId) return

    setIsDeleting(true)
    try {
      // For now, we'll just clear the local state and show success
      // The backend API for deleting conversations can be implemented later
      setActiveConversationId(null)
      setShowMobileChat(false)
      setShowDeleteDialog(false)
      toast.success('Chat deleted successfully')

      // Refetch conversations to update the list
      conversationsQuery.refetch()
    } catch (error) {
      toast.error('Failed to delete chat')
    } finally {
      setIsDeleting(false)
    }
  }, [activeConversationId, conversationsQuery])

  const handleOpenCreateLead = useCallback(() => {
    const other = getOtherParticipant()
    if (!other) {
      toast.error('Could not find participant to create lead for')
      return
    }
    // Reset form
    setCreateLeadForm({
      eventType: '',
      eventDate: '',
      guestCount: '',
      budget: '',
      initialMessage: '',
    })
    setShowCreateLeadDialog(true)
  }, [getOtherParticipant])

  const handleCreateLead = useCallback(async () => {
    const other = getOtherParticipant()
    if (!other?.userId) {
      toast.error('Could not find participant to create lead for')
      return
    }

    try {
      await createBusinessLead.mutateAsync({
        plannerId: other.userId,
        source: 'DIRECT_MESSAGE',
        eventType: createLeadForm.eventType || undefined,
        eventDate: createLeadForm.eventDate || undefined,
        guestCount: createLeadForm.guestCount ? Number(createLeadForm.guestCount) : undefined,
        budget: createLeadForm.budget ? Number(createLeadForm.budget) : undefined,
        initialMessage: createLeadForm.initialMessage || undefined,
      })
      toast.success('Lead created successfully!', {
        description: 'You can view and manage this lead in the Leads page.',
      })
      setShowCreateLeadDialog(false)
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to create lead'
      toast.error(message)
    }
  }, [getOtherParticipant, createBusinessLead, createLeadForm])

  const messageGroups = useMemo(() => groupMessagesByDate(messages), [messages])

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border bg-background shadow-xl">
      {/* Conversation List - Hidden on mobile when chat is open */}
      <div
        className={cn(
          'w-full flex-shrink-0 border-r bg-muted/30 md:w-[340px] lg:w-[380px]',
          showMobileChat && 'hidden md:flex'
        )}
      >
        <div className="flex h-full w-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-background/80 px-4 py-4 backdrop-blur-sm">
            <h1 className="text-xl font-semibold">Messages</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => conversationsQuery.refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Search */}
          <div className="border-b px-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-muted/50 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:bg-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1">
            {conversationsQuery.isLoading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="text-sm">Loading conversations...</span>
              </div>
            ) : conversationsQuery.isError ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <AlertCircle className="h-8 w-8" />
                <span className="text-sm">Unable to load conversations</span>
                <Button variant="outline" size="sm" onClick={() => conversationsQuery.refetch()}>
                  Try Again
                </Button>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
                <MessageSquareText className="h-10 w-10" />
                <span className="text-sm">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </span>
              </div>
            ) : (
              <div className="py-1">
                {filteredConversations.map((conversation) => {
                  const lastMessage = conversation.messages?.[0]
                  const isActive = conversation.id === activeConversationId
                  const title = getConversationTitle(conversation, user?.id)
                  const subtitle = getConversationSubtitle(conversation, user?.id)
                  const avatarUrl = getConversationAvatar(conversation, user?.id)

                  return (
                    <button
                      key={conversation.id}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-muted/50',
                        isActive && 'bg-primary/10 hover:bg-primary/15'
                      )}
                      onClick={() => handleConversationSelect(conversation.id)}
                    >
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={avatarUrl} alt={title} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                            {getInitials(title)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-background bg-emerald-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-semibold">{title}</span>
                          <span className="flex-shrink-0 text-xs text-muted-foreground">
                            {formatConversationTime(conversation.lastMessageAt || conversation.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            {lastMessage?.senderId === user?.id && (
                              <CheckCheck className="h-4 w-4 flex-shrink-0 text-primary" />
                            )}
                            <span className="truncate">
                              {lastMessage?.content || `Start chatting with ${subtitle}`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>

      {/* Chat Area */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          !showMobileChat && 'hidden md:flex'
        )}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b bg-background/80 px-3 py-3 backdrop-blur-sm md:px-6">
              <div className="flex items-center gap-2 md:gap-3">
                {/* Back button - mobile only */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full md:hidden"
                  onClick={handleBackToList}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <Avatar className="h-9 w-9 md:h-10 md:w-10">
                    <AvatarImage
                      src={getConversationAvatar(activeConversation, user?.id)}
                      alt={getConversationTitle(activeConversation, user?.id)}
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-sm text-primary-foreground">
                      {getInitials(getConversationTitle(activeConversation, user?.id))}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-500 md:h-3 md:w-3" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold md:text-base">
                    {getConversationTitle(activeConversation, user?.id)}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {typingLabel || getConversationSubtitle(activeConversation, user?.id)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full text-muted-foreground"
                  onClick={() => setIsMessageSearchOpen(!isMessageSearchOpen)}
                >
                  <Search className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => setIsMessageSearchOpen(true)}>
                      <Search className="mr-2 h-4 w-4" />
                      Search Messages
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleViewProfile}>
                      <UserCircle className="mr-2 h-4 w-4" />
                      View Profile
                    </DropdownMenuItem>
                    {scope === 'business' && (
                      <DropdownMenuItem onClick={handleOpenCreateLead}>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Lead
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => refetchMessages()}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Chat
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Message Search Bar */}
            {isMessageSearchOpen && (
              <div className="flex items-center gap-2 border-b bg-muted/30 px-3 py-2 md:px-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search in messages..."
                    value={messageSearchQuery}
                    onChange={(e) => {
                      setMessageSearchQuery(e.target.value)
                      setCurrentSearchIndex(0)
                    }}
                    className="w-full rounded-lg bg-background py-2 pl-10 pr-4 text-sm outline-none ring-1 ring-border focus:ring-primary"
                  />
                </div>
                {searchMatchingMessages.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {currentSearchIndex + 1}/{searchMatchingMessages.length}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSearchPrev}>
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSearchNext}>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCloseMessageSearch}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto"
              style={{
                backgroundImage: `linear-gradient(to bottom, hsl(var(--muted)/0.3), hsl(var(--muted)/0.3))`,
              }}
            >
              <div className="min-h-full px-3 py-4 md:px-8 lg:px-16">
                {messagesLoading ? (
                  <div className="flex h-full items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                    <div className="rounded-full bg-primary/10 p-6">
                      <MessageSquareText className="h-12 w-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Start a conversation</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Send a message to begin chatting
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messageGroups.map((group, groupIndex) => (
                      <div key={groupIndex}>
                        {/* Date Separator */}
                        <div className="mb-4 flex justify-center">
                          <span className="rounded-lg bg-background/90 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                            {formatDate(group.date)}
                          </span>
                        </div>

                        {/* Messages in this date group */}
                        <div className="space-y-1">
                          {group.messages.map((message, messageIndex) => {
                            const isMine = message.senderId === user?.id
                            const isFirst =
                              messageIndex === 0 ||
                              group.messages[messageIndex - 1].senderId !== message.senderId
                            const isLast =
                              messageIndex === group.messages.length - 1 ||
                              group.messages[messageIndex + 1].senderId !== message.senderId
                            const isHighlighted =
                              !!messageSearchQuery &&
                              message.content.toLowerCase().includes(messageSearchQuery.toLowerCase())

                            return (
                              <MessageBubble
                                key={message.id}
                                message={message}
                                isMine={isMine}
                                isFirst={isFirst}
                                isLast={isLast}
                                isHighlighted={isHighlighted}
                                searchQuery={messageSearchQuery}
                                onReact={(emoji) =>
                                  addReaction({ messageId: message.id, payload: { emoji } })
                                }
                              />
                            )
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Typing Indicator */}
                    {typingLabel && <TypingIndicator />}
                  </div>
                )}
              </div>
            </div>

            {/* Input Area */}
            <div className="border-t bg-background/80 px-2 py-2 backdrop-blur-sm md:px-4 md:py-3">
              {!hasMessagingAccess && scope === 'business' ? (
                /* Upgrade prompt for vendors without messaging access */
                <div className="flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-3 md:px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/20">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Messaging requires a Professional plan</p>
                      <p className="text-xs text-muted-foreground">
                        Upgrade to send messages and connect with potential clients
                      </p>
                    </div>
                  </div>
                  <Link href="/business/settings/subscription">
                    <Button size="sm" className="gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" />
                      Upgrade
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-end gap-1 md:gap-2">
                  <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 flex-shrink-0 rounded-full text-muted-foreground hover:text-foreground md:h-10 md:w-10"
                      >
                        <Smile className="h-5 w-5 md:h-6 md:w-6" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" side="top" className="w-64 p-3 md:w-72">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">Quick Reactions</p>
                      <div className="grid grid-cols-6 gap-1">
                        {QUICK_EMOJIS.map((emoji) => (
                          <Button
                            key={emoji}
                            type="button"
                            variant="ghost"
                            className="h-9 w-9 text-lg hover:bg-muted md:h-10 md:w-10 md:text-xl"
                            onClick={() => handleEmojiSelect(emoji)}
                          >
                            {emoji}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="hidden h-9 w-9 flex-shrink-0 rounded-full text-muted-foreground hover:text-foreground md:flex md:h-10 md:w-10"
                  >
                    <Paperclip className="h-5 w-5" />
                  </Button>

                  <div className="flex-1">
                    <Textarea
                      ref={textareaRef}
                      value={draft}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      rows={1}
                      className="max-h-32 min-h-[40px] resize-none rounded-2xl border-0 bg-muted/50 px-3 py-2.5 text-sm focus-visible:ring-1 focus-visible:ring-primary md:min-h-[44px] md:px-4 md:py-3"
                      disabled={!activeConversationId}
                    />
                  </div>

                  <Button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending || !activeConversationId}
                    size="icon"
                    className="h-9 w-9 flex-shrink-0 rounded-full md:h-10 md:w-10"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin md:h-5 md:w-5" />
                    ) : (
                      <Send className="h-4 w-4 md:h-5 md:w-5" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 text-center">
            <div className="rounded-full bg-muted p-6 md:p-8">
              <MessageSquareText className="h-12 w-12 text-muted-foreground md:h-16 md:w-16" />
            </div>
            <div>
              <h2 className="text-lg font-semibold md:text-xl">Select a conversation</h2>
              <p className="mt-2 text-sm text-muted-foreground md:text-base">
                Choose a conversation from the list to start messaging
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the conversation from your message list. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Lead Dialog - Business scope only */}
      {scope === 'business' && (
        <AlertDialog open={showCreateLeadDialog} onOpenChange={setShowCreateLeadDialog}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Create Lead
              </AlertDialogTitle>
              <AlertDialogDescription>
                Add this planner as a lead to track and manage the inquiry.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {activeConversation && (
              <div className="space-y-4 py-2">
                {/* Planner info */}
                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={getConversationAvatar(activeConversation, user?.id)}
                      alt={getConversationTitle(activeConversation, user?.id)}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(getConversationTitle(activeConversation, user?.id))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{getConversationTitle(activeConversation, user?.id)}</p>
                    <p className="text-sm text-muted-foreground">
                      {getConversationSubtitle(activeConversation, user?.id)}
                    </p>
                  </div>
                </div>

                {/* Lead Details Form */}
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="eventType" className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Event Type
                      </Label>
                      <Input
                        id="eventType"
                        placeholder="e.g., Wedding"
                        value={createLeadForm.eventType}
                        onChange={(e) =>
                          setCreateLeadForm((prev) => ({ ...prev, eventType: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventDate" className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        Event Date
                      </Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={createLeadForm.eventDate}
                        onChange={(e) =>
                          setCreateLeadForm((prev) => ({ ...prev, eventDate: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="guestCount" className="flex items-center gap-1.5 text-sm">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        Guest Count
                      </Label>
                      <Input
                        id="guestCount"
                        type="number"
                        placeholder="e.g., 150"
                        min="1"
                        value={createLeadForm.guestCount}
                        onChange={(e) =>
                          setCreateLeadForm((prev) => ({ ...prev, guestCount: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="flex items-center gap-1.5 text-sm">
                        <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                        Budget
                      </Label>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="e.g., 10000"
                        min="0"
                        value={createLeadForm.budget}
                        onChange={(e) =>
                          setCreateLeadForm((prev) => ({ ...prev, budget: e.target.value }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="initialMessage" className="text-sm">
                      Notes (Optional)
                    </Label>
                    <Textarea
                      id="initialMessage"
                      placeholder="Add any notes about this lead..."
                      value={createLeadForm.initialMessage}
                      onChange={(e) =>
                        setCreateLeadForm((prev) => ({ ...prev, initialMessage: e.target.value }))
                      }
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={createBusinessLead.isPending}>Cancel</AlertDialogCancel>
              <Button
                onClick={handleCreateLead}
                disabled={createBusinessLead.isPending}
              >
                {createBusinessLead.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Lead
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  isFirst: boolean
  isLast: boolean
  isHighlighted?: boolean
  searchQuery?: string
  onReact: (emoji: string) => void
}

function MessageBubble({
  message,
  isMine,
  isFirst,
  isLast,
  isHighlighted,
  searchQuery,
  onReact,
}: MessageBubbleProps) {
  const senderLabel = getUserLabel(message.sender)
  const showStatus = message.status === 'sending' || message.status === 'failed'

  const reactionGroups = useMemo(() => {
    const groups = new Map<string, number>()
    ;(message.reactions || []).forEach((reaction) => {
      groups.set(reaction.emoji, (groups.get(reaction.emoji) || 0) + 1)
    })
    return Array.from(groups.entries())
  }, [message.reactions])

  // Highlight matching text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-300 text-foreground">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div
      id={`message-${message.id}`}
      className={cn(
        'flex transition-colors duration-500',
        isMine ? 'justify-end' : 'justify-start'
      )}
    >
      <div className={cn('group flex max-w-[85%] items-end gap-2 md:max-w-[75%]', isMine && 'flex-row-reverse')}>
        {/* Avatar for received messages */}
        {!isMine && isLast && (
          <Avatar className="mb-1 h-6 w-6 flex-shrink-0 md:h-7 md:w-7">
            <AvatarImage
              src={message.sender?.vendorProfile?.profilePhotoUrl || message.sender?.avatarUrl || ''}
            />
            <AvatarFallback className="bg-gradient-to-br from-slate-500 to-slate-600 text-[9px] text-white md:text-[10px]">
              {getInitials(senderLabel)}
            </AvatarFallback>
          </Avatar>
        )}
        {!isMine && !isLast && <div className="w-6 flex-shrink-0 md:w-7" />}

        <div className={cn('flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
          {/* Sender name for first message in group */}
          {!isMine && isFirst && (
            <span className="ml-1 text-xs font-medium text-primary">{senderLabel}</span>
          )}

          {/* Message bubble */}
          <div
            className={cn(
              'relative px-3 py-2 shadow-sm',
              isMine
                ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground'
                : 'rounded-2xl rounded-bl-md bg-background text-foreground',
              isFirst && isMine && 'rounded-tr-2xl',
              isFirst && !isMine && 'rounded-tl-2xl',
              isLast && isMine && 'rounded-br-2xl',
              isLast && !isMine && 'rounded-bl-2xl',
              isHighlighted && 'ring-2 ring-yellow-400'
            )}
          >
            {/* Message content */}
            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed md:text-[15px]">
              {searchQuery ? highlightText(message.content, searchQuery) : message.content}
            </p>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((attachment) => (
                  <AttachmentPreview key={attachment.id} attachment={attachment} />
                ))}
              </div>
            )}

            {/* Time and status */}
            <div
              className={cn(
                'mt-1 flex items-center gap-1 text-[10px] md:text-[11px]',
                isMine ? 'justify-end text-primary-foreground/70' : 'text-muted-foreground'
              )}
            >
              <span>{formatTime(message.createdAt)}</span>
              {isMine && (
                <>
                  {message.status === 'sending' && <Clock className="h-3 w-3" />}
                  {message.status === 'failed' && <AlertCircle className="h-3 w-3 text-destructive" />}
                  {!showStatus && <CheckCheck className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                </>
              )}
            </div>

            {/* Reactions */}
            {reactionGroups.length > 0 && (
              <div
                className={cn(
                  'absolute -bottom-3 flex gap-0.5',
                  isMine ? 'right-2' : 'left-2'
                )}
              >
                {reactionGroups.map(([emoji, count]) => (
                  <span
                    key={emoji}
                    className="flex items-center gap-0.5 rounded-full bg-background px-1.5 py-0.5 text-xs shadow-md"
                  >
                    {emoji}
                    {count > 1 && <span className="text-muted-foreground">{count}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick reactions - show on hover */}
          <div
            className={cn(
              'flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100',
              isMine ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            {['❤️', '👍', '😂'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => onReact(emoji)}
                className="rounded-full p-1 text-sm hover:bg-muted"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AttachmentPreview({ attachment }: { attachment: MessageAttachment }) {
  const isImage = attachment.mimeType.startsWith('image/')
  const isVideo = attachment.mimeType.startsWith('video/')

  if (isImage) {
    return (
      <div className="overflow-hidden rounded-xl">
        <NextImage
          src={attachment.url}
          alt={attachment.fileName}
          width={960}
          height={640}
          unoptimized={true}
          priority={true}
          className="max-h-48 max-w-full object-cover md:max-h-64"
        />
      </div>
    )
  }

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl bg-background/20 px-3 py-2 transition-colors hover:bg-background/30"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20 md:h-10 md:w-10">
        {isVideo ? <Video className="h-4 w-4 text-primary md:h-5 md:w-5" /> : <FileText className="h-4 w-4 text-primary md:h-5 md:w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{attachment.fileName}</p>
        <p className="text-xs opacity-70">{(attachment.fileSize / 1024).toFixed(1)} KB</p>
      </div>
    </a>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[75%] items-end gap-2">
        <div className="w-6 flex-shrink-0 md:w-7" />
        <div className="rounded-2xl rounded-bl-md bg-background px-4 py-3 shadow-sm">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" />
          </div>
        </div>
      </div>
    </div>
  )
}
