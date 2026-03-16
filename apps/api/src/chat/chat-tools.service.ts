import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';

export interface AnonTransaction {
  amount: number;
  type: string;
  category: string;
  date: string;
  description: string;
}

export interface AnonGoal {
  description: string;
  targetAmount: number;
  deadline: string | null;
  aiRecommendation: string | null;
}

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
}

@Injectable()
export class ChatToolsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(
    userId: string,
    args: { from?: string; to?: string; category?: string; limit?: number },
  ): Promise<AnonTransaction[]> {
    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        ...(args.category ? { category: args.category as any } : {}),
        ...(args.from || args.to
          ? {
              date: {
                ...(args.from ? { gte: new Date(args.from) } : {}),
                ...(args.to ? { lte: new Date(args.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      take: args.limit ?? 50,
    });

    return rows.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date.toISOString().split('T')[0]!,
      description: t.description,
    }));
  }

  async getGoals(userId: string): Promise<AnonGoal[]> {
    const rows = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((g) => ({
      description: g.description,
      targetAmount: g.targetAmount,
      deadline: g.deadline ? g.deadline.toISOString().split('T')[0]! : null,
      aiRecommendation: g.aiRecommendation,
    }));
  }

  async getSpendingSummary(
    userId: string,
    args: { period: 'weekly' | 'monthly' },
  ): Promise<CategorySummary[]> {
    const now = new Date();
    const from =
      args.period === 'weekly'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1);

    const rows = await this.prisma.transaction.findMany({
      where: { userId, date: { gte: from }, type: 'EXPENSE' },
    });

    const byCategory = rows.reduce<
      Record<string, { total: number; count: number }>
    >((acc, t) => {
      acc[t.category] ??= { total: 0, count: 0 };
      acc[t.category]!.total += t.amount;
      acc[t.category]!.count += 1;
      return acc;
    }, {});

    return Object.entries(byCategory).map(([category, { total, count }]) => ({
      category,
      total: Math.round(total * 100) / 100,
      count,
    }));
  }

  async getActiveChallenge(
    userId: string,
  ): Promise<{
    description: string;
    weekStart: string;
    weekEnd: string;
  } | null> {
    const challenge = await this.prisma.challenge.findFirst({
      where: { userId, status: 'ACTIVE' },
      orderBy: { weekStart: 'desc' },
    });

    if (!challenge) return null;

    return {
      description: challenge.description,
      weekStart: challenge.weekStart.toISOString().split('T')[0]!,
      weekEnd: challenge.weekEnd.toISOString().split('T')[0]!,
    };
  }
}

// ---------------------------------------------------------------------------
// Build tool definitions with userId bound in closure
// ---------------------------------------------------------------------------

export function buildTools(
  service: ChatToolsService,
  userId: string,
): DynamicStructuredTool[] {
  return [
    new DynamicStructuredTool({
      name: 'get_transactions',
      description:
        "Fetch the user's transactions. Filter by date range, category, or limit. Returns amount, type, category, date, description.",
      schema: z.object({
        from: z
          .string()
          .optional()
          .describe('ISO date string, e.g. 2025-01-01'),
        to: z.string().optional().describe('ISO date string, e.g. 2025-01-31'),
        category: z
          .enum([
            'Food',
            'Transport',
            'Bills',
            'Entertainment',
            'Shopping',
            'Health',
            'Income',
            'Other',
          ])
          .optional()
          .describe('Filter by category'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Max records to return'),
      }),
      func: (args) =>
        service.getTransactions(userId, args).then((r) => JSON.stringify(r)),
    }),

    new DynamicStructuredTool({
      name: 'get_goals',
      description: 'Fetch all savings goals for the user.',
      schema: z.object({}),
      func: () => service.getGoals(userId).then((r) => JSON.stringify(r)),
    }),

    new DynamicStructuredTool({
      name: 'get_spending_summary',
      description:
        'Get total spending by category for the current week or month.',
      schema: z.object({
        period: z
          .enum(['weekly', 'monthly'])
          .describe('weekly = last 7 days, monthly = current calendar month'),
      }),
      func: (args) =>
        service.getSpendingSummary(userId, args).then((r) => JSON.stringify(r)),
    }),

    new DynamicStructuredTool({
      name: 'get_active_challenge',
      description: "Get the user's most recent active weekly challenge.",
      schema: z.object({}),
      func: () =>
        service.getActiveChallenge(userId).then((r) => JSON.stringify(r)),
    }),
  ];
}
