import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse } from '@financial-advisor/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    const tokens = this.issueTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        authProvider: user.authProvider,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = this.issueTokens(user.id, user.email);
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        authProvider: user.authProvider,
      },
      tokens,
    };
  }

  refreshTokens(userId: string, email: string) {
    return this.issueTokens(userId, email);
  }

  private issueTokens(sub: string, email: string) {
    const payload = { sub, email };
    return {
      accessToken: this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET')!,
        expiresIn: '15m',
      }),
      refreshToken: this.jwt.sign(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET')!,
        expiresIn: '7d',
      }),
    };
  }
}
