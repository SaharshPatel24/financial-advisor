import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Goal } from '@financial-advisor/shared';
import { colors, radius, spacing, typography } from '../../theme';

const ACCENT_COLORS = [colors.primary, colors.success, colors.warning, colors.danger];

interface Props {
  goal: Goal;
  index: number;
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return null;
  try {
    return new Date(deadline).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  try {
    return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000);
  } catch {
    return null;
  }
}

export function GoalCard({ goal, index }: Props) {
  const accent = ACCENT_COLORS[index % ACCENT_COLORS.length];
  const deadline = formatDeadline(goal.deadline);
  const days = daysUntil(goal.deadline);

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={styles.description} numberOfLines={2}>
            {goal.description}
          </Text>
          <View style={[styles.targetBadge, { backgroundColor: accent + '1a' }]}>
            <Text style={[styles.targetAmount, { color: accent }]}>
              ${goal.targetAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        {deadline && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
            <Text style={styles.metaText}>Target: {deadline}</Text>
            {days !== null && days > 0 && <Text style={styles.daysChip}>{days}d left</Text>}
            {days !== null && days <= 0 && (
              <Text style={[styles.daysChip, styles.daysOverdue]}>Overdue</Text>
            )}
          </View>
        )}

        {goal.aiRecommendation && (
          <View style={styles.aiRow}>
            <Ionicons name="sparkles" size={11} color={colors.primary} />
            <Text style={styles.aiText} numberOfLines={3}>
              {goal.aiRecommendation}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginBottom: spacing['3'],
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: spacing['3'],
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing['2'],
  },
  description: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  targetBadge: {
    borderRadius: radius.md,
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexShrink: 0,
  },
  targetAmount: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    flex: 1,
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  daysChip: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    color: colors.warning,
    backgroundColor: colors.warningSubtle,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radius.full,
  },
  daysOverdue: {
    color: colors.danger,
    backgroundColor: colors.dangerSubtle,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.md,
    padding: spacing['2'],
  },
  aiText: {
    flex: 1,
    fontSize: typography.size.xs,
    color: colors.primary,
    lineHeight: 16,
  },
});
