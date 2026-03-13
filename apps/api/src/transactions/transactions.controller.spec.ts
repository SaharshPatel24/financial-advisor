import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TransactionsController } from './transactions.controller';
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

const mockService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
};

const mockRequest = { user: { id: 'user-1', email: 'user@test.com' } };

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TransactionsController', () => {
  let controller: TransactionsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionsController],
      providers: [{ provide: TransactionsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<TransactionsController>(TransactionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // POST /transactions
  // -------------------------------------------------------------------------

  describe('create', () => {
    it('should call service.create with userId and dto', async () => {
      mockService.create.mockResolvedValue(mockTransaction);

      const dto = { description: 'Coffee', amount: 5, type: 'EXPENSE' as const };
      const result = await controller.create(mockRequest as any, dto);

      expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockTransaction);
    });
  });

  // -------------------------------------------------------------------------
  // GET /transactions
  // -------------------------------------------------------------------------

  describe('findAll', () => {
    it('should call service.findAll with userId and query', async () => {
      const paginated = { data: [mockTransaction], total: 1, page: 1, limit: 20 };
      mockService.findAll.mockResolvedValue(paginated);

      const query = { type: 'EXPENSE' as const };
      const result = await controller.findAll(mockRequest as any, query);

      expect(mockService.findAll).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(paginated);
    });
  });

  // -------------------------------------------------------------------------
  // GET /transactions/:id
  // -------------------------------------------------------------------------

  describe('findOne', () => {
    it('should call service.findOne with userId and id', async () => {
      mockService.findOne.mockResolvedValue(mockTransaction);

      const result = await controller.findOne(mockRequest as any, 'tx-1');

      expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'tx-1');
      expect(result).toEqual(mockTransaction);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne(mockRequest as any, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
