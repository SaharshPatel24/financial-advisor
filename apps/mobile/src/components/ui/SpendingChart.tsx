import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

interface DayData {
  label: string;
  value: number;
  active?: boolean;
}

interface Props {
  data?: DayData[];
}

const MOCK_WEEKLY: DayData[] = [
  { label: 'Mon', value: 30 },
  { label: 'Tue', value: 42 },
  { label: 'Wed', value: 18 },
  { label: 'Thu', value: 50 },
  { label: 'Fri', value: 26 },
  { label: 'Sat', value: 36, active: true },
  { label: 'Sun', value: 12, active: true },
];

const MOCK_MONTHLY: DayData[] = [
  { label: 'Wk1', value: 140 },
  { label: 'Wk2', value: 210 },
  { label: 'Wk3', value: 180, active: true },
  { label: 'Wk4', value: 90, active: true },
];

export function SpendingChart({ data }: Props) {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const chartData = data ?? (period === 'weekly' ? MOCK_WEEKLY : MOCK_MONTHLY);
  const maxVal = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Weekly spending</Text>
        <View style={styles.toggle}>
          <TouchableOpacity
            onPress={() => setPeriod('weekly')}
            style={[styles.toggleOption, period === 'weekly' && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, period === 'weekly' && styles.toggleTextActive]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriod('monthly')}
            style={[styles.toggleOption, period === 'monthly' && styles.toggleActive]}
          >
            <Text style={[styles.toggleText, period === 'monthly' && styles.toggleTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.bars}>
        {chartData.map((day) => {
          const pct = day.value / maxVal;
          const barH = Math.max(6, Math.round(pct * 56));
          return (
            <View key={day.label} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  { height: barH },
                  day.active && styles.barActive,
                ]}
              />
              <Text style={[styles.barLabel, day.active && styles.barLabelActive]}>
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth:     1,
    borderColor:     colors.border,
    borderRadius:    radius.md + 1,
    padding:         spacing['3'],
    marginBottom:    spacing['3'],
  },
  header: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginBottom:   spacing['2'],
  },
  title: {
    fontSize:   11,
    fontWeight: typography.weight.semibold,
    color:      colors.textPrimary,
  },
  toggle: {
    flexDirection: 'row',
    gap:           4,
  },
  toggleOption: {
    paddingVertical:   2,
    paddingHorizontal: 9,
    borderRadius:      radius.full,
  },
  toggleActive: {
    backgroundColor: '#eef2ff',
  },
  toggleText: {
    fontSize:   9,
    fontWeight: typography.weight.medium,
    color:      colors.textMuted,
  },
  toggleTextActive: {
    color:      '#4f46e5',
    fontWeight: typography.weight.semibold,
  },
  bars: {
    flexDirection: 'row',
    alignItems:    'flex-end',
    height:        72,
    gap:           5,
  },
  barCol: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            3,
    height:         '100%',
  },
  bar: {
    width:        '100%',
    borderRadius: 3,
    backgroundColor: '#e0e7ff',
  },
  barActive: {
    backgroundColor: colors.primary,
  },
  barLabel: {
    fontSize: 9,
    color:    colors.textMuted,
  },
  barLabelActive: {
    color:      colors.primary,
    fontWeight: typography.weight.semibold,
  },
});
