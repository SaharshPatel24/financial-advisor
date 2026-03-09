import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthProvider } from '@prisma/client';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: '$2b$12$hashedpassword',
  name: 'Test User',
  authProvider: AuthProvider.LOCAL,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const usersMock = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
};

const jwtMock = {
  sign: jest.fn().mockReturnValue('signed-token'),
};

const configMock = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRY: '15m',
      JWT_REFRESH_EXPIRY: '7d',
    };
    return map[key];
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    jwtMock.sign.mockReturnValue('signed-token');
  });

  describe('register', () => {
    it('creates user and returns AuthResponse', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      usersMock.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

      expect(result.user.id).toBe('user-1');
      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('signed-token');
      expect(result.tokens.refreshToken).toBe('signed-token');
      expect(usersMock.create).toHaveBeenCalledTimes(1);
    });

    it('hashes password before storing', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      usersMock.create.mockResolvedValue(mockUser);

      await service.register({ email: 'test@example.com', password: 'plaintext' });

      const createCall = usersMock.create.mock.calls[0][0];
      expect(createCall.passwordHash).not.toBe('plaintext');
      expect(createCall.passwordHash).toMatch(/^\$2b\$/);
    });

    it('throws ConflictException if email already exists', async () => {
      usersMock.findByEmail.mockResolvedValue(mockUser);
      await expect(
        service.register({ email: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(ConflictException);
      expect(usersMock.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('returns AuthResponse for valid credentials', async () => {
      const hash = await bcrypt.hash('correctpassword', 10);
      usersMock.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash });

      const result = await service.login({
        email: 'test@example.com',
        password: 'correctpassword',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('signed-token');
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('correctpassword', 10);
      usersMock.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: hash });

      await expect(
        service.login({ email: 'test@example.com', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user not found', async () => {
      usersMock.findByEmail.mockResolvedValue(null);
      await expect(
        service.login({ email: 'nobody@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for OAuth users with no passwordHash', async () => {
      usersMock.findByEmail.mockResolvedValue({ ...mockUser, passwordHash: null });
      await expect(
        service.login({ email: 'test@example.com', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('returns new token pair', () => {
      const tokens = service.refreshTokens('user-1', 'test@example.com');
      expect(tokens.accessToken).toBe('signed-token');
      expect(tokens.refreshToken).toBe('signed-token');
      expect(jwtMock.sign).toHaveBeenCalledTimes(2);
    });
  });
});
