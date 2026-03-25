import { Module } from '@nestjs/common';
import { SplitwiseService } from './splitwise.service';
import { SplitwiseToolsService } from './splitwise-tools.service';

@Module({
  providers: [SplitwiseService, SplitwiseToolsService],
  exports: [SplitwiseService, SplitwiseToolsService],
})
export class SplitwiseModule {}
