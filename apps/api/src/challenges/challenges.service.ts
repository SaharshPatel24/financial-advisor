import { Injectable, NotFoundException } from '@nestjs/common';
import { Challenge } from '@prisma/client';
import type { ChallengeStatus } from '@financial-advisor/shared';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChallengesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(userId: string): Promise<Challenge> {
    const { weekStart, weekEnd } = getCurrentWeek();

    const recentTransactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const description = await this.ai.generateWeeklyChallenge(
      recentTransactions as any,
      weekStart,
      weekEnd,
    );

    return this.prisma.challenge.create({
      data: { userId, description, weekStart, weekEnd },
    });
  }

  async findAll(userId: string): Promise<Challenge[]> {
    return this.prisma.challenge.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
    });
  }

  async findOne(userId: string, id: string): Promise<Challenge> {
    const challenge = await this.prisma.challenge.findFirst({
      where: { id, userId },
    });
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  async updateStatus(
    userId: string,
    id: string,
    status: ChallengeStatus,
  ): Promise<Challenge> {
    await this.findOne(userId, id); // ensures ownership + throws if missing

    return this.prisma.challenge.update({
      where: { id },
      data: { status },
    });
  }
}

// ---------------------------------------------------------------------------
// Module-private helper
// ---------------------------------------------------------------------------

function getCurrentWeek(): { weekStart: Date; weekEnd: Date } {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - day);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}
