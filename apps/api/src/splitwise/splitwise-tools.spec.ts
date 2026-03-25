import { Test, TestingModule } from '@nestjs/testing';
import {
  SplitwiseToolsService,
  buildSplitwiseTools,
} from './splitwise-tools.service';
import { SplitwiseService } from './splitwise.service';

const API_KEY = 'test-key';

const splitwiseMock: jest.Mocked<SplitwiseService> = {
  getExpenses: jest.fn(),
  getFriends: jest.fn(),
  getGroups: jest.fn(),
  createExpense: jest.fn(),
  getExpense: jest.fn(),
} as any;

describe('SplitwiseToolsService / buildSplitwiseTools', () => {
  let service: SplitwiseToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SplitwiseToolsService,
        { provide: SplitwiseService, useValue: splitwiseMock },
      ],
    }).compile();

    service = module.get<SplitwiseToolsService>(SplitwiseToolsService);
    jest.clearAllMocks();
  });

  it('returns exactly 5 tools', () => {
    const tools = buildSplitwiseTools(service as any, API_KEY);
    expect(tools).toHaveLength(5);
    const names = tools.map((t) => t.name);
    expect(names).toContain('get_splitwise_expenses');
    expect(names).toContain('get_splitwise_friends');
    expect(names).toContain('get_splitwise_groups');
    expect(names).toContain('get_splitwise_friend_balances');
    expect(names).toContain('create_splitwise_expense');
  });

  // -------------------------------------------------------------------------
  // get_splitwise_expenses
  // -------------------------------------------------------------------------

  describe('get_splitwise_expenses tool', () => {
    it('calls SplitwiseService.getExpenses with bound apiKey', async () => {
      const expenses = [{ id: 1, description: 'Pizza' }];
      splitwiseMock.getExpenses.mockResolvedValue(expenses as any);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find((t) => t.name === 'get_splitwise_expenses')!;
      const result = await tool.func({ group_id: 42, limit: 5 }, {} as any);

      expect(splitwiseMock.getExpenses).toHaveBeenCalledWith(API_KEY, {
        group_id: 42,
        limit: 5,
      });
      expect(JSON.parse(result as string)).toEqual(expenses);
    });
  });

  // -------------------------------------------------------------------------
  // get_splitwise_friends
  // -------------------------------------------------------------------------

  describe('get_splitwise_friends tool', () => {
    it('calls SplitwiseService.getFriends with bound apiKey', async () => {
      const friends = [{ id: 5, first_name: 'Alice' }];
      splitwiseMock.getFriends.mockResolvedValue(friends as any);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find((t) => t.name === 'get_splitwise_friends')!;
      const result = await tool.func({}, {} as any);

      expect(splitwiseMock.getFriends).toHaveBeenCalledWith(API_KEY);
      expect(JSON.parse(result as string)).toEqual(friends);
    });
  });

  // -------------------------------------------------------------------------
  // get_splitwise_groups
  // -------------------------------------------------------------------------

  describe('get_splitwise_groups tool', () => {
    it('calls SplitwiseService.getGroups with bound apiKey', async () => {
      const groups = [{ id: 10, name: 'Roommates' }];
      splitwiseMock.getGroups.mockResolvedValue(groups as any);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find((t) => t.name === 'get_splitwise_groups')!;
      const result = await tool.func({}, {} as any);

      expect(splitwiseMock.getGroups).toHaveBeenCalledWith(API_KEY);
      expect(JSON.parse(result as string)).toEqual(groups);
    });
  });

  // -------------------------------------------------------------------------
  // get_splitwise_friend_balances
  // -------------------------------------------------------------------------

  describe('get_splitwise_friend_balances tool', () => {
    it('computes owes_you / you_owe / net from friend balances', async () => {
      splitwiseMock.getFriends.mockResolvedValue([
        {
          id: 1,
          first_name: 'Alice',
          last_name: 'Smith',
          email: 'alice@example.com',
          balance: [{ amount: '30.00', currency_code: 'USD' }],
        },
        {
          id: 2,
          first_name: 'Bob',
          last_name: 'Jones',
          email: 'bob@example.com',
          balance: [{ amount: '-10.00', currency_code: 'USD' }],
        },
        {
          id: 3,
          first_name: 'Carol',
          last_name: 'Doe',
          email: 'carol@example.com',
          balance: [{ amount: '0.00', currency_code: 'USD' }],
        },
      ] as any);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find(
        (t) => t.name === 'get_splitwise_friend_balances',
      )!;
      const result = JSON.parse((await tool.func({}, {} as any)) as string);

      expect(result.owes_you).toEqual([
        { name: 'Alice Smith', amount: 30, currency: 'USD' },
      ]);
      expect(result.you_owe).toEqual([
        { name: 'Bob Jones', amount: 10, currency: 'USD' },
      ]);
      expect(result.net).toBe(20);
    });

    it('returns empty arrays and zero net when no balances', async () => {
      splitwiseMock.getFriends.mockResolvedValue([]);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find(
        (t) => t.name === 'get_splitwise_friend_balances',
      )!;
      const result = JSON.parse((await tool.func({}, {} as any)) as string);

      expect(result.owes_you).toEqual([]);
      expect(result.you_owe).toEqual([]);
      expect(result.net).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // create_splitwise_expense
  // -------------------------------------------------------------------------

  describe('create_splitwise_expense tool', () => {
    it('calls SplitwiseService.createExpense with bound apiKey', async () => {
      const expense = { id: 99, description: 'Dinner' };
      splitwiseMock.createExpense.mockResolvedValue(expense as any);

      const tools = buildSplitwiseTools(service as any, API_KEY);
      const tool = tools.find((t) => t.name === 'create_splitwise_expense')!;

      const args = {
        cost: '50.00',
        description: 'Dinner',
        date: '2025-03-01',
        group_id: 10,
        users: [
          { user_id: 1, paid_share: '50.00', owed_share: '25.00' },
          { user_id: 2, paid_share: '0.00', owed_share: '25.00' },
        ],
      };

      const result = await tool.func(args, {} as any);

      expect(splitwiseMock.createExpense).toHaveBeenCalledWith(API_KEY, args);
      expect(JSON.parse(result as string)).toEqual(expense);
    });
  });
});
