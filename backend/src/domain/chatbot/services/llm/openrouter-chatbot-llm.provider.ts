import { Injectable, Logger } from '@nestjs/common';
import {
  ChatbotLlmChatSession,
  ChatbotLlmProvider,
} from './chatbot-llm-provider.interface';
import {
  ChatbotLlmMessage,
  ChatbotLlmTurnResult,
  ChatbotToolCall,
  ChatbotToolDefinition,
  ChatbotToolResult,
} from './chatbot-llm.types';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: OpenRouterMessage;
  }>;
}

class OpenRouterChatSession implements ChatbotLlmChatSession {
  private pendingToolCallId: string | null = null;

  constructor(
    private readonly endpoint: string,
    private readonly apiKey: string,
    private readonly model: string,
    private readonly appName: string,
    private readonly siteUrl: string,
    private readonly messages: OpenRouterMessage[],
    private readonly tools: ChatbotToolDefinition[],
    private readonly generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
    },
  ) {}

  async sendUserMessage(message: string): Promise<ChatbotLlmTurnResult> {
    this.messages.push({
      role: 'user',
      content: message,
    });

    return this.complete();
  }

  async sendToolResult(toolResult: ChatbotToolResult): Promise<ChatbotLlmTurnResult> {
    this.messages.push({
      role: 'tool',
      tool_call_id: this.pendingToolCallId || toolResult.name,
      name: toolResult.name,
      content: JSON.stringify(toolResult.result || {}),
    });

    this.pendingToolCallId = null;
    return this.complete();
  }

  private async complete(): Promise<ChatbotLlmTurnResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': this.siteUrl,
          'X-Title': this.appName,
        },
        body: JSON.stringify({
          model: this.model,
          messages: this.messages,
          tools: this.tools.map((tool) => ({
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            },
          })),
          tool_choice: 'auto',
          temperature: this.generationConfig?.temperature ?? 0.4,
          top_p: this.generationConfig?.topP ?? 0.9,
          max_tokens: this.generationConfig?.maxOutputTokens ?? 1024,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`OpenRouter request failed (${response.status}): ${body}`);
      }

      const payload = (await response.json()) as OpenRouterResponse;
      const message = payload.choices?.[0]?.message;
      if (!message) {
        return { text: '' };
      }

      const toolCall = this.extractToolCall(message);

      this.messages.push({
        role: 'assistant',
        content: message.content || '',
        tool_calls: message.tool_calls,
      });

      if (toolCall && message.tool_calls?.[0]?.id) {
        this.pendingToolCallId = message.tool_calls[0].id;
      }

      return {
        text: message.content || '',
        toolCall: toolCall || undefined,
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractToolCall(message: OpenRouterMessage): ChatbotToolCall | null {
    const toolCall = message.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.name) {
      return null;
    }

    const args = toolCall.function.arguments || '{}';

    try {
      const parsed = JSON.parse(args) as Record<string, unknown>;
      return {
        name: toolCall.function.name,
        args: parsed,
      };
    } catch {
      return {
        name: toolCall.function.name,
        args: {},
      };
    }
  }
}

@Injectable()
export class OpenRouterChatbotLlmProvider implements ChatbotLlmProvider {
  readonly name = 'openrouter';

  private readonly logger = new Logger(OpenRouterChatbotLlmProvider.name);
  private apiKey = '';
  private model = 'openai/gpt-4.1-mini';
  private readonly endpoint = 'https://openrouter.ai/api/v1/chat/completions';

  async initialize(config: { apiKey: string; model: string }): Promise<boolean> {
    if (!config.apiKey) {
      return false;
    }

    this.apiKey = config.apiKey;
    this.model = config.model;

    return true;
  }

  isReady(): boolean {
    return Boolean(this.apiKey);
  }

  async startChat(input: {
    systemPrompt: string;
    tools: ChatbotToolDefinition[];
    history: ChatbotLlmMessage[];
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
    };
  }): Promise<ChatbotLlmChatSession> {
    if (!this.isReady()) {
      throw new Error('OpenRouter provider is not initialized');
    }

    const appName = process.env.OPENROUTER_APP_NAME || 'Omnicassion Chatbot';
    const siteUrl = process.env.OPENROUTER_SITE_URL || 'https://omnicassion.com';

    const messages: OpenRouterMessage[] = [
      {
        role: 'system',
        content: input.systemPrompt,
      },
      ...input.history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
    ];

    this.logger.debug(`OpenRouter chat started with model ${this.model}`);

    return new OpenRouterChatSession(
      this.endpoint,
      this.apiKey,
      this.model,
      appName,
      siteUrl,
      messages,
      input.tools,
      input.generationConfig,
    );
  }
}
