import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { AuthProvider } from '@prisma/client';

const mockAuthResponse = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    authProvider: AuthProvider.LOCAL,
  },
  tokens: {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  },
};

const authServiceMock = {
  register: jest.fn().mockResolvedValue(mockAuthResponse),
  login: jest.fn().mockResolvedValue(mockAuthResponse),
  refreshTokens: jest.fn().mockReturnValue(mockAuthResponse.tokens),
};

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    })
      .overrideGuard(JwtRefreshGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
    authServiceMock.register.mockResolvedValue(mockAuthResponse);
    authServiceMock.login.mockResolvedValue(mockAuthResponse);
    authServiceMock.refreshTokens.mockReturnValue(mockAuthResponse.tokens);
  });

  describe('register', () => {
    it('calls AuthService.register and returns result', async () => {
      const dto = { email: 'test@example.com', password: 'pass123', name: 'Test User' };
      const result = await controller.register(dto);
      expect(authServiceMock.register).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('calls AuthService.login and returns result', async () => {
      const dto = { email: 'test@example.com', password: 'pass123' };
      const result = await controller.login(dto);
      expect(authServiceMock.login).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('calls AuthService.refreshTokens with user from request', () => {
      const req = { user: { id: 'user-1', email: 'test@example.com' } };
      const result = controller.refresh(req);
      expect(authServiceMock.refreshTokens).toHaveBeenCalledWith('user-1', 'test@example.com');
      expect(result).toEqual(mockAuthResponse.tokens);
    });
  });
});
