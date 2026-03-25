import { Injectable } from '@nestjs/common';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { SplitwiseService } from './splitwise.service';

@Injectable()
export class SplitwiseToolsService {
  constructor(private readonly splitwise: SplitwiseService) {}
}

// ---------------------------------------------------------------------------
// Build tool definitions with apiKey bound in closure
// ---------------------------------------------------------------------------

export function buildSplitwiseTools(
  service: SplitwiseToolsService & { splitwise: SplitwiseService },
  apiKey: string,
): DynamicStructuredTool[] {
  const sw: SplitwiseService = (service as any).splitwise;

  return [
    // -----------------------------------------------------------------------
    // get_splitwise_expenses
    // -----------------------------------------------------------------------
    new DynamicStructuredTool({
      name: 'get_splitwise_expenses',
      description:
        "List the user's Splitwise expenses. Optionally filter by group, friend, date range, or limit.",
      schema: z.object({
        group_id: z.number().int().optional().describe('Splitwise group ID'),
        friend_id: z.number().int().optional().describe('Splitwise friend ID'),
        dated_after: z
          .string()
          .optional()
          .describe('ISO date string e.g. 2025-01-01'),
        dated_before: z
          .string()
          .optional()
          .describe('ISO date string e.g. 2025-01-31'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Max expenses to return (default 20)'),
      }),
      func: (raw) => {
        const args = parseArgs<{
          group_id?: number;
          friend_id?: number;
          dated_after?: string;
          dated_before?: string;
          limit?: number;
        }>(raw);
        return sw.getExpenses(apiKey, args).then((r) => JSON.stringify(r));
      },
    }),

    // -----------------------------------------------------------------------
    // get_splitwise_friends
    // -----------------------------------------------------------------------
    new DynamicStructuredTool({
      name: 'get_splitwise_friends',
      description:
        "List all of the user's Splitwise friends with their IDs and current balances.",
      schema: z.object({}),
      func: () => sw.getFriends(apiKey).then((r) => JSON.stringify(r)),
    }),

    // -----------------------------------------------------------------------
    // get_splitwise_groups
    // -----------------------------------------------------------------------
    new DynamicStructuredTool({
      name: 'get_splitwise_groups',
      description:
        "List all of the user's Splitwise groups with member details and debts.",
      schema: z.object({}),
      func: () => sw.getGroups(apiKey).then((r) => JSON.stringify(r)),
    }),

    // -----------------------------------------------------------------------
    // get_splitwise_friend_balances
    // -----------------------------------------------------------------------
    new DynamicStructuredTool({
      name: 'get_splitwise_friend_balances',
      description:
        'Return a pre-computed net balance summary across all friends — who owes the user money, who the user owes, and the overall net position. Use this instead of manually summing raw friend balances.',
      schema: z.object({}),
      func: async () => {
        const friends = await sw.getFriends(apiKey);
        const owesYou: Array<{
          name: string;
          amount: number;
          currency: string;
        }> = [];
        const youOwe: Array<{
          name: string;
          amount: number;
          currency: string;
        }> = [];
        let net = 0;

        for (const f of friends) {
          const name = `${f.first_name} ${f.last_name}`.trim();
          for (const b of f.balance) {
            const amount = parseFloat(b.amount);
            if (isNaN(amount) || amount === 0) continue;
            if (amount > 0) {
              owesYou.push({ name, amount, currency: b.currency_code });
              net += amount;
            } else {
              youOwe.push({
                name,
                amount: Math.abs(amount),
                currency: b.currency_code,
              });
              net += amount;
            }
          }
        }

        return JSON.stringify({
          owes_you: owesYou,
          you_owe: youOwe,
          net: Math.round(net * 100) / 100,
        });
      },
    }),

    // -----------------------------------------------------------------------
    // create_splitwise_expense
    // -----------------------------------------------------------------------
    new DynamicStructuredTool({
      name: 'create_splitwise_expense',
      description:
        'Create a new Splitwise expense with explicit per-user splits. Always confirm split details with the user before calling this tool.',
      schema: z.object({
        cost: z
          .string()
          .describe('Total cost as a decimal string e.g. "25.50"'),
        description: z.string().describe('Expense description'),
        date: z.string().describe('ISO date string e.g. 2025-03-15'),
        group_id: z
          .number()
          .int()
          .optional()
          .describe('Splitwise group ID (omit for non-group expense)'),
        users: z
          .array(
            z.object({
              user_id: z.number().int().describe('Splitwise user ID'),
              paid_share: z
                .string()
                .describe('Amount this user paid e.g. "25.50"'),
              owed_share: z
                .string()
                .describe('Amount this user owes e.g. "12.75"'),
            }),
          )
          .min(2)
          .describe('Split breakdown — must include all involved users'),
      }),
      func: (raw) => {
        const args = parseArgs<{
          cost: string;
          description: string;
          date: string;
          group_id?: number;
          users: Array<{
            user_id: number;
            paid_share: string;
            owed_share: string;
          }>;
        }>(raw);
        return sw.createExpense(apiKey, args).then((r) => JSON.stringify(r));
      },
    }),
  ];
}

// ---------------------------------------------------------------------------
// Module-private helpers
// ---------------------------------------------------------------------------

function parseArgs<T extends object>(raw: unknown): T {
  if (raw && typeof raw === 'object' && 'input' in raw) {
    const inputVal = (raw as { input: unknown }).input;
    if (typeof inputVal === 'string') {
      try {
        return JSON.parse(inputVal) as T;
      } catch {
        // fall through
      }
    }
  }
  return raw as T;
}
