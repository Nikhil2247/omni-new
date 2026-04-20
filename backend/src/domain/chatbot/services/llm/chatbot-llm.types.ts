export interface ChatbotLlmMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatbotToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatbotToolResult {
  name: string;
  result: unknown;
}

export interface ChatbotLlmTurnResult {
  text: string;
  toolCall?: ChatbotToolCall;
}
