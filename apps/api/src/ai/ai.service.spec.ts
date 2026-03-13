import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import Anthropic from '@anthropic-ai/sdk';
import { AiService } from './ai.service';
import type { Transaction } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@anthropic-ai/sdk');
jest.mock('@anthropic-ai/sdk/helpers/zod', () => ({
  zodOutputFormat: jest.fn().mockReturnValue({ type: 'json_schema' }),
}));

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-api-key'),
} as unknown as ConfigService;

const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: 'u1',
    description: 'Grocery store',
    amount: 80,
    type: 'EXPENSE',
    category: 'Food',
    aiConfidence: 0.95,
    date: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    userId: 'u1',
    description: 'Salary',
    amount: 3000,
    type: 'INCOME',
    category: 'Income',
    aiConfidence: null,
    date: '2025-01-01T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AiService', () => {
  let service: AiService;
  let mockClient: jest.Mocked<Anthropic>;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    mockClient = (Anthropic as jest.MockedClass<typeof Anthropic>).mock
      .instances[0] as jest.Mocked<Anthropic>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialise Anthropic client with ANTHROPIC_API_KEY', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
      'ANTHROPIC_API_KEY',
    );
    expect(Anthropic).toHaveBeenCalledWith({ apiKey: 'test-api-key' });
  });

  // -------------------------------------------------------------------------
  // categorizeTransaction
  // -------------------------------------------------------------------------

  describe('categorizeTransaction', () => {
    it('should call messages.parse and return category + confidence', async () => {
      const mockParsed = { category: 'Food', confidence: 0.92 };
      (mockClient.messages as any) = {
        parse: jest.fn().mockResolvedValue({ parsed_output: mockParsed }),
      };

      const result = await service.categorizeTransaction(
        'Grocery store',
        50,
        'EXPENSE',
      );

      expect(mockClient.messages.parse).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-6',
          max_tokens: 256,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        }),
      );
      expect(result).toEqual(mockParsed);
    });
  });

  // -------------------------------------------------------------------------
  // generateInsights
  // -------------------------------------------------------------------------

  describe('generateInsights', () => {
    it('should stream insights and return plain text', async () => {
      const mockContent: Anthropic.ContentBlock[] = [
        { type: 'text', text: 'You spend too much on food.' },
      ];
      const mockStream = {
        finalMessage: jest
          .fn()
          .mockResolvedValue({ content: mockContent, stop_reason: 'end_turn' }),
      };
      (mockClient.messages as any) = {
        stream: jest.fn().mockReturnValue(mockStream),
      };

      const result = await service.generateInsights(mockTransactions, 'weekly');

      expect(mockClient.messages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-6',
          thinking: { type: 'adaptive' },
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        }),
      );
      expect(result).toBe('You spend too much on food.');
    });

    it('should handle empty transactions', async () => {
      const mockStream = {
        finalMessage: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'No data available.' }],
          stop_reason: 'end_turn',
        }),
      };
      (mockClient.messages as any) = {
        stream: jest.fn().mockReturnValue(mockStream),
      };

      const result = await service.generateInsights([], 'monthly');

      const userMessage = (mockClient.messages.stream as jest.Mock).mock
        .calls[0][0].messages[0].content as string;
      expect(userMessage).toContain('No transactions available.');
      expect(result).toBe('No data available.');
    });
  });

  // -------------------------------------------------------------------------
  // generateGoalRecommendation
  // -------------------------------------------------------------------------

  describe('generateGoalRecommendation', () => {
    it('should stream a goal recommendation', async () => {
      const mockStream = {
        finalMessage: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Cut dining out by 20%.' }],
          stop_reason: 'end_turn',
        }),
      };
      (mockClient.messages as any) = {
        stream: jest.fn().mockReturnValue(mockStream),
      };

      const goal = {
        description: 'Save for vacation',
        targetAmount: 2000,
        deadline: '2025-12-31',
      };
      const result = await service.generateGoalRecommendation(
        goal,
        mockTransactions,
      );

      expect(mockClient.messages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-6',
          thinking: { type: 'adaptive' },
        }),
      );
      expect(result).toBe('Cut dining out by 20%.');
    });

    it('should omit deadline line when not provided', async () => {
      const mockStream = {
        finalMessage: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Advice.' }],
          stop_reason: 'end_turn',
        }),
      };
      (mockClient.messages as any) = {
        stream: jest.fn().mockReturnValue(mockStream),
      };

      await service.generateGoalRecommendation(
        { description: 'Emergency fund', targetAmount: 1000 },
        [],
      );

      const prompt = (mockClient.messages.stream as jest.Mock).mock.calls[0][0]
        .messages[0].content as string;
      expect(prompt).not.toContain('Deadline:');
    });
  });

  // -------------------------------------------------------------------------
  // generateWeeklyChallenge
  // -------------------------------------------------------------------------

  describe('generateWeeklyChallenge', () => {
    it('should call messages.create and return challenge text', async () => {
      (mockClient.messages as any) = {
        create: jest.fn().mockResolvedValue({
          content: [
            { type: 'text', text: 'Spend less than $60 on Food this week.' },
          ],
          stop_reason: 'end_turn',
        }),
      };

      const weekStart = new Date('2025-01-06');
      const weekEnd = new Date('2025-01-12');
      const result = await service.generateWeeklyChallenge(
        mockTransactions,
        weekStart,
        weekEnd,
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-opus-4-6',
          max_tokens: 256,
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'user' }),
          ]),
        }),
      );
      expect(result).toBe('Spend less than $60 on Food this week.');
    });

    it('should include date range in the prompt', async () => {
      (mockClient.messages as any) = {
        create: jest.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'Save at least $50.' }],
          stop_reason: 'end_turn',
        }),
      };

      const weekStart = new Date('2025-03-10');
      const weekEnd = new Date('2025-03-16');
      await service.generateWeeklyChallenge([], weekStart, weekEnd);

      const prompt = (mockClient.messages.create as jest.Mock).mock.calls[0][0]
        .messages[0].content as string;
      expect(prompt).toContain('2025-03-10');
      expect(prompt).toContain('2025-03-16');
    });
  });
});
