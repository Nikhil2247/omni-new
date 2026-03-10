'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { chatbotService } from '@/lib/api/services/chatbot.service'
import type {
  ChatbotAction,
  ChatbotCard,
  ChatbotVendorSuggestion,
  ChatbotContext,
  FollowUpQuestion,
  ChatbotMessageHistory,
  ConversationListItem,
  PlanningToolLink,
  VendorCategoryLink,
} from '@/lib/api/types/chatbot.types'

export interface ChatMessage {
  id: string
  role: 'user' | 'bot'
  text: string
  createdAt: number
  vendors?: ChatbotVendorSuggestion[]
  suggestions?: string[]
  actions?: ChatbotAction[]
  cards?: ChatbotCard[]
  followUpQuestions?: FollowUpQuestion[]
  filters?: ChatbotContext
  planningTools?: PlanningToolLink[]
  vendorCategories?: VendorCategoryLink[]
  language?: 'en' | 'hi' | 'hinglish'
  confidence?: number
}

export interface ChatThread {
  id: string
  title: string
  messages: ChatMessage[]
  context: ChatbotContext
  turns: number
  updatedAt: number
}

const DEFAULT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: "Hi! I'm your event planning assistant. Tell me what you're planning and I'll help you find vendors, create budgets, and build checklists.",
  createdAt: Date.now(),
  suggestions: [
    'Find photographers in Delhi',
    'Wedding budget for 2L',
    'Caterers in Mumbai',
    'Planning checklist',
  ],
}

const createDefaultThread = (): ChatThread => ({
  id: `local-${Date.now()}`,
  title: 'New Chat',
  messages: [DEFAULT_MESSAGE],
  context: {},
  turns: 0,
  updatedAt: Date.now(),
})

interface ChatStore {
  // State
  threads: ChatThread[]
  activeThreadId: string
  userId: string | null
  isLoading: boolean
  isHydrated: boolean
  isSyncing: boolean

  // Getters
  getActiveThread: () => ChatThread | null
  getMessages: () => ChatMessage[]

  // Actions
  setUserId: (userId: string | null) => void
  setIsLoading: (loading: boolean) => void
  setActiveThreadId: (id: string) => void

  // Thread management
  createThread: () => Promise<void>
  deleteThread: (threadId: string) => Promise<void>
  clearThread: (threadId?: string) => Promise<void>
  renameThread: (threadId: string, title: string) => Promise<void>

  // Message handling
  sendMessage: (text: string) => Promise<void>

  // Backend sync
  loadConversations: () => Promise<void>
  loadConversation: (conversationId: string) => Promise<void>

  // Initialize
  initialize: (userId?: string) => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      threads: [],
      activeThreadId: '',
      userId: null,
      isLoading: false,
      isHydrated: false,
      isSyncing: false,

      getActiveThread: () => {
        const { threads, activeThreadId } = get()
        return threads.find((t) => t.id === activeThreadId) || null
      },

      getMessages: () => {
        const thread = get().getActiveThread()
        return thread?.messages || [DEFAULT_MESSAGE]
      },

      setUserId: (userId) => set({ userId }),
      setIsLoading: (isLoading) => set({ isLoading }),
      setActiveThreadId: (activeThreadId) => set({ activeThreadId }),

      createThread: async () => {
        const { userId, threads } = get()

        if (userId) {
          // Create on backend
          try {
            const result = await chatbotService.createConversation(userId)
            if (result) {
              const newThread: ChatThread = {
                id: result.id,
                title: result.title,
                messages: [DEFAULT_MESSAGE],
                context: {},
                turns: 0,
                updatedAt: Date.now(),
              }
              set({
                threads: [newThread, ...threads],
                activeThreadId: result.id,
              })
            } else {
              // Fallback to local thread if backend fails
              const newThread = createDefaultThread()
              set({
                threads: [newThread, ...threads],
                activeThreadId: newThread.id,
              })
            }
          } catch {
            // Fallback to local thread on error
            const newThread = createDefaultThread()
            set({
              threads: [newThread, ...threads],
              activeThreadId: newThread.id,
            })
          }
        } else {
          // Create locally for guests
          const newThread = createDefaultThread()
          set({
            threads: [newThread, ...threads],
            activeThreadId: newThread.id,
          })
        }
      },

      deleteThread: async (threadId) => {
        const { userId, threads, activeThreadId } = get()

        if (userId && !threadId.startsWith('local-')) {
          await chatbotService.deleteConversation(userId, threadId)
        }

        const remaining = threads.filter((t) => t.id !== threadId)

        if (remaining.length === 0) {
          // Create a new thread if all deleted
          const newThread = createDefaultThread()
          set({
            threads: [newThread],
            activeThreadId: newThread.id,
          })
        } else {
          set({
            threads: remaining,
            activeThreadId: threadId === activeThreadId ? remaining[0].id : activeThreadId,
          })
        }
      },

      clearThread: async (threadId) => {
        const { userId, threads, activeThreadId } = get()
        const targetId = threadId || activeThreadId

        if (userId && !targetId.startsWith('local-')) {
          await chatbotService.clearConversation(userId, targetId)
        }

        set({
          threads: threads.map((t) =>
            t.id === targetId
              ? {
                  ...t,
                  messages: [DEFAULT_MESSAGE],
                  context: {},
                  turns: 0,
                  updatedAt: Date.now(),
                }
              : t
          ),
        })
      },

      renameThread: async (threadId, title) => {
        const { userId, threads } = get()

        if (userId && !threadId.startsWith('local-')) {
          await chatbotService.updateConversationTitle(userId, threadId, title)
        }

        set({
          threads: threads.map((t) =>
            t.id === threadId ? { ...t, title, updatedAt: Date.now() } : t
          ),
        })
      },

