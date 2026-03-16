import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
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
  date: new Date('2025-01-01'),
  createdAt: new Date('2025-01-01'),
};

const mockPrisma = {
  transaction: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn(),
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
    it('should create a transaction with the provided category', async () => {
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.create('user-1', {
        description: 'Coffee',
        amount: 5,
        type: 'EXPENSE',
        category: 'Food',
      });

      expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ category: 'Food' }),
      });
      expect(result).toEqual(mockTransaction);
    });

    it('should use provided date when given', async () => {
      mockPrisma.transaction.create.mockResolvedValue(mockTransaction);

      await service.create('user-1', {
        description: 'Lunch',
        amount: 12,
        type: 'EXPENSE',
        category: 'Food',
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

  // -------------------------------------------------------------------------
  // update
  // -------------------------------------------------------------------------

  describe('update', () => {
    it('should update allowed fields', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.update.mockResolvedValue({
        ...mockTransaction,
        description: 'Latte',
        amount: 6,
      });

      const result = await service.update('user-1', 'tx-1', {
        description: 'Latte',
        amount: 6,
      });

      expect(mockPrisma.transaction.update).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
        data: { description: 'Latte', amount: 6 },
      });
      expect(result.description).toBe('Latte');
    });

    it('should throw NotFoundException when transaction does not belong to user', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(
        service.update('user-1', 'bad-id', { amount: 10 }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------------------
  // delete
  // -------------------------------------------------------------------------

  describe('delete', () => {
    it('should delete a transaction belonging to the user', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(mockTransaction);
      mockPrisma.transaction.delete.mockResolvedValue(mockTransaction);

      await service.delete('user-1', 'tx-1');

      expect(mockPrisma.transaction.delete).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
      });
    });

    it('should throw NotFoundException when transaction does not belong to user', async () => {
      mockPrisma.transaction.findFirst.mockResolvedValue(null);

      await expect(service.delete('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
