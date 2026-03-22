import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ChatMessageDto } from '@financial-advisor/shared';
import { colors, typography } from '../../theme';

interface Props {
  message: ChatMessageDto;
}

export default function MessageBubble({ message }: Props) {
  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Ionicons name="sparkles" size={12} color={colors.textInverse} />
      </View>
      <View style={styles.aiBubble}>
        <Text style={styles.aiText}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '75%',
  },
  userText: {
    color: colors.textInverse,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
  aiRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  aiBubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '75%',
  },
  aiText: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
});
