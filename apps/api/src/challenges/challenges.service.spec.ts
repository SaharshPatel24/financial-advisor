import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { ChallengesService } from './challenges.service';

const mockChallenge = {
  id: 'ch-1',
  userId: 'user-1',
  description: 'Spend less than $50 on Food this week.',
  weekStart: new Date('2025-01-06'),
  weekEnd: new Date('2025-01-12'),
  status: 'ACTIVE',
  createdAt: new Date(),
};

const mockPrisma = {
  transaction: { findMany: jest.fn() },
  challenge: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
};

const mockAi = { generateWeeklyChallenge: jest.fn() };

describe('ChallengesService', () => {
  let service: ChallengesService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<ChallengesService>(ChallengesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should fetch transactions, call AI, and persist challenge', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockAi.generateWeeklyChallenge.mockResolvedValue(
        'Spend less than $50 on Food this week.',
      );
      mockPrisma.challenge.create.mockResolvedValue(mockChallenge);

      const result = await service.generate('user-1');

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' }, take: 50 }),
      );
      expect(mockAi.generateWeeklyChallenge).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(Date),
        expect.any(Date),
      );
      expect(mockPrisma.challenge.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          description: 'Spend less than $50 on Food this week.',
        }),
      });
      expect(result).toEqual(mockChallenge);
    });

    it('should compute weekStart as Sunday and weekEnd as Saturday', async () => {
      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockAi.generateWeeklyChallenge.mockResolvedValue('Challenge text');
      mockPrisma.challenge.create.mockResolvedValue(mockChallenge);

      await service.generate('user-1');

      const { weekStart, weekEnd } =
        mockPrisma.challenge.create.mock.calls[0][0].data;

      expect(weekStart.getDay()).toBe(0); // Sunday
      expect(weekEnd.getDay()).toBe(6); // Saturday
      const diffDays =
        (weekEnd.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24);
      // weekStart is 00:00:00, weekEnd is 23:59:59.999 — diff is ~6.999 days
      expect(diffDays).toBeGreaterThanOrEqual(6);
      expect(diffDays).toBeLessThan(7);
    });
  });

  describe('findAll', () => {
    it('should return challenges for the user ordered by weekStart desc', async () => {
      mockPrisma.challenge.findMany.mockResolvedValue([mockChallenge]);

      const result = await service.findAll('user-1');

      expect(mockPrisma.challenge.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { weekStart: 'desc' },
      });
      expect(result).toEqual([mockChallenge]);
    });
  });

  describe('findOne', () => {
    it('should return a challenge scoped to the user', async () => {
      mockPrisma.challenge.findFirst.mockResolvedValue(mockChallenge);

      const result = await service.findOne('user-1', 'ch-1');

      expect(mockPrisma.challenge.findFirst).toHaveBeenCalledWith({
        where: { id: 'ch-1', userId: 'user-1' },
      });
      expect(result).toEqual(mockChallenge);
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrisma.challenge.findFirst.mockResolvedValue(null);

      await expect(service.findOne('user-1', 'bad-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should update and return the challenge', async () => {
      mockPrisma.challenge.findFirst.mockResolvedValue(mockChallenge);
      mockPrisma.challenge.update.mockResolvedValue({
        ...mockChallenge,
        status: 'COMPLETED',
      });

      const result = await service.updateStatus('user-1', 'ch-1', 'COMPLETED');

      expect(mockPrisma.challenge.update).toHaveBeenCalledWith({
        where: { id: 'ch-1' },
        data: { status: 'COMPLETED' },
      });
      expect(result.status).toBe('COMPLETED');
    });

    it('should throw NotFoundException when challenge does not belong to user', async () => {
      mockPrisma.challenge.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus('user-1', 'bad-id', 'FAILED'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
