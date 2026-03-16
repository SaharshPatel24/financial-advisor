import { Injectable, NotFoundException } from '@nestjs/common';
import { HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import type { BaseMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAgentService } from './chat-agent.service';
import type {
  ChatSessionSummary,
  ChatSessionDetail,
  ChatMessageDto,
  ChatStreamEvent,
} from '@financial-advisor/shared';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agent: ChatAgentService,
  ) {}

  async createSession(
    userId: string,
    title?: string,
  ): Promise<ChatSessionSummary> {
    const session = await this.prisma.chatSession.create({
      data: { userId, title: title ?? null },
    });
    return toSessionSummary(session);
  }

  async getSessions(userId: string): Promise<ChatSessionSummary[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map(toSessionSummary);
  }

  async getSession(
    userId: string,
    sessionId: string,
  ): Promise<ChatSessionDetail> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    return {
      ...toSessionSummary(session),
      messages: session.messages.map(toMessageDto),
    };
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) throw new NotFoundException('Chat session not found');
    await this.prisma.chatSession.delete({ where: { id: sessionId } });
  }

  async *streamMessage(
    userId: string,
    sessionId: string,
    content: string,
  ): AsyncGenerator<ChatStreamEvent> {
    // 1. Verify session ownership
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Chat session not found');

    // 2. Auto-set title on first user message
    if (!session.title && session.messages.length === 0) {
      await this.prisma.chatSession.update({
        where: { id: sessionId },
        data: { title: content.slice(0, 60) },
      });
    }

    // 3. Persist user message
    await this.prisma.chatMessage.create({
      data: { sessionId, role: 'user', content },
    });

    // 4. Load user info for system prompt
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const userName = user.name ?? 'User';

    // 5. Convert DB messages → LangChain messages (include new user message)
    const allMessages: BaseMessage[] = [
      ...session.messages.map(toBaseMessage),
      new HumanMessage(content),
    ];

    // 6. Stream agent events, accumulate assistant text
    let assistantText = '';
    for await (const event of this.agent.stream(
      userId,
      userName,
      allMessages,
    )) {
      if (event.type === 'token') assistantText += event.data.content;
      yield event;
    }

    // 7. Persist assistant message
    const saved = await this.prisma.chatMessage.create({
      data: { sessionId, role: 'assistant', content: assistantText },
    });

    // 8. Signal completion
    yield { type: 'done', data: { messageId: saved.id } };
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

function toSessionSummary(session: {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ChatSessionSummary {
  return {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}

function toMessageDto(msg: {
  id: string;
  role: string;
  content: string;
  toolName: string | null;
  createdAt: Date;
}): ChatMessageDto {
  return {
    id: msg.id,
    role: msg.role as ChatMessageDto['role'],
    content: msg.content,
    toolName: msg.toolName,
    createdAt: msg.createdAt.toISOString(),
  };
}

function toBaseMessage(msg: {
  role: string;
  content: string;
  toolName: string | null;
}): BaseMessage {
  if (msg.role === 'user') return new HumanMessage(msg.content);
  if (msg.role === 'tool')
    return new ToolMessage({
      content: msg.content,
      tool_call_id: msg.toolName ?? '',
    });
  return new AIMessage(msg.content);
}
