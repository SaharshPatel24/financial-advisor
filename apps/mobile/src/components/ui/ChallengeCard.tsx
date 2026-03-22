import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Challenge } from '@financial-advisor/shared';
import { ProgressBar } from './ProgressBar';
import { colors, radius, spacing, typography } from '../../theme';

function formatWeek(weekStart: string, weekEnd: string) {
  try {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return '';
  }
}

function weekProgress(weekStart: string, weekEnd: string) {
  const now = Date.now();
  const start = new Date(weekStart).getTime();
  const end = new Date(weekEnd).getTime();
  const days = Math.round((end - start) / 86_400_000) || 7;
  const daysIn = Math.min(days, Math.floor(Math.max(0, now - start) / 86_400_000));
  return { daysIn, days };
}

interface Props {
  challenge: Challenge;
  onComplete: () => void;
  onGiveUp: () => void;
  loading?: boolean;
}

export function ChallengeCard({ challenge, onComplete, onGiveUp, loading }: Props) {
  const week = formatWeek(challenge.weekStart, challenge.weekEnd);
  const { daysIn, days } = weekProgress(challenge.weekStart, challenge.weekEnd);
  const progress = days > 0 ? daysIn / days : 0;
  const daysLeft = Math.max(0, days - daysIn);

  return (
    <View style={styles.card}>
      {/* Week badge */}
      <View style={styles.weekBadge}>
        <Ionicons name="calendar-outline" size={11} color={colors.primary} />
        <Text style={styles.weekBadgeText}>{week}</Text>
      </View>

      {/* Challenge description */}
      <Text style={styles.desc}>{challenge.description}</Text>

      {/* Progress row */}
      <View style={styles.progressHeader}>
        <View style={styles.statusRow}>
          <View style={styles.dot} />
          <Text style={styles.statusText}>In progress</Text>
        </View>
        <Text style={styles.daysText}>{daysLeft > 0 ? `${daysLeft} days left` : 'Last day!'}</Text>
      </View>
      <ProgressBar progress={progress} color={colors.warning} height={6} />

      {/* Actions */}
      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btnComplete}
          onPress={onComplete}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={16} color={colors.textInverse} />
              <Text style={styles.btnCompleteText}>Mark complete</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnGiveUp}
          onPress={onGiveUp}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnGiveUpText}>Give up</Text>
        </TouchableOpacity>
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
    padding: spacing['4'],
    marginBottom: spacing['3'],
    gap: spacing['3'],
  },
  weekBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.full,
    paddingVertical: 4,
    paddingHorizontal: spacing['3'],
    alignSelf: 'flex-start',
  },
  weekBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  desc: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    lineHeight: 22,
    fontWeight: typography.weight.medium,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning,
  },
  statusText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.warning,
  },
  daysText: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing['2'],
    marginTop: spacing['1'],
  },
  btnComplete: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
  },
  btnCompleteText: {
    color: colors.textInverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  btnGiveUp: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
  },
  btnGiveUpText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },
});
