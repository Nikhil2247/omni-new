import {
  ChatbotLlmMessage,
  ChatbotLlmTurnResult,
  ChatbotToolDefinition,
  ChatbotToolResult,
} from './chatbot-llm.types';

export interface ChatbotLlmChatSession {
  sendUserMessage(message: string): Promise<ChatbotLlmTurnResult>;
  sendToolResult(toolResult: ChatbotToolResult): Promise<ChatbotLlmTurnResult>;
}

export interface ChatbotLlmProvider {
  readonly name: string;

  initialize(config: {
    apiKey: string;
    model: string;
  }): Promise<boolean>;

  isReady(): boolean;

  startChat(input: {
    systemPrompt: string;
    tools: ChatbotToolDefinition[];
    history: ChatbotLlmMessage[];
    generationConfig?: {
      temperature?: number;
      maxOutputTokens?: number;
      topP?: number;
    };
  }): Promise<ChatbotLlmChatSession>;
}
