import React, { useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useInsightStore } from '../../store/insightStore';
import { BalanceCard } from '../../components/ui/BalanceCard';
import { SpendingChart } from '../../components/ui/SpendingChart';
import { InsightCard } from '../../components/ui/InsightCard';
import { TransactionRow } from '../../components/ui/TransactionRow';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';
import type { AppTabNavProp } from '../../navigation/types';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function initials(name?: string | null) {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function DashboardScreen() {
  const navigation = useNavigation<AppTabNavProp>();
  const tabBarHeight = useBottomTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const { transactions, fetchTransactions } = useTransactionStore();
  const { weeklyInsight, fetchWeeklyInsight } = useInsightStore();

  useEffect(() => {
    fetchTransactions(undefined, true);
    fetchWeeklyInsight();
  }, []);

  const { income, spent } = useMemo(() => {
    let income = 0;
    let spent = 0;
    transactions.forEach((t) => {
      if (t.type === 'INCOME') income += t.amount;
      else spent += t.amount;
    });
    return { income, spent };
  }, [transactions]);

  const recentTx = transactions.slice(0, 3);

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { paddingBottom: tabBarHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.name}>{user?.name?.split(' ')[0] ?? 'there'}</Text>
        </View>
        <View>
          <Text style={styles.date}>{formatDate()}</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.name)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard netBalance={income - spent} income={income} spent={spent} />

        <SpendingChart />

        <InsightCard text={weeklyInsight?.summary ?? strings.dashboard.insightsEmpty} />

        <SectionHeader
          title={strings.dashboard.recentActivity}
          linkLabel={strings.dashboard.viewAll}
          onLinkPress={() => navigation.navigate('Transactions')}
        />

        {recentTx.length > 0 ? (
          <View style={styles.txCard}>
            {recentTx.map((tx) => (
              <TransactionRow key={tx.id} transaction={tx} showTime={false} />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>No transactions yet.</Text>
        )}

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  greeting: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  name: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginBottom: 6,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  avatarText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing['4'],
  },
  txCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  empty: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing['4'],
  },
  bottomPad: {
    height: 24,
  },
});
