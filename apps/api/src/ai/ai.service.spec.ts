import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from './ai.service';
import * as llmFactory from './llm.factory';
import type { Transaction } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

let mockInvoke: jest.Mock;
let mockFallbackInvoke: jest.Mock;

/**
 * Builds a mock model whose invoke routes through the provided spy.
 * prompt.pipe(model) returns the model itself (see ChatPromptTemplate mock below),
 * so model.pipe(parser).invoke() and model.withStructuredOutput().invoke() both
 * call through to the spy.
 */
function makeMockModel(spy: () => jest.Mock) {
  return {
    withStructuredOutput: jest.fn().mockReturnValue({
      invoke: (...args: unknown[]) => spy()(...args),
    }),
    pipe: jest.fn().mockReturnValue({
      invoke: (...args: unknown[]) => spy()(...args),
      pipe: jest.fn().mockReturnValue({
        invoke: (...args: unknown[]) => spy()(...args),
      }),
    }),
  };
}

jest.mock('./llm.factory', () => ({ createLlmPair: jest.fn() }));

/**
 * Make prompt.pipe(runnable) return the runnable directly so that
 * prompt.pipe(model.withStructuredOutput(schema)) delegates to the correct
 * model's invoke — primary or fallback.
 */
jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromTemplate: jest.fn().mockReturnValue({
      pipe: jest.fn().mockImplementation((runnable: any) => runnable),
    }),
  },
}));

jest.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: jest.fn().mockImplementation(() => ({})),
}));

const mockConfigService = { getOrThrow: jest.fn() } as unknown as ConfigService;

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

async function buildService(
  fallbackModels: unknown[] = [],
): Promise<AiService> {
  (llmFactory.createLlmPair as jest.Mock).mockReturnValue({
    model: makeMockModel(() => mockInvoke),
    thinkingModel: makeMockModel(() => mockInvoke),
    fallbackModels,
  });
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      AiService,
      { provide: ConfigService, useValue: mockConfigService },
    ],
  }).compile();
  return module.get<AiService>(AiService);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke = jest.fn();
    mockFallbackInvoke = jest.fn();
  });

  it('should be defined', async () => {
    expect(await buildService()).toBeDefined();
  });

  it('should delegate model creation to createLlmPair', async () => {
    await buildService();
    expect(llmFactory.createLlmPair).toHaveBeenCalledWith(mockConfigService);
  });

  // -------------------------------------------------------------------------
  // generateInsights
  // -------------------------------------------------------------------------

  describe('generateInsights', () => {
    it('should invoke the text chain and return plain text', async () => {
      const service = await buildService();
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
      const service = await buildService();
      mockInvoke.mockResolvedValue('No data available.');

      await service.generateInsights([], 'monthly');

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ summary: 'No transactions available.' }),
      );
    });

    it('should use fallback model when primary fails', async () => {
      const fallback = makeMockModel(() => mockFallbackInvoke);
      const service = await buildService([fallback]);
      mockInvoke.mockRejectedValue(new Error('API error'));
      mockFallbackInvoke.mockResolvedValue('Fallback insight.');

      const result = await service.generateInsights(mockTransactions, 'weekly');

      expect(result).toBe('Fallback insight.');
    });

    it('should return static fallback when all models fail', async () => {
      const service = await buildService();
      mockInvoke.mockRejectedValue(new Error('API error'));

      const result = await service.generateInsights([], 'weekly');

      expect(result).toMatch(/temporarily unavailable/i);
    });
  });

  // -------------------------------------------------------------------------
  // generateGoalRecommendation
  // -------------------------------------------------------------------------

  describe('generateGoalRecommendation', () => {
    it('should invoke chain and return recommendation text', async () => {
      const service = await buildService();
      mockInvoke.mockResolvedValue('Cut dining out by 20%.');

      const result = await service.generateGoalRecommendation(
        {
          description: 'Save for vacation',
          targetAmount: 2000,
          deadline: '2025-12-31',
        },
        mockTransactions,
      );

      expect(result).toBe('Cut dining out by 20%.');
    });

    it('should pass empty deadlineLine when deadline is not provided', async () => {
      const service = await buildService();
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
      const service = await buildService();
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

    it('should return static fallback when all models fail', async () => {
      const service = await buildService();
      mockInvoke.mockRejectedValue(new Error('API error'));

      const result = await service.generateGoalRecommendation(
        { description: 'savings goal', targetAmount: 500 },
        [],
      );

      expect(result).toMatch(/temporarily unavailable/i);
    });
  });

  // -------------------------------------------------------------------------
  // generateWeeklyChallenge
  // -------------------------------------------------------------------------

  describe('generateWeeklyChallenge', () => {
    it('should invoke chain and return challenge text', async () => {
      const service = await buildService();
      mockInvoke.mockResolvedValue('Spend less than $60 on Food this week.');

      const result = await service.generateWeeklyChallenge(
        mockTransactions,
        new Date('2025-01-06'),
        new Date('2025-01-12'),
      );

      expect(result).toBe('Spend less than $60 on Food this week.');
    });

    it('should include date range in chain invocation', async () => {
      const service = await buildService();
      mockInvoke.mockResolvedValue('Save at least $50.');

      await service.generateWeeklyChallenge(
        [],
        new Date('2025-03-10'),
        new Date('2025-03-16'),
      );

      expect(mockInvoke).toHaveBeenCalledWith(
        expect.objectContaining({ from: '2025-03-10', to: '2025-03-16' }),
      );
    });

    it('should return static fallback when all models fail', async () => {
      const service = await buildService();
      mockInvoke.mockRejectedValue(new Error('API error'));

      const result = await service.generateWeeklyChallenge(
        [],
        new Date('2025-01-06'),
        new Date('2025-01-12'),
      );

      expect(result).toMatch(/save at least \$10/i);
    });
  });
});
