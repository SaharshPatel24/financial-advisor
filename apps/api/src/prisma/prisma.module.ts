import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// TODO(Issue #6): PrismaService fully implemented in issue #6
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
