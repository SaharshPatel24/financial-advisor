import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../../theme';

interface Props {
  text: string;
}

export function InsightCard({ text }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="sparkles" size={14} color={colors.textInverse} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>AI Insights</Text>
        <Text style={styles.body}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primarySubtle,
    borderRadius: radius.lg,
    padding: spacing['3'],
    flexDirection: 'row',
    gap: spacing['3'],
    marginBottom: spacing['3'],
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 30,
    height: 30,
    backgroundColor: colors.primary,
    borderRadius: radius.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    color: colors.primaryDark,
    marginBottom: 3,
  },
  body: {
    fontSize: typography.size.sm,
    color: colors.primary,
    lineHeight: 18,
  },
});
