import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function AuthLayout() {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  // If user is authenticated, redirect to app
  if (isAuthenticated) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // animationEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Forgot Password' }} />
    </Stack>
  );
}
