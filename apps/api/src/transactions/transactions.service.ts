import { Injectable, NotFoundException } from '@nestjs/common';
import { Transaction } from '@prisma/client';
import type { PaginatedTransactions } from '@financial-advisor/shared';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async create(userId: string, dto: CreateTransactionDto): Promise<Transaction> {
    let category = dto.category;
    let aiConfidence: number | null = null;

    if (!category) {
      const result = await this.ai.categorizeTransaction(
        dto.description,
        dto.amount,
        dto.type,
      );
      category = result.category;
      aiConfidence = result.confidence;
    }

    return this.prisma.transaction.create({
      data: {
        userId,
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        category,
        aiConfidence,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });
  }

  async findAll(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<PaginatedTransactions> {
    const page = Math.max(1, query.page ?? DEFAULT_PAGE);
    const limit = Math.min(100, Math.max(1, query.limit ?? DEFAULT_LIMIT));
    const skip = (page - 1) * limit;

    const where = buildWhereClause(userId, query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data: data as any, total, page, limit };
  }

  async findOne(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }
}

// ---------------------------------------------------------------------------
// Module-private helper
// ---------------------------------------------------------------------------

function buildWhereClause(
  userId: string,
  query: GetTransactionsQueryDto,
): object {
  const where: Record<string, unknown> = { userId };

  if (query.type) where['type'] = query.type;
  if (query.category) where['category'] = query.category;
  if (query.from ?? query.to) {
    where['date'] = {
      ...(query.from ? { gte: new Date(query.from) } : {}),
      ...(query.to ? { lte: new Date(query.to) } : {}),
    };
  }

  return where;
}
