import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #14): Implement transaction list with AI-assigned categories
export default function TransactionsScreen() {
  return (
    <View style={styles.container}>
      <Text>Transactions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
