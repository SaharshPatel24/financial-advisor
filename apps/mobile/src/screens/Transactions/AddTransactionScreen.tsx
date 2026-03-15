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
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{strings.addTransaction.title}</Text>

        {/* Description */}
        <Text style={styles.label}>{strings.addTransaction.descriptionLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={strings.addTransaction.descriptionPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          returnKeyType="next"
        />

        {/* Amount */}
        <Text style={styles.label}>{strings.addTransaction.amountLabel}</Text>
        <TextInput
          style={styles.input}
          placeholder={strings.addTransaction.amountPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />

        {/* Type toggle */}
        <Text style={styles.label}>{strings.addTransaction.typeLabel}</Text>
        <View style={styles.toggle}>
          {(['EXPENSE', 'INCOME'] as TransactionType[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleOption, type === t && styles.toggleActive]}
              onPress={() => setType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, type === t && styles.toggleTextActive]}>
                {t === 'INCOME' ? strings.addTransaction.typeIncome : strings.addTransaction.typeExpense}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI category badge */}
        {aiCategory ? (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryLabel}>{strings.addTransaction.categoryLabel}: </Text>
            <Text style={styles.categoryValue}>{aiCategory}</Text>
          </View>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.buttonText}>{strings.addTransaction.submitButton}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>{strings.common.cancel}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex:            1,
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
    padding:  spacing['6'],
  },
  title: {
    fontSize:     typography.size.xl,
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['6'],
  },
  label: {
    fontSize:     typography.size.sm,
    fontWeight:   typography.weight.medium,
    color:        colors.textPrimary,
    marginBottom: spacing['1'],
  },
  input: {
    backgroundColor:   colors.surfaceAlt,
    borderWidth:       1,
    borderColor:       colors.border,
    borderRadius:      radius.md,
    paddingHorizontal: spacing['4'],
    paddingVertical:   spacing['3'],
    fontSize:          typography.size.base,
    color:             colors.textPrimary,
    marginBottom:      spacing['4'],
  },
  toggle: {
    flexDirection:  'row',
    borderWidth:    1,
    borderColor:    colors.border,
    borderRadius:   radius.md,
    overflow:       'hidden',
    marginBottom:   spacing['6'],
  },
  toggleOption: {
    flex:            1,
    paddingVertical: spacing['3'],
    alignItems:      'center',
    backgroundColor: colors.surfaceAlt,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.medium,
    color:      colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.textInverse,
  },
  categoryBadge: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: colors.surface,
    borderRadius:    radius.md,
    padding:         spacing['3'],
    marginBottom:    spacing['4'],
    borderWidth:     1,
    borderColor:     colors.border,
  },
  categoryLabel: {
    fontSize: typography.size.sm,
    color:    colors.textSecondary,
  },
  categoryValue: {
    fontSize:   typography.size.sm,
    fontWeight: typography.weight.semibold,
    color:      colors.primary,
  },
  error: {
    fontSize:     typography.size.sm,
    color:        colors.danger,
    marginBottom: spacing['3'],
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: spacing['4'],
    alignItems:      'center',
    marginBottom:    spacing['3'],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color:      colors.textInverse,
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing['2'],
  },
  cancelText: {
    fontSize: typography.size.sm,
    color:    colors.textSecondary,
  },
});
