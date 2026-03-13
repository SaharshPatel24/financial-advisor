import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { strings } from '../../content/strings';

// TODO(Issue #13): Implement full registration form with Zustand auth store integration
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.auth.register.title}</Text>
      <Text style={styles.subtitle}>{strings.auth.register.subtitle}</Text>
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
    fontSize: typography.size.base,
    color:    colors.textSecondary,
  },
});
