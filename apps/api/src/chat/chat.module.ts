import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SplitwiseModule } from '../splitwise/splitwise.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatAgentService } from './chat-agent.service';
import { ChatToolsService } from './chat-tools.service';

@Module({
  imports: [PrismaModule, AiModule, SplitwiseModule],
  controllers: [ChatController],
  providers: [ChatService, ChatAgentService, ChatToolsService],
})
export class ChatModule {}
