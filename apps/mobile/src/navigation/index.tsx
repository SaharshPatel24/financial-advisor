import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';
import { colors, spacing, typography, radius } from '../theme';
import { strings } from '../content/strings';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import AddTransactionScreen from '../screens/Transactions/AddTransactionScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import ChallengeScreen from '../screens/Challenge/ChallengeScreen';

import type { AuthStackParamList, AppTabParamList, AppStackParamList } from './types';

// ---------------------------------------------------------------------------
// Stack + Tab instances
// ---------------------------------------------------------------------------
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack  = createNativeStackNavigator<AppStackParamList>();
const AppTabs   = createBottomTabNavigator<AppTabParamList>();

// ---------------------------------------------------------------------------
// Tab bar icon — emoji-based, zero extra dependencies.
// Swap the emoji prop for a vector icon component later with no other changes.
// ---------------------------------------------------------------------------
type TabIconProps = { icon: string; label: string; focused: boolean };

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiActive]}>
        {icon}
      </Text>
      <Text
        style={[
          styles.tabLabel,
          focused ? styles.tabLabelActive : styles.tabLabelInactive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Auth navigator
// ---------------------------------------------------------------------------
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login"    component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// App tab navigator
// ---------------------------------------------------------------------------
function AppNavigator() {
  return (
    <AppTabs.Navigator
      screenOptions={{
        headerShown:        false,
        tabBarShowLabel:    false,
        tabBarStyle:        styles.tabBar,
        sceneStyle:         { backgroundColor: colors.background },
      }}
    >
      <AppTabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label={strings.tabs.dashboard} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💳" label={strings.tabs.transactions} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🎯" label={strings.tabs.goals} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Challenge"
        component={ChallengeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏆" label={strings.tabs.challenge} focused={focused} />
          ),
        }}
      />
    </AppTabs.Navigator>
  );
}

// ---------------------------------------------------------------------------
// App root stack — tabs + modal screens (e.g. AddTransaction)
// ---------------------------------------------------------------------------
function AppRootNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="AppTabs" component={AppNavigator} />
      <AppStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ presentation: 'modal' }}
      />
    </AppStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root navigator — switches stacks reactively via Zustand auth state
// ---------------------------------------------------------------------------
export default function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppRootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  tabBar: {
    position:        'absolute',
    bottom:          spacing['5'],
    left:            spacing['6'],
    right:           spacing['6'],
    backgroundColor: colors.surface,
    borderRadius:    36,
    borderTopWidth:  0,
    height:          60,
    paddingBottom:   0,
    paddingTop:      0,
    paddingHorizontal: spacing['2'],
    elevation:       12,
    shadowColor:     colors.textPrimary,
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.12,
    shadowRadius:    16,
    overflow:        'hidden',
  },
  tabIconContainer: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    gap:            2,
  },
  tabEmoji: {
    fontSize: 22,
    opacity:  0.35,
  },
  tabEmojiActive: {
    opacity: 1,
  },
  tabLabel: {
    fontSize:   typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  tabLabelActive: {
    color:      colors.primary,
    fontWeight: typography.weight.semibold,
  },
  tabLabelInactive: {
    color: colors.textMuted,
  },
});
