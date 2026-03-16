import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { z } from 'zod';
import { createLlmPair } from './llm.factory';
import type {
  CreateGoalDto,
  InsightPeriod,
  Transaction,
  TransactionCategory,
  TransactionType,
} from '@financial-advisor/shared';
import {
  anonGoal,
  anonTransactions,
  scrubDescription,
  type AnonTransaction,
} from './anonymizer';

const TRANSACTION_CATEGORIES: [TransactionCategory, ...TransactionCategory[]] =
  [
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

const STATIC_FALLBACKS = {
  categorization: { category: 'Other' as TransactionCategory, confidence: 0 },
  text: 'Our AI advisor is temporarily unavailable. Please try again shortly.',
  challenge: 'Save at least $10 this week as a starting point.',
} as const;

@Injectable()
export class AiService {
  private readonly model: BaseChatModel;
  private readonly thinkingModel: BaseChatModel;
  private readonly fallbackModels: BaseChatModel[];

  constructor(config: ConfigService) {
    const { model, thinkingModel, fallbackModels } = createLlmPair(config);
    this.model = model;
    this.thinkingModel = thinkingModel;
    this.fallbackModels = fallbackModels;
  }

  async categorizeTransaction(
    description: string,
    amount: number,
    type: TransactionType,
  ): Promise<Categorization> {
    const safeDescription = scrubDescription(description);
    const prompt = ChatPromptTemplate.fromTemplate(
      `Categorize this transaction:
Description: {description}
Amount: $${amount}
Type: {type}

Choose from: {categories}.
Return a confidence score between 0 and 1.`,
    );
    const vars = {
      description: safeDescription,
      type,
      categories: TRANSACTION_CATEGORIES.join(', '),
    };

    return invokeWithFallbacks(
      () =>
        prompt
          .pipe(this.model.withStructuredOutput(CategorizationSchema))
          .invoke(vars),
      this.fallbackModels.map(
        (f) => () =>
          prompt
            .pipe(f.withStructuredOutput(CategorizationSchema))
            .invoke(vars),
      ),
      STATIC_FALLBACKS.categorization,
    );
  }

  async generateInsights(
    transactions: Transaction[],
    period: InsightPeriod,
  ): Promise<string> {
    const safeTxs = anonTransactions(transactions);
    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a personal finance advisor. Analyze the following {period} transactions and provide 2-3 actionable insights in under 200 words.

Transaction summary:
{summary}`,
    );
    const vars = { period, summary: buildTransactionSummary(safeTxs) };
    const parser = new StringOutputParser();

    return invokeWithFallbacks(
      () => prompt.pipe(this.thinkingModel).pipe(parser).invoke(vars),
      this.fallbackModels.map(
        (f) => () => prompt.pipe(f).pipe(parser).invoke(vars),
      ),
      STATIC_FALLBACKS.text,
    );
  }

  async generateGoalRecommendation(
    goal: CreateGoalDto,
    transactions: Transaction[],
  ): Promise<string> {
    const safeGoal = anonGoal(goal);
    const safeTxs = anonTransactions(transactions);
    const deadlineLine = safeGoal.deadline
      ? `Deadline: ${safeGoal.deadline}`
      : '';

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a personal finance advisor. Given this savings goal and recent spending, provide a concrete recommendation in 2-3 sentences.

Goal: {goalDescription}
Target: ${safeGoal.targetAmount}
{deadlineLine}

Recent spending:
{summary}`,
    );
    const vars = {
      goalDescription: safeGoal.description,
      deadlineLine,
      summary: buildTransactionSummary(safeTxs),
    };
    const parser = new StringOutputParser();

    return invokeWithFallbacks(
      () => prompt.pipe(this.thinkingModel).pipe(parser).invoke(vars),
      this.fallbackModels.map(
        (f) => () => prompt.pipe(f).pipe(parser).invoke(vars),
      ),
      STATIC_FALLBACKS.text,
    );
  }

  async generateWeeklyChallenge(
    transactions: Transaction[],
    weekStart: Date,
    weekEnd: Date,
  ): Promise<string> {
    const safeTxs = anonTransactions(transactions);
    const from = weekStart.toISOString().split('T')[0];
    const to = weekEnd.toISOString().split('T')[0];

    const prompt = ChatPromptTemplate.fromTemplate(
      `You are a personal finance coach. Based on this user's recent spending, generate one specific, achievable weekly challenge for {from} to {to}.

Recent spending:
{summary}

Return exactly one sentence starting with "Spend less than", "Save at least", or "Limit your". Use specific dollar amounts from the data.`,
    );
    const vars = { from, to, summary: buildTransactionSummary(safeTxs) };
    const parser = new StringOutputParser();

    return invokeWithFallbacks(
      () => prompt.pipe(this.model).pipe(parser).invoke(vars),
      this.fallbackModels.map(
        (f) => () => prompt.pipe(f).pipe(parser).invoke(vars),
      ),
      STATIC_FALLBACKS.challenge,
    );
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

async function invokeWithFallbacks<T>(
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>,
  staticFallback: T,
): Promise<T> {
  try {
    return await primaryFn();
  } catch {
    for (const fn of fallbackFns) {
      try {
        return await fn();
      } catch {
        continue;
      }
    }
    return staticFallback;
  }
}

function buildTransactionSummary(transactions: AnonTransaction[]): string {
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
