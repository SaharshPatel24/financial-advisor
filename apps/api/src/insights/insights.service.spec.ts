import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { InsightsService } from './insights.service';

const mockTransactions = [
  {
    id: 'tx-1',
    userId: 'u1',
    description: 'Groceries',
    amount: 80,
    type: 'EXPENSE',
    category: 'Food',
    aiConfidence: 0.9,
    date: new Date(),
    createdAt: new Date(),
  },
];

const mockPrisma = {
  transaction: { findMany: jest.fn() },
};

const mockAi = {
  generateInsights: jest.fn(),
};

describe('InsightsService', () => {
  let service: InsightsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return an Insight with correct shape for weekly period', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
    mockAi.generateInsights.mockResolvedValue('You spend a lot on food.');

    const result = await service.generate('u1', 'weekly');

    expect(result.period).toBe('weekly');
    expect(result.summary).toBe('You spend a lot on food.');
    expect(result.from).toBeDefined();
    expect(result.to).toBeDefined();
    expect(result.generatedAt).toBeDefined();
  });

  it('should return an Insight for monthly period', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    mockAi.generateInsights.mockResolvedValue('No spending this month.');

    const result = await service.generate('u1', 'monthly');

    expect(result.period).toBe('monthly');
    expect(result.summary).toBe('No spending this month.');
  });

  it('should query transactions within the correct date range', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue([]);
    mockAi.generateInsights.mockResolvedValue('OK');

    const before = new Date();
    await service.generate('u1', 'weekly');
    const after = new Date();

    const { where } = mockPrisma.transaction.findMany.mock.calls[0][0];
    expect(where.userId).toBe('u1');

    const from = new Date(where.date.gte);
    const to = new Date(where.date.lte);
    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeCloseTo(7, 0);
    expect(to.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(to.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  it('should pass transactions and period to AiService', async () => {
    mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions);
    mockAi.generateInsights.mockResolvedValue('Insight text');

    await service.generate('u1', 'weekly');

    expect(mockAi.generateInsights).toHaveBeenCalledWith(
      mockTransactions,
      'weekly',
    );
  });
});
