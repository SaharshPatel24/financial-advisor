import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

interface Props {
  progress: number; // 0 to 1
  color?: string;
  height?: number;
}

export function ProgressBar({ progress, color = colors.primary, height = 6 }: Props) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <View style={[styles.track, { height }]}>
      <View
        style={[
          styles.fill,
          { width: `${clamped * 100}%` as `${number}%`, backgroundColor: color, height },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: '#f1f5f9',
    borderRadius:    radius.full,
    overflow:        'hidden',
  },
  fill: {
    borderRadius: radius.full,
  },
});
