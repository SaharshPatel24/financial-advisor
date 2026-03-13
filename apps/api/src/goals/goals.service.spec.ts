import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { GoalsService } from './goals.service';

const mockGoal = {
  id: 'goal-1',
  userId: 'user-1',
  description: 'Save for vacation',
  targetAmount: 2000,
  deadline: new Date('2025-12-31'),
  aiRecommendation: 'Cut dining out.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  transaction: { findMany: jest.fn() },
  goal: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
};

const mockAi = { generateGoalRecommendation: jest.fn() };

describe('GoalsService', () => {
  let service: GoalsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should fetch recent transactions, call AI, and persist goal', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockAi.generateGoalRecommendation.mockResolvedValue('Cut dining out.');
      mockPrisma.goal.create.mockResolvedValue(mockGoal);

      const result = await service.create('user-1', {
        description: 'Save for vacation',
        targetAmount: 2000,
        deadline: '2025-12-31',
      });

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, take: 50 }),
      );
      expect(mockAi.generateGoalRecommendation).toHaveBeenCalled();
      expect(mockPrisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          aiRecommendation: 'Cut dining out.',
          deadline: new Date('2025-12-31'),
        }),
      });
      expect(result).toEqual(mockGoal);
    });

    it('should set deadline to null when not provided', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockAi.generateGoalRecommendation.mockResolvedValue('Save more.');
      mockPrisma.goal.create.mockResolvedValue({ ...mockGoal, deadline: null });

      await service.create('user-1', {
        description: 'Emergency fund',
        targetAmount: 1000,
      });

      expect(mockPrisma.goal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ deadline: null }),
      });
    });
  });

  describe('findAll', () => {
    it('should return all goals for the user', async () => {
      mockPrisma.goal.findMany.mockResolvedValue([mockGoal]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.goal.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockGoal]);
    });
  });

  describe('findOne', () => {
    it('should return the goal when found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(mockGoal);

      const result = await service.findOne('user-1', 'goal-1');

      expect(mockPrisma.goal.findFirst).toHaveBeenCalledWith({
        where: { id: 'goal-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockGoal);
    });

    it('should throw NotFoundException when goal not found', async () => {
      mockPrisma.goal.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
