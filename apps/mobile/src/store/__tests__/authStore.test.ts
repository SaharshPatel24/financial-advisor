import { useAuthStore } from '../authStore';

// Mock the api module
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  },
}));

import api from '../../services/api';

const mockApi = api as jest.Mocked<typeof api>;

const mockUser = { id: '1', email: 'test@example.com', name: 'Test', authProvider: 'LOCAL' as const };
const mockTokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };
const mockResponse = { user: mockUser, tokens: mockTokens };

beforeEach(() => {
  // Reset store state
  useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
  jest.clearAllMocks();
});

describe('authStore', () => {
  it('initialises with unauthenticated state', () => {
    const { user, tokens, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(tokens).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  describe('login', () => {
    it('sets user and tokens on success', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });
      await useAuthStore.getState().login({ email: 'test@example.com', password: 'pass1234' });
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(tokens).toEqual(mockTokens);
      expect(isAuthenticated).toBe(true);
    });

    it('posts to /auth/login with credentials', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });
      await useAuthStore.getState().login({ email: 'test@example.com', password: 'pass1234' });
      expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'pass1234',
      });
    });

    it('propagates API errors', async () => {
      (mockApi.post as jest.Mock).mockRejectedValueOnce(new Error('Unauthorized'));
      await expect(
        useAuthStore.getState().login({ email: 'bad@example.com', password: 'wrong' }),
      ).rejects.toThrow('Unauthorized');
    });
  });

  describe('register', () => {
    it('sets user and tokens on success', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });
      await useAuthStore.getState().register({ name: 'Test', email: 'test@example.com', password: 'pass1234' });
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toEqual(mockUser);
      expect(tokens).toEqual(mockTokens);
      expect(isAuthenticated).toBe(true);
    });

    it('posts to /auth/register', async () => {
      (mockApi.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });
      await useAuthStore.getState().register({ name: 'Test', email: 'test@example.com', password: 'pass1234' });
      expect(mockApi.post).toHaveBeenCalledWith('/auth/register', {
        name: 'Test',
        email: 'test@example.com',
        password: 'pass1234',
      });
    });
  });

  describe('logout', () => {
    it('clears auth state', async () => {
      useAuthStore.setState({ user: mockUser, tokens: mockTokens, isAuthenticated: true });
      useAuthStore.getState().logout();
      const { user, tokens, isAuthenticated } = useAuthStore.getState();
      expect(user).toBeNull();
      expect(tokens).toBeNull();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('setTokens', () => {
    it('updates tokens without touching user or auth flag', () => {
      useAuthStore.setState({ user: mockUser, tokens: mockTokens, isAuthenticated: true });
      const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
      useAuthStore.getState().setTokens(newTokens);
      const { tokens, user, isAuthenticated } = useAuthStore.getState();
      expect(tokens).toEqual(newTokens);
      expect(user).toEqual(mockUser);
      expect(isAuthenticated).toBe(true);
    });
  });
});
