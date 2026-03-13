import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { strings } from '../../content/strings';

// TODO(Issue #13): Implement full login form with Zustand auth store integration
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.appName}>{strings.app.name}</Text>
      <Text style={styles.title}>{strings.auth.login.title}</Text>
      <Text style={styles.subtitle}>{strings.auth.login.subtitle}</Text>
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
  appName: {
    fontSize:   typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color:      colors.primary,
    marginBottom: spacing['2'],
    letterSpacing: -0.5,
  },
  title: {
    fontSize:     typography.size.xl,
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['1'],
  },
  subtitle: {
    fontSize: typography.size.base,
    color:    colors.textSecondary,
  },
});
