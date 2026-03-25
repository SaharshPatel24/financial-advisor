import { Injectable } from '@nestjs/common';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { SystemMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { AiService } from '../ai/ai.service';
import { ChatToolsService, buildTools } from './chat-tools.service';
import {
  SplitwiseToolsService,
  buildSplitwiseTools,
} from '../splitwise/splitwise-tools.service';
import type { ChatStreamEvent } from '@financial-advisor/shared';

const HISTORY_WINDOW = 20;

@Injectable()
export class ChatAgentService {
  constructor(
    private readonly ai: AiService,
    private readonly toolsService: ChatToolsService,
    private readonly splitwiseToolsService: SplitwiseToolsService,
  ) {}

  async *stream(
    userId: string,
    userName: string,
    messages: BaseMessage[],
    splitwiseApiKey: string | null,
  ): AsyncGenerator<ChatStreamEvent> {
    const tools = buildTools(this.toolsService, userId);

    if (splitwiseApiKey) {
      tools.push(
        ...buildSplitwiseTools(
          this.splitwiseToolsService as any,
          splitwiseApiKey,
        ),
      );
    }

    const model = this.ai.getModel();

    const agent = createReactAgent({
      llm: model,
      tools,
      stateModifier: new SystemMessage(
        buildSystemPrompt(userName, !!splitwiseApiKey),
      ),
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
          data: {
            tool: chunk.name ?? '',
            result: extractToolOutput(chunk.data?.output),
          },
        };
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

function buildSystemPrompt(userName: string, hasSplitwise: boolean): string {
  const today = new Date().toISOString().split('T')[0];
  const splitwiseLine = hasSplitwise
    ? `\nYou also have access to ${userName}'s Splitwise account via tools. For create_splitwise_expense, always confirm split details with the user before calling the tool.`
    : '';
  return `You are Fina, a personal finance assistant. Today is ${today}.
You have access to ${userName}'s real financial data via tools — always use tools to answer questions, never guess numbers.
Be concise, specific, and cite actual amounts from the data.
Never reveal raw IDs or internal fields. If data is unavailable, say so honestly.${splitwiseLine}`;
}

function extractToolOutput(output: unknown): unknown {
  if (output === null || output === undefined) return null;
  // LangChain ToolMessage — extract the string content
  if (typeof output === 'object' && 'content' in (output as object)) {
    const content = (output as { content: unknown }).content;
    if (typeof content === 'string') {
      try {
        return JSON.parse(content);
      } catch {
        return content;
      }
    }
  }
  return output;
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
