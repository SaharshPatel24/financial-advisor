import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChallengesService } from './challenges.service';
import { UpdateChallengeStatusDto } from './dto/update-challenge-status.dto';

interface AuthRequest {
  user: { id: string };
}

@UseGuards(JwtAuthGuard)
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  @Post('generate')
  generate(@Request() req: AuthRequest) {
    return this.challenges.generate(req.user.id);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.challenges.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.challenges.findOne(req.user.id, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateChallengeStatusDto,
  ) {
    return this.challenges.updateStatus(req.user.id, id, dto.status);
  }
}
