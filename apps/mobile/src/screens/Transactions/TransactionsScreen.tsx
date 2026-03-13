import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';
import { strings } from '../../content/strings';

// TODO(Issue #14): Implement transaction list with AI-assigned categories
export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.transactions.title}</Text>
      <Text style={styles.empty}>{strings.transactions.empty}</Text>
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
    marginBottom: spacing['2'],
  },
  empty: {
    fontSize:  typography.size.base,
    color:     colors.textSecondary,
    textAlign: 'center',
  },
});
