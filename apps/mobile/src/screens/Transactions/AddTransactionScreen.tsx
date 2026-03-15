import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #14): Implement add transaction form; show AI-assigned category on submit
export default function AddTransactionScreen() {
  return (
    <View style={styles.container}>
      <Text>Add Transaction</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
