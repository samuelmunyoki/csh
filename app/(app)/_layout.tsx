import React from 'react';
import { Redirect, Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

const BackButton = () => {
  const router = useRouter();
  return (
    <TouchableOpacity onPress={() => router.back()} className="p-2">
      <ArrowLeftIcon size={24} color="#2563eb" />
    </TouchableOpacity>
  );
};

export default function AppLayout() {
  const { isAuthenticated, loading } = useAuthStore();

  if (loading) return null;

  if (!isAuthenticated) return <Redirect href="/(auth)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ title: 'Home' }} />
      <Stack.Screen
        name="item-details"
        options={{ title: 'Item Details', presentation: 'modal' }}
      />
      <Stack.Screen
        name="create-item"
        options={{
          title: 'Create Item',
          presentation: 'modal',
          headerShown: true,
          headerBackTitleVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="admin-moderation"
        options={{
          title: 'Moderation',
          presentation: 'modal',
          headerShown: true,
          headerBackTitleVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="admin-products"
        options={{
          title: 'Product Approvals',
          presentation: 'modal',
          headerShown: true,
          headerBackTitleVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="donations"
        options={{
          title: 'Donations',
          presentation: 'modal',
          headerShown: true,
          headerBackTitleVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen
        name="my-items"
        options={{
          title: 'My Items',
          presentation: 'modal',
          headerShown: true,
          headerBackTitleVisible: false,
          headerLeft: () => <BackButton />,
        }}
      />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}