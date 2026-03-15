import React from 'react';
import { Text, StyleSheet } from 'react-native';
import type { TransactionCategory } from '@financial-advisor/shared';

type Config = { bg: string; text: string };

const CATEGORY_COLORS: Record<TransactionCategory, Config> = {
  Food:          { bg: '#fef2f2', text: '#b91c1c' },
  Transport:     { bg: '#eff6ff', text: '#1e40af' },
  Bills:         { bg: '#fef9ec', text: '#92400e' },
  Entertainment: { bg: '#fdf4ff', text: '#6b21a8' },
  Shopping:      { bg: '#eef2ff', text: '#3730a3' },
  Health:        { bg: '#ecfdf5', text: '#065f46' },
  Income:        { bg: '#ecfdf5', text: '#065f46' },
  Other:         { bg: '#f1f5f9', text: '#334155' },
};

interface Props {
  category: TransactionCategory;
}

export function CategoryBadge({ category }: Props) {
  const { bg, text } = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Other;
  return (
    <Text style={[styles.badge, { backgroundColor: bg, color: text }]}>
      {category}
    </Text>
  );
}

const styles = StyleSheet.create({
  badge: {
    fontSize:        9,
    fontWeight:      '500',
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius:    999,
    overflow:        'hidden',
    alignSelf:       'flex-start',
    marginTop:       3,
  },
});
