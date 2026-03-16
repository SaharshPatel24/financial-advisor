import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ChatAgentService } from './chat-agent.service';
import { ChatService } from './chat.service';

const NOW = new Date('2025-01-15T12:00:00Z');

const mockSession = {
  id: 'sess-1',
  userId: 'user-1',
  title: null,
  createdAt: NOW,
  updatedAt: NOW,
  messages: [],
};

const mockUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
};

const mockPrisma = {
  chatSession: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  chatMessage: {
    create: jest.fn(),
  },
  user: {
    findUniqueOrThrow: jest.fn(),
  },
};

async function* emptyStream() {}

const mockAgent = {
  stream: jest.fn().mockReturnValue(emptyStream()),
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ChatAgentService, useValue: mockAgent },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSession', () => {
    it('should create and return a session summary', async () => {
      mockPrisma.chatSession.create.mockResolvedValue(mockSession);

      const result = await service.createSession('user-1');

      expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', title: null },
      });
      expect(result.id).toBe('sess-1');
      expect(result.title).toBeNull();
    });

    it('should pass title when provided', async () => {
      mockPrisma.chatSession.create.mockResolvedValue({
        ...mockSession,
        title: 'My chat',
      });

      const result = await service.createSession('user-1', 'My chat');

      expect(mockPrisma.chatSession.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', title: 'My chat' },
      });
      expect(result.title).toBe('My chat');
    });
  });

  describe('getSessions', () => {
    it('should return all sessions ordered by createdAt desc', async () => {
      mockPrisma.chatSession.findMany.mockResolvedValue([mockSession]);

      const result = await service.getSessions('user-1');

      expect(mockPrisma.chatSession.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('getSession', () => {
    it('should return session detail with messages', async () => {
      const sessionWithMessages = {
        ...mockSession,
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            content: 'Hello',
            toolName: null,
            createdAt: NOW,
          },
        ],
      };
      mockPrisma.chatSession.findFirst.mockResolvedValue(sessionWithMessages);

      const result = await service.getSession('user-1', 'sess-1');

      expect(result.messages).toHaveLength(1);
      expect(result.messages[0]?.role).toBe('user');
    });

    it('should throw NotFoundException when session not found', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null);

      await expect(service.getSession('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete the session', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(mockSession);
      mockPrisma.chatSession.delete.mockResolvedValue(mockSession);

      await service.deleteSession('user-1', 'sess-1');

      expect(mockPrisma.chatSession.delete).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
      });
    });

    it('should throw NotFoundException when session not owned', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteSession('user-1', 'other-sess'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('streamMessage', () => {
    it('should throw NotFoundException when session not owned', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue(null);

      const gen = service.streamMessage('user-1', 'bad-sess', 'hello');
      await expect(gen.next()).rejects.toThrow(NotFoundException);
    });

    it('should auto-set title on first message', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        ...mockSession,
        messages: [],
      });
      mockPrisma.chatSession.update.mockResolvedValue({});
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockAgent.stream.mockReturnValue(emptyStream());

      const events = [];
      for await (const e of service.streamMessage(
        'user-1',
        'sess-1',
        'What is my balance?',
      )) {
        events.push(e);
      }

      expect(mockPrisma.chatSession.update).toHaveBeenCalledWith({
        where: { id: 'sess-1' },
        data: { title: 'What is my balance?' },
      });
    });

    it('should not overwrite title when session already has one', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        ...mockSession,
        title: 'Existing title',
        messages: [],
      });
      mockPrisma.chatMessage.create.mockResolvedValue({ id: 'msg-1' });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);
      mockAgent.stream.mockReturnValue(emptyStream());

      const events = [];
      for await (const e of service.streamMessage(
        'user-1',
        'sess-1',
        'Hello',
      )) {
        events.push(e);
      }

      expect(mockPrisma.chatSession.update).not.toHaveBeenCalled();
    });

    it('should persist user and assistant messages and yield done event', async () => {
      mockPrisma.chatSession.findFirst.mockResolvedValue({
        ...mockSession,
        title: 'My chat',
        messages: [],
      });
      mockPrisma.chatMessage.create
        .mockResolvedValueOnce({ id: 'user-msg-1' })
        .mockResolvedValueOnce({ id: 'asst-msg-1' });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue(mockUser);

      async function* fakeStream() {
        yield { type: 'token' as const, data: { content: 'Hello' } };
        yield { type: 'token' as const, data: { content: ' there!' } };
      }
      mockAgent.stream.mockReturnValue(fakeStream());

      const events = [];
      for await (const e of service.streamMessage('user-1', 'sess-1', 'Hi')) {
        events.push(e);
      }

      // user message persisted
      expect(mockPrisma.chatMessage.create).toHaveBeenNthCalledWith(1, {
        data: { sessionId: 'sess-1', role: 'user', content: 'Hi' },
      });
      // assistant message persisted with accumulated text
      expect(mockPrisma.chatMessage.create).toHaveBeenNthCalledWith(2, {
        data: {
          sessionId: 'sess-1',
          role: 'assistant',
          content: 'Hello there!',
        },
      });
      // done event is last
      const last = events[events.length - 1];
      expect(last?.type).toBe('done');
      expect((last as any).data.messageId).toBe('asst-msg-1');
    });
  });
});
