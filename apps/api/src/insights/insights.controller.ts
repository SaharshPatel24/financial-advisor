import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import type { InsightPeriod } from '@financial-advisor/shared';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InsightsService } from './insights.service';

interface AuthRequest {
  user: { id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get()
  generate(
    @Request() req: AuthRequest,
    @Query('period') period: InsightPeriod = 'weekly',
  ) {
    return this.insights.generate(req.user.id, period);
  }
}
