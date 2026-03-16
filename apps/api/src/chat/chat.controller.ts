import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSessionDto } from './dto/create-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatService } from './chat.service';

interface AuthRequest {
  user: { id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('api/chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Post('sessions')
  createSession(@Request() req: AuthRequest, @Body() dto: CreateSessionDto) {
    return this.chat.createSession(req.user.id, dto.title);
  }

  @Get('sessions')
  getSessions(@Request() req: AuthRequest) {
    return this.chat.getSessions(req.user.id);
  }

  @Get('sessions/:id')
  getSession(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.getSession(req.user.id, id);
  }

  @Delete('sessions/:id')
  @HttpCode(204)
  deleteSession(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.chat.deleteSession(req.user.id, id);
  }

  @Post('sessions/:id/messages')
  @Header('Content-Type', 'text/event-stream')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  async sendMessage(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ): Promise<void> {
    try {
      for await (const event of this.chat.streamMessage(
        req.user.id,
        id,
        dto.content,
      )) {
        res.write(
          `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.write(`event: error\ndata: ${JSON.stringify({ message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
