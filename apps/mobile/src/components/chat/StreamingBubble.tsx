import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography } from '../../theme';

interface Props {
  content: string;
}

function ThinkingDots() {
  const dot1 = useRef(new Animated.Value(0.25)).current;
  const dot2 = useRef(new Animated.Value(0.25)).current;
  const dot3 = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    const makePulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.25, duration: 300, useNativeDriver: true }),
          Animated.delay(Math.max(0, 900 - delay - 600)),
        ]),
      );

    const a1 = makePulse(dot1, 0);
    const a2 = makePulse(dot2, 200);
    const a3 = makePulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={dots.row}>
      <Animated.View style={[dots.dot, { opacity: dot1 }]} />
      <Animated.View style={[dots.dot, { opacity: dot2 }]} />
      <Animated.View style={[dots.dot, { opacity: dot3 }]} />
    </View>
  );
}

const dots = StyleSheet.create({
  row: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textMuted },
});

export default function StreamingBubble({ content }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Ionicons name="sparkles" size={12} color={colors.textInverse} />
      </View>
      <View style={styles.bubble}>
        {content ? <Text style={styles.text}>{content}</Text> : <ThinkingDots />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  bubble: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    maxWidth: '75%',
    minWidth: 60,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    lineHeight: 22,
  },
});
