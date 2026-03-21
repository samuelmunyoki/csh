import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { EditIcon, TrashIcon } from 'lucide-react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';
import { formatPrice } from '@/utils/currency';

export default function MyItemsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userItems, loading, fetchUserItems, deleteItem } = useMarketplaceStore();

  useEffect(() => {
    if (user) {
      fetchUserItems(user.id);
    }
  }, [user]);

  const handleDeleteItem = (itemId: string) => {
    Alert.alert('Delete Item', 'Are you sure you want to delete this item?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          if (user) {
            await deleteItem(itemId, user.id);
          }
        },
      },
    ]);
  };

  const renderItemCard = ({ item }: { item: any }) => (
    <View className="bg-white rounded-lg overflow-hidden shadow-sm mb-4">
      <View className="flex-row">
        {item.images[0] && (
          <Image
            source={{ uri: item.images[0] }}
            className="w-24 h-24"
            resizeMode="cover"
          />
        )}
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="font-semibold text-gray-900" numberOfLines={2}>
              {item.title}
            </Text>
            <Text className="text-gray-600 text-sm mt-1">{item.category}</Text>
            <Text className="text-gray-600 text-sm">{item.views} views</Text>
          </View>
          <Text className="text-blue-600 font-bold text-lg">{formatPrice(item.price)}</Text>
        </View>
        <View className="justify-end items-end p-3 gap-2">
          <TouchableOpacity
            onPress={() => router.push(`/(app)/item-details?id=${item.id}`)}
            className="p-2 bg-blue-100 rounded-full"
          >
            <EditIcon size={16} color="#2563eb" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteItem(item.id)}
            className="p-2 bg-red-100 rounded-full"
          >
            <TrashIcon size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">My Items</Text>
        <Text className="text-gray-600 text-sm mt-1">{userItems.length} items listed</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : userItems.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center mb-4">
            You haven't listed any items yet
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(app)/create-item')}
            className="bg-blue-600 rounded-lg px-6 py-3"
          >
            <Text className="text-white font-semibold">List Your First Item</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={userItems}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
