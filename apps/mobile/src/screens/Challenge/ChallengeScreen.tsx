import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useChallengeStore } from '../../store/challengeStore';
import { ChallengeCard } from '../../components/ui/ChallengeCard';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';
import type { ChallengeStatus } from '@financial-advisor/shared';

function statusStyle(status: ChallengeStatus) {
  if (status === 'COMPLETED') return { bg: colors.successSubtle, text: colors.success };
  if (status === 'FAILED') return { bg: colors.dangerSubtle, text: colors.danger };
  return { bg: colors.warningSubtle, text: colors.warning };
}

function statusLabel(status: ChallengeStatus) {
  if (status === 'COMPLETED') return strings.challenge.statusCompleted;
  if (status === 'FAILED') return strings.challenge.statusFailed;
  return strings.challenge.statusActive;
}

function formatWeekRange(start: string, end: string) {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(s)} – ${fmt(e)}`;
  } catch {
    return '';
  }
}

export default function ChallengeScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { active, past, loading, fetchChallenges, generateChallenge, updateStatus } =
    useChallengeStore();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchChallenges();
  }, []);

  async function handleGenerate() {
    setActionLoading(true);
    try {
      await generateChallenge();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!active) return;
    setActionLoading(true);
    try {
      await updateStatus(active.id, 'COMPLETED');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleGiveUp() {
    if (!active) return;
    setActionLoading(true);
    try {
      await updateStatus(active.id, 'FAILED');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { paddingBottom: tabBarHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.challenge.title}</Text>
        <Text style={styles.subtitle}>AI-generated weekly challenge</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading && !active && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        {/* Active challenge */}
        {active ? (
          <ChallengeCard
            challenge={active}
            onComplete={handleComplete}
            onGiveUp={handleGiveUp}
            loading={actionLoading}
          />
        ) : (
          !loading && (
            <View style={styles.emptyCard}>
              <Ionicons name="trophy-outline" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No active challenge</Text>
              <Text style={styles.emptyBody}>{strings.challenge.empty}</Text>
              <TouchableOpacity
                style={[styles.generateBtn, actionLoading && styles.generateBtnDisabled]}
                onPress={handleGenerate}
                disabled={actionLoading}
                activeOpacity={0.85}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={15} color={colors.textInverse} />
                    <Text style={styles.generateBtnText}>{strings.challenge.generateButton}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )
        )}

        {/* Past challenges */}
        {past.length > 0 && (
          <View style={styles.pastCard}>
            <Text style={styles.pastTitle}>Past challenges</Text>
            {past.map((c, i) => {
              const badge = statusStyle(c.status);
              return (
                <View
                  key={c.id}
                  style={[styles.pastRow, i === past.length - 1 && styles.pastRowLast]}
                >
                  <View style={styles.pastLeft}>
                    <Text style={styles.pastName} numberOfLines={1}>
                      {c.description}
                    </Text>
                    <Text style={styles.pastDate}>{formatWeekRange(c.weekStart, c.weekEnd)}</Text>
                  </View>
                  <View style={[styles.pastBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.pastBadgeText, { color: badge.text }]}>
                      {statusLabel(c.status)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Next week */}
        <View style={styles.nextCard}>
          <View style={styles.nextTitleRow}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
            <Text style={styles.nextTitle}>Next week</Text>
          </View>
          <Text style={styles.nextBody}>
            Fina will generate a new personalised challenge based on your spending patterns at the
            start of each week.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['4'],
  },
  loader: {
    marginTop: spacing['8'],
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing['5'],
    alignItems: 'center',
    marginBottom: spacing['3'],
    gap: spacing['2'],
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: spacing['1'],
  },
  emptyBody: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['5'],
    marginTop: spacing['1'],
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: colors.textInverse,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  pastCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing['3'],
    marginBottom: spacing['3'],
  },
  pastTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    marginBottom: spacing['2'],
  },
  pastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pastRowLast: {
    borderBottomWidth: 0,
  },
  pastLeft: {
    flex: 1,
    marginRight: spacing['2'],
  },
  pastName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
  },
  pastDate: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  pastBadge: {
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: spacing['2'],
  },
  pastBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  nextCard: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg,
    padding: spacing['3'],
    marginBottom: spacing['3'],
    gap: 6,
  },
  nextTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  nextTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primaryDark,
  },
  nextBody: {
    fontSize: typography.size.sm,
    color: colors.primary,
    lineHeight: 19,
  },
  bottomPad: {
    height: 24,
  },
});
