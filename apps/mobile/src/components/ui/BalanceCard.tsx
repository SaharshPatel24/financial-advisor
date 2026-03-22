import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  netBalance: number;
  income: number;
  spent: number;
  period?: string;
}

export function BalanceCard({ netBalance, income, spent, period = 'This month' }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Net balance · {period}</Text>
      <Text style={styles.amount}>
        ${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>
            ${income.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={styles.statValue}>
            ${spent.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    padding: spacing['4'],
    marginBottom: spacing['3'],
  },
  label: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
  },
  amount: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    color: colors.textInverse,
    letterSpacing: -0.5,
    marginBottom: spacing['3'],
  },
  row: {
    flexDirection: 'row',
    gap: spacing['2'],
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.md,
    padding: spacing['2'],
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  statValue: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
    color: colors.textInverse,
  },
});
