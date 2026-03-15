import { create } from 'zustand';
import type { Transaction, CreateTransactionDto } from '@financial-advisor/shared';
import api from '../services/api';

interface TransactionState {
  transactions: Transaction[];
  createTransaction: (dto: CreateTransactionDto) => Promise<Transaction>;
}

export const useTransactionStore = create<TransactionState>()((set) => ({
  transactions: [],

  createTransaction: async (dto) => {
    const { data } = await api.post<Transaction>('/transactions', dto);
    set((s) => ({ transactions: [data, ...s.transactions] }));
    return data;
  },
}));
