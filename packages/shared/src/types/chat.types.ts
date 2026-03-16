export interface ChatSessionSummary {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageDto {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  toolName?: string | null;
  createdAt: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: ChatMessageDto[];
}

export type ChatStreamEvent =
  | { type: 'token'; data: { content: string } }
  | { type: 'tool_call'; data: { tool: string; args: Record<string, unknown> } }
  | { type: 'tool_result'; data: { tool: string; result: unknown } }
  | { type: 'done'; data: { messageId: string } }
  | { type: 'error'; data: { message: string } };
