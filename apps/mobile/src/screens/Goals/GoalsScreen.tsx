import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Modal, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons }       from '@expo/vector-icons';
import { useGoalsStore }  from '../../store/goalsStore';
import { GoalCard }       from '../../components/ui/GoalCard';
import { InsightCard }    from '../../components/ui/InsightCard';
import { colors, spacing, typography, radius } from '../../theme';
import { strings } from '../../content/strings';

export default function GoalsScreen() {
  const { goals, loading, fetchGoals, createGoal } = useGoalsStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription]   = useState('');
  const [targetAmount, setTargetAmount]  = useState('');
  const [deadline, setDeadline]          = useState('');
  const [saving, setSaving]              = useState(false);
  const [error, setError]                = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const aiRecommendation = goals.find((g) => g.aiRecommendation)?.aiRecommendation;

  async function handleCreate() {
    setError('');
    if (!description.trim()) { setError(strings.errors.requiredField); return; }
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
      setModalVisible(false);
      setDescription('');
      setTargetAmount('');
      setDeadline('');
    } catch {
      setError(strings.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.goals.title}</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newBtnText}>+ {strings.goals.addButton}</Text>
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
          <Text style={styles.empty}>{strings.goals.empty}</Text>
        )}

        {aiRecommendation && (
          <InsightCard text={aiRecommendation} />
        )}

        <View style={styles.bottomPad} />
      </ScrollView>

      {/* Create goal modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setModalVisible(false)}
            activeOpacity={1}
          />
          <View style={styles.modalSheet}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{strings.goals.addButton}</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={14} color={colors.textSecondary} />
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

              <Text style={styles.fieldLabel}>{strings.goals.deadlineLabel}</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD (optional)"
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
                {saving
                  ? <ActivityIndicator color={colors.textInverse} />
                  : <Text style={styles.saveBtnText}>{strings.goals.submitButton}</Text>
                }
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
    flex:            1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: spacing['4'],
    paddingVertical:  spacing['3'],
    backgroundColor:  colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize:   21,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
  },
  newBtn: {
    backgroundColor: colors.primary,
    borderRadius:    9,
    paddingVertical: 6,
    paddingHorizontal: 11,
  },
  newBtnText: {
    fontSize:   11,
    fontWeight: typography.weight.semibold,
    color:      colors.textInverse,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['3'] + 1,
  },
  loader: {
    marginTop: spacing['8'],
  },
  empty: {
    fontSize:        typography.size.base,
    color:           colors.textMuted,
    textAlign:       'center',
    paddingVertical: spacing['8'],
  },
  bottomPad: {
    height: 100,
  },
  modalOverlay: {
    flex:           1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius:  radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  handle: {
    width:           34,
    height:          4,
    backgroundColor: colors.border,
    borderRadius:    radius.full,
    alignSelf:       'center',
    marginTop:       spacing['2'] + 2,
  },
  modalHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: spacing['4'],
    paddingVertical:  spacing['3'],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
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
  modalBody: {
    padding: spacing['4'],
  },
  fieldLabel: {
    fontSize:     11,
    fontWeight:   typography.weight.medium,
    color:        colors.textPrimary,
    marginBottom: 4,
    marginTop:    spacing['3'],
  },
  input: {
    backgroundColor:   colors.background,
    borderWidth:       1.5,
    borderColor:       colors.border,
    borderRadius:      radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical:   spacing['2'] + 2,
    fontSize:          13,
    color:             colors.textPrimary,
  },
  amountRow: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   colors.background,
    borderWidth:       1.5,
    borderColor:       colors.primary,
    borderRadius:      radius.md - 2,
    paddingHorizontal: spacing['3'],
    paddingVertical:   spacing['2'] + 2,
    gap:               4,
  },
  currencySign: {
    fontSize:   17,
    fontWeight: typography.weight.semibold,
    color:      colors.primary,
  },
  amountInput: {
    flex:       1,
    fontSize:   22,
    fontWeight: typography.weight.bold,
    color:      colors.textPrimary,
    padding:    0,
  },
  errorText: {
    fontSize:     typography.size.sm,
    color:        colors.danger,
    marginTop:    spacing['2'],
    marginBottom: spacing['2'],
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius:    radius.md,
    paddingVertical: spacing['3'] + 1,
    alignItems:      'center',
    marginTop:       spacing['4'],
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
