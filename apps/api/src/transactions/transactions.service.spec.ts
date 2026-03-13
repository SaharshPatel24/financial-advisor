import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockTransaction = {
  id: 'tx-1',
  userId: 'user-1',
  description: 'Coffee',
  amount: 5,
  type: 'EXPENSE',
  category: 'Food',
  aiConfidence: 0.9,
  date: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
};

const mockPrisma = {
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockAi = {
  categorizeTransaction: jest.fn(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('should auto-categorize when category is omitted', async () => {
      mockAi.categorizeTransaction.mockResolvedValue({
        category: 'Food',
        confidence: 0.9,
      });
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create('user-1', {
        description: 'Coffee',
        amount: 5,
        type: 'EXPENSE',
      });

      expect(mockAi.categorizeTransaction).toHaveBeenCalledWith(
        'Coffee',
        5,
        'EXPENSE',
      );
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          category: 'Food',
          aiConfidence: 0.9,
        }),
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should skip AI when category is provided', async () => {
      mockPrisma.transaction.create.mockResolvedValue({
        ...mockTransaction,
        aiConfidence: null,
      });

      await service.create('user-1', {
        description: 'Salary',
        amount: 3000,
        type: 'INCOME',
        category: 'Income',
      });

      expect(mockAi.categorizeTransaction).not.toHaveBeenCalled();
      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ category: 'Income', aiConfidence: null }),
      });
    });

    it('should use provided date when given', async () => {
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);
      mockAi.categorizeTransaction.mockResolvedValue({
        category: 'Food',
        confidence: 0.8,
      });

      await service.create('user-1', {
        description: 'Lunch',
        amount: 12,
        type: 'EXPENSE',
        date: '2025-06-15T12:00:00.000Z',
      });

      const createdData = mockPrisma.transaction.create.mock.calls[0][0].data;
      expect(createdData.date).toEqual(new Date('2025-06-15T12:00:00.000Z'));
    });
  });

  // -------------------------------------------------------------------------
  // findAll
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    beforeEach(() => {
      mockPrisma.$transaction.mockResolvedValue([[mockTransaction], 1]);
    });

    it('should return paginated transactions with defaults', async () => {
      const result = await service.findAll('user-1', {});

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(result).toEqual({
        data: [mockTransaction],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('should apply type and category filters', async () => {
      const result = await service.findAll('user-1', {
        type: 'EXPENSE',
        category: 'Food',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(1);
    });

    it('should apply date range filter', async () => {
      const result = await service.findAll('user-1', {
        from: '2025-01-01',
        to: '2025-01-31',
      });

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(result.total).toBe(1);
    });

    it('should cap limit at 100', async () => {
      const result = await service.findAll('user-1', { limit: 999 });

      expect(result.limit).toBe(100);
    });
  });

  // -------------------------------------------------------------------------
  // findOne
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('should return a transaction belonging to the user', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);

      const result = await service.findOne('user-1', 'tx-1');

      expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
        where: { id: 'tx-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundException when transaction is not found', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
