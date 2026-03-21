import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LogOutIcon, SettingsIcon, ShoppingBagIcon, HeartIcon, ShieldIcon, CheckSquareIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthStore();

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await signOut();
            router.replace('/(auth)');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const MenuOption = ({
    icon: Icon,
    label,
    onPress,
  }: {
    icon: any;
    label: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white px-4 py-3 flex-row items-center border-b border-gray-100"
    >
      <Icon size={24} color="#2563eb" />
      <Text className="text-gray-900 font-medium ml-3 flex-1">{label}</Text>
      <Text className="text-gray-400">&gt;</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Profile Header */}
      <View className="bg-white px-4 py-6 border-b border-gray-200">
        <View className="flex-row items-center">
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/80' }}
            className="w-16 h-16 rounded-full bg-gray-300"
          />
          <View className="ml-4 flex-1">
            <Text className="text-xl font-bold text-gray-900">{user?.name}</Text>
            <Text className="text-gray-600 text-sm mt-1">{user?.email}</Text>
            <Text className="text-gray-600 text-sm mt-1">{user?.university}</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row justify-around mt-6 pt-6 border-t border-gray-200">
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">
              {user?.completedTransactions || 0}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">Sales</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600">{user?.rating || 0}</Text>
            <Text className="text-gray-600 text-sm mt-1">Rating</Text>
          </View>
          <View className="items-center">
            <Text className="text-2xl font-bold text-blue-600 capitalize">
              {user?.role}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">Role</Text>
          </View>
        </View>
      </View>

      {/* Menu Options */}
      <View className="mt-6 mb-6">
        <MenuOption
          icon={ShoppingBagIcon}
          label="My Items"
          onPress={() => router.push('/(app)/my-items')}
        />
        
        {/* Admin Only Options */}
        {user?.role === 'admin' && (
          <>
            <View className="bg-blue-50 px-4 py-2 mb-2 rounded-lg">
              <Text className="text-blue-700 font-semibold text-sm">Admin Panel</Text>
            </View>
            <MenuOption
              icon={CheckSquareIcon}
              label="Product Approvals"
              onPress={() => router.push('/(app)/admin-products')}
            />
            <MenuOption
              icon={ShieldIcon}
              label="Moderation"
              onPress={() => router.push('/(app)/admin-moderation')}
            />
          </>
        )}
        
      </View>

      {/* Sign Out */}
      <View className="px-4 mb-6">
        <TouchableOpacity
          onPress={handleSignOut}
          className="bg-red-600 rounded-lg px-4 py-3 flex-row items-center justify-center"
        >
          <LogOutIcon size={20} color="white" />
          <Text className="text-white font-medium ml-2">Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View className="bg-white px-4 py-4 border-t border-gray-200 items-center">
        <Text className="text-gray-500 text-sm">CampuShare Hub v1.0.0</Text>
        <Text className="text-gray-500 text-sm mt-1">© 2024 Campus Community</Text>
      </View>
    </ScrollView>
  );
}
