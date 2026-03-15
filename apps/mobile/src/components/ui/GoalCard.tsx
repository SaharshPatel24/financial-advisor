import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Goal } from '@financial-advisor/shared';
import { ProgressBar } from './ProgressBar';
import { colors, radius, spacing, typography } from '../../theme';

const PROGRESS_COLORS = [colors.primary, colors.success, colors.warning];

interface Props {
  goal: Goal;
  index: number;
  savedAmount?: number; // optional — not in the API model yet
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  try {
    return new Date(deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return null;
  }
}

export function GoalCard({ goal, index, savedAmount = 0 }: Props) {
  const progress = goal.targetAmount > 0 ? savedAmount / goal.targetAmount : 0;
  const pct = Math.round(Math.min(1, progress) * 100);
  const barColor = PROGRESS_COLORS[index % PROGRESS_COLORS.length];
  const deadline = formatDeadline(goal.deadline);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.name} numberOfLines={1}>{goal.description}</Text>
          {deadline && <Text style={styles.deadline}>Target: {deadline}</Text>}
        </View>
        <Text style={[styles.pct, { color: barColor }]}>{pct}%</Text>
      </View>
      <ProgressBar progress={progress} color={barColor} />
      <View style={styles.amounts}>
        <Text style={styles.saved}>${savedAmount.toLocaleString()} saved</Text>
        <Text style={styles.target}>of ${goal.targetAmount.toLocaleString()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.lg - 2,
    padding:         spacing['3'] + 1,
    marginBottom:    spacing['2'] + 2,
  },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'flex-start',
    marginBottom:    spacing['2'] + 1,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing['2'],
  },
  name: {
    fontSize:   13,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  deadline: {
    fontSize:  10,
    color:     colors.textMuted,
    marginTop: 1,
  },
  pct: {
    fontSize:   15,
    fontWeight: typography.weight.bold,
  },
  amounts: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      7,
  },
  saved: {
    fontSize:   11,
    fontWeight: typography.weight.semibold,
    color:      colors.textPrimary,
  },
  target: {
    fontSize: 11,
    color:    colors.textMuted,
  },
});
