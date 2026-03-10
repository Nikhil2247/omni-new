import { Injectable } from '@nestjs/common';
import { ChatbotMessageDto } from '../dto/chatbot.dto';
import { ChatbotDomainService } from '../../../domain/chatbot/services/chatbot-domain.service';
import { ChatbotPersistenceService } from '../../../domain/chatbot/services/chatbot-persistence.service';
import {
  ChatbotFilters,
  ChatbotHistoryResponse,
  ChatbotResponse,
  ChatbotVendorSuggestion,
  FollowUpQuestion,
} from '../../../domain/chatbot/types/chatbot.types';

export type { ChatbotResponse, ChatbotVendorSuggestion, FollowUpQuestion };

export interface ConversationListItem {
  id: string;
  title: string;
  turns: number;
  lastMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  turns: number;
  language: 'en' | 'hi' | 'hinglish';
  filters: ChatbotFilters;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
}

@Injectable()
export class ChatbotService {
  constructor(
    private readonly chatbotDomainService: ChatbotDomainService,
    private readonly persistenceService: ChatbotPersistenceService,
  ) {}

  respond(dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    return this.chatbotDomainService.respond({
      message: dto.message,
      userId: dto.userId,
      sessionId: dto.sessionId,
      conversationId: dto.conversationId,
      resetSession: dto.resetSession,
      context: dto.context,
      conversationHistory: dto.conversationHistory,
    });
  }

  getUserHistory(userId: string): Promise<ChatbotHistoryResponse> {
    return this.chatbotDomainService.getUserHistory(userId);
  }

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<ConversationListItem[]> {
    return this.persistenceService.getConversations(userId);
  }

  /**
   * Get a specific conversation with messages
   */
  async getConversation(
    conversationId: string,
    userId: string,
  ): Promise<ConversationDetail | null> {
    const result = await this.persistenceService.getConversation(
      conversationId,
      userId,
    );

    if (!result) {
      return null;
    }

    return {
      id: result.id,
      title: result.title,
      turns: result.turns,
      language: result.language || 'en',
      filters: result.filters || {},
      messages: result.history || [],
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(
    userId: string,
    title?: string,
  ): Promise<{ id: string; title: string } | null> {
    return this.persistenceService.createConversation(userId, title);
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string,
  ): Promise<boolean> {
    return this.persistenceService.updateConversationTitle(
      conversationId,
      userId,
      title,
    );
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    return this.persistenceService.deleteConversation(conversationId, userId);
  }

  /**
   * Clear all messages in a conversation
   */
  async clearConversation(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    return this.persistenceService.clearConversation(conversationId, userId);
  }
}
