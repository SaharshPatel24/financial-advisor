import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';

const mockInsight = {
  period: 'weekly',
  summary: 'You spend a lot on food.',
  from: '2025-01-01T00:00:00.000Z',
  to: '2025-01-07T00:00:00.000Z',
  generatedAt: '2025-01-07T12:00:00.000Z',
};

const mockService = { generate: jest.fn() };
const mockRequest = { user: { id: 'user-1' } };

describe('InsightsController', () => {
  let controller: InsightsController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InsightsController],
      providers: [{ provide: InsightsService, useValue: mockService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<InsightsController>(InsightsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.generate with userId and period', async () => {
    mockService.generate.mockResolvedValue(mockInsight);

    const result = await controller.generate(mockRequest as any, 'weekly');

    expect(mockService.generate).toHaveBeenCalledWith('user-1', 'weekly');
    expect(result).toEqual(mockInsight);
  });

  it('should default to weekly when period is not provided', async () => {
    mockService.generate.mockResolvedValue(mockInsight);

    await controller.generate(mockRequest as any, undefined as any);

    expect(mockService.generate).toHaveBeenCalledWith('user-1', 'weekly');
  });

  it('should pass monthly period to the service', async () => {
    mockService.generate.mockResolvedValue({ ...mockInsight, period: 'monthly' });

    await controller.generate(mockRequest as any, 'monthly');

    expect(mockService.generate).toHaveBeenCalledWith('user-1', 'monthly');
  });
});
