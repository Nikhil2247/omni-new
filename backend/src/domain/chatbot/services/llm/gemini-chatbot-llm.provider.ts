import { Injectable, Logger } from '@nestjs/common';
import {
  Content,
  FunctionDeclaration,
  GenerateContentResult,
  GoogleGenerativeAI,
  Part,
  Schema,
  SchemaType,
} from '@google/generative-ai';
import {
  ChatbotLlmChatSession,
  ChatbotLlmProvider,
} from './chatbot-llm-provider.interface';
import {
  ChatbotLlmMessage,
  ChatbotLlmTurnResult,
  ChatbotToolDefinition,
  ChatbotToolResult,
} from './chatbot-llm.types';

class GeminiChatSession implements ChatbotLlmChatSession {
  constructor(private readonly chat: any) {}

  async sendUserMessage(message: string): Promise<ChatbotLlmTurnResult> {
    const response = await this.chat.sendMessage(message);
    return this.parseResponse(response);
  }

  async sendToolResult(toolResult: ChatbotToolResult): Promise<ChatbotLlmTurnResult> {
    const response = await this.chat.sendMessage([
      {
        functionResponse: {
          name: toolResult.name,
          response: toolResult.result,
        },
      },
    ]);

    return this.parseResponse(response);
  }

  private parseResponse(response: GenerateContentResult): ChatbotLlmTurnResult {
    const result = response.response;
    const content = result.candidates?.[0]?.content;
    const toolCallPart = content?.parts?.find((part: Part) => 'functionCall' in part);

    if (toolCallPart && 'functionCall' in toolCallPart && toolCallPart.functionCall) {
      return {
        text: result.text() || '',
        toolCall: {
          name: toolCallPart.functionCall.name || '',
          args: (toolCallPart.functionCall.args as Record<string, unknown>) || {},
        },
      };
    }

    return {
      text: result.text() || '',
    };
  }
}

@Injectable()
export class GeminiChatbotLlmProvider implements ChatbotLlmProvider {
  readonly name = 'gemini';

  private readonly logger = new Logger(GeminiChatbotLlmProvider.name);
  private genAI: GoogleGenerativeAI | null = null;
  private modelName = 'gemini-2.5-flash';
  private apiKey = '';

  async initialize(config: { apiKey: string; model: string }): Promise<boolean> {
    try {
      this.apiKey = config.apiKey;
      this.modelName = config.model;
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      return true;
    } catch (error) {
      this.logger.error(`Failed to initialize Gemini provider: ${error}`);
      this.genAI = null;
      return false;
    }
  }

  isReady(): boolean {
    return Boolean(this.genAI);
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
    if (!this.genAI) {
      throw new Error('Gemini provider is not initialized');
    }

    const model = this.genAI.getGenerativeModel({
      model: this.modelName,
      tools: [
        {
          functionDeclarations: input.tools.map((tool) =>
            this.toGeminiFunctionDeclaration(tool),
          ),
        },
      ],
      systemInstruction: input.systemPrompt,
    });

    const chat = model.startChat({
      history: input.history.map((item) => ({
        role: item.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: item.content }],
      })) as Content[],
      generationConfig: {
        temperature: input.generationConfig?.temperature ?? 0.5,
        topP: input.generationConfig?.topP ?? 0.9,
        maxOutputTokens: input.generationConfig?.maxOutputTokens ?? 1024,
      },
    });

    return new GeminiChatSession(chat);
  }

  private toGeminiFunctionDeclaration(tool: ChatbotToolDefinition): FunctionDeclaration {
    return {
      name: tool.name,
      description: tool.description,
      parameters: this.toGeminiSchema(tool.parameters) as FunctionDeclaration['parameters'],
    };
  }

  private toGeminiSchema(schema: Record<string, unknown>): Schema {
    const type = (schema.type as string | undefined)?.toLowerCase();

    if (type === 'object') {
      const rawProperties = (schema.properties as Record<string, unknown>) || {};
      const properties: Record<string, Schema> = {};
      for (const [key, value] of Object.entries(rawProperties)) {
        properties[key] = this.toGeminiSchema((value as Record<string, unknown>) || {});
      }

      return {
        type: SchemaType.OBJECT,
        properties,
        required: ((schema.required as string[]) || []).filter(Boolean),
        description: schema.description as string | undefined,
      };
    }

    if (type === 'array') {
      return {
        type: SchemaType.ARRAY,
        items: this.toGeminiSchema(
          ((schema.items as Record<string, unknown>) || {}) as Record<string, unknown>,
        ),
        description: schema.description as string | undefined,
      };
    }

    if (type === 'number' || type === 'integer') {
      return {
        type: SchemaType.NUMBER,
        description: schema.description as string | undefined,
      };
    }

    if (type === 'boolean') {
      return {
        type: SchemaType.BOOLEAN,
        description: schema.description as string | undefined,
      };
    }

    return {
      type: SchemaType.STRING,
      description: schema.description as string | undefined,
    };
  }
}
