import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { strings } from '../../content/strings';

// TODO(Issue #15): Implement spending summary cards and AI insights display
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{strings.dashboard.greeting}</Text>
      <Text style={styles.subtitle}>{strings.app.tagline}</Text>
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
  greeting: {
    fontSize:     typography.size['2xl'],
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['2'],
  },
  subtitle: {
    fontSize: typography.size.base,
    color:    colors.textSecondary,
  },
});
