import React, { useRef } from 'react';
import { Animated, TouchableOpacity, View, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACTION_WIDTH = 68;

interface Props {
  children: React.ReactNode;
  onEdit: () => void;
  onDelete: () => void;
}

export function SwipeableRow({ children, onEdit, onDelete }: Props) {
  const swipeableRef = useRef<Swipeable>(null);

  function close() {
    swipeableRef.current?.close();
  }

  function renderRightActions(_: Animated.AnimatedInterpolation<number>) {
    return (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => {
            close();
            onEdit();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="pencil" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => {
            close();
            onDelete();
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="trash" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={40}
      overshootRight={false}
      friction={1.5}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    width: ACTION_WIDTH * 2,
  },
  actionBtn: {
    width: ACTION_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: {
    backgroundColor: colors.primary,
  },
  deleteBtn: {
    backgroundColor: colors.danger,
  },
});
