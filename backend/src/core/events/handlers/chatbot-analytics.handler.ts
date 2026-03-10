import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';

interface ChatbotInteractionEvent {
  sessionId?: string;
  intent: string;
  language: 'en' | 'hi' | 'hinglish';
  confidence: number;
  vendorsFound: number;
  responseTimeMs: number;
}

@Injectable()
export class ChatbotAnalyticsHandler {
  private readonly logger = new Logger(ChatbotAnalyticsHandler.name);
  private readonly dailyTtlSeconds = 60 * 60 * 24 * 45;

  constructor(private readonly cache: DragonflyService) {}

  @OnEvent('chatbot.interaction.logged')
  async handleInteraction(event: ChatbotInteractionEvent): Promise<void> {
    const dateKey = this.currentDateKey();
    const metricsKey = `chatbot:metrics:${dateKey}`;
    const sessionKey = event.sessionId
      ? `chatbot:session-metrics:${event.sessionId}`
      : undefined;

    try {
      const currentMetrics =
        (await this.cache.get<Record<string, number>>(metricsKey)) || {};

      currentMetrics.totalInteractions = (currentMetrics.totalInteractions || 0) + 1;
      currentMetrics[`intent:${event.intent}`] =
        (currentMetrics[`intent:${event.intent}`] || 0) + 1;
      currentMetrics[`language:${event.language}`] =
        (currentMetrics[`language:${event.language}`] || 0) + 1;

      if (event.vendorsFound > 0) {
        currentMetrics.vendorResultInteractions =
          (currentMetrics.vendorResultInteractions || 0) + 1;
      }

      currentMetrics.totalVendorsFound =
        (currentMetrics.totalVendorsFound || 0) + event.vendorsFound;
      currentMetrics.totalResponseTimeMs =
        (currentMetrics.totalResponseTimeMs || 0) + event.responseTimeMs;
      currentMetrics.totalConfidence =
        (currentMetrics.totalConfidence || 0) + event.confidence;

      await this.cache.set(metricsKey, currentMetrics, {
        ttl: this.dailyTtlSeconds,
      });

      if (sessionKey) {
        const currentSession =
          (await this.cache.get<Record<string, number | string>>(sessionKey)) || {};

        currentSession.turns = Number(currentSession.turns || 0) + 1;
        currentSession.lastIntent = event.intent;
        currentSession.lastLanguage = event.language;
        currentSession.lastConfidence = event.confidence;
        currentSession.lastVendorsFound = event.vendorsFound;
        currentSession.lastResponseTimeMs = event.responseTimeMs;

        await this.cache.set(sessionKey, currentSession, {
          ttl: 60 * 60 * 24,
        });
      }
    } catch (error) {
      this.logger.warn(`Failed to aggregate chatbot interaction metrics: ${error}`);
    }
  }

  private currentDateKey(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
