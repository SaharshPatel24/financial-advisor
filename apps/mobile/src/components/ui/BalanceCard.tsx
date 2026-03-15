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
      <Text style={styles.amount}>${netBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
      <View style={styles.row}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Income</Text>
          <Text style={styles.statValue}>${income.toLocaleString('en-US', { minimumFractionDigits: 0 })}</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Spent</Text>
          <Text style={styles.statValue}>${spent.toLocaleString('en-US', { minimumFractionDigits: 0 })}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius:    radius.lg,
    padding:         spacing['4'] - 2,
    marginBottom:    spacing['3'],
  },
  label: {
    fontSize:     10,
    color:        'rgba(255,255,255,0.7)',
    marginBottom: 3,
  },
  amount: {
    fontSize:     26,
    fontWeight:   typography.weight.bold,
    color:        colors.textInverse,
    letterSpacing: -0.5,
    marginBottom: spacing['2'] + 2,
  },
  row: {
    flexDirection: 'row',
    gap:           spacing['2'] + 2,
  },
  stat: {
    flex:            1,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius:    radius.md - 2,
    padding:         7,
  },
  statLabel: {
    fontSize:     10,
    color:        'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  statValue: {
    fontSize:   13,
    fontWeight: typography.weight.bold,
    color:      colors.textInverse,
  },
});
