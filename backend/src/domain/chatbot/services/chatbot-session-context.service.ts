import { Injectable, Logger } from '@nestjs/common';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';
import {
  ChatbotConversationMessage,
  ChatbotFilters,
  ChatbotSessionState,
} from '../types/chatbot.types';

@Injectable()
export class ChatbotSessionContextService {
  private readonly logger = new Logger(ChatbotSessionContextService.name);
  private readonly inMemoryStore = new Map<string, ChatbotSessionState>();
  private readonly ttlSeconds = 60 * 60 * 24 * 30;

  constructor(private readonly cache: DragonflyService) {}

  async get(sessionId?: string): Promise<ChatbotSessionState | null> {
    if (!sessionId) {
      return null;
    }

    const cacheKey = this.buildKey(sessionId);
    const cached = await this.cache.get<ChatbotSessionState>(cacheKey);
    if (cached) {
      return cached;
    }

    return this.inMemoryStore.get(sessionId) || null;
  }

  async save(
    sessionId: string | undefined,
    input: {
      filters: ChatbotFilters;
      history: ChatbotConversationMessage[];
      language?: 'en' | 'hi' | 'hinglish';
    },
  ): Promise<void> {
    if (!sessionId) {
      return;
    }

    const nextState: ChatbotSessionState = {
      filters: input.filters,
      history: input.history.slice(-20),
      language: input.language,
      turns: input.history.length,
    };

    const cacheKey = this.buildKey(sessionId);
    const cached = await this.cache.set(cacheKey, nextState, {
      ttl: this.ttlSeconds,
    });

    if (!cached) {
      this.logger.warn(`Failed to persist chatbot session in cache: ${sessionId}`);
    }

    this.inMemoryStore.set(sessionId, nextState);
  }

  async reset(sessionId?: string): Promise<void> {
    if (!sessionId) {
      return;
    }

    const cacheKey = this.buildKey(sessionId);
    await this.cache.delete(cacheKey);
    this.inMemoryStore.delete(sessionId);
  }

  private buildKey(sessionId: string): string {
    return `chatbot:session:${sessionId}`;
  }
}
