import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

// ---------------------------------------------------------------------------
// Auth stack
// ---------------------------------------------------------------------------
export type AuthStackParamList = {
  Login:    undefined;
  Register: undefined;
};

// ---------------------------------------------------------------------------
// App tab navigator
// ---------------------------------------------------------------------------
export type AppTabParamList = {
  Dashboard:      undefined;
  Transactions:   undefined;
  Goals:          undefined;
  Challenge:      undefined;
};

// ---------------------------------------------------------------------------
// Typed navigation props — import these in screens instead of casting
// ---------------------------------------------------------------------------
export type AuthNavProp    = NativeStackNavigationProp<AuthStackParamList>;
export type AppTabNavProp  = BottomTabNavigationProp<AppTabParamList>;
