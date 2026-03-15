import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import type { Challenge } from '@financial-advisor/shared';
import { ProgressBar } from './ProgressBar';
import { colors, radius, spacing, typography } from '../../theme';

function formatWeek(weekStart: string, weekEnd: string) {
  try {
    const start = new Date(weekStart);
    const end   = new Date(weekEnd);
    const fmt   = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  } catch {
    return '';
  }
}

function weekProgress(weekStart: string, weekEnd: string) {
  const now   = Date.now();
  const start = new Date(weekStart).getTime();
  const end   = new Date(weekEnd).getTime();
  const days  = Math.round((end - start) / 86_400_000) || 7;
  const elapsed = Math.max(0, now - start);
  const daysIn  = Math.min(days, Math.floor(elapsed / 86_400_000));
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

  return (
    <View style={styles.card}>
      <View style={styles.weekBadge}>
        <Text style={styles.weekBadgeText}>{week} · This week</Text>
      </View>

      <Text style={styles.desc}>{challenge.description}</Text>

      <View style={styles.statusRow}>
        <View style={[styles.dot, styles.dotActive]} />
        <Text style={styles.statusText}>In progress</Text>
        <Text style={styles.daysText}>{daysIn} of {days} days</Text>
      </View>

      <ProgressBar progress={progress} color={colors.warning} height={5} />

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.btnComplete}
          onPress={onComplete}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} size="small" />
            : <Text style={styles.btnCompleteText}>Mark as complete</Text>
          }
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
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.lg,
    padding:         spacing['4'] - 2,
    marginBottom:    spacing['2'] + 2,
  },
  weekBadge: {
    backgroundColor:   '#eef2ff',
    borderRadius:      radius.full,
    paddingVertical:   3,
    paddingHorizontal: spacing['2'] + 2,
    alignSelf:         'flex-start',
    marginBottom:      7,
  },
  weekBadgeText: {
    fontSize:   10,
    fontWeight: typography.weight.semibold,
    color:      '#4338ca',
  },
  desc: {
    fontSize:     11,
    color:        colors.textSecondary,
    lineHeight:   16,
    marginBottom: spacing['2'] + 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
    marginBottom:  9,
  },
  dot: {
    width:        8,
    height:       8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.warning,
  },
  statusText: {
    fontSize:   11,
    fontWeight: typography.weight.medium,
    color:      '#b45309',
  },
  daysText: {
    marginLeft: 'auto',
    fontSize:   10,
    color:      colors.textMuted,
  },
  buttons: {
    flexDirection: 'row',
    gap:           7,
    marginTop:     11,
  },
  btnComplete: {
    flex:            2,
    backgroundColor: colors.primary,
    borderRadius:    radius.md - 2,
    paddingVertical: spacing['2'] + 1,
    alignItems:      'center',
  },
  btnCompleteText: {
    color:      colors.textInverse,
    fontSize:   11,
    fontWeight: typography.weight.semibold,
  },
  btnGiveUp: {
    flex:            1,
    backgroundColor: colors.background,
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    radius.md - 2,
    paddingVertical: spacing['2'] + 1,
    alignItems:      'center',
  },
  btnGiveUpText: {
    color:    colors.textSecondary,
    fontSize: 11,
  },
});
