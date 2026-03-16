import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { createLlmPair } from './llm.factory';
import type {
  CreateGoalDto,
  InsightPeriod,
  Transaction,
} from '@financial-advisor/shared';
import { anonGoal, anonTransactions, type AnonTransaction } from './anonymizer';

const STATIC_FALLBACKS = {
  text: 'Our AI advisor is temporarily unavailable. Please try again shortly.',
  challenge: 'Save at least $10 this week as a starting point.',
} as const;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly model: BaseChatModel;
  private readonly thinkingModel: BaseChatModel;
  private readonly fallbackModels: BaseChatModel[];

  constructor(config: ConfigService) {
    const { model, thinkingModel, fallbackModels } = createLlmPair(config);
    this.model = model;
    this.thinkingModel = thinkingModel;
    this.fallbackModels = fallbackModels;
  }

  getModel(): BaseChatModel {
    return this.model;
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
      this.logger,
      'generateInsights',
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
      this.logger,
      'generateGoalRecommendation',
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
      this.logger,
      'generateWeeklyChallenge',
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
  logger: Logger,
  method: string,
): Promise<T> {
  try {
    return await primaryFn();
  } catch (err) {
    logger.warn(
      `[${method}] primary failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    for (const fn of fallbackFns) {
      try {
        return await fn();
      } catch (fbErr) {
        logger.warn(
          `[${method}] fallback failed: ${fbErr instanceof Error ? fbErr.message : String(fbErr)}`,
        );
      }
    }
    logger.error(
      `[${method}] all providers failed — returning static fallback`,
    );
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
