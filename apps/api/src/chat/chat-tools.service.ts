import { Injectable, Logger } from '@nestjs/common';
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
  private readonly logger = new Logger(ChatToolsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getTransactions(
    userId: string,
    args: { from?: string; to?: string; category?: string; limit?: number },
  ): Promise<AnonTransaction[]> {
    this.logger.log(`getTransactions called — args: ${JSON.stringify(args)}`);

    const rows = await this.prisma.transaction.findMany({
      where: {
        userId,
        ...(args.category ? { category: args.category as any } : {}),
        ...(args.from || args.to
          ? {
              date: {
                ...(args.from ? { gte: startOfDay(args.from) } : {}),
                ...(args.to ? { lte: endOfDay(args.to) } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: 'desc' },
      take: args.limit ?? 50,
    });

    this.logger.log(`getTransactions result — ${rows.length} rows`);

    return rows.map((t) => ({
      amount: t.amount,
      type: t.type,
      category: t.category,
      // Shift back 12 h so transactions entered late evening in western
      // timezones (stored as next-day UTC) display with the correct local date.
      date: new Date(t.date.getTime() - 12 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]!,
      description: t.description,
    }));
  }

  async getGoals(userId: string): Promise<AnonGoal[]> {
    this.logger.log(`getGoals called — userId: ${userId}`);

    const rows = await this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    this.logger.log(`getGoals result — ${rows.length} rows`);

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
    this.logger.log(`getSpendingSummary called — period: ${args.period}`);

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

  async getActiveChallenge(userId: string): Promise<{
    description: string;
    weekStart: string;
    weekEnd: string;
  } | null> {
    this.logger.log(`getActiveChallenge called — userId: ${userId}`);

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
      func: (raw) => {
        const args = parseArgs<{
          from?: string;
          to?: string;
          category?: string;
          limit?: number;
        }>(raw);
        return service
          .getTransactions(userId, args)
          .then((r) => JSON.stringify(r));
      },
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
      func: (raw) => {
        const args = parseArgs<{ period: 'weekly' | 'monthly' }>(raw);
        return service
          .getSpendingSummary(userId, args)
          .then((r) => JSON.stringify(r));
      },
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

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

/**
 * Some models (e.g. Gemini) call tools with a legacy single-string format:
 *   { input: '{"from":"...","category":"Food"}' }
 * instead of a structured object. This helper unwraps that string so the
 * actual filter args are always available regardless of model.
 */
function parseArgs<T extends object>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'input' in raw) {
    const inputVal = (raw as { input: unknown }).input;
    if (typeof inputVal === 'string') {
      try {
        return JSON.parse(inputVal) as T;
      } catch {
        // fall through — return raw
      }
    }
  }
  return raw as T;
}

function startOfDay(dateStr: string): Date {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfDay(dateStr: string): Date {
  // Extend 12 h past UTC midnight to cover UTC-12 (westernmost) timezone:
  // a transaction recorded at e.g. 8 pm EST (UTC-5) on date X is stored as
  // X+1T01:00Z — without this buffer those rows would be missed.
  const d = new Date(dateStr);
  d.setUTCHours(35, 59, 59, 999); // 23 + 12 = 35 → rolls to next day 11:59:59 Z
  return d;
}
