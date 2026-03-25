import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthProvider } from '@prisma/client';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  passwordHash: 'hashed',
  name: 'Test User',
  authProvider: AuthProvider.LOCAL,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findByEmail', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await service.findByEmail('nobody@example.com');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      expect(await service.findById('unknown')).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns a new user', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);
      const result = await service.create({
        email: 'test@example.com',
        passwordHash: 'hashed',
        name: 'Test User',
      });
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed',
          name: 'Test User',
        },
      });
    });
  });

  describe('saveSplitwiseApiKey', () => {
    it('calls prisma.user.update with the provided apiKey', async () => {
      prismaMock.user.update.mockResolvedValue(mockUser);
      await service.saveSplitwiseApiKey('user-1', 'sw-key-abc');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { splitwiseApiKey: 'sw-key-abc' },
      });
    });
  });

  describe('clearSplitwiseApiKey', () => {
    it('calls prisma.user.update with null', async () => {
      prismaMock.user.update.mockResolvedValue(mockUser);
      await service.clearSplitwiseApiKey('user-1');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { splitwiseApiKey: null },
      });
    });
  });
});
