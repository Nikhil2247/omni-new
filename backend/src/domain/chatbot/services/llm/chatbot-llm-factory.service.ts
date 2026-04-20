import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatbotLlmProvider } from './chatbot-llm-provider.interface';
import { GeminiChatbotLlmProvider } from './gemini-chatbot-llm.provider';
import { OpenRouterChatbotLlmProvider } from './openrouter-chatbot-llm.provider';

@Injectable()
export class ChatbotLlmFactoryService {
  private readonly logger = new Logger(ChatbotLlmFactoryService.name);
  private activeProvider: ChatbotLlmProvider | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly openRouterProvider: OpenRouterChatbotLlmProvider,
    private readonly geminiProvider: GeminiChatbotLlmProvider,
  ) {}

  async initializePreferredProvider(): Promise<ChatbotLlmProvider | null> {
    const openRouterApiKey = this.configService.get<string>('OPENROUTER_API_KEY');
    const openRouterModel =
      this.configService.get<string>('OPENROUTER_MODEL') || 'openai/gpt-4.1-mini';

    if (openRouterApiKey) {
      const ok = await this.openRouterProvider.initialize({
        apiKey: openRouterApiKey,
        model: openRouterModel,
      });

      if (ok) {
        this.activeProvider = this.openRouterProvider;
        this.logger.log(`Chatbot LLM provider selected: ${this.activeProvider.name}`);
        return this.activeProvider;
      }

      this.logger.warn('OpenRouter provider initialization failed; trying Gemini fallback.');
    }

    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    const geminiModel =
      this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

    if (geminiApiKey) {
      const ok = await this.geminiProvider.initialize({
        apiKey: geminiApiKey,
        model: geminiModel,
      });

      if (ok) {
        this.activeProvider = this.geminiProvider;
        this.logger.log(`Chatbot LLM provider selected: ${this.activeProvider.name}`);
        return this.activeProvider;
      }
    }

    this.logger.warn('No LLM provider is configured. Chatbot will run with fallback responses.');
    this.activeProvider = null;
    return null;
  }

  getActiveProvider(): ChatbotLlmProvider | null {
    return this.activeProvider;
  }
}
