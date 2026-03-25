import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    name?: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async saveSplitwiseApiKey(id: string, apiKey: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { splitwiseApiKey: apiKey },
    });
  }

  async clearSplitwiseApiKey(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { splitwiseApiKey: null },
    });
  }
}
