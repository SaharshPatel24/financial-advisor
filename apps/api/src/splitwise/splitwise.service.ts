import { Injectable, Logger } from '@nestjs/common';

// ---------------------------------------------------------------------------
// Minimal Splitwise API types
// ---------------------------------------------------------------------------

export interface SplitwiseUser {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

export interface SplitwiseDebt {
  from: number;
  to: number;
  amount: string;
  currency_code: string;
}

export interface SplitwiseExpenseUser {
  user_id: number;
  paid_share: string;
  owed_share: string;
  net_balance: string;
}

export interface SplitwiseExpense {
  id: number;
  description: string;
  cost: string;
  currency_code: string;
  date: string;
  group_id: number | null;
  users: SplitwiseExpenseUser[];
  deleted_at: string | null;
}

export interface SplitwiseFriend {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  balance: Array<{ amount: string; currency_code: string }>;
}

export interface SplitwiseGroup {
  id: number;
  name: string;
  members: SplitwiseUser[];
  debt: SplitwiseDebt[];
}

export interface GetExpensesOpts {
  group_id?: number;
  friend_id?: number;
  dated_after?: string;
  dated_before?: string;
  limit?: number;
}

export interface CreateExpenseData {
  cost: string;
  description: string;
  date: string;
  group_id?: number;
  users: Array<{
    user_id: number;
    paid_share: string;
    owed_share: string;
  }>;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

@Injectable()
export class SplitwiseService {
  private readonly logger = new Logger(SplitwiseService.name);
  private readonly BASE = 'https://secure.splitwise.com/api/v3.0';

  private async get<T>(
    apiKey: string,
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${this.BASE}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }

    this.logger.log(`GET ${url.toString()}`);
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!res.ok) {
      throw new Error(`Splitwise API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  private async post<T>(
    apiKey: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.BASE}${path}`;
    const encoded = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null) encoded.set(k, String(v));
    }

    this.logger.log(`POST ${url}`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: encoded.toString(),
    });

    if (!res.ok) {
      throw new Error(`Splitwise API error ${res.status}: ${await res.text()}`);
    }
    return res.json() as Promise<T>;
  }

  async getExpenses(
    apiKey: string,
    opts: GetExpensesOpts,
  ): Promise<SplitwiseExpense[]> {
    const data = await this.get<{ expenses: SplitwiseExpense[] }>(
      apiKey,
      '/get_expenses',
      {
        group_id: opts.group_id,
        friend_id: opts.friend_id,
        dated_after: opts.dated_after,
        dated_before: opts.dated_before,
        limit: opts.limit ?? 20,
      },
    );
    return data.expenses;
  }

  async getFriends(apiKey: string): Promise<SplitwiseFriend[]> {
    const data = await this.get<{ friends: SplitwiseFriend[] }>(
      apiKey,
      '/get_friends',
    );
    return data.friends;
  }

  async getGroups(apiKey: string): Promise<SplitwiseGroup[]> {
    const data = await this.get<{ groups: SplitwiseGroup[] }>(
      apiKey,
      '/get_groups',
    );
    return data.groups;
  }

  async createExpense(
    apiKey: string,
    data: CreateExpenseData,
  ): Promise<SplitwiseExpense> {
    const body: Record<string, unknown> = {
      cost: data.cost,
      description: data.description,
      date: data.date,
      ...(data.group_id !== undefined ? { group_id: data.group_id } : {}),
    };

    data.users.forEach((u, i) => {
      body[`users__${i}__user_id`] = u.user_id;
      body[`users__${i}__paid_share`] = u.paid_share;
      body[`users__${i}__owed_share`] = u.owed_share;
    });

    const result = await this.post<{ expense: SplitwiseExpense }>(
      apiKey,
      '/create_expense',
      body,
    );
    return result.expense;
  }

  async getExpense(apiKey: string, id: number): Promise<SplitwiseExpense> {
    const data = await this.get<{ expense: SplitwiseExpense }>(
      apiKey,
      `/get_expense/${id}`,
    );
    return data.expense;
  }
}
