import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #15): Implement spending summary cards and AI insights display
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text>Dashboard</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
