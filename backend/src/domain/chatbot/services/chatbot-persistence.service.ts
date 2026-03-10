import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  ChatbotConversationMessage,
  ChatbotFilters,
  ChatbotSessionState,
} from '../types/chatbot.types';

type Language = 'en' | 'hi' | 'hinglish';

interface ConversationRow {
  id: string;
  title: string;
  filters: unknown;
  turns: number;
  language: string;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface ConversationListItem {
  id: string;
  title: string;
  turns: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
}

interface MessageRow {
  role: string;
  content: string;
}

@Injectable()
export class ChatbotPersistenceService {
  private readonly logger = new Logger(ChatbotPersistenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all conversations for a user (sorted by last message)
   */
  async getConversations(userId: string): Promise<ConversationListItem[]> {
    try {
      const conversations = await this.prisma.$queryRaw<
        Array<ConversationRow & { last_message?: string }>
      >`
        SELECT
          c.id,
          c.title,
          c.turns,
          c.last_message_at,
          c.created_at,
          c.updated_at,
          (
            SELECT content
            FROM "planning"."chatbot_conversation_messages" m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
          ) as last_message
        FROM "planning"."chatbot_conversations" c
        WHERE c.user_id = ${userId}::uuid
        ORDER BY COALESCE(c.last_message_at, c.created_at) DESC, c.created_at DESC
      `;

      return conversations.map((c) => ({
        id: c.id,
        title: c.title,
        turns: Number(c.turns || 0),
        lastMessageAt: c.last_message_at,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastMessage: c.last_message,
      }));
    } catch (error) {
      this.logger.warn(`Failed to get conversations for user ${userId}: ${error}`);
      return [];
    }
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<(ChatbotSessionState & { id: string; title: string }) | null> {
    try {
      const conversations = await this.prisma.$queryRaw<ConversationRow[]>`
        SELECT id, title, filters, turns, language
        FROM "planning"."chatbot_conversations"
        WHERE id = ${conversationId}::uuid AND user_id = ${userId}::uuid
        LIMIT 1
      `;

      if (!conversations.length) {
        return null;
      }

      const conversation = conversations[0];
      const messages = await this.prisma.$queryRaw<MessageRow[]>`
        SELECT role, content
        FROM "planning"."chatbot_conversation_messages"
        WHERE conversation_id = ${conversation.id}::uuid
        ORDER BY created_at ASC
        LIMIT 100
      `;

      return {
        id: conversation.id,
        title: conversation.title,
        filters: this.normalizeFilters(conversation.filters),
        history: messages
          .filter((message) => message.content)
          .map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
          })),
        language: this.normalizeLanguage(conversation.language),
        turns: Number(conversation.turns || 0),
      };
    } catch (error) {
      this.logger.warn(`Failed to get conversation ${conversationId}: ${error}`);
      return null;
    }
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    title: string = 'New Chat',
  ): Promise<{ id: string; title: string } | null> {
    try {
      const id = randomUUID();
      await this.prisma.$executeRaw`
        INSERT INTO "planning"."chatbot_conversations"
          (id, user_id, title, language, filters, turns, created_at, updated_at)
        VALUES
          (${id}::uuid, ${userId}::uuid, ${title}, 'en', '{}', 0, NOW(), NOW())
      `;

      return { id, title };
    } catch (error) {
      this.logger.warn(`Failed to create conversation for user ${userId}: ${error}`);
      return null;
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string,
  ): Promise<boolean> {
    try {
      const result = await this.prisma.$executeRaw`
        UPDATE "planning"."chatbot_conversations"
        SET title = ${title}, updated_at = NOW()
        WHERE id = ${conversationId}::uuid AND user_id = ${userId}::uuid
      `;
      return result > 0;
    } catch (error) {
      this.logger.warn(`Failed to update conversation title: ${error}`);
      return false;
    }
  }

  /**
   * Delete a conversation and its messages
   */
  async deleteConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      const result = await this.prisma.$executeRaw`
        DELETE FROM "planning"."chatbot_conversations"
        WHERE id = ${conversationId}::uuid AND user_id = ${userId}::uuid
      `;
      return result > 0;
    } catch (error) {
      this.logger.warn(`Failed to delete conversation ${conversationId}: ${error}`);
      return false;
    }
  }

  /**
   * Clear all messages in a conversation (but keep the conversation)
   */
  async clearConversation(conversationId: string, userId: string): Promise<boolean> {
    try {
      // Verify ownership first
      const conversations = await this.prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM "planning"."chatbot_conversations"
        WHERE id = ${conversationId}::uuid AND user_id = ${userId}::uuid
        LIMIT 1
      `;

      if (!conversations.length) {
        return false;
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`
          DELETE FROM "planning"."chatbot_conversation_messages"
          WHERE conversation_id = ${conversationId}::uuid
        `;

        await tx.$executeRaw`
          UPDATE "planning"."chatbot_conversations"
          SET turns = 0, filters = '{}', last_message_at = NULL, updated_at = NOW()
          WHERE id = ${conversationId}::uuid
        `;
      });

      return true;
    } catch (error) {
      this.logger.warn(`Failed to clear conversation ${conversationId}: ${error}`);
      return false;
    }
  }

  /**
   * Legacy: Get user's most recent conversation state
   */
  async getUserState(userId: string): Promise<ChatbotSessionState | null> {
    try {
      const conversations = await this.prisma.$queryRaw<ConversationRow[]>`
        SELECT id, title, filters, turns, language
        FROM "planning"."chatbot_conversations"
        WHERE user_id = ${userId}::uuid
        ORDER BY COALESCE(last_message_at, created_at) DESC, created_at DESC
        LIMIT 1
      `;

      if (!conversations.length) {
        return null;
      }

      const conversation = conversations[0];
      const messages = await this.prisma.$queryRaw<MessageRow[]>`
        SELECT role, content
        FROM "planning"."chatbot_conversation_messages"
        WHERE conversation_id = ${conversation.id}::uuid
        ORDER BY created_at ASC
        LIMIT 40
      `;

      return {
        filters: this.normalizeFilters(conversation.filters),
        history: messages
          .filter((message) => message.content)
          .map((message) => ({
            role: message.role === 'assistant' ? 'assistant' : 'user',
            content: message.content,
          })),
        language: this.normalizeLanguage(conversation.language),
        turns: Number(conversation.turns || 0),
      };
    } catch (error) {
      this.logger.warn(`Failed to read chatbot history for user ${userId}: ${error}`);
      return null;
    }
  }

  /**
   * Persist a turn to a specific conversation
   */
  async persistTurn(input: {
    conversationId?: string;
    userId: string;
    language: Language;
    filters: ChatbotFilters;
    turns: number;
    userMessage: string;
    assistantMessage: string;
    title?: string;
  }): Promise<string | null> {
    try {
      const filtersJson = JSON.stringify(input.filters || {});

      return await this.prisma.$transaction(async (tx) => {
        let conversationId = input.conversationId;

        if (conversationId) {
          // Update existing conversation
          await tx.$executeRaw`
            UPDATE "planning"."chatbot_conversations"
            SET
              language = ${input.language}::"planning"."ChatbotConversationLanguage",
              filters = ${filtersJson}::jsonb,
              turns = ${input.turns},
              title = COALESCE(${input.title}, title),
              last_message_at = NOW(),
              updated_at = NOW()
            WHERE id = ${conversationId}::uuid AND user_id = ${input.userId}::uuid
          `;
        } else {
          // Create new conversation
          conversationId = randomUUID();
          const title = input.title || input.userMessage.slice(0, 50) || 'New Chat';

          await tx.$executeRaw`
            INSERT INTO "planning"."chatbot_conversations"
              (id, user_id, title, language, filters, turns, last_message_at, created_at, updated_at)
            VALUES
              (
                ${conversationId}::uuid,
                ${input.userId}::uuid,
                ${title},
                ${input.language}::"planning"."ChatbotConversationLanguage",
                ${filtersJson}::jsonb,
                ${input.turns},
                NOW(),
                NOW(),
                NOW()
              )
          `;
        }

        // Insert messages
        await tx.$executeRaw`
          INSERT INTO "planning"."chatbot_conversation_messages"
            (id, conversation_id, role, content, created_at)
          VALUES
            (${randomUUID()}::uuid, ${conversationId}::uuid, 'user'::"planning"."ChatbotMessageRole", ${input.userMessage}, NOW()),
            (${randomUUID()}::uuid, ${conversationId}::uuid, 'assistant'::"planning"."ChatbotMessageRole", ${input.assistantMessage}, NOW())
        `;

        return conversationId;
      });
    } catch (error) {
      this.logger.warn(`Failed to persist chatbot turn: ${error}`);
      return null;
    }
  }

  private normalizeLanguage(language: string): Language {
    if (language === 'hi' || language === 'hinglish') {
      return language;
    }
    return 'en';
  }

  private normalizeFilters(filters: unknown): ChatbotFilters {
    if (!filters || typeof filters !== 'object' || Array.isArray(filters)) {
      return {};
    }
    return filters as ChatbotFilters;
  }
}
