import { create } from 'zustand';
import type {
  Transaction,
  CreateTransactionDto,
  PaginatedTransactions,
  TransactionType,
  TransactionCategory,
} from '@financial-advisor/shared';
import api from '../services/api';

interface UpdateTransactionDto {
  description?: string;
  amount?: number;
  type?: TransactionType;
  category?: TransactionCategory;
  date?: string;
}

interface TransactionState {
  transactions: Transaction[];
  total: number;
  page: number;
  loading: boolean;
  fetchTransactions: (type?: TransactionType, reset?: boolean) => Promise<void>;
  createTransaction: (dto: CreateTransactionDto) => Promise<Transaction>;
  updateTransaction: (id: string, dto: UpdateTransactionDto) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionStore = create<TransactionState>()((set, get) => ({
  transactions: [],
  total: 0,
  page: 1,
  loading: false,

  fetchTransactions: async (type, reset = false) => {
    const currentPage = reset ? 1 : get().page;
    set({ loading: true });
    try {
      const params: Record<string, unknown> = { page: currentPage, limit: 20 };
      if (type) params.type = type;
      const { data } = await api.get<PaginatedTransactions>('/transactions', { params });
      set((s) => ({
        transactions: reset ? data.data : [...s.transactions, ...data.data],
        total: data.total,
        page: currentPage + 1,
        loading: false,
      }));
    } catch {
      set({ loading: false });
    }
  },

  createTransaction: async (dto) => {
    const { data } = await api.post<Transaction>('/transactions', dto);
    set((s) => ({ transactions: [data, ...s.transactions], total: s.total + 1 }));
    return data;
  },

  updateTransaction: async (id, dto) => {
    const { data } = await api.patch<Transaction>(`/transactions/${id}`, dto);
    set((s) => ({
      transactions: s.transactions.map((t) => (t.id === id ? data : t)),
    }));
    return data;
  },

  deleteTransaction: async (id) => {
    await api.delete(`/transactions/${id}`);
    set((s) => ({
      transactions: s.transactions.filter((t) => t.id !== id),
      total: s.total - 1,
    }));
  },
}));
