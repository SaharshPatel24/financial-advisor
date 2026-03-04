import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// TODO(Issue #13): Implement registration form with Zustand auth store integration
export default function RegisterScreen() {
  return (
    <View style={styles.container}>
      <Text>Register Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});
