import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { useTransactionStore } from '../../store/transactionStore';
import type { TransactionType, TransactionCategory } from '@financial-advisor/shared';
import type { AppStackParamList, AppStackNavProp } from '../../navigation/types';

type EditRoute = RouteProp<AppStackParamList, 'EditTransaction'>;

type CategoryConfig = {
  label: TransactionCategory;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
};

const CATEGORIES: CategoryConfig[] = [
  { label: 'Food', icon: 'fast-food-outline', color: '#f97316' },
  { label: 'Transport', icon: 'car-outline', color: '#3b82f6' },
  { label: 'Bills', icon: 'receipt-outline', color: '#8b5cf6' },
  { label: 'Entertainment', icon: 'film-outline', color: '#ec4899' },
  { label: 'Shopping', icon: 'bag-handle-outline', color: '#14b8a6' },
  { label: 'Health', icon: 'medkit-outline', color: '#22c55e' },
  { label: 'Income', icon: 'wallet-outline', color: '#eab308' },
  { label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#94a3b8' },
];

export default function EditTransactionScreen() {
  const navigation = useNavigation<AppStackNavProp>();
  const route = useRoute<EditRoute>();
  const { transaction } = route.params;
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);

  const [description, setDescription] = useState(transaction.description);
  const [amount, setAmount] = useState(String(transaction.amount));
  const [type, setType] = useState<TransactionType>(transaction.type);
  const [category, setCategory] = useState<TransactionCategory>(transaction.category);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function validate(): boolean {
    if (!description.trim()) {
      setError('Description is required');
      return false;
    }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError('Enter a valid amount');
      return false;
    }
    return true;
  }

  async function handleSave() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await updateTransaction(transaction.id, {
        description: description.trim(),
        amount: parseFloat(amount),
        type,
        category,
      });
      navigation.goBack();
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={() => navigation.goBack()}
        activeOpacity={1}
      />

      <View style={styles.sheet}>
        <View style={styles.handle} />

        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Edit Transaction</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Type toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeOption, type === 'INCOME' && styles.typeIncome]}
              onPress={() => setType('INCOME')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeText, type === 'INCOME' && styles.typeIncomeText]}>
                Income
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, type === 'EXPENSE' && styles.typeExpense]}
              onPress={() => setType('EXPENSE')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeText, type === 'EXPENSE' && styles.typeExpenseText]}>
                Expense
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={styles.input}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              returnKeyType="next"
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Amount</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* Category picker */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat.label;
                return (
                  <TouchableOpacity
                    key={cat.label}
                    style={[
                      styles.categoryPill,
                      selected && { backgroundColor: cat.color, borderColor: cat.color },
                    ]}
                    onPress={() => setCategory(cat.label)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name={cat.icon} size={13} color={selected ? '#fff' : cat.color} />
                    <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
  },
  handle: {
    width: 34,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    marginTop: spacing['2'] + 2,
    marginBottom: 0,
    alignSelf: 'center',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing['4'],
  },
  typeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius: 11,
    padding: 3,
    marginBottom: spacing['4'] - 2,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 9,
  },
  typeIncome: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  typeExpense: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: '#fecaca',
  },
  typeText: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
    color: colors.textMuted,
  },
  typeIncomeText: {
    color: colors.success,
  },
  typeExpenseText: {
    color: colors.danger,
  },
  field: {
    marginBottom: spacing['3'],
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'] + 2,
    fontSize: 13,
    color: colors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'] + 2,
    gap: 4,
  },
  currencySign: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    padding: 0,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  categoryLabel: {
    fontSize: 11,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
  },
  categoryLabelSelected: {
    color: '#fff',
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.danger,
    marginBottom: spacing['3'],
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing['3'] + 1,
    alignItems: 'center',
    marginTop: spacing['2'],
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: colors.textInverse,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
