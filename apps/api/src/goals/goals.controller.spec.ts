import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  description: 'Save for vacation',
  targetAmount: 2000,
  deadline: null,
  aiRecommendation: 'Cut dining out.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockService = { create: jest.fn(), findAll: jest.fn(), findOne: jest.fn() };
const mockRequest = { user: { id: 'user-1' } };

describe('GoalsController', () => {
  let controller: GoalsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [{ provide: GoalsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<GoalsController>(GoalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /goals', () => {
    it('should create a goal', async () => {
      mockService.create.mockResolvedValue(mockGoal);
      const dto = { description: 'Save for vacation', targetAmount: 2000 };

      const result = await controller.create(mockRequest as any, dto);

      expect(mockService.create).toHaveBeenCalledWith('user-1', dto);
      expect(result).toEqual(mockGoal);
    });
  });

  describe('GET /goals', () => {
    it('should return all goals for the user', async () => {
      mockService.findAll.mockResolvedValue([mockGoal]);

      const result = await controller.findAll(mockRequest as any);

      expect(mockService.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockGoal]);
    });
  });

  describe('GET /goals/:id', () => {
    it('should return one goal', async () => {
      mockService.findOne.mockResolvedValue(mockGoal);

      const result = await controller.findOne(mockRequest as any, 'goal-1');

      expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'goal-1');
      expect(result).toEqual(mockGoal);
    });

    it('should propagate NotFoundException', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne(mockRequest as any, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
