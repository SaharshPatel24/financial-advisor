import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { AiService } from './ai.service';
import type { Transaction } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Shared invoke spy — assigned in beforeEach so it can be controlled per-test
let mockInvoke: jest.Mock;

jest.mock('@langchain/anthropic', () => ({
  ChatAnthropic: jest.fn().mockImplementation(() => ({
    withStructuredOutput: jest.fn().mockReturnValue({
      invoke: (...args: unknown[]) => mockInvoke(...args),
    }),
    pipe: jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }),
    }),
  })),
}));

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          invoke: (...args: unknown[]) => mockInvoke(...args),
        }),
        invoke: (...args: unknown[]) => mockInvoke(...args),
      }),
    }),
  },
}));

jest.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: jest.fn().mockImplementation(() => ({})),
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

  beforeEach(async () => {
    jest.clearAllMocks();
    mockInvoke = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should initialise ChatAnthropic with ANTHROPIC_API_KEY', () => {
    expect(mockConfigService.getOrThrow).toHaveBeenCalledWith(
      'ANTHROPIC_API_KEY',
    );
    expect(ChatAnthropic).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: 'test-api-key',
        model: 'claude-opus-4-6',
      }),
    );
  });

  it('should create a thinking model with extended thinking enabled', () => {
    expect(ChatAnthropic).toHaveBeenCalledWith(
      expect.objectContaining({
        thinking: { type: 'enabled', budget_tokens: 8000 },
      }),
    );
  });

  // -------------------------------------------------------------------------
  // categorizeTransaction
  // -------------------------------------------------------------------------

  describe('categorizeTransaction', () => {
    it('should invoke the structured output chain and return category + confidence', async () => {
      const mockResult = { category: 'Food', confidence: 0.92 };
      mockInvoke.mockResolvedValue(mockResult);

      const result = await service.categorizeTransaction(
        'Grocery store',
        50,
        'EXPENSE',
      );

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          description: expect.any(String),
          type: 'EXPENSE',
          categories: expect.any(String),
        }),
      );
      expect(result).toEqual(mockResult);
    });
  });

  // -------------------------------------------------------------------------
  // generateInsights
  // -------------------------------------------------------------------------

  describe('generateInsights', () => {
    it('should invoke the text chain and return plain text', async () => {
      mockInvoke.mockResolvedValue('You spend too much on food.');

      const result = await service.generateInsights(mockTransactions, 'weekly');

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({
          period: 'weekly',
          summary: expect.any(String),
        }),
      );
      expect(result).toBe('You spend too much on food.');
    });

    it('should pass "No transactions available." in summary for empty list', async () => {
      mockInvoke.mockResolvedValue('No data available.');

      await service.generateInsights([], 'monthly');

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'No transactions available.' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // generateGoalRecommendation
  // -------------------------------------------------------------------------

  describe('generateGoalRecommendation', () => {
    it('should invoke chain and return recommendation text', async () => {
      mockInvoke.mockResolvedValue('Cut dining out by 20%.');

      const goal = {
        description: 'Save for vacation',
        targetAmount: 2000,
        deadline: '2025-12-31',
      };
      const result = await service.generateGoalRecommendation(
        goal,
        mockTransactions,
      );

      expect(mockInvoke).toHaveBeenCalled();
      expect(result).toBe('Cut dining out by 20%.');
    });

    it('should pass empty deadlineLine when deadline is not provided', async () => {
      mockInvoke.mockResolvedValue('Advice.');

      await service.generateGoalRecommendation(
        { description: 'Emergency fund', targetAmount: 1000 },
        [],
      );

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ deadlineLine: '' }),
      );
    });

    it('should pass deadlineLine when deadline is provided', async () => {
      mockInvoke.mockResolvedValue('Advice.');

      // deadline is truncated to YYYY-MM by the anonymizer
      await service.generateGoalRecommendation(
        {
          description: 'savings goal',
          targetAmount: 1000,
          deadline: '2025-06-01',
        },
        [],
      );

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ deadlineLine: 'Deadline: 2025-06' }),
      );
    });
  });

  // -------------------------------------------------------------------------
  // generateWeeklyChallenge
  // -------------------------------------------------------------------------

  describe('generateWeeklyChallenge', () => {
    it('should invoke chain and return challenge text', async () => {
      mockInvoke.mockResolvedValue('Spend less than $60 on Food this week.');

      const weekStart = new Date('2025-01-06');
      const weekEnd = new Date('2025-01-12');
      const result = await service.generateWeeklyChallenge(
        mockTransactions,
        weekStart,
        weekEnd,
      );

      expect(result).toBe('Spend less than $60 on Food this week.');
    });

    it('should include date range in chain invocation', async () => {
      mockInvoke.mockResolvedValue('Save at least $50.');

      const weekStart = new Date('2025-03-10');
      const weekEnd = new Date('2025-03-16');
      await service.generateWeeklyChallenge([], weekStart, weekEnd);

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ from: '2025-03-10', to: '2025-03-16' }),
      );
    });
  });
});