      sendMessage: async (text) => {
        const { userId, activeThreadId, threads, isLoading } = get()
        const thread = threads.find((t) => t.id === activeThreadId)

        if (!text.trim() || isLoading || !thread) return

        // Add user message
        const userMessage: ChatMessage = {
          id: `${Date.now()}-user`,
          role: 'user',
          text,
          createdAt: Date.now(),
        }

        // Update thread title if first message
        const isFirstMessage = thread.messages.length <= 1

        set({
          isLoading: true,
          threads: threads.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  messages: [...t.messages, userMessage],
                  title: isFirstMessage ? text.slice(0, 40) : t.title,
                  updatedAt: Date.now(),
                }
              : t
          ),
        })

        try {
          // Build conversation history
          const history: ChatbotMessageHistory[] = thread.messages
            .slice(-20)
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({
              role: m.role === 'bot' ? 'assistant' as const : 'user' as const,
              content: m.text,
            }))

          const response = await chatbotService.sendMessage({
            message: text,
            userId: userId || undefined,
            conversationId: activeThreadId.startsWith('local-') ? undefined : activeThreadId,
            context: thread.context,
            conversationHistory: history,
          })

          const botMessage: ChatMessage = {
            id: `${Date.now()}-bot`,
            role: 'bot',
            text: response.reply,
            createdAt: Date.now(),
            vendors: response.vendors,
            suggestions: response.suggestions,
            actions: response.actions,
            cards: response.cards,
            followUpQuestions: response.followUpQuestions,
            planningTools: response.planningTools,
            vendorCategories: response.vendorCategories,
            language: response.language,
            confidence: response.confidence,
          }

          // Get the updated thread id from backend if new conversation was created
          const newConversationId = response.session?.conversationId
          const currentThreads = get().threads

          set({
            threads: currentThreads.map((t) => {
              if (t.id === activeThreadId) {
                return {
                  ...t,
                  id: newConversationId || t.id,
                  messages: [...t.messages, botMessage],
                  context: response.filters || t.context,
                  turns: response.session?.turns || t.turns + 1,
                  updatedAt: Date.now(),
                }
              }
              return t
            }),
            activeThreadId: newConversationId || activeThreadId,
          })
        } catch (error) {
          console.error('Failed to send message:', error)

          const errorMessage: ChatMessage = {
            id: `${Date.now()}-error`,
            role: 'bot',
            text: "I'm having trouble connecting. Please try again.",
            createdAt: Date.now(),
          }

          const currentThreads = get().threads
          set({
            threads: currentThreads.map((t) =>
              t.id === activeThreadId
                ? { ...t, messages: [...t.messages, errorMessage] }
                : t
            ),
          })
        } finally {
          set({ isLoading: false })
        }
      },

      loadConversations: async () => {
        const { userId } = get()
        if (!userId) return

        set({ isSyncing: true })

        try {
          const conversations = await chatbotService.getConversations(userId)

          if (conversations.length > 0) {
            // Convert to threads (without messages - we'll load them on demand)
            const threads: ChatThread[] = conversations.map((c) => ({
              id: c.id,
              title: c.title,
              messages: [DEFAULT_MESSAGE],
              context: {},
              turns: c.turns,
              updatedAt: c.lastMessageAt ? new Date(c.lastMessageAt).getTime() : Date.now(),
            }))

            set({
              threads,
              activeThreadId: threads[0].id,
            })

            // Load the active conversation's messages
            await get().loadConversation(threads[0].id)
          } else {
            // No conversations, create a default local one
            const defaultThread = createDefaultThread()
            set({
              threads: [defaultThread],
              activeThreadId: defaultThread.id,
            })
          }
        } catch (error) {
          console.error('Failed to load conversations:', error)
          // Create default local thread on error
          const defaultThread = createDefaultThread()
          set({
            threads: [defaultThread],
            activeThreadId: defaultThread.id,
          })
        } finally {
          set({ isSyncing: false })
        }
      },

      loadConversation: async (conversationId) => {
        const { userId, threads } = get()
        if (!userId || conversationId.startsWith('local-')) return

        try {
          const conversation = await chatbotService.getConversation(userId, conversationId)

          if (conversation && conversation.messages.length > 0) {
            // Convert messages to our format
            const messages: ChatMessage[] = conversation.messages.map((m, i) => ({
              id: `restored-${i}`,
              role: m.role === 'assistant' ? 'bot' : 'user',
              text: m.content,
              createdAt: Date.now() - (conversation.messages.length - i) * 1000,
            }))

            set({
              threads: threads.map((t) =>
                t.id === conversationId
                  ? {
                      ...t,
                      title: conversation.title,
                      messages,
                      context: conversation.filters,
                      turns: conversation.turns,
                    }
                  : t
              ),
            })
          }
        } catch (error) {
          console.error('Failed to load conversation:', error)
        }
      },

      initialize: async (userId) => {
        const { threads, isHydrated, userId: currentUserId, isSyncing } = get()

        // Skip if already syncing or same user already initialized
        if (isSyncing) return
        if (isHydrated && currentUserId === userId && threads.length > 0) return

        set({ userId: userId || null, isHydrated: true })

        if (userId) {
          // Load from backend only if we don't have threads for this user
          if (threads.length === 0 || currentUserId !== userId) {
            await get().loadConversations()
          }
        } else if (threads.length === 0) {
          // Guest user - create default thread if needed
          const defaultThread = createDefaultThread()
          set({
            threads: [defaultThread],
            activeThreadId: defaultThread.id,
          })
        }
      },
    }),
    {
      name: 'omni-chat-store',
      partialize: (state) => ({
        threads: state.threads,
        activeThreadId: state.activeThreadId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isHydrated = true
        }
      },
    }
  )
)
