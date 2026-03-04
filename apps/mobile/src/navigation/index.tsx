import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import TransactionsScreen from '../screens/Transactions/TransactionsScreen';
import GoalsScreen from '../screens/Goals/GoalsScreen';
import ChallengeScreen from '../screens/Challenge/ChallengeScreen';

const AuthStack = createNativeStackNavigator();
const AppTabs = createBottomTabNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppTabs.Navigator>
      <AppTabs.Screen name="Dashboard" component={DashboardScreen} />
      <AppTabs.Screen name="Transactions" component={TransactionsScreen} />
      <AppTabs.Screen name="Goals" component={GoalsScreen} />
      <AppTabs.Screen name="Challenge" component={ChallengeScreen} />
    </AppTabs.Navigator>
  );
}

// TODO(Issue #12): Replace with useAuthStore().isAuthenticated from Zustand
const isLoggedIn = false;

export default function RootNavigator() {
  return (
    <NavigationContainer>
      {isLoggedIn ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
