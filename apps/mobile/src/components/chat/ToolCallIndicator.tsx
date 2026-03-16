import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../theme';

const TOOL_LABELS: Record<string, string> = {
  get_transactions: 'Looking up your transactions...',
  get_goals: 'Checking your goals...',
  get_spending_summary: 'Analysing your spending...',
  get_active_challenge: 'Checking your challenge...',
};

interface Props {
  tool: string;
}

export default function ToolCallIndicator({ tool }: Props) {
  const label = TOOL_LABELS[tool] ?? `Running ${tool}...`;
  return (
    <View style={styles.chip}>
      <View style={styles.dot} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginLeft: 34,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.success,
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});
