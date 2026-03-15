import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Transaction, TransactionCategory } from '@financial-advisor/shared';
import { CategoryBadge } from './CategoryBadge';
import { colors, radius, spacing, typography } from '../../theme';

type IconConfig = {
  bg: string;
  color: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

const CATEGORY_ICON: Record<TransactionCategory, IconConfig> = {
  Food:          { bg: '#fef2f2', color: '#ef4444', icon: 'cart-outline' },
  Transport:     { bg: '#eff6ff', color: '#3b82f6', icon: 'car-outline' },
  Bills:         { bg: '#fef9ec', color: '#f59e0b', icon: 'document-text-outline' },
  Entertainment: { bg: '#fdf4ff', color: '#a855f7', icon: 'film-outline' },
  Shopping:      { bg: '#eef2ff', color: '#6366f1', icon: 'bag-outline' },
  Health:        { bg: '#ecfdf5', color: '#10b981', icon: 'medkit-outline' },
  Income:        { bg: '#ecfdf5', color: '#10b981', icon: 'cash-outline' },
  Other:         { bg: '#f1f5f9', color: '#64748b', icon: 'ellipsis-horizontal-outline' },
};

function formatTime(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

interface Props {
  transaction: Transaction;
  showTime?: boolean;
}

export function TransactionRow({ transaction, showTime = true }: Props) {
  const cfg = CATEGORY_ICON[transaction.category] ?? CATEGORY_ICON.Other;
  const isIncome = transaction.type === 'INCOME';

  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon} size={18} color={cfg.color} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{transaction.description}</Text>
        <CategoryBadge category={transaction.category} />
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, isIncome ? styles.income : styles.expense]}>
          {isIncome ? '+' : '-'}${Math.abs(transaction.amount).toFixed(2)}
        </Text>
        {showTime && <Text style={styles.time}>{formatTime(transaction.date)}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               spacing['2'] + 1,
    paddingVertical:   spacing['2'] + 1,
    paddingHorizontal: spacing['4'],
    backgroundColor:   colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   radius.md - 2,
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.medium,
    color:      colors.textPrimary,
  },
  right: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  income: {
    color: colors.income,
  },
  expense: {
    color: colors.expense,
  },
  time: {
    fontSize:  9,
    color:     colors.textMuted,
    marginTop: 2,
  },
});
