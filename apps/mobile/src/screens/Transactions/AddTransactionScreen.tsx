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
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme';
import { strings } from '../../content/strings';
import { useTransactionStore } from '../../store/transactionStore';
import type { TransactionType } from '@financial-advisor/shared';
import type { AppStackNavProp } from '../../navigation/types';

export default function AddTransactionScreen() {
  const navigation = useNavigation<AppStackNavProp>();
  const createTransaction = useTransactionStore((s) => s.createTransaction);

  const [description, setDescription] = useState('');
  const [amount, setAmount]           = useState('');
  const [type, setType]               = useState<TransactionType>('EXPENSE');
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [aiCategory, setAiCategory]   = useState('');

  function validate(): boolean {
    if (!description.trim()) { setError(strings.errors.requiredField); return false; }
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) { setError(strings.errors.invalidAmount); return false; }
    return true;
  }

  async function handleSubmit() {
    setError('');
    setAiCategory('');
    if (!validate()) return;
    setLoading(true);
    try {
      const tx = await createTransaction({
        description: description.trim(),
        amount: parseFloat(amount),
        type,
      });
      setAiCategory(tx.category);
      setTimeout(() => navigation.goBack(), 1200);
    } catch {
      setError(strings.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.overlay}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Tap outside to dismiss */}
      <TouchableOpacity style={styles.backdrop} onPress={() => navigation.goBack()} activeOpacity={1} />

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{strings.addTransaction.title}</Text>
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
                {strings.addTransaction.typeIncome}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, type === 'EXPENSE' && styles.typeExpense]}
              onPress={() => setType('EXPENSE')}
              activeOpacity={0.8}
            >
              <Text style={[styles.typeText, type === 'EXPENSE' && styles.typeExpenseText]}>
                {strings.addTransaction.typeExpense}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{strings.addTransaction.descriptionLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={strings.addTransaction.descriptionPlaceholder}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              returnKeyType="next"
            />
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>{strings.addTransaction.amountLabel}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                returnKeyType="done"
              />
            </View>
          </View>

          {/* AI category result */}
          {aiCategory ? (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>{strings.addTransaction.categoryLabel}</Text>
              <View style={styles.aiBadge}>
                <View style={styles.aiIconWrap}>
                  <Ionicons name="sparkles" size={11} color={colors.textInverse} />
                </View>
                <View>
                  <Text style={styles.aiDetected}>AI detected</Text>
                  <Text style={styles.aiValue}>{aiCategory}</Text>
                </View>
              </View>
            </View>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.saveBtnText}>{strings.addTransaction.submitButton}</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex:            1,
    justifyContent:  'flex-end',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius:  radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight:       '85%',
  },
  handle: {
    width:           34,
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    radius.full,
    marginTop:       spacing['2'] + 2,
    marginBottom:    0,
    alignSelf:       'center',
  },
  sheetHeader: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize:   15,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  closeBtn: {
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: colors.surfaceAlt,
    alignItems:      'center',
    justifyContent:  'center',
  },
  body: {
    padding: spacing['4'],
  },
  typeToggle: {
    flexDirection:   'row',
    backgroundColor: colors.surfaceAlt,
    borderRadius:    11,
    padding:         3,
    marginBottom:    spacing['4'] - 2,
  },
  typeOption: {
    flex:            1,
    paddingVertical: 7,
    alignItems:      'center',
    borderRadius:    9,
  },
  typeIncome: {
    backgroundColor: colors.surface,
    borderWidth:     1.5,
    borderColor:     '#bbf7d0',
  },
  typeExpense: {
    backgroundColor: colors.surface,
    borderWidth:     1.5,
    borderColor:     '#fecaca',
  },
  typeText: {
    fontSize:   12,
    fontWeight: typography.weight.semibold,
    color:      colors.textMuted,
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
    fontSize:     11,
    fontWeight:   typography.weight.medium,
    color:        colors.textPrimary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth:     1.5,
    borderColor:     colors.border,
    borderRadius:    radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'] + 2,
    fontSize:        13,
    color:           colors.textPrimary,
  },
  amountRow: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.background,
    borderWidth:     1.5,
    borderColor:     colors.primary,
    borderRadius:    radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'] + 2,
    gap:             4,
  },
  currencySign: {
    fontSize:   17,
    fontWeight: typography.weight.semibold,
    color:      colors.primary,
  },
  amountInput: {
    flex:     1,
    fontSize: 22,
    fontWeight: typography.weight.bold,
    color:    colors.textPrimary,
    padding:  0,
  },
  aiBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             spacing['2'],
    backgroundColor: '#eef2ff',
    borderWidth:     1.5,
    borderColor:     '#c7d2fe',
    borderRadius:    radius.md - 2,
    padding:         9,
  },
  aiIconWrap: {
    width:           20,
    height:          20,
    borderRadius:    6,
    backgroundColor: colors.primary,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  aiDetected: {
    fontSize: 10,
    color:    '#818cf8',
  },
  aiValue: {
    fontSize:   12,
    fontWeight: typography.weight.semibold,
    color:      '#3730a3',
  },
  errorText: {
    fontSize:     typography.size.sm,
    color:        colors.danger,
    marginBottom: spacing['3'],
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: spacing['3'] + 1,
    alignItems:      'center',
    marginTop:       spacing['2'],
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color:      colors.textInverse,
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
