import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesController } from './challenges.controller';
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

const mockService = {
  generate: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  updateStatus: jest.fn(),
};
const mockRequest = { user: { id: 'user-1' } };

describe('ChallengesController', () => {
  let controller: ChallengesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengesController],
      providers: [{ provide: ChallengesService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChallengesController>(ChallengesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /challenges/generate', () => {
    it('should call service.generate with userId', async () => {
      mockService.generate.mockResolvedValue(mockChallenge);

      const result = await controller.generate(mockRequest as any);

      expect(mockService.generate).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockChallenge);
    });
  });

  describe('GET /challenges', () => {
    it('should return all challenges for the user', async () => {
      mockService.findAll.mockResolvedValue([mockChallenge]);

      const result = await controller.findAll(mockRequest as any);

      expect(mockService.findAll).toHaveBeenCalledWith('user-1');
      expect(result).toEqual([mockChallenge]);
    });
  });

  describe('GET /challenges/:id', () => {
    it('should return one challenge', async () => {
      mockService.findOne.mockResolvedValue(mockChallenge);

      const result = await controller.findOne(mockRequest as any, 'ch-1');

      expect(mockService.findOne).toHaveBeenCalledWith('user-1', 'ch-1');
      expect(result).toEqual(mockChallenge);
    });

    it('should propagate NotFoundException', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        controller.findOne(mockRequest as any, 'bad-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('PATCH /challenges/:id/status', () => {
    it('should update the challenge status', async () => {
      const updated = { ...mockChallenge, status: 'COMPLETED' };
      mockService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(mockRequest as any, 'ch-1', {
        status: 'COMPLETED',
      });

      expect(mockService.updateStatus).toHaveBeenCalledWith(
        'user-1',
        'ch-1',
        'COMPLETED',
      );
      expect(result).toEqual(updated);
    });
  });
});
