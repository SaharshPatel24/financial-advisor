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
import { useAuthStore } from '../../store/authStore';
import type { AuthNavProp } from '../../navigation/types';

export default function LoginScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  function validate(): boolean {
    if (!email.trim()) { setError(strings.errors.requiredField); return false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError(strings.errors.invalidEmail); return false; }
    if (!password) { setError(strings.errors.requiredField); return false; }
    return true;
  }

  async function handleLogin() {
    setError('');
    if (!validate()) return;
    setLoading(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      // RootNavigator switches to AppTabs automatically when isAuthenticated → true
    } catch {
      setError(strings.errors.loginFailed);
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
        {/* ── Logo ── */}
        <Text style={styles.appName}>{strings.app.name}</Text>
        <Text style={styles.tagline}>{strings.app.tagline}</Text>

        {/* ── Card ── */}
        <View style={styles.card}>
          <Text style={styles.title}>{strings.auth.login.title}</Text>
          <Text style={styles.subtitle}>{strings.auth.login.subtitle}</Text>

          <Text style={styles.label}>{strings.auth.login.emailLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={strings.auth.login.emailPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            returnKeyType="next"
          />

          <Text style={styles.label}>{strings.auth.login.passwordLabel}</Text>
          <TextInput
            style={styles.input}
            placeholder={strings.auth.login.passwordPlaceholder}
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading
              ? <ActivityIndicator color={colors.textInverse} />
              : <Text style={styles.buttonText}>{strings.auth.login.submitButton}</Text>
            }
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{strings.auth.login.noAccount} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{strings.auth.login.registerLink}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    flexGrow:       1,
    justifyContent: 'center',
    padding:        spacing['6'],
  },
  appName: {
    fontSize:      typography.size['3xl'],
    fontWeight:    typography.weight.bold,
    color:         colors.primary,
    textAlign:     'center',
    marginBottom:  spacing['1'],
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize:     typography.size.sm,
    color:        colors.textMuted,
    textAlign:    'center',
    marginBottom: spacing['8'],
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius:    radius.xl,
    padding:         spacing['6'],
    shadowColor:     colors.textPrimary,
    shadowOffset:    { width: 0, height: 2 },
    shadowOpacity:   0.06,
    shadowRadius:    12,
    elevation:       3,
  },
  title: {
    fontSize:     typography.size.xl,
    fontWeight:   typography.weight.bold,
    color:        colors.textPrimary,
    marginBottom: spacing['1'],
  },
  subtitle: {
    fontSize:     typography.size.sm,
    color:        colors.textSecondary,
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
    marginBottom:    spacing['4'],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color:      colors.textInverse,
    fontSize:   typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
  },
  footerText: {
    fontSize: typography.size.sm,
    color:    colors.textSecondary,
  },
  link: {
    fontSize:   typography.size.sm,
    color:      colors.primary,
    fontWeight: typography.weight.semibold,
  },
});
