import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/useAuthStore';
import { useMarketplaceStore } from '@/store/useMarketplaceStore';

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { savedItems, loading, fetchSavedItems } = useMarketplaceStore();

  useEffect(() => {
    if (user) {
      fetchSavedItems(user.id);
    }
  }, [user]);

  const handleItemPress = (itemId: string) => {
    router.push({
      pathname: '/(app)/item-details',
      params: { id: itemId },
    });
  };

  const renderItemCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => handleItemPress(item.id)}
      className="bg-white rounded-lg overflow-hidden shadow-sm mb-4"
    >
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
          </View>
          <Text className="text-blue-600 font-bold text-lg">${item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-4 pb-4 border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-900">Saved Items</Text>
        <Text className="text-gray-600 text-sm mt-1">{savedItems.length} items saved</Text>
      </View>

      {/* Content */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : savedItems.length === 0 ? (
        <View className="flex-1 justify-center items-center px-4">
          <Text className="text-gray-500 text-lg text-center">
            No saved items yet. Browse the marketplace to save items you love!
          </Text>
        </View>
      ) : (
        <FlatList
          data={savedItems}
          renderItem={renderItemCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
