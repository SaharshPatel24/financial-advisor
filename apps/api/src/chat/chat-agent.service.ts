import { Injectable } from '@nestjs/common';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { AiService } from '../ai/ai.service';
import { ChatToolsService, buildTools } from './chat-tools.service';
import type { ChatStreamEvent } from '@financial-advisor/shared';

const HISTORY_WINDOW = 20;

@Injectable()
export class ChatAgentService {
  constructor(
    private readonly ai: AiService,
    private readonly toolsService: ChatToolsService,
  ) {}

  async *stream(
    userId: string,
    userName: string,
    messages: BaseMessage[],
  ): AsyncGenerator<ChatStreamEvent> {
    const tools = buildTools(this.toolsService, userId);
    const model = this.ai.getModel();

    const agent = createReactAgent({
      llm: model,
      tools,
      stateModifier: new SystemMessage(buildSystemPrompt(userName)),
    });

    const windowed = messages.slice(-HISTORY_WINDOW);

    for await (const chunk of agent.streamEvents(
      { messages: windowed },
      { version: 'v2' },
    )) {
      if (chunk.event === 'on_chat_model_stream') {
        const raw = chunk.data?.chunk?.content;
        // content can be a string or an array of content blocks (Anthropic thinking)
        const token = extractToken(raw);
        if (token) yield { type: 'token', data: { content: token } };
      }

      if (chunk.event === 'on_tool_start') {
        yield {
          type: 'tool_call',
          data: {
            tool: chunk.name ?? '',
            args: (chunk.data?.input ?? {}) as Record<string, unknown>,
          },
        };
      }

      if (chunk.event === 'on_tool_end') {
        yield {
          type: 'tool_result',
          data: { tool: chunk.name ?? '', result: chunk.data?.output },
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(userName: string): string {
  const today = new Date().toISOString().split('T')[0];
  return `You are Fina, a personal finance assistant. Today is ${today}.
You have access to ${userName}'s real financial data via tools — always use tools to answer questions, never guess numbers.
Be concise, specific, and cite actual amounts from the data.
Never reveal raw IDs or internal fields. If data is unavailable, say so honestly.`;
}

function extractToken(content: unknown): string | null {
  if (typeof content === 'string') return content || null;
  if (Array.isArray(content)) {
    for (const block of content) {
      if (typeof block === 'object' && block !== null && 'type' in block) {
        const b = block as { type: string; text?: string };
        if (b.type === 'text' && b.text) return b.text;
      }
    }
  }
  return null;
}
