import { Injectable, NotFoundException } from '@nestjs/common';
import { Goal } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGoalDto } from './dto/create-goal.dto';

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async create(userId: string, dto: CreateGoalDto): Promise<Goal> {
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const aiRecommendation = await this.ai.generateGoalRecommendation(
      dto,
      recentTransactions as any,
    );

    return this.prisma.goal.create({
      data: {
        userId,
        description: dto.description,
        targetAmount: dto.targetAmount,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        aiRecommendation,
      },
    });
  }

  async findAll(userId: string): Promise<Goal[]> {
    return this.prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Goal> {
    const goal = await this.prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }
}
