import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import type {
  CreateGoalDto,
  InsightPeriod,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';

const TRANSACTION_CATEGORIES: [
  TransactionCategory,
  ...TransactionCategory[],
] = [
  'Food',
  'Transport',
  'Bills',
  'Entertainment',
  'Shopping',
  'Health',
  'Income',
  'Other',
];

const CategorizationSchema = z.object({
  category: z.enum(TRANSACTION_CATEGORIES),
  confidence: z.number().min(0).max(1),
});

type Categorization = z.infer<typeof CategorizationSchema>;

@Injectable()
export class AiService {
  private readonly client: Anthropic;
  private readonly model = 'claude-opus-4-6';

  constructor(config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async categorizeTransaction(
    description: string,
    amount: number,
    type: TransactionType,
  ): Promise<Categorization> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Categorize this transaction:
Description: ${description}
Amount: $${amount}
Type: ${type}

Choose from: ${TRANSACTION_CATEGORIES.join(', ')}.
Return a confidence score between 0 and 1.`,
        },
      ],
      output_config: {
        format: zodOutputFormat(CategorizationSchema),
      },
    });

    return response.parsed_output!;
  }

  async generateInsights(
    transactions: Transaction[],
    period: InsightPeriod,
  ): Promise<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: `You are a personal finance advisor. Analyze the following ${period} transactions and provide 2-3 actionable insights in under 200 words.

Transaction summary:
${buildTransactionSummary(transactions)}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    return extractText(message.content);
  }

  async generateGoalRecommendation(
    goal: CreateGoalDto,
    transactions: Transaction[],
  ): Promise<string> {
    const deadlineLine = goal.deadline ? `Deadline: ${goal.deadline}` : '';

    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 512,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: `You are a personal finance advisor. Given this savings goal and recent spending, provide a concrete recommendation in 2-3 sentences.

Goal: ${goal.description}
Target: $${goal.targetAmount}
${deadlineLine}

Recent spending:
${buildTransactionSummary(transactions)}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    return extractText(message.content);
  }

  async generateWeeklyChallenge(
    transactions: Transaction[],
    weekStart: Date,
    weekEnd: Date,
  ): Promise<string> {
    const from = weekStart.toISOString().split('T')[0];
    const to = weekEnd.toISOString().split('T')[0];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `You are a personal finance coach. Based on this user's recent spending, generate one specific, achievable weekly challenge for ${from} to ${to}.

Recent spending:
${buildTransactionSummary(transactions)}

Return exactly one sentence starting with "Spend less than", "Save at least", or "Limit your". Use specific dollar amounts from the data.`,
        },
      ],
    });

    return extractText(response.content);
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

function buildTransactionSummary(transactions: Transaction[]): string {
  if (transactions.length === 0) return 'No transactions available.';

  const byCategory = transactions.reduce<
    Record<string, { total: number; count: number }>
  >((acc, t) => {
    acc[t.category] ??= { total: 0, count: 0 };
    acc[t.category].total += t.amount;
    acc[t.category].count += 1;
    return acc;
  }, {});

  return Object.entries(byCategory)
    .map(
      ([cat, { total, count }]) =>
        `- ${cat}: $${total.toFixed(2)} (${count} tx)`,
    )
    .join('\n');
}

function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}
