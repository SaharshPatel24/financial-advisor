import React from 'react';
import { StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthStore } from '../store/authStore';
import { colors } from '../theme';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import AddTransactionScreen from '../screens/Transactions/AddTransactionScreen';
import EditTransactionScreen from '../screens/Transactions/EditTransactionScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import ChallengeScreen from '../screens/Challenge/ChallengeScreen';

import type { AuthStackParamList, AppTabParamList, AppStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const AppStack = createNativeStackNavigator<AppStackParamList>();
const AppTabs = createBottomTabNavigator<AppTabParamList>();

// ---------------------------------------------------------------------------
// Tab icon — Ionicons + label
// ---------------------------------------------------------------------------
type TabIconProps = {
  name: React.ComponentProps<typeof Ionicons>['name'];
  focused: boolean;
};

function TabIcon({ name, focused }: TabIconProps) {
  return <Ionicons name={name} size={30} color={focused ? colors.primary : colors.textSecondary} />;
}

// ---------------------------------------------------------------------------
// Auth navigator
// ---------------------------------------------------------------------------
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
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
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: styles.tabBarItem,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <AppTabs.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Transactions"
        component={TransactionsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'card' : 'card-outline'} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Goals"
        component={GoalsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'flag' : 'flag-outline'} focused={focused} />
          ),
        }}
      />
      <AppTabs.Screen
        name="Challenge"
        component={ChallengeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'trophy' : 'trophy-outline'} focused={focused} />
          ),
        }}
      />
    </AppTabs.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root app stack — tabs + modals
// ---------------------------------------------------------------------------
function AppRootNavigator() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="AppTabs" component={AppNavigator} />
      <AppStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ presentation: 'transparentModal' }}
      />
      <AppStack.Screen
        name="EditTransaction"
        component={EditTransactionScreen}
        options={{ presentation: 'transparentModal' }}
      />
    </AppStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Root navigator
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
    position: 'absolute',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 78,
    elevation: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabBarItem: {
    paddingTop: 15,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
