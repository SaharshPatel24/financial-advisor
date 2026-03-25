import { Test, TestingModule } from '@nestjs/testing';
import { SplitwiseService } from './splitwise.service';

const API_KEY = 'test-api-key';
const BASE = 'https://secure.splitwise.com/api/v3.0';

function mockFetch(body: unknown, status = 200) {
  return jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue('error body'),
    json: jest.fn().mockResolvedValue(body),
  });
}

describe('SplitwiseService', () => {
  let service: SplitwiseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SplitwiseService],
    }).compile();

    service = module.get<SplitwiseService>(SplitwiseService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // getExpenses
  // -------------------------------------------------------------------------

  describe('getExpenses', () => {
    it('calls correct URL with default limit and Bearer header', async () => {
      const expense = { id: 1, description: 'Dinner' };
      global.fetch = mockFetch({ expenses: [expense] });

      const result = await service.getExpenses(API_KEY, {});

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain(`${BASE}/get_expenses`);
      expect(url).toContain('limit=20');
      expect((init as RequestInit).headers).toMatchObject({
        Authorization: `Bearer ${API_KEY}`,
      });
      expect(result).toEqual([expense]);
    });

    it('serializes optional filters into query params', async () => {
      global.fetch = mockFetch({ expenses: [] });

      await service.getExpenses(API_KEY, {
        group_id: 42,
        friend_id: 7,
        dated_after: '2025-01-01',
        dated_before: '2025-01-31',
        limit: 5,
      });

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toContain('group_id=42');
      expect(url).toContain('friend_id=7');
      expect(url).toContain('dated_after=2025-01-01');
      expect(url).toContain('dated_before=2025-01-31');
      expect(url).toContain('limit=5');
    });

    it('throws on non-2xx response', async () => {
      global.fetch = mockFetch({}, 401);

      await expect(service.getExpenses(API_KEY, {})).rejects.toThrow(
        'Splitwise API error 401',
      );
    });
  });

  // -------------------------------------------------------------------------
  // getFriends
  // -------------------------------------------------------------------------

  describe('getFriends', () => {
    it('returns friends array', async () => {
      const friend = { id: 5, first_name: 'Alice' };
      global.fetch = mockFetch({ friends: [friend] });

      const result = await service.getFriends(API_KEY);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${BASE}/get_friends`);
      expect(result).toEqual([friend]);
    });
  });

  // -------------------------------------------------------------------------
  // getGroups
  // -------------------------------------------------------------------------

  describe('getGroups', () => {
    it('returns groups array', async () => {
      const group = { id: 10, name: 'Roommates' };
      global.fetch = mockFetch({ groups: [group] });

      const result = await service.getGroups(API_KEY);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${BASE}/get_groups`);
      expect(result).toEqual([group]);
    });
  });

  // -------------------------------------------------------------------------
  // createExpense
  // -------------------------------------------------------------------------

  describe('createExpense', () => {
    it('POSTs form-encoded body and returns expense', async () => {
      const expense = { id: 99, description: 'Pizza' };
      global.fetch = mockFetch({ expense });

      const result = await service.createExpense(API_KEY, {
        cost: '30.00',
        description: 'Pizza',
        date: '2025-03-01',
        group_id: 10,
        users: [
          { user_id: 1, paid_share: '30.00', owed_share: '15.00' },
          { user_id: 2, paid_share: '0.00', owed_share: '15.00' },
        ],
      });

      const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${BASE}/create_expense`);
      expect((init as RequestInit).method).toBe('POST');
      expect((init as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/x-www-form-urlencoded',
      });

      const body = new URLSearchParams((init as RequestInit).body as string);
      expect(body.get('cost')).toBe('30.00');
      expect(body.get('description')).toBe('Pizza');
      expect(body.get('group_id')).toBe('10');
      expect(body.get('users__0__user_id')).toBe('1');
      expect(body.get('users__0__paid_share')).toBe('30.00');
      expect(body.get('users__1__owed_share')).toBe('15.00');

      expect(result).toEqual(expense);
    });

    it('throws on non-2xx response', async () => {
      global.fetch = mockFetch({}, 422);

      await expect(
        service.createExpense(API_KEY, {
          cost: '10.00',
          description: 'Test',
          date: '2025-01-01',
          users: [],
        }),
      ).rejects.toThrow('Splitwise API error 422');
    });
  });

  // -------------------------------------------------------------------------
  // getExpense
  // -------------------------------------------------------------------------

  describe('getExpense', () => {
    it('fetches a single expense by id', async () => {
      const expense = { id: 55, description: 'Coffee' };
      global.fetch = mockFetch({ expense });

      const result = await service.getExpense(API_KEY, 55);

      const [url] = (global.fetch as jest.Mock).mock.calls[0];
      expect(url).toBe(`${BASE}/get_expense/55`);
      expect(result).toEqual(expense);
    });
  });
});
