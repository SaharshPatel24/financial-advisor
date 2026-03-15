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
        <Ionicons name="sparkles" size={13} color={colors.textInverse} />
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
    backgroundColor: '#eef2ff',
    borderRadius:    radius.md,
    padding:         11,
    flexDirection:   'row',
    gap:             spacing['2'] + 1,
    marginBottom:    spacing['3'],
    alignItems:      'flex-start',
  },
  iconWrap: {
    width:           26,
    height:          26,
    backgroundColor: colors.primary,
    borderRadius:    7,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize:     10,
    fontWeight:   typography.weight.semibold,
    color:        '#3730a3',
    marginBottom: 2,
  },
  body: {
    fontSize:   10,
    color:      '#4f46e5',
    lineHeight: 14,
  },
});
