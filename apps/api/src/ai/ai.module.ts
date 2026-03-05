import { Module } from '@nestjs/common';
import { AiService } from './ai.service';

// TODO(Issue #7): AiService with Anthropic SDK implemented in issue #7
@Module({
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
