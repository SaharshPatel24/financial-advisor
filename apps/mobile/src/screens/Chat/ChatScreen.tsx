import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useTransactionStore } from '../../store/transactionStore';
import { useGoalsStore } from '../../store/goalsStore';
import { colors, typography, spacing } from '../../theme';
import MessageBubble from '../../components/chat/MessageBubble';
import StreamingBubble from '../../components/chat/StreamingBubble';
import ToolCallIndicator from '../../components/chat/ToolCallIndicator';
import ChatInput from '../../components/chat/ChatInput';
import type { ChatMessageDto } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Context bar — shows quick financial stats in the header
// ---------------------------------------------------------------------------
const ContextBar = React.memo(function ContextBar() {
  const transactions = useTransactionStore((s) => s.transactions);
  const goals = useGoalsStore((s) => s.goals);

  const { monthlySpent, monthlyIncome } = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    let spent = 0;
    let income = 0;
    for (const t of transactions) {
      const d = new Date(t.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      if (t.type === 'EXPENSE') spent += t.amount;
      else if (t.type === 'INCOME') income += t.amount;
    }
    return { monthlySpent: spent, monthlyIncome: income };
  }, [transactions]);

  const formatAmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`);

  return (
    <View style={ctxStyles.bar}>
      <View style={ctxStyles.pill}>
        <Text style={ctxStyles.label}>Spent</Text>
        <Text style={[ctxStyles.value, ctxStyles.red]}>{formatAmt(monthlySpent)}</Text>
      </View>
      <View style={ctxStyles.divider} />
      <View style={ctxStyles.pill}>
        <Text style={ctxStyles.label}>Income</Text>
        <Text style={[ctxStyles.value, ctxStyles.green]}>{formatAmt(monthlyIncome)}</Text>
      </View>
      <View style={ctxStyles.divider} />
      <View style={ctxStyles.pill}>
        <Text style={ctxStyles.label}>Goals</Text>
        <Text style={[ctxStyles.value, goals.length > 0 ? ctxStyles.green : ctxStyles.neutral]}>
          {goals.length} active
        </Text>
      </View>
    </View>
  );
});

const ctxStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  divider: {
    width: 5,
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginBottom: 1,
  },
  value: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.bold,
  },
  red: { color: colors.danger },
  green: { color: colors.success },
  neutral: { color: colors.textPrimary },
});

// ---------------------------------------------------------------------------
// Welcome state shown when session has no messages
// ---------------------------------------------------------------------------
const WELCOME_ACTIONS = [
  {
    icon: 'receipt-outline' as const,
    iconBg: colors.dangerSubtle,
    iconColor: colors.danger,
    label: 'Add a transaction',
    sub: 'Log income or expense',
  },
  {
    icon: 'flag-outline' as const,
    iconBg: colors.successSubtle,
    iconColor: colors.success,
    label: 'Create a goal',
    sub: 'Plan & track savings',
  },
  {
    icon: 'trending-up-outline' as const,
    iconBg: colors.primarySubtle,
    iconColor: colors.primary,
    label: 'Spending breakdown',
    sub: 'Where did my money go?',
  },
  {
    icon: 'trophy-outline' as const,
    iconBg: colors.warningSubtle,
    iconColor: colors.warning,
    label: 'Weekly challenge',
    sub: 'AI-generated goal',
  },
];

function WelcomeState() {
  const user = useAuthStore((s) => s.user);
  const firstName = user?.name?.split(' ')[0] ?? null;

  return (
    <View style={welcome.container}>
      <View style={welcome.circle}>
        <Ionicons name="sparkles" size={28} color={colors.textInverse} />
      </View>
      <Text style={welcome.title}>
        {firstName ? `Hey ${firstName}, I'm Fina` : "Hey, I'm Fina"}
      </Text>
      <Text style={welcome.sub}>Your AI money agent. Tell me what you need — I'll handle it.</Text>
      <View style={welcome.grid}>
        {WELCOME_ACTIONS.map((item) => (
          <View key={item.label} style={welcome.card}>
            <View style={[welcome.cardIcon, { backgroundColor: item.iconBg }]}>
              <Ionicons name={item.icon} size={16} color={item.iconColor} />
            </View>
            <Text style={welcome.cardLabel}>{item.label}</Text>
            <Text style={welcome.cardSub}>{item.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const welcome = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 10,
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 270,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginTop: 6,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
  },
  cardIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  cardSub: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------
function ChatHeader({ onNewChat }: { onNewChat: () => void }) {
  return (
    <View style={header.container}>
      <View style={header.titleRow}>
        <View style={header.titleLeft}>
          <Text style={header.title}>Fina AI</Text>
          <View style={header.onlinePill}>
            <View style={header.onlineDot} />
            <Text style={header.onlineLabel}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onNewChat} activeOpacity={0.7} style={header.newBtn}>
          <Ionicons name="create-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <ContextBar />
    </View>
  );
}

const header = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successSubtle,
    borderRadius: spacing['4'],
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  onlineLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.success,
  },
  newBtn: {
    padding: 4,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function ChatScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const activeSession = useChatStore((s) => s.activeSession);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeToolCall = useChatStore((s) => s.activeToolCall);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const openSession = useChatStore((s) => s.openSession);
  const resetActiveSession = useChatStore((s) => s.resetActiveSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const listRef = useRef<FlatList<ChatMessageDto>>(null);

  // On mount: load sessions and open the most recent one
  useEffect(() => {
    loadSessions().then(() => {
      const { sessions: loaded } = useChatStore.getState();
      if (loaded.length > 0) {
        openSession(loaded[0]!.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when messages or streaming content changes
  useEffect(() => {
    if (activeSession?.messages.length || streamingContent) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [activeSession?.messages.length, streamingContent]);

  const messages = activeSession?.messages ?? [];
  const hasMessages = messages.length > 0 || isStreaming;

  function handleSend(content: string) {
    sendMessage(content).catch(() => {});
  }

  function handleNewChat() {
    resetActiveSession();
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { paddingBottom: tabBarHeight }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ChatHeader onNewChat={handleNewChat} />

        {hasMessages ? (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            renderItem={({ item }) => <MessageBubble message={item} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              isStreaming ? (
                <View style={styles.streamingFooter}>
                  {activeToolCall && <ToolCallIndicator tool={activeToolCall} />}
                  <StreamingBubble content={streamingContent} />
                </View>
              ) : null
            }
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          />
        ) : (
          <View style={styles.flex}>
            <WelcomeState />
          </View>
        )}

        <ChatInput onSend={handleSend} disabled={isStreaming} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  messageList: {
    padding: 14,
    paddingBottom: 8,
    gap: 10,
  },
  separator: {
    height: 0,
  },
  streamingFooter: {
    gap: 6,
    marginTop: 10,
  },
});
