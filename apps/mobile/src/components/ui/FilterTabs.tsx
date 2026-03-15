import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface Tab<T extends string> {
  label: string;
  value: T;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  active: T;
  onChange: (value: T) => void;
}

export function FilterTabs<T extends string>({ tabs, active, onChange }: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.value}
          onPress={() => onChange(tab.value)}
          style={[styles.tab, active === tab.value && styles.tabActive]}
          activeOpacity={0.8}
        >
          <Text style={[styles.label, active === tab.value && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap:            spacing['1'] + 1,
    paddingBottom:  2,
  },
  tab: {
    paddingVertical:   4,
    paddingHorizontal: 11,
    borderRadius:      radius.full,
    borderWidth:       1.5,
    borderColor:       colors.border,
    backgroundColor:   colors.surface,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor:     colors.primary,
  },
  label: {
    fontSize:   10,
    fontWeight: typography.weight.medium,
    color:      colors.textSecondary,
  },
  labelActive: {
    color: colors.textInverse,
  },
});
