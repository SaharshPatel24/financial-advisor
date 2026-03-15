import React, { useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, SafeAreaView,
} from 'react-native';
import { useAuthStore }        from '../../store/authStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useInsightStore }     from '../../store/insightStore';
import { BalanceCard }         from '../../components/ui/BalanceCard';
import { SpendingChart }       from '../../components/ui/SpendingChart';
import { InsightCard }         from '../../components/ui/InsightCard';
import { TransactionRow }      from '../../components/ui/TransactionRow';
import { SectionHeader }       from '../../components/ui/SectionHeader';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';
import type { AppTabNavProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

function initials(name?: string | null) {
  if (!name) return 'U';
  return name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function DashboardScreen() {
  const navigation = useNavigation<AppTabNavProp>();
  const user = useAuthStore((s) => s.user);
  const { transactions, fetchTransactions } = useTransactionStore();
  const { weeklyInsight, fetchWeeklyInsight } = useInsightStore();

  useEffect(() => {
    fetchTransactions(undefined, true);
    fetchWeeklyInsight();
  }, []);

  const { income, spent } = useMemo(() => {
    let income = 0;
    let spent  = 0;
    transactions.forEach((t) => {
      if (t.type === 'INCOME') income += t.amount;
      else spent += t.amount;
    });
    return { income, spent };
  }, [transactions]);

  const recentTx = transactions.slice(0, 3);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting()}, {user?.name ?? 'there'}</Text>
          <Text style={styles.date}>{formatDate()}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials(user?.name)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <BalanceCard
          netBalance={income - spent}
          income={income}
          spent={spent}
        />

        <SpendingChart />

        {weeklyInsight && (
          <InsightCard text={weeklyInsight.summary} />
        )}
        {!weeklyInsight && (
          <InsightCard text={strings.dashboard.insightsEmpty} />
        )}

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

        {/* bottom padding for floating tab bar */}
        <View style={styles.bottomPad} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex:            1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['2'],
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  greeting: {
    fontSize:   19,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  date: {
    fontSize:  11,
    color:     colors.textMuted,
    marginTop: 1,
  },
  avatar: {
    width:           34,
    height:          34,
    borderRadius:    17,
    backgroundColor: '#eef2ff',
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    fontSize:   12,
    fontWeight: typography.weight.semibold,
    color:      '#4f46e5',
  },
  scroll: {
    flex:            1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing['3'] + 1,
  },
  txCard: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.md + 1,
    overflow:        'hidden',
  },
  empty: {
    fontSize:  typography.size.sm,
    color:     colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing['4'],
  },
  bottomPad: {
    height: 100,
  },
});
