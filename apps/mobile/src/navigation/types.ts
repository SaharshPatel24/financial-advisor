import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { Transaction } from '@financial-advisor/shared';

// ---------------------------------------------------------------------------
// Auth stack
// ---------------------------------------------------------------------------
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

// ---------------------------------------------------------------------------
// App tab navigator
// ---------------------------------------------------------------------------
export type AppTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  FinaAI: undefined;
  Goals: undefined;
  Challenge: undefined;
};

// ---------------------------------------------------------------------------
// Root app stack — wraps tabs + modal screens
// ---------------------------------------------------------------------------
export type AppStackParamList = {
  AppTabs: undefined;
  AddTransaction: undefined;
  EditTransaction: { transaction: Transaction };
};

// ---------------------------------------------------------------------------
// Typed navigation props — import these in screens instead of casting
// ---------------------------------------------------------------------------
export type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavProp = BottomTabNavigationProp<AppTabParamList>;
export type AppStackNavProp = NativeStackNavigationProp<AppStackParamList>;
