import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

interface Props {
  title: string;
  linkLabel?: string;
  onLinkPress?: () => void;
}

export function SectionHeader({ title, linkLabel, onLinkPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {linkLabel && (
        <TouchableOpacity onPress={onLinkPress} activeOpacity={0.7}>
          <Text style={styles.link}>{linkLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing['2'],
  },
  title: {
    fontSize:   13,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  link: {
    fontSize:   11,
    fontWeight: typography.weight.medium,
    color:      colors.primary,
  },
});
