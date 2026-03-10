import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) {
    return null;
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Redirect href="/(auth)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
      <Stack.Screen
        name="item-details"
        options={{
          title: 'Item Details',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="create-item"
        options={{
          title: 'Create Item',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="messaging"
        options={{
          title: 'Messages',
          presentation: 'modal',
        }}
      />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
