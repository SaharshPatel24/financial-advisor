import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #17): Display active weekly AI challenge and progress
export default function ChallengeScreen() {
  return (
    <View style={styles.container}>
      <Text>Weekly Challenge</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
