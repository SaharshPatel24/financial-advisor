import {
  Body,
  Controller,
  HttpCode,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSplitwiseDto } from './dto/update-splitwise.dto';
import { UsersService } from './users.service';

interface AuthRequest {
  user: { id: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Patch('me/splitwise')
  @HttpCode(204)
  async updateSplitwise(
    @Request() req: AuthRequest,
    @Body() dto: UpdateSplitwiseDto,
  ): Promise<void> {
    if (dto.apiKey) {
      await this.users.saveSplitwiseApiKey(req.user.id, dto.apiKey);
    } else {
      await this.users.clearSplitwiseApiKey(req.user.id);
    }
  }
}
