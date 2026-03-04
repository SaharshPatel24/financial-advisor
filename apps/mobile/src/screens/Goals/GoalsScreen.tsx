import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #16): Implement goal entry form and AI recommendation display
export default function GoalsScreen() {
  return (
    <View style={styles.container}>
      <Text>Goals</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
