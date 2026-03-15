import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useChallengeStore } from '../../store/challengeStore';
import { ChallengeCard }     from '../../components/ui/ChallengeCard';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';

function statusBadgeStyle(status: 'ACTIVE' | 'COMPLETED' | 'FAILED') {
  if (status === 'COMPLETED') return { bg: '#ecfdf5', text: '#065f46' };
  if (status === 'FAILED')    return { bg: '#fef2f2', text: '#991b1b' };
  return { bg: '#fef9ec', text: '#92400e' };
}

function statusLabel(status: 'ACTIVE' | 'COMPLETED' | 'FAILED') {
  if (status === 'COMPLETED') return strings.challenge.statusCompleted;
  if (status === 'FAILED')    return strings.challenge.statusFailed;
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
  const { active, past, loading, fetchChallenges, generateChallenge, updateStatus } = useChallengeStore();
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
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.challenge.title}</Text>
        <Text style={styles.subtitle}>Your AI-generated weekly challenge</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading && !active && (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        )}

        {/* Active challenge */}
        {active ? (
          <ChallengeCard
            challenge={active}
            onComplete={handleComplete}
            onGiveUp={handleGiveUp}
            loading={actionLoading}
          />
        ) : !loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>{strings.challenge.empty}</Text>
            <TouchableOpacity
              style={[styles.generateBtn, actionLoading && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={actionLoading}
              activeOpacity={0.85}
            >
              {actionLoading
                ? <ActivityIndicator color={colors.textInverse} />
                : <Text style={styles.generateBtnText}>{strings.challenge.generateButton}</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Past challenges */}
        {past.length > 0 && (
          <View style={styles.pastCard}>
            <Text style={styles.pastTitle}>Past challenges</Text>
            {past.map((c) => {
              const badge = statusBadgeStyle(c.status);
              return (
                <View key={c.id} style={styles.pastRow}>
                  <View style={styles.pastLeft}>
                    <Text style={styles.pastName} numberOfLines={1}>{c.description}</Text>
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

        {/* Next week preview */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>Next week preview</Text>
          <Text style={styles.nextBody}>
            Your AI advisor will generate a new personalised challenge based on your spending patterns.
          </Text>
        </View>

        <View style={styles.bottomPad} />
      </ScrollView>
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
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize:   21,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  subtitle: {
    fontSize:  11,
    color:     colors.textMuted,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['3'] + 1,
  },
  loader: {
    marginTop: spacing['8'],
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.lg,
    padding:         spacing['4'],
    alignItems:      'center',
    marginBottom:    spacing['2'] + 2,
    gap:             spacing['3'],
  },
  emptyText: {
    fontSize:  typography.size.sm,
    color:     colors.textMuted,
    textAlign: 'center',
  },
  generateBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: spacing['3'],
    paddingHorizontal: spacing['6'],
    alignItems:      'center',
  },
  generateBtnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color:      colors.textInverse,
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  pastCard: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.md + 1,
    padding:         spacing['3'] + 1,
    marginBottom:    spacing['2'] + 2,
  },
  pastTitle: {
    fontSize:     12,
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['2'] + 1,
  },
  pastRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingVertical: spacing['2'],
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  pastLeft: {
    flex:        1,
    marginRight: spacing['2'],
  },
  pastName: {
    fontSize:   11,
    fontWeight: typography.weight.medium,
    color:      colors.textPrimary,
  },
  pastDate: {
    fontSize:  10,
    color:     colors.textMuted,
    marginTop: 1,
  },
  pastBadge: {
    borderRadius:      radius.full,
    paddingVertical:   3,
    paddingHorizontal: spacing['2'] + 1,
  },
  pastBadgeText: {
    fontSize:   9,
    fontWeight: typography.weight.semibold,
  },
  nextCard: {
    backgroundColor: '#eef2ff',
    borderRadius:    radius.md,
    padding:         11,
    marginBottom:    spacing['2'] + 2,
  },
  nextTitle: {
    fontSize:     10,
    fontWeight:   typography.weight.semibold,
    color:        '#3730a3',
    marginBottom: 3,
  },
  nextBody: {
    fontSize:   11,
    color:      '#4f46e5',
    lineHeight: 16,
  },
  bottomPad: {
    height: 100,
  },
});
