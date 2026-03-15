import { create } from 'zustand';
import type { Transaction } from '@financial-advisor/shared';

// TODO(Issue #14): Add fetch and create transaction actions
interface TransactionState {
  transactions: Transaction[];
}

export const useTransactionStore = create<TransactionState>()(() => ({
  transactions: [],
}));
