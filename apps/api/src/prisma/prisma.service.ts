import { Injectable, OnModuleInit } from '@nestjs/common';

// TODO(Issue #6): Extend PrismaClient and implement onModuleInit connection in issue #6
@Injectable()
export class PrismaService implements OnModuleInit {
  async onModuleInit() {
    // Prisma client connection set up in issue #6
  }
}
