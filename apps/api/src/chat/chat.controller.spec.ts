import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

const NOW_ISO = '2025-01-15T12:00:00.000Z';

const mockSession = {
  id: 'sess-1',
  title: null,
  createdAt: NOW_ISO,
  updatedAt: NOW_ISO,
};

const mockService = {
  createSession: jest.fn(),
  getSessions: jest.fn(),
  getSession: jest.fn(),
  deleteSession: jest.fn(),
  streamMessage: jest.fn(),
};

const authReq = { user: { id: 'user-1' } };

describe('ChatController', () => {
  let controller: ChatController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatController],
      providers: [{ provide: ChatService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChatController>(ChatController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createSession', () => {
    it('should delegate to service and return session', async () => {
      mockService.createSession.mockResolvedValue(mockSession);

      const result = await controller.createSession(authReq as any, {
        title: 'Test',
      });

      expect(mockService.createSession).toHaveBeenCalledWith('user-1', 'Test');
      expect(result).toEqual(mockSession);
    });
  });

  describe('getSessions', () => {
    it('should return list of sessions', async () => {
      mockService.getSessions.mockResolvedValue([mockSession]);

      const result = await controller.getSessions(authReq as any);

      expect(mockService.getSessions).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockSession]);
    });
  });

  describe('getSession', () => {
    it('should return session detail', async () => {
      const detail = { ...mockSession, messages: [] };
      mockService.getSession.mockResolvedValue(detail);

      const result = await controller.getSession(authReq as any, 'sess-1');

      expect(mockService.getSession).toHaveBeenCalledWith('user-1', 'sess-1');
      expect(result).toEqual(detail);
    });

    it('should propagate NotFoundException', async () => {
      mockService.getSession.mockRejectedValue(new NotFoundException());

      await expect(
        controller.getSession(authReq as any, 'bad'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSession', () => {
    it('should call service delete', async () => {
      mockService.deleteSession.mockResolvedValue(undefined);

      await controller.deleteSession(authReq as any, 'sess-1');

      expect(mockService.deleteSession).toHaveBeenCalledWith(
        'user-1',
        'sess-1',
      );
    });
  });

  describe('sendMessage (SSE)', () => {
    function makeRes() {
      return { write: jest.fn(), end: jest.fn() };
    }

    async function* fakeStream(events: object[]) {
      for (const e of events) yield e;
    }

    it('should write SSE events and end response', async () => {
      mockService.streamMessage.mockReturnValue(
        fakeStream([
          { type: 'token', data: { content: 'Hi' } },
          { type: 'done', data: { messageId: 'msg-1' } },
        ]),
      );

      const res = makeRes();
      await controller.sendMessage(
        authReq as any,
        'sess-1',
        { content: 'Hello' },
        res as any,
      );

      expect(res.write).toHaveBeenCalledWith(
        `event: token\ndata: ${JSON.stringify({ content: 'Hi' })}\n\n`,
      );
      expect(res.write).toHaveBeenCalledWith(
        `event: done\ndata: ${JSON.stringify({ messageId: 'msg-1' })}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
    });

    it('should write error event and end when stream throws', async () => {
      mockService.streamMessage.mockImplementation(async function* () {
        throw new Error('agent failed');
      });

      const res = makeRes();
      await controller.sendMessage(
        authReq as any,
        'sess-1',
        { content: 'Hello' },
        res as any,
      );

      expect(res.write).toHaveBeenCalledWith(
        `event: error\ndata: ${JSON.stringify({ message: 'agent failed' })}\n\n`,
      );
      expect(res.end).toHaveBeenCalled();
    });
  });
});
