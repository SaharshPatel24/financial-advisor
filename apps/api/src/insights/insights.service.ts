import { Injectable } from '@nestjs/common';
import type { Insight, InsightPeriod } from '@financial-advisor/shared';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InsightsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string, period: InsightPeriod): Promise<Insight> {
    const { from, to } = getDateRange(period);

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: from, lte: to } },
      orderBy: { date: 'desc' },
    });

    const summary = await this.ai.generateInsights(transactions as any, period);

    return {
      period,
      summary,
      from: from.toISOString(),
      to: to.toISOString(),
      generatedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Module-private helper
// ---------------------------------------------------------------------------

function getDateRange(period: InsightPeriod): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date(to);

  if (period === 'weekly') {
    from.setDate(from.getDate() - 7);
  } else {
    from.setMonth(from.getMonth() - 1);
  }

  return { from, to };
}
