import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { GetTransactionsQueryDto } from './dto/get-transactions-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

interface AuthRequest {
  user: { id: string; email: string };
}

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateTransactionDto) {
    return this.transactions.create(req.user.id, dto);
  }

  @Get()
  findAll(
    @Request() req: AuthRequest,
    @Query() query: GetTransactionsQueryDto,
  ) {
    return this.transactions.findAll(req.user.id, query);
  }

  @Get(':id')
  findOne(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.transactions.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    return this.transactions.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  delete(@Request() req: AuthRequest, @Param('id') id: string) {
    return this.transactions.delete(req.user.id, id);
  }
}
