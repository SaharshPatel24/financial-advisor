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

@Injectable()
export class AiService {
  private readonly model: BaseChatModel;
  private readonly thinkingModel: BaseChatModel;

  constructor(config: ConfigService) {
    const { model, thinkingModel } = createLlmPair(config);
    this.model = model;
    this.thinkingModel = thinkingModel;
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

    const chain = prompt.pipe(
      this.model.withStructuredOutput(CategorizationSchema),
    );
    return chain.invoke({
      description: safeDescription,
      type,
      categories: TRANSACTION_CATEGORIES.join(', '),
    });
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

    const chain = prompt
      .pipe(this.thinkingModel)
      .pipe(new StringOutputParser());
    return chain.invoke({ period, summary: buildTransactionSummary(safeTxs) });
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

    const chain = prompt
      .pipe(this.thinkingModel)
      .pipe(new StringOutputParser());
    return chain.invoke({
      goalDescription: safeGoal.description,
      deadlineLine,
      summary: buildTransactionSummary(safeTxs),
    });
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

    const chain = prompt.pipe(this.model).pipe(new StringOutputParser());
    return chain.invoke({
      from,
      to,
      summary: buildTransactionSummary(safeTxs),
    });
  }
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

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
