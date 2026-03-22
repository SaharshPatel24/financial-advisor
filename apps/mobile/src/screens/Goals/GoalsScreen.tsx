import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useGoalsStore } from '../../store/goalsStore';
import { GoalCard } from '../../components/ui/GoalCard';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';

export default function GoalsScreen() {
  const tabBarHeight = useBottomTabBarHeight();
  const { goals, loading, fetchGoals, createGoal } = useGoalsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  function closeModal() {
    setModalVisible(false);
    setDescription('');
    setTargetAmount('');
    setDeadline('');
    setError('');
  }

  async function handleCreate() {
    setError('');
    if (!description.trim()) {
      setError(strings.errors.requiredField);
      return;
    }
    const amount = parseFloat(targetAmount);
    if (!targetAmount || isNaN(amount) || amount <= 0) {
      setError(strings.errors.invalidAmount);
      return;
    }
    setSaving(true);
    try {
      await createGoal({
        description: description.trim(),
        targetAmount: amount,
        deadline: deadline || undefined,
      });
      closeModal();
    } catch {
      setError(strings.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, { paddingBottom: tabBarHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.goals.title}</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={18} color={colors.textInverse} />
          <Text style={styles.newBtnText}>{strings.goals.addButton}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loading && goals.length === 0 && (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
        )}

        {goals.map((goal, i) => (
          <GoalCard key={goal.id} goal={goal} index={i} />
        ))}

        {!loading && goals.length === 0 && (
          <View style={styles.emptyWrap}>
            <Ionicons name="flag-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No goals yet</Text>
            <Text style={styles.emptyBody}>
              Set a savings target and Fina will give you an AI-powered plan to reach it.
            </Text>
          </View>
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Create goal modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={styles.modalBackdrop} onPress={closeModal} activeOpacity={1} />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New goal</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={closeModal}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              contentContainerStyle={styles.modalBody}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.fieldLabel}>{strings.goals.descriptionLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder={strings.goals.descriptionPlaceholder}
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
              />

              <Text style={styles.fieldLabel}>{strings.goals.targetLabel}</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currencySign}>$</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.fieldLabel}>
                {strings.goals.deadlineLabel} <Text style={styles.optionalLabel}>(optional)</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                value={deadline}
                onChangeText={setDeadline}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleCreate}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.saveBtnText}>{strings.goals.submitButton}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingTop: spacing['3'],
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  newBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: colors.textInverse,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['4'],
  },
  loader: {
    marginTop: spacing['8'],
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing['10'],
    gap: spacing['2'],
  },
  emptyTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.semibold,
    color: colors.textSecondary,
    marginTop: spacing['2'],
  },
  emptyBody: {
    fontSize: typography.size.sm,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  bottomPad: {
    height: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  handle: {
    width: 34,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginTop: spacing['2'],
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing['4'],
    paddingVertical: spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.size.md,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: spacing['4'],
    paddingBottom: spacing['6'],
  },
  fieldLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textPrimary,
    marginBottom: 6,
    marginTop: spacing['3'],
  },
  optionalLabel: {
    fontWeight: typography.weight.regular,
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['3'],
    fontSize: typography.size.base,
    color: colors.textPrimary,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing['3'],
    paddingVertical: spacing['2'],
    gap: 4,
  },
  currencySign: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.primary,
  },
  amountInput: {
    flex: 1,
    fontSize: typography.size.xl,
    fontWeight: typography.weight.bold,
    color: colors.textPrimary,
    padding: 0,
  },
  errorText: {
    fontSize: typography.size.sm,
    color: colors.danger,
    marginTop: spacing['2'],
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing['3'],
    alignItems: 'center',
    marginTop: spacing['4'],
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
