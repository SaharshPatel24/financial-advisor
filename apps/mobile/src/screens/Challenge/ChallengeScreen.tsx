import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { strings } from '../../content/strings';

// TODO(Issue #17): Display active weekly AI challenge and progress
export default function ChallengeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.challenge.title}</Text>
      <Text style={styles.subtitle}>{strings.challenge.subtitle}</Text>
      <Text style={styles.empty}>{strings.challenge.empty}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex:            1,
    backgroundColor: colors.background,
    justifyContent:  'center',
    alignItems:      'center',
    padding:         spacing['6'],
  },
  title: {
    fontSize:     typography.size.xl,
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['1'],
  },
  subtitle: {
    fontSize:     typography.size.sm,
    color:        colors.textSecondary,
    marginBottom: spacing['4'],
    textAlign:    'center',
  },
  empty: {
    fontSize:  typography.size.base,
    color:     colors.textMuted,
    textAlign: 'center',
  },
});
