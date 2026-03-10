import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatbotObservabilityService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitInteraction(event: {
    sessionId?: string;
    intent: string;
    language: 'en' | 'hi' | 'hinglish';
    confidence: number;
    vendorsFound: number;
    responseTimeMs: number;
  }): void {
    this.eventEmitter.emit('chatbot.interaction.logged', event);
  }
}
