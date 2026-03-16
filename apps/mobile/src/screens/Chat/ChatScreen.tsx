import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../../store/chatStore';
import { colors } from '../../theme';
import MessageBubble from '../../components/chat/MessageBubble';
import StreamingBubble from '../../components/chat/StreamingBubble';
import ToolCallIndicator from '../../components/chat/ToolCallIndicator';
import ChatInput from '../../components/chat/ChatInput';
import type { ChatMessageDto } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Suggestion chips shown on the welcome / empty state
// ---------------------------------------------------------------------------
const WELCOME_CHIPS = [
  'How am I doing this month?',
  'What did I spend on food?',
  'Show my goals',
  'Check my challenge',
];

const SUGGESTION_CHIPS = [
  'How am I doing?',
  'Biggest expense this week?',
  'Am I on track for my goals?',
  'Show my challenge',
];

// ---------------------------------------------------------------------------
// Welcome state shown when session has no messages
// ---------------------------------------------------------------------------
function WelcomeState({ onChipPress }: { onChipPress: (text: string) => void }) {
  return (
    <View style={welcome.container}>
      <View style={welcome.circle}>
        <Ionicons name="sparkles" size={28} color={colors.textInverse} />
      </View>
      <Text style={welcome.title}>I'm Fina, your AI money agent</Text>
      <Text style={welcome.sub}>
        Tell me what you need — I'll look up your real data and help you out.
      </Text>
      <View style={welcome.grid}>
        {[
          {
            icon: 'receipt-outline' as const,
            label: 'Spending breakdown',
            sub: 'Where did my money go?',
          },
          { icon: 'flag-outline' as const, label: 'Goal check-in', sub: 'Am I on track?' },
          {
            icon: 'trending-up-outline' as const,
            label: 'Monthly summary',
            sub: 'Income vs expenses',
          },
          { icon: 'trophy-outline' as const, label: 'Weekly challenge', sub: 'See my progress' },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={welcome.card}
            onPress={() => onChipPress(item.label)}
            activeOpacity={0.7}
          >
            <View style={welcome.cardIcon}>
              <Ionicons name={item.icon} size={16} color={colors.primary} />
            </View>
            <Text style={welcome.cardLabel}>{item.label}</Text>
            <Text style={welcome.cardSub}>{item.sub}</Text>
          </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 4,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 260,
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
    backgroundColor: colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 15,
  },
  cardSub: {
    fontSize: 10,
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
      <View style={header.left}>
        <View style={header.avatar}>
          <Ionicons name="sparkles" size={16} color={colors.textInverse} />
          <View style={header.onlineDot} />
        </View>
        <View>
          <Text style={header.name}>Fina AI</Text>
          <Text style={header.status}>Online · ready to help</Text>
        </View>
      </View>
      <TouchableOpacity onPress={onNewChat} activeOpacity={0.7} style={header.newBtn}>
        <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const header = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.surface,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  status: {
    fontSize: 11,
    color: colors.success,
    fontWeight: '500',
    marginTop: 1,
  },
  newBtn: {
    padding: 4,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function ChatScreen() {
  const activeSession = useChatStore((s) => s.activeSession);
  const streamingContent = useChatStore((s) => s.streamingContent);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const activeToolCall = useChatStore((s) => s.activeToolCall);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const openSession = useChatStore((s) => s.openSession);
  const resetActiveSession = useChatStore((s) => s.resetActiveSession);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const sessions = useChatStore((s) => s.sessions);

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

  const chips = hasMessages ? SUGGESTION_CHIPS : WELCOME_CHIPS;

  return (
    <SafeAreaView style={styles.safeArea}>
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
            <WelcomeState onChipPress={handleSend} />
          </View>
        )}

        {/* Suggestion chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          {chips.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={styles.chip}
              onPress={() => handleSend(chip)}
              activeOpacity={0.7}
              disabled={isStreaming}
            >
              <Text style={styles.chipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
  chipsScroll: {
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chipsContent: {
    flexDirection: 'row',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
