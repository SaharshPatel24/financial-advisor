import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TransactionsModule } from './transactions/transactions.module';
import { GoalsModule } from './goals/goals.module';
import { InsightsModule } from './insights/insights.module';
import { ChallengesModule } from './challenges/challenges.module';

@Module({
  imports: [
    // Load .env variables globally across all modules
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    UsersModule,
    TransactionsModule,
    GoalsModule,
    InsightsModule,
    ChallengesModule,
  ],
})
export class AppModule {}
