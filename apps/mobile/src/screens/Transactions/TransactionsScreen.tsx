import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTransactionStore } from '../../store/transactionStore';
import { FilterTabs }          from '../../components/ui/FilterTabs';
import { TransactionRow }      from '../../components/ui/TransactionRow';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';
import type { Transaction, TransactionType } from '@financial-advisor/shared';
import type { AppStackNavProp } from '../../navigation/types';

type Filter = 'ALL' | TransactionType;

const FILTER_TABS: { label: string; value: Filter }[] = [
  { label: strings.transactions.filterAll,     value: 'ALL' },
  { label: strings.transactions.filterIncome,  value: 'INCOME' },
  { label: strings.transactions.filterExpense, value: 'EXPENSE' },
];

function formatDateGroup(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const today     = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (sameDay(d, today))     return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function groupByDate(txs: Transaction[]) {
  const groups: { date: string; items: Transaction[] }[] = [];
  const seen: Record<string, number> = {};
  txs.forEach((tx) => {
    const key = tx.date.slice(0, 10);
    if (seen[key] === undefined) {
      seen[key] = groups.length;
      groups.push({ date: key, items: [] });
    }
    groups[seen[key]].items.push(tx);
  });
  return groups;
}

export default function TransactionsScreen() {
  const navigation = useNavigation<AppStackNavProp>();
  const { transactions, loading, fetchTransactions } = useTransactionStore();
  const [filter, setFilter] = useState<Filter>('ALL');

  useEffect(() => {
    fetchTransactions(undefined, true);
  }, []);

  const filtered = filter === 'ALL'
    ? transactions
    : transactions.filter((t) => t.type === filter);

  const groups = groupByDate(filtered);

  type ListItem =
    | { type: 'header'; date: string; key: string }
    | { type: 'row'; tx: Transaction; key: string };

  const listData: ListItem[] = [];
  groups.forEach((g) => {
    listData.push({ type: 'header', date: g.date, key: `h-${g.date}` });
    g.items.forEach((tx) => listData.push({ type: 'row', tx, key: tx.id }));
  });

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'header') {
      return (
        <Text style={styles.groupHeader}>{formatDateGroup(item.date)}</Text>
      );
    }
    return <TransactionRow transaction={item.tx} showTime />;
  }, []);

  const onRefresh = useCallback(() => {
    fetchTransactions(undefined, true);
  }, []);

  const handleFilterChange = (value: Filter) => {
    setFilter(value);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.transactions.title}</Text>
        <FilterTabs tabs={FILTER_TABS} active={filter} onChange={handleFilterChange} />
      </View>

      <FlatList
        data={listData}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={filtered.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{strings.transactions.empty}</Text>
          </View>
        }
        ListFooterComponent={<View style={styles.footer} />}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddTransaction')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing['4'],
    paddingTop:      spacing['2'] + 2,
    paddingBottom:   spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap:             spacing['2'],
  },
  title: {
    fontSize:   21,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  list: {
    flex:            1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContent: {
    flex: 1,
  },
  groupHeader: {
    fontSize:          10,
    fontWeight:        typography.weight.semibold,
    color:             colors.textMuted,
    paddingHorizontal: spacing['4'],
    paddingTop:        spacing['2'],
    paddingBottom:     3,
    letterSpacing:     0.3,
    textTransform:     'uppercase',
    backgroundColor:   colors.background,
  },
  emptyWrap: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingVertical: spacing['16'],
  },
  emptyText: {
    fontSize:  typography.size.base,
    color:     colors.textMuted,
    textAlign: 'center',
  },
  footer: {
    height: 16,
  },
  fab: {
    position:        'absolute',
    bottom:          90,
    right:           spacing['4'],
    width:           46,
    height:          46,
    borderRadius:    23,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    shadowColor:     colors.primary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.4,
    shadowRadius:    8,
    elevation:       8,
  },
  fabIcon: {
    fontSize:   22,
    color:      colors.textInverse,
    lineHeight: 24,
    marginTop:  -1,
  },
});
