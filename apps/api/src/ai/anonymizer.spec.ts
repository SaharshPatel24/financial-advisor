import type { CreateGoalDto, Transaction } from '@financial-advisor/shared';
import { anonGoal, anonTransactions, scrubDescription } from './anonymizer';

const baseTx: Transaction = {
  id: 'tx-123',
  userId: 'user-456',
  description: "John's Coffee at Starbucks",
  amount: 5.5,
  type: 'EXPENSE',
  category: 'Food',
  aiConfidence: 0.95,
  date: '2025-01-15T10:00:00.000Z',
  createdAt: '2025-01-15T10:00:01.000Z',
};

describe('anonTransactions', () => {
  it('strips userId, id, createdAt, aiConfidence, description', () => {
    const result = anonTransactions([baseTx]);
    expect(result[0]).not.toHaveProperty('userId');
    expect(result[0]).not.toHaveProperty('id');
    expect(result[0]).not.toHaveProperty('createdAt');
    expect(result[0]).not.toHaveProperty('aiConfidence');
    expect(result[0]).not.toHaveProperty('description');
  });

  it('preserves amount, type, category', () => {
    const [result] = anonTransactions([baseTx]);
    expect(result.amount).toBe(5.5);
    expect(result.type).toBe('EXPENSE');
    expect(result.category).toBe('Food');
  });

  it('converts exact date to month/year only', () => {
    const [result] = anonTransactions([baseTx]);
    expect(result.month).toBe('2025-01');
  });

  it('handles empty array', () => {
    expect(anonTransactions([])).toEqual([]);
  });

  it('handles multiple transactions', () => {
    const tx2: Transaction = {
      ...baseTx,
      id: 'tx-999',
      date: '2025-03-20',
      amount: 100,
    };
    const result = anonTransactions([baseTx, tx2]);
    expect(result).toHaveLength(2);
    expect(result[1].month).toBe('2025-03');
    expect(result[1].amount).toBe(100);
  });
});

describe('anonGoal', () => {
  const goal: CreateGoalDto = {
    description: 'Save for trip to Paris with Sarah',
    targetAmount: 2000,
    deadline: '2025-06-30',
  };

  it('preserves targetAmount', () => {
    expect(anonGoal(goal).targetAmount).toBe(2000);
  });

  it('converts deadline to month/year only', () => {
    expect(anonGoal(goal).deadline).toBe('2025-06');
  });

  it('omits deadline when not provided', () => {
    const noDeadline: CreateGoalDto = {
      description: 'Emergency fund',
      targetAmount: 5000,
    };
    expect(anonGoal(noDeadline).deadline).toBeUndefined();
  });

  it('scrubs name-like words from description', () => {
    const result = anonGoal(goal);
    expect(result.description).not.toMatch(/\bSarah\b/);
    expect(result.description).not.toMatch(/\bParis\b/);
  });
});

describe('scrubDescription', () => {
  it('removes possessives like "John\'s"', () => {
    expect(scrubDescription("John's Coffee")).not.toMatch(/\bJohn/);
  });

  it('removes capitalized name-like words', () => {
    expect(scrubDescription('Pay to Sarah for dinner')).not.toMatch(
      /\bSarah\b/,
    );
  });

  it('returns fallback for fully scrubbed input', () => {
    expect(scrubDescription('John Sarah')).toBe('Transaction');
  });

  it('preserves lowercase words', () => {
    const result = scrubDescription('coffee and tea');
    expect(result).toBe('coffee and tea');
  });

  it('preserves amount-related lowercase context', () => {
    const result = scrubDescription('monthly subscription fee');
    expect(result).toContain('monthly');
    expect(result).toContain('subscription');
    expect(result).toContain('fee');
  });
});
